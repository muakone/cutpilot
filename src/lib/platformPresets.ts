import ffmpeg from "fluent-ffmpeg";

export interface PlatformPreset {
  id: string;
  name: string;
  description: string;
  width: number;
  height: number;
  fps: number;
  bitrate: string;
  aspectRatio: string;
  maxDuration?: number;
  maxFileSize?: number; // in MB
}

export const PLATFORM_PRESETS: Record<string, PlatformPreset> = {
  tiktok: {
    id: "tiktok",
    name: "TikTok / Instagram Reels",
    description: "Vertical 9:16, optimized for TikTok and Instagram",
    width: 1080,
    height: 1920,
    fps: 30,
    bitrate: "3000k",
    aspectRatio: "9:16",
    maxDuration: 60,
    maxFileSize: 287,
  },
  youtube_shorts: {
    id: "youtube_shorts",
    name: "YouTube Shorts",
    description: "Vertical 9:16, optimized for YouTube Shorts",
    width: 1080,
    height: 1920,
    fps: 30,
    bitrate: "3500k",
    aspectRatio: "9:16",
    maxDuration: 60,
  },
  youtube: {
    id: "youtube",
    name: "YouTube (1080p)",
    description: "Horizontal 16:9, standard YouTube format",
    width: 1920,
    height: 1080,
    fps: 30,
    bitrate: "5000k",
    aspectRatio: "16:9",
  },
  youtube_720: {
    id: "youtube_720",
    name: "YouTube (720p)",
    description: "Horizontal 16:9, compressed for faster uploads",
    width: 1280,
    height: 720,
    fps: 30,
    bitrate: "2500k",
    aspectRatio: "16:9",
  },
  instagram_story: {
    id: "instagram_story",
    name: "Instagram Story",
    description: "Vertical 9:16, optimized for Instagram Stories",
    width: 1080,
    height: 1920,
    fps: 30,
    bitrate: "3000k",
    aspectRatio: "9:16",
    maxDuration: 60,
    maxFileSize: 100,
  },
};

/**
 * Convert video to platform-specific format
 */
export async function convertToPlatform(
  inputPath: string,
  outputPath: string,
  presetId: string,
  onProgress?: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const preset = PLATFORM_PRESETS[presetId];
    if (!preset) {
      reject(new Error(`Unknown preset: ${presetId}`));
      return;
    }

    console.log(`[Platform] Converting to ${preset.name}...`);
    console.log(`[Platform] Target resolution: ${preset.width}x${preset.height}`);

    const command = ffmpeg(inputPath)
      .size(`${preset.width}x${preset.height}`)
      .fps(preset.fps)
      .videoBitrate(preset.bitrate)
      .videoCodec("libx264")
      .audioCodec("aac")
      .audioBitrate("128k")
      .format("mp4")
      .outputOptions([
        "-preset fast",
        "-movflags +faststart", // Enable streaming
        "-pix_fmt yuv420p", // Compatibility
      ]);

    // Apply aspect ratio fitting
    if (preset.aspectRatio === "9:16") {
      // Vertical video - smart crop or pad
      command.outputOptions([
        "-vf",
        `scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920`,
      ]);
    }

    command
      .output(outputPath)
      .on("progress", (progress) => {
        if (onProgress && progress.percent) {
          onProgress(Math.min(progress.percent, 99));
        }
      })
      .on("end", () => {
        if (onProgress) onProgress(100);
        console.log(`[Platform] Conversion complete: ${outputPath}`);
        resolve();
      })
      .on("error", (err) => {
        console.error(`[Platform] Conversion error:`, err);
        reject(err);
      })
      .run();
  });
}

/**
 * Check if video duration exceeds platform limits
 */
export function checkPlatformLimits(
  durationSec: number,
  presetId: string
): { valid: boolean; message?: string } {
  const preset = PLATFORM_PRESETS[presetId];
  if (!preset) {
    return { valid: false, message: "Unknown platform" };
  }

  if (preset.maxDuration && durationSec > preset.maxDuration) {
    return {
      valid: false,
      message: `Video is ${Math.round(durationSec)}s. ${preset.name} max is ${preset.maxDuration}s. Trim your video first.`,
    };
  }

  return { valid: true };
}
