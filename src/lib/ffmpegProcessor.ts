import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs";

// Set FFmpeg and FFprobe paths
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ffprobeInstaller = require("@ffprobe-installer/ffprobe");

  if (ffmpegInstaller && ffmpegInstaller.path) {
    ffmpeg.setFfmpegPath(ffmpegInstaller.path);
  }

  if (ffprobeInstaller && ffprobeInstaller.path) {
    ffmpeg.setFfprobePath(ffprobeInstaller.path);
  }
} catch (error) {
  console.warn("Could not load ffmpeg/ffprobe installers:", error);
}

export interface EditOperation {
  id: string;
  startSec: number;
  endSec: number;
  op: string;
  label: string;
  params: Record<string, unknown>;
  status: string;
}

export interface ProcessingProgress {
  percent: number;
  currentOperation: string;
  status: "processing" | "completed" | "error";
  outputPath?: string;
  error?: string;
}

/**
 * Detect silence in video and return time segments
 */
export async function detectSilence(
  videoPath: string,
  minSilence: number = 0.6,
  thresholdDb: number = -30,
): Promise<Array<{ start: number; end: number }>> {
  return new Promise((resolve, reject) => {
    const silentSegments: Array<{ start: number; end: number }> = [];
    let currentSilence: { start: number } | null = null;

    ffmpeg(videoPath)
      .audioFilters(`silencedetect=n=${thresholdDb}dB:d=${minSilence}`)
      .outputOptions(["-f", "null"])
      .output("-")
      .on("stderr", (line) => {
        // Parse silence detection output
        const silenceStartMatch = line.match(/silence_start: ([\d.]+)/);
        const silenceEndMatch = line.match(/silence_end: ([\d.]+)/);

        if (silenceStartMatch) {
          currentSilence = { start: parseFloat(silenceStartMatch[1]) };
        } else if (silenceEndMatch && currentSilence) {
          silentSegments.push({
            start: currentSilence.start,
            end: parseFloat(silenceEndMatch[1]),
          });
          currentSilence = null;
        }
      })
      .on("end", () => {
        console.log("Detected silent segments:", silentSegments);
        resolve(silentSegments);
      })
      .on("error", (err) => {
        console.error("Silence detection error:", err);
        reject(err);
      })
      .run();
  });
}

/**
 * Remove silence from video
 */
export async function removeSilence(
  inputPath: string,
  outputPath: string,
  minSilence: number = 0.6,
  thresholdDb: number = -30,
  onProgress?: (percent: number) => void,
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      // First detect silence
      const silentSegments = await detectSilence(
        inputPath,
        minSilence,
        thresholdDb,
      );

      if (silentSegments.length === 0) {
        // No silence detected, just copy the file
        fs.copyFileSync(inputPath, outputPath);
        resolve();
        return;
      }

      // Get video duration
      const metadata = await getMetadata(inputPath);
      const duration = metadata.duration || 0;

      // Calculate non-silent segments
      const keepSegments: Array<{ start: number; end: number }> = [];
      let lastEnd = 0;

      for (const silent of silentSegments) {
        if (silent.start > lastEnd) {
          keepSegments.push({ start: lastEnd, end: silent.start });
        }
        lastEnd = silent.end;
      }

      if (lastEnd < duration) {
        keepSegments.push({ start: lastEnd, end: duration });
      }

      if (keepSegments.length === 0) {
        reject(new Error("All video would be removed by silence detection"));
        return;
      }

      // Create filter_complex to concatenate non-silent segments
      const segments = keepSegments
        .map(
          (seg, i) =>
            `[0:v]trim=start=${seg.start}:end=${seg.end},setpts=PTS-STARTPTS[v${i}]; ` +
            `[0:a]atrim=start=${seg.start}:end=${seg.end},asetpts=PTS-STARTPTS[a${i}]`,
        )
        .join("; ");

      const videoConcat = keepSegments.map((_, i) => `[v${i}]`).join("");
      const audioConcat = keepSegments.map((_, i) => `[a${i}]`).join("");

      const filterComplex = `${segments}; ${videoConcat}concat=n=${keepSegments.length}:v=1:a=0[outv]; ${audioConcat}concat=n=${keepSegments.length}:v=0:a=1[outa]`;

      ffmpeg(inputPath)
        .complexFilter(filterComplex)
        .outputOptions(["-map", "[outv]", "-map", "[outa]"])
        .output(outputPath)
        .on("progress", (progress) => {
          if (onProgress && progress.percent) {
            onProgress(Math.min(progress.percent, 99));
          }
        })
        .on("end", () => {
          if (onProgress) onProgress(100);
          resolve();
        })
        .on("error", (err) => {
          console.error("Remove silence error:", err);
          reject(err);
        })
        .run();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Apply visual effect to video
 */
export async function applyEffect(
  inputPath: string,
  outputPath: string,
  effectName: string,
  strength: number = 50,
  startSec: number = 0,
  endSec: number = 0,
  onProgress?: (percent: number) => void,
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const metadata = await getMetadata(inputPath);
      const duration = metadata.duration || 0;
      const actualEnd = endSec > 0 ? endSec : duration;

      let videoFilter = "";

      switch (effectName.toLowerCase()) {
        case "punch-in":
          // Simple zoom effect without complex expressions
          const zoomStrength = 1 + strength / 100;
          // Apply effect only during the specified time range
          if (startSec > 0 || endSec > 0) {
            videoFilter = `scale=iw*${zoomStrength}:ih*${zoomStrength},setsar=1,crop=iw/${zoomStrength}:ih/${zoomStrength}:enable='between(t,${startSec},${actualEnd})'`;
          } else {
            videoFilter = `scale=iw*${zoomStrength}:ih*${zoomStrength},setsar=1,crop=iw/${zoomStrength}:ih/${zoomStrength}`;
          }
          break;

        case "shake":
          // Very simple shake - slight crop offset with timestamp
          if (startSec > 0 || endSec > 0) {
            videoFilter = `crop=in_w-10:in_h-10:5:5:enable='between(t,${startSec},${actualEnd})'`;
          } else {
            videoFilter = `crop=in_w-10:in_h-10:5:5`;
          }
          break;

        case "blur":
          // Gaussian blur
          const blurAmount = Math.min(strength / 5, 10);
          // Apply blur only during the specified time range
          if (startSec > 0 || endSec > 0) {
            videoFilter = `gblur=sigma=${blurAmount}:enable='between(t,${startSec},${actualEnd})'`;
          } else {
            videoFilter = `gblur=sigma=${blurAmount}`;
          }
          break;

        case "glitch":
          // Desaturate effect
          if (startSec > 0 || endSec > 0) {
            videoFilter = `eq=saturation=0.5:enable='between(t,${startSec},${actualEnd})'`;
          } else {
            videoFilter = `eq=saturation=0.5`;
          }
          break;

        default:
          // No effect - just copy
          fs.copyFileSync(inputPath, outputPath);
          resolve();
          return;
      }

      ffmpeg(inputPath)
        .videoFilters(videoFilter)
        .outputOptions([
          "-preset",
          "veryfast", // Faster encoding
          "-crf",
          "23", // Good quality/speed balance
          "-movflags",
          "+faststart", // Web optimization
        ])
        .output(outputPath)
        .on("progress", (progress) => {
          if (onProgress && progress.percent) {
            onProgress(Math.min(progress.percent, 99));
          }
        })
        .on("end", () => {
          if (onProgress) onProgress(100);
          resolve();
        })
        .on("error", (err) => {
          console.error(`Effect ${effectName} error:`, err);
          reject(err);
        })
        .run();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Apply audio effect
 */
export async function applyAudioEffect(
  inputPath: string,
  outputPath: string,
  effectName: string,
  strength: number = 50,
  onProgress?: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    let audioFilter = "";

    switch (effectName.toLowerCase()) {
      case "bass-boost":
        const bassGain = strength / 10;
        audioFilter = `equalizer=f=100:t=h:width=200:g=${bassGain}`;
        break;

      default:
        fs.copyFileSync(inputPath, outputPath);
        resolve();
        return;
    }

    ffmpeg(inputPath)
      .audioFilters(audioFilter)
      .output(outputPath)
      .on("progress", (progress) => {
        if (onProgress && progress.percent) {
          onProgress(Math.min(progress.percent, 99));
        }
      })
      .on("end", () => {
        if (onProgress) onProgress(100);
        resolve();
      })
      .on("error", (err) => {
        console.error(`Audio effect ${effectName} error:`, err);
        reject(err);
      })
      .run();
  });
}

/**
 * Apply color grading preset to video
 */
export async function applyColorGrade(
  inputPath: string,
  outputPath: string,
  preset: string,
  startSec: number = 0,
  endSec: number = 0,
  intensity: number = 100,
  onProgress?: (percent: number) => void,
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const metadata = await getMetadata(inputPath);
      const duration = metadata.duration || 0;
      const actualEnd = endSec > 0 ? endSec : duration;
      const factor = intensity / 100;

      let colorFilter = "";

      switch (preset.toLowerCase()) {
        case "warm":
        case "warmer":
          // Increase reds/yellows, decrease blues
          colorFilter = `eq=saturation=1.2:contrast=1.1,colorbalance=rs=${0.1 * factor}:gs=${0.05 * factor}:bs=${-0.1 * factor}`;
          break;

        case "cool":
        case "cooler":
          // Increase blues, decrease reds
          colorFilter = `eq=saturation=1.1,colorbalance=rs=${-0.1 * factor}:gs=${0.05 * factor}:bs=${0.15 * factor}`;
          break;

        case "vintage":
        case "retro":
          // Desaturate, add sepia tone, reduce contrast
          colorFilter = `eq=saturation=0.7:contrast=0.9,curves=vintage`;
          break;

        case "cinematic":
        case "filmic":
          // Higher contrast, slight desaturation, crushed blacks
          colorFilter = `eq=contrast=1.3:brightness=-0.05:saturation=0.85,curves=strong_contrast`;
          break;

        case "vibrant":
        case "saturated":
          // Boost saturation and contrast
          colorFilter = `eq=saturation=${1.5 * factor}:contrast=${1.2 * factor}`;
          break;

        case "faded":
        case "washed":
          // Reduce contrast and saturation
          colorFilter = `eq=contrast=${0.7 * factor}:saturation=${0.6 * factor}:brightness=0.05`;
          break;

        case "high-contrast":
        case "dramatic":
          // Maximum contrast
          colorFilter = `eq=contrast=${1.5 * factor}:saturation=1.1`;
          break;

        case "black-and-white":
        case "bw":
        case "grayscale":
          // Remove color
          colorFilter = `hue=s=0`;
          break;

        default:
          // Unknown preset, copy file
          fs.copyFileSync(inputPath, outputPath);
          resolve();
          return;
      }

      // Add time constraint if specified
      if (startSec > 0 || actualEnd < duration) {
        colorFilter = `${colorFilter}:enable='between(t,${startSec},${actualEnd})'`;
      }

      console.log(`Applying color grade: ${preset} (${colorFilter})`);

      ffmpeg(inputPath)
        .videoFilters(colorFilter)
        .outputOptions([
          "-preset",
          "ultrafast",
          "-crf",
          "28",
          "-pix_fmt",
          "yuv420p",
          "-movflags",
          "+faststart",
        ])
        .output(outputPath)
        .on("start", (cmdLine) => {
          console.log("Color grade FFmpeg command:", cmdLine);
        })
        .on("progress", (progress) => {
          if (onProgress && progress.percent) {
            onProgress(Math.min(progress.percent, 99));
          }
        })
        .on("end", () => {
          console.log("Color grading completed");
          if (onProgress) onProgress(100);
          resolve();
        })
        .on("error", (err) => {
          console.error(`Color grade ${preset} error:`, err);
          reject(err);
        })
        .run();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Add image overlay to video
 */
export async function addImageOverlay(
  inputPath: string,
  outputPath: string,
  imagePath: string,
  startSec: number = 0,
  endSec: number = 0,
  options?: {
    position?:
      | "top-left"
      | "top-right"
      | "bottom-left"
      | "bottom-right"
      | "center";
    scale?: number;
  },
  onProgress?: (percent: number) => void,
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    let tempImagePath: string | null = null;

    try {
      const metadata = await getMetadata(inputPath);
      const duration = metadata.duration || 0;
      const actualEnd = endSec > 0 ? endSec : duration;
      const position = options?.position || "top-right";
      const scale = options?.scale || 0.3;

      // Handle different image path types
      let actualImagePath = imagePath;

      // 1. Base64 data URLs - convert to temp file
      if (imagePath.startsWith("data:image/")) {
        console.log("Converting base64 data URL to temp file...");
        const base64Data = imagePath.split(",")[1];
        const buffer = Buffer.from(base64Data, "base64");
        const extension = imagePath.match(/data:image\/(\w+);/)?.[1] || "png";
        tempImagePath = path.join(
          path.dirname(outputPath),
          `temp_overlay_${Date.now()}.${extension}`,
        );
        fs.writeFileSync(tempImagePath, buffer);
        actualImagePath = tempImagePath;
      }
      // 2. HTTP/HTTPS URLs - download to temp file
      else if (
        imagePath.startsWith("http://") ||
        imagePath.startsWith("https://")
      ) {
        console.log(`Downloading image from URL: ${imagePath}`);
        const extension = imagePath.split(".").pop()?.split("?")[0] || "png";
        tempImagePath = path.join(
          path.dirname(outputPath),
          `temp_overlay_${Date.now()}.${extension}`,
        );

        // Download the image
        const response = await fetch(imagePath);
        if (!response.ok) {
          throw new Error(`Failed to download image: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        fs.writeFileSync(tempImagePath, buffer);
        actualImagePath = tempImagePath;
        console.log(`Image downloaded to: ${tempImagePath}`);
      }
      // 3. Local file paths - use as-is
      else {
        console.log(`Using local image path: ${imagePath}`);
      }

      // Calculate position based on preset
      let xPosition: string;
      let yPosition: string;

      switch (position) {
        case "top-left":
          xPosition = "10";
          yPosition = "10";
          break;
        case "top-right":
          xPosition = "W-w-10";
          yPosition = "10";
          break;
        case "bottom-left":
          xPosition = "10";
          yPosition = "H-h-10";
          break;
        case "bottom-right":
          xPosition = "W-w-10";
          yPosition = "H-h-10";
          break;
        case "center":
        default:
          xPosition = "(W-w)/2";
          yPosition = "(H-h)/2";
          break;
      }

      // Scale and overlay filter with time constraints
      const overlayFilter = `[1:v]scale=iw*${scale}:ih*${scale}[img];[0:v][img]overlay=${xPosition}:${yPosition}:enable='between(t,${startSec},${actualEnd})'`;

      console.log(`FFmpeg overlay filter: ${overlayFilter}`);
      console.log(`Using image path: ${actualImagePath}`);

      const command = ffmpeg(inputPath)
        .input(actualImagePath)
        .complexFilter(overlayFilter)
        .outputOptions([
          "-preset",
          "ultrafast", // Changed from veryfast for speed
          "-crf",
          "28", // Faster encoding
          "-movflags",
          "+faststart",
        ])
        .output(outputPath)
        .on("start", (cmdLine) => {
          console.log("FFmpeg command:", cmdLine);
        })
        .on("progress", (progress) => {
          console.log(`FFmpeg progress: ${progress.percent}%`);
          if (onProgress && progress.percent) {
            onProgress(Math.min(progress.percent, 99));
          }
        })
        .on("end", () => {
          console.log("FFmpeg completed successfully");
          if (onProgress) onProgress(100);
          // Clean up temporary file
          if (tempImagePath && fs.existsSync(tempImagePath)) {
            fs.unlinkSync(tempImagePath);
          }
          resolve();
        })
        .on("error", (err) => {
          console.error("FFmpeg error:", err);
          console.error("Image overlay error:", err);
          // Clean up temporary file on error
          if (tempImagePath && fs.existsSync(tempImagePath)) {
            fs.unlinkSync(tempImagePath);
          }
          reject(err);
        })
        .run();
    } catch (error) {
      // Clean up temporary file on error
      if (tempImagePath && fs.existsSync(tempImagePath)) {
        fs.unlinkSync(tempImagePath);
      }
      reject(error);
    }
  });
}

/**
 * Add text overlay to video
 */
export async function addTextOverlay(
  inputPath: string,
  outputPath: string,
  text: string,
  startSec: number = 0,
  endSec: number = 0,
  options?: {
    position?: "top" | "center" | "bottom";
    animation?: "fade" | "none";
    fontSize?: number;
    fontColor?: string;
    bgColor?: string;
  },
  onProgress?: (percent: number) => void,
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const metadata = await getMetadata(inputPath);
      const duration = metadata.duration || 0;
      const actualEnd = endSec > 0 ? endSec : duration;

      // Escape text for FFmpeg
      const escapedText = text.replace(/'/g, "\\'").replace(/:/g, "\\:");

      // Default options
      const position = options?.position || "bottom";
      const animation = options?.animation || "fade";
      const fontSize = options?.fontSize || 72;
      const fontColor = options?.fontColor || "white";
      const bgColor = options?.bgColor || "black@0.7";

      // Calculate positioning - SIMPLIFIED for reliability
      let yPosition: string;
      switch (position) {
        case "top":
          yPosition = "100";
          break;
        case "center":
          yPosition = "(h-text_h)/2";
          break;
        case "bottom":
        default:
          yPosition = "h-200";
          break;
      }

      const xPosition = "(w-text_w)/2"; // Always center horizontally

      // SIMPLIFIED: Only fade animation to avoid complex expressions
      // Complex slide animations cause FFmpeg parsing errors
      let textFilter: string;

      if (animation === "none") {
        // No animation - just show/hide
        textFilter = `drawtext=text='${escapedText}':fontsize=${fontSize}:fontcolor=${fontColor}:borderw=3:bordercolor=black:x=${xPosition}:y=${yPosition}:box=1:boxcolor=${bgColor}:boxborderw=20:enable='between(t,${startSec},${actualEnd})'`;
      } else {
        // Fade animation only (most reliable)
        const fadeDuration = 0.3;
        const fadeInEnd = startSec + fadeDuration;
        const fadeOutStart = actualEnd - fadeDuration;

        // Simplified alpha with less nesting
        let alphaExpr = "1";
        if (actualEnd - startSec > fadeDuration * 2) {
          // Only add fades if duration is long enough
          alphaExpr = `if(lt(t,${fadeInEnd}),(t-${startSec})/${fadeDuration},if(gt(t,${fadeOutStart}),(${actualEnd}-t)/${fadeDuration},1))`;
        }

        textFilter = `drawtext=text='${escapedText}':fontsize=${fontSize}:fontcolor=${fontColor}:borderw=3:bordercolor=black:x=${xPosition}:y=${yPosition}:box=1:boxcolor=${bgColor}:boxborderw=20:enable='between(t,${startSec},${actualEnd})':alpha='${alphaExpr}'`;
      }

      console.log(`Caption FFmpeg filter: ${textFilter}`);

      const command = ffmpeg(inputPath)
        .videoFilters(textFilter)
        .outputOptions([
          "-preset",
          "ultrafast",
          "-crf",
          "28",
          "-pix_fmt",
          "yuv420p",
          "-movflags",
          "+faststart",
        ])
        .output(outputPath)
        .on("start", (cmdLine) => {
          console.log("Caption FFmpeg command:", cmdLine);
        })
        .on("stderr", (stderrLine) => {
          console.log("FFmpeg stderr:", stderrLine);
        })
        .on("progress", (progress) => {
          console.log(`Caption progress: ${JSON.stringify(progress)}`);
          if (onProgress && progress.percent) {
            onProgress(Math.min(progress.percent, 99));
          }
        })
        .on("end", () => {
          if (onProgress) onProgress(100);
          resolve();
        })
        .on("error", (err) => {
          console.error("Text overlay error:", err);
          reject(err);
        })
        .run();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Trim video to keep only specific timeframe (cut out rest)
 */
export async function trimVideo(
  inputPath: string,
  outputPath: string,
  startSec: number,
  endSec: number,
  onProgress?: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .setStartTime(startSec)
      .setDuration(endSec - startSec)
      .output(outputPath)
      .on("progress", (progress) => {
        if (onProgress && progress.percent) {
          onProgress(Math.min(progress.percent, 99));
        }
      })
      .on("end", () => {
        if (onProgress) onProgress(100);
        resolve();
      })
      .on("error", (err) => {
        console.error("Trim error:", err);
        reject(err);
      })
      .run();
  });
}

/**
 * Overlay audio onto video at specific time
 */
export async function overlayAudio(
  inputPath: string,
  outputPath: string,
  audioPath: string,
  startSec: number = 0,
  volume: number = 1.0,
  loop: boolean = false,
  onProgress?: (percent: number) => void,
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    let tempAudioPath: string | null = null;

    try {
      // Handle HTTP/HTTPS audio URLs by downloading to temp file
      let actualAudioPath = audioPath;
      if (audioPath.startsWith("http://") || audioPath.startsWith("https://")) {
        console.log(`Downloading audio from URL: ${audioPath}`);
        const extension = audioPath.split(".").pop()?.split("?")[0] || "mp3";
        tempAudioPath = path.join(
          path.dirname(outputPath),
          `temp_audio_${Date.now()}.${extension}`,
        );

        const response = await fetch(audioPath);
        if (!response.ok) {
          throw new Error(`Failed to download audio: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        fs.writeFileSync(tempAudioPath, buffer);
        actualAudioPath = tempAudioPath;
        console.log(`Audio downloaded to: ${tempAudioPath}`);
      }

      console.log(`Overlaying audio at ${startSec}s with volume ${volume}`);

      // Check if input video has audio stream
      const cmd = ffmpeg(inputPath);

      cmd.ffprobe((err, metadata) => {
        if (err) {
          reject(err);
          return;
        }

        const hasAudioStream = metadata.streams.some(
          (stream) => stream.codec_type === "audio",
        );
        console.log(`Input video has audio: ${hasAudioStream}`);

        // Mix audio: adelay to offset audio start time, volume adjustment
        const audioDelayMs = startSec * 1000;

        let audioFilter: string;
        if (hasAudioStream) {
          // Mix with existing audio
          audioFilter = `[1:a]adelay=${audioDelayMs}|${audioDelayMs},volume=${volume}[aud];[0:a][aud]amix=inputs=2:duration=first[aout]`;
        } else {
          // No existing audio, just add the overlay audio
          audioFilter = `[1:a]adelay=${audioDelayMs}|${audioDelayMs},volume=${volume}[aout]`;
        }

        ffmpeg(inputPath)
          .input(actualAudioPath)
          .complexFilter(audioFilter)
          .outputOptions([
            "-map",
            "0:v",
            "-map",
            "[aout]",
            "-preset",
            "ultrafast",
            "-crf",
            "28",
            "-shortest", // End when shortest input ends
            "-movflags",
            "+faststart",
          ])
          .output(outputPath)
          .on("start", (cmdLine) => {
            console.log("Audio overlay FFmpeg command:", cmdLine);
          })
          .on("progress", (progress) => {
            if (onProgress && progress.percent) {
              onProgress(Math.min(progress.percent, 99));
            }
          })
          .on("end", () => {
            console.log("Audio overlay completed");
            if (onProgress) onProgress(100);
            // Clean up temp file
            if (tempAudioPath && fs.existsSync(tempAudioPath)) {
              fs.unlinkSync(tempAudioPath);
            }
            resolve();
          })
          .on("error", (err) => {
            console.error("Audio overlay error:", err);
            // Clean up temp file on error
            if (tempAudioPath && fs.existsSync(tempAudioPath)) {
              fs.unlinkSync(tempAudioPath);
            }
            reject(err);
          })
          .run();
      });
    } catch (error) {
      // Clean up temp file on error
      if (tempAudioPath && fs.existsSync(tempAudioPath)) {
        fs.unlinkSync(tempAudioPath);
      }
      reject(error);
    }
  });
}

/**
 * Overlay video meme onto main video at specific time and position
 */
export async function overlayVideo(
  inputPath: string,
  outputPath: string,
  overlayVideoPath: string,
  startSec: number = 0,
  durationSec?: number,
  position:
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
    | "center" = "bottom-right",
  scale: number = 0.3,
  onProgress?: (percent: number) => void,
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    let tempVideoPath: string | null = null;

    try {
      // Handle HTTP/HTTPS video URLs by downloading to temp file
      let actualVideoPath = overlayVideoPath;
      if (
        overlayVideoPath.startsWith("http://") ||
        overlayVideoPath.startsWith("https://")
      ) {
        console.log(`Downloading video from URL: ${overlayVideoPath}`);
        const extension =
          overlayVideoPath.split(".").pop()?.split("?")[0] || "mp4";
        tempVideoPath = path.join(
          path.dirname(outputPath),
          `temp_overlay_${Date.now()}.${extension}`,
        );

        const response = await fetch(overlayVideoPath);
        if (!response.ok) {
          throw new Error(`Failed to download video: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        fs.writeFileSync(tempVideoPath, buffer);
        actualVideoPath = tempVideoPath;
        console.log(`Video overlay downloaded to: ${tempVideoPath}`);
      }

      console.log(
        `Overlaying video at ${startSec}s, position: ${position}, scale: ${scale}`,
      );

      // Calculate position coordinates
      let xPos = "";
      let yPos = "";

      switch (position) {
        case "top-left":
          xPos = "10";
          yPos = "10";
          break;
        case "top-right":
          xPos = "W-w-10";
          yPos = "10";
          break;
        case "bottom-left":
          xPos = "10";
          yPos = "H-h-10";
          break;
        case "bottom-right":
          xPos = "W-w-10";
          yPos = "H-h-10";
          break;
        case "center":
          xPos = "(W-w)/2";
          yPos = "(H-h)/2";
          break;
      }

      // Build overlay filter with timing
      const scaleFilter = `scale=iw*${scale}:ih*${scale}`;
      const enableCondition = durationSec
        ? `enable='between(t,${startSec},${startSec + durationSec})'`
        : `enable='gte(t,${startSec})'`;

      const overlayFilter = `[1:v]${scaleFilter}[ovr];[0:v][ovr]overlay=x=${xPos}:y=${yPos}:${enableCondition}[vout]`;

      ffmpeg(inputPath)
        .input(actualVideoPath)
        .complexFilter(overlayFilter)
        .outputOptions([
          "-map",
          "[vout]",
          "-map",
          "0:a?", // Include audio from main video if exists
          "-preset",
          "ultrafast",
          "-crf",
          "28",
          "-shortest",
          "-movflags",
          "+faststart",
        ])
        .output(outputPath)
        .on("start", (cmdLine) => {
          console.log("Video overlay FFmpeg command:", cmdLine);
        })
        .on("progress", (progress) => {
          if (onProgress && progress.percent) {
            onProgress(Math.min(progress.percent, 99));
          }
        })
        .on("end", () => {
          console.log("Video overlay completed");
          if (onProgress) onProgress(100);
          // Clean up temp file
          if (tempVideoPath && fs.existsSync(tempVideoPath)) {
            fs.unlinkSync(tempVideoPath);
          }
          resolve();
        })
        .on("error", (err) => {
          console.error("Video overlay error:", err);
          // Clean up temp file on error
          if (tempVideoPath && fs.existsSync(tempVideoPath)) {
            fs.unlinkSync(tempVideoPath);
          }
          reject(err);
        })
        .run();
    } catch (error) {
      // Clean up temp file on error
      if (tempVideoPath && fs.existsSync(tempVideoPath)) {
        fs.unlinkSync(tempVideoPath);
      }
      reject(error);
    }
  });
}

/**
 * Change video speed (slow-mo or fast-forward) with optional timeframe support
 */
export async function changeSpeed(
  inputPath: string,
  outputPath: string,
  speedFactor: number, // 0.5 = half speed (slow-mo), 2.0 = double speed (fast)
  startSec: number = 0,
  endSec: number = 0,
  onProgress?: (percent: number) => void,
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const metadata = await getMetadata(inputPath);
      const duration = metadata.duration || 0;
      const actualEnd = endSec > 0 ? endSec : duration;

      // If affecting entire video, use simpler approach
      if (startSec === 0 && actualEnd >= duration) {
        // For video: setpts filter adjusts timestamps
        // For audio: atempo filter adjusts tempo (must be between 0.5 and 100.0)
        const videoPTS = 1 / speedFactor;

        // FFmpeg atempo has limits, so we may need to chain multiple atempo filters
        let audioFilter = "";
        let remainingSpeed = speedFactor;

        if (speedFactor >= 0.5 && speedFactor <= 2.0) {
          audioFilter = `atempo=${speedFactor}`;
        } else if (speedFactor < 0.5) {
          // Very slow: chain atempo filters
          audioFilter = `atempo=0.5,atempo=${speedFactor / 0.5}`;
        } else {
          // Very fast: chain atempo filters
          const chainedFilters: string[] = [];
          while (remainingSpeed > 2.0) {
            chainedFilters.push("atempo=2.0");
            remainingSpeed /= 2.0;
          }
          chainedFilters.push(`atempo=${remainingSpeed}`);
          audioFilter = chainedFilters.join(",");
        }

        ffmpeg(inputPath)
          .videoFilters(`setpts=${videoPTS}*PTS`)
          .audioFilters(audioFilter)
          .outputOptions([
            "-preset",
            "veryfast",
            "-crf",
            "23",
            "-movflags",
            "+faststart",
          ])
          .output(outputPath)
          .on("progress", (progress) => {
            if (onProgress && progress.percent) {
              onProgress(Math.min(progress.percent, 99));
            }
          })
          .on("end", () => {
            if (onProgress) onProgress(100);
            resolve();
          })
          .on("error", (err) => {
            console.error("Speed change error:", err);
            reject(err);
          })
          .run();
      } else {
        // Time-constrained speed change: split video into segments
        // Segment 1: before speed change (0 to startSec)
        // Segment 2: speed changed portion (startSec to actualEnd)
        // Segment 3: after speed change (actualEnd to duration)

        const videoPTS = 1 / speedFactor;
        let audioFilter = "";
        let remainingSpeed = speedFactor;

        if (speedFactor >= 0.5 && speedFactor <= 2.0) {
          audioFilter = `atempo=${speedFactor}`;
        } else if (speedFactor < 0.5) {
          audioFilter = `atempo=0.5,atempo=${speedFactor / 0.5}`;
        } else {
          const chainedFilters: string[] = [];
          while (remainingSpeed > 2.0) {
            chainedFilters.push("atempo=2.0");
            remainingSpeed /= 2.0;
          }
          chainedFilters.push(`atempo=${remainingSpeed}`);
          audioFilter = chainedFilters.join(",");
        }

        // Build filter_complex for segmented speed change
        const filters: string[] = [];

        // Segment 1: before (normal speed)
        if (startSec > 0) {
          filters.push(`[0:v]trim=0:${startSec},setpts=PTS-STARTPTS[v1]`);
          filters.push(`[0:a]atrim=0:${startSec},asetpts=PTS-STARTPTS[a1]`);
        }

        // Segment 2: speed changed portion
        filters.push(
          `[0:v]trim=${startSec}:${actualEnd},setpts=${videoPTS}*(PTS-STARTPTS)[v2]`,
        );
        filters.push(
          `[0:a]atrim=${startSec}:${actualEnd},asetpts=PTS-STARTPTS,${audioFilter}[a2]`,
        );

        // Segment 3: after (normal speed)
        if (actualEnd < duration) {
          filters.push(
            `[0:v]trim=${actualEnd}:${duration},setpts=PTS-STARTPTS[v3]`,
          );
          filters.push(
            `[0:a]atrim=${actualEnd}:${duration},asetpts=PTS-STARTPTS[a3]`,
          );
        }

        // Concatenate all segments
        const segmentCount =
          (startSec > 0 ? 1 : 0) + 1 + (actualEnd < duration ? 1 : 0);
        const vLabels = [];
        const aLabels = [];
        for (let i = 1; i <= segmentCount; i++) {
          vLabels.push(`[v${i}]`);
          aLabels.push(`[a${i}]`);
        }

        filters.push(
          `${vLabels.join("")}concat=n=${segmentCount}:v=1:a=0[outv]`,
        );
        filters.push(
          `${aLabels.join("")}concat=n=${segmentCount}:v=0:a=1[outa]`,
        );

        const filterComplex = filters.join("; ");

        ffmpeg(inputPath)
          .complexFilter(filterComplex)
          .outputOptions([
            "-map",
            "[outv]",
            "-map",
            "[outa]",
            "-preset",
            "veryfast",
            "-crf",
            "23",
            "-movflags",
            "+faststart",
          ])
          .output(outputPath)
          .on("progress", (progress) => {
            if (onProgress && progress.percent) {
              onProgress(Math.min(progress.percent, 99));
            }
          })
          .on("end", () => {
            if (onProgress) onProgress(100);
            resolve();
          })
          .on("error", (err) => {
            console.error("Speed change error:", err);
            reject(err);
          })
          .run();
      }
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Process all operations in sequence
 */
export async function processOperations(
  inputVideoPath: string,
  operations: EditOperation[],
  onProgress?: (progress: ProcessingProgress) => void,
): Promise<string> {
  const outputDir = path.join(process.cwd(), "public", "uploads", "processed");

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const timestamp = Date.now();
  const finalOutputPath = path.join(outputDir, `processed_${timestamp}.mp4`);

  let currentInputPath = inputVideoPath;
  let tempFileIndex = 0;

  try {
    // Sort operations by dependency (silence removal first, then effects)
    const sortedOps = [...operations].sort((a, b) => {
      if (a.op === "remove_silence") return -1;
      if (b.op === "remove_silence") return 1;
      return 0;
    });

    for (let i = 0; i < sortedOps.length; i++) {
      const operation = sortedOps[i];
      const isLastOp = i === sortedOps.length - 1;
      const outputPath = isLastOp
        ? finalOutputPath
        : path.join(outputDir, `temp_${timestamp}_${tempFileIndex++}.mp4`);

      if (onProgress) {
        onProgress({
          percent: (i / sortedOps.length) * 100,
          currentOperation: operation.label,
          status: "processing",
        });
      }

      switch (operation.op) {
        case "remove_silence":
          await removeSilence(
            currentInputPath,
            outputPath,
            (operation.params.minSilence as number) || 0.6,
            (operation.params.thresholdDb as number) || -30,
            (percent) => {
              if (onProgress) {
                const totalPercent =
                  (i / sortedOps.length) * 100 +
                  (percent / 100 / sortedOps.length) * 100;
                onProgress({
                  percent: totalPercent,
                  currentOperation: operation.label,
                  status: "processing",
                });
              }
            },
          );
          break;

        case "effect":
          const effectName = operation.label.toLowerCase().replace(/\s+/g, "-");
          if (["punch-in", "shake", "blur", "glitch"].includes(effectName)) {
            await applyEffect(
              currentInputPath,
              outputPath,
              effectName,
              (operation.params.strength as number) || 50,
              operation.startSec,
              operation.endSec,
              (percent) => {
                if (onProgress) {
                  const totalPercent =
                    (i / sortedOps.length) * 100 +
                    (percent / 100 / sortedOps.length) * 100;
                  onProgress({
                    percent: totalPercent,
                    currentOperation: operation.label,
                    status: "processing",
                  });
                }
              },
            );
          } else if (effectName === "bass-boost") {
            await applyAudioEffect(
              currentInputPath,
              outputPath,
              effectName,
              (operation.params.strength as number) || 50,
              (percent) => {
                if (onProgress) {
                  const totalPercent =
                    (i / sortedOps.length) * 100 +
                    (percent / 100 / sortedOps.length) * 100;
                  onProgress({
                    percent: totalPercent,
                    currentOperation: operation.label,
                    status: "processing",
                  });
                }
              },
            );
          } else {
            // Unknown effect, skip
            if (currentInputPath !== outputPath) {
              fs.copyFileSync(currentInputPath, outputPath);
            }
          }
          break;

        case "overlay_image":
          // Add image overlay
          const imagePath = operation.params.imagePath as string;
          if (!imagePath) {
            console.error("Image overlay requires imagePath parameter");
            if (currentInputPath !== outputPath) {
              fs.copyFileSync(currentInputPath, outputPath);
            }
            break;
          }

          console.log("Processing image overlay:", {
            operation: operation.label,
            imagePath:
              imagePath.substring(0, 50) + (imagePath.length > 50 ? "..." : ""),
            startSec: operation.startSec,
            endSec: operation.endSec,
          });

          const imageOptions = {
            position:
              (operation.params.position as
                | "top-left"
                | "top-right"
                | "bottom-left"
                | "bottom-right"
                | "center") || "top-right",
            scale: (operation.params.scale as number) || 0.3,
          };

          await addImageOverlay(
            currentInputPath,
            outputPath,
            imagePath,
            operation.startSec,
            operation.endSec,
            imageOptions,
            (percent) => {
              if (onProgress) {
                const totalPercent =
                  (i / sortedOps.length) * 100 +
                  (percent / 100 / sortedOps.length) * 100;
                onProgress({
                  percent: totalPercent,
                  currentOperation: operation.label,
                  status: "processing",
                });
              }
            },
          );
          break;

        case "overlay_audio":
          // Add audio overlay/sound effect
          const audioPath = operation.params.audioPath as string;
          if (!audioPath) {
            console.error("Audio overlay requires audioPath parameter");
            if (currentInputPath !== outputPath) {
              fs.copyFileSync(currentInputPath, outputPath);
            }
            break;
          }

          console.log("Processing audio overlay:", {
            operation: operation.label,
            audioPath:
              audioPath.substring(0, 50) + (audioPath.length > 50 ? "..." : ""),
            startSec: operation.startSec,
            volume: operation.params.volume || 0.5,
          });

          const audioVolume = (operation.params.volume as number) || 1.0;
          const audioLoop = (operation.params.loop as boolean) || false;

          await overlayAudio(
            currentInputPath,
            outputPath,
            audioPath,
            operation.startSec,
            audioVolume,
            audioLoop,
            (percent) => {
              if (onProgress) {
                const totalPercent =
                  (i / sortedOps.length) * 100 +
                  (percent / 100 / sortedOps.length) * 100;
                onProgress({
                  percent: totalPercent,
                  currentOperation: operation.label,
                  status: "processing",
                });
              }
            },
          );
          break;

        case "overlay_video":
          // Add video meme overlay
          const videoPath = operation.params.videoPath as string;
          if (!videoPath) {
            console.error("Video overlay requires videoPath parameter");
            if (currentInputPath !== outputPath) {
              fs.copyFileSync(currentInputPath, outputPath);
            }
            break;
          }

          console.log("Processing video overlay:", {
            operation: operation.label,
            videoPath:
              videoPath.substring(0, 50) + (videoPath.length > 50 ? "..." : ""),
            startSec: operation.startSec,
            duration: operation.endSec
              ? operation.endSec - operation.startSec
              : "full",
          });

          const videoOptions = {
            position:
              (operation.params.position as
                | "top-left"
                | "top-right"
                | "bottom-left"
                | "bottom-right"
                | "center") || "bottom-right",
            scale: (operation.params.scale as number) || 0.3,
          };

          const videoDuration = operation.endSec
            ? operation.endSec - operation.startSec
            : undefined;

          await overlayVideo(
            currentInputPath,
            outputPath,
            videoPath,
            operation.startSec,
            videoDuration,
            videoOptions.position,
            videoOptions.scale,
            (percent) => {
              if (onProgress) {
                const totalPercent =
                  (i / sortedOps.length) * 100 +
                  (percent / 100 / sortedOps.length) * 100;
                onProgress({
                  percent: totalPercent,
                  currentOperation: operation.label,
                  status: "processing",
                });
              }
            },
          );
          break;

        case "captions":
          // Add text overlay with enhanced options
          const captionText =
            (operation.params.text as string) || operation.label;
          const animationType =
            (operation.params.animation as string) || "fade";
          // Only allow 'fade' or 'none' for FFmpeg compatibility
          const safeAnimation = (animationType === "none" ? "none" : "fade") as
            | "fade"
            | "none";

          const captionOptions = {
            position:
              (operation.params.position as "top" | "center" | "bottom") ||
              "bottom",
            animation: safeAnimation,
            fontSize: (operation.params.fontSize as number) || 72,
            fontColor: (operation.params.fontColor as string) || "white",
            bgColor: (operation.params.bgColor as string) || "black@0.7",
          };

          await addTextOverlay(
            currentInputPath,
            outputPath,
            captionText,
            operation.startSec,
            operation.endSec,
            captionOptions,
            (percent) => {
              if (onProgress) {
                const totalPercent =
                  (i / sortedOps.length) * 100 +
                  (percent / 100 / sortedOps.length) * 100;
                onProgress({
                  percent: totalPercent,
                  currentOperation: operation.label,
                  status: "processing",
                });
              }
            },
          );
          break;

        case "trim":
          // Trim video to specific timeframe
          await trimVideo(
            currentInputPath,
            outputPath,
            operation.startSec,
            operation.endSec,
            (percent) => {
              if (onProgress) {
                const totalPercent =
                  (i / sortedOps.length) * 100 +
                  (percent / 100 / sortedOps.length) * 100;
                onProgress({
                  percent: totalPercent,
                  currentOperation: operation.label,
                  status: "processing",
                });
              }
            },
          );
          break;

        case "speed":
          // Change video speed with timeframe support
          const speedFactor = (operation.params.speed as number) || 1.0;
          await changeSpeed(
            currentInputPath,
            outputPath,
            speedFactor,
            operation.startSec,
            operation.endSec,
            (percent) => {
              if (onProgress) {
                const totalPercent =
                  (i / sortedOps.length) * 100 +
                  (percent / 100 / sortedOps.length) * 100;
                onProgress({
                  percent: totalPercent,
                  currentOperation: operation.label,
                  status: "processing",
                });
              }
            },
          );
          break;

        case "color_grade":
          // Apply color grading preset
          const colorPreset = (operation.params.preset as string) || "warm";
          const colorIntensity = (operation.params.intensity as number) || 100;
          await applyColorGrade(
            currentInputPath,
            outputPath,
            colorPreset,
            operation.startSec,
            operation.endSec,
            colorIntensity,
            (percent) => {
              if (onProgress) {
                const totalPercent =
                  (i / sortedOps.length) * 100 +
                  (percent / 100 / sortedOps.length) * 100;
                onProgress({
                  percent: totalPercent,
                  currentOperation: operation.label,
                  status: "processing",
                });
              }
            },
          );
          break;

        default:
          // Unknown operation, skip
          if (currentInputPath !== outputPath) {
            fs.copyFileSync(currentInputPath, outputPath);
          }
          break;
      }

      // Clean up temp file if not the original input
      if (
        currentInputPath !== inputVideoPath &&
        fs.existsSync(currentInputPath)
      ) {
        fs.unlinkSync(currentInputPath);
      }

      currentInputPath = outputPath;
    }

    if (onProgress) {
      onProgress({
        percent: 100,
        currentOperation: "Complete",
        status: "completed",
        outputPath: `/uploads/processed/processed_${timestamp}.mp4`,
      });
    }

    return `/uploads/processed/processed_${timestamp}.mp4`;
  } catch (error) {
    // Clean up temp files on error
    if (
      currentInputPath !== inputVideoPath &&
      fs.existsSync(currentInputPath)
    ) {
      try {
        fs.unlinkSync(currentInputPath);
      } catch (e) {
        console.error("Error cleaning up temp file:", e);
      }
    }

    if (onProgress) {
      onProgress({
        percent: 0,
        currentOperation: "Error",
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    throw error;
  }
}

/**
 * Helper to get video metadata
 */
async function getMetadata(
  videoPath: string,
): Promise<{ duration?: number; width?: number; height?: number }> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }

      const videoStream = metadata.streams.find(
        (stream) => stream.codec_type === "video",
      );

      resolve({
        duration: parseFloat(String(metadata.format.duration || 0)),
        width: videoStream?.width || 0,
        height: videoStream?.height || 0,
      });
    });
  });
}
