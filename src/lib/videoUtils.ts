import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs";

// Set FFmpeg and FFprobe paths with error handling
try {
  const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
  const ffprobeInstaller = require("@ffprobe-installer/ffprobe");

  if (ffmpegInstaller && ffmpegInstaller.path) {
    ffmpeg.setFfmpegPath(ffmpegInstaller.path);
    console.log("FFmpeg path set to:", ffmpegInstaller.path);
  }

  if (ffprobeInstaller && ffprobeInstaller.path) {
    ffmpeg.setFfprobePath(ffprobeInstaller.path);
    console.log("FFprobe path set to:", ffprobeInstaller.path);
  }
} catch (error) {
  console.warn("Could not load ffmpeg/ffprobe installers:", error);
  // Will try to use system FFmpeg/FFprobe from PATH
}

export interface VideoMetadata {
  durationSec: number;
  width: number;
  height: number;
  fps: number;
  codec: string;
}

/**
 * Extract video metadata using FFprobe
 */
export async function extractVideoMetadata(
  videoPath: string,
): Promise<VideoMetadata> {
  console.log("Extracting metadata from:", videoPath);

  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        console.error("FFprobe error:", err);
        reject(new Error(`Failed to extract metadata: ${err.message}`));
        return;
      }

      console.log("FFprobe metadata:", JSON.stringify(metadata, null, 2));

      const videoStream = metadata.streams.find(
        (stream) => stream.codec_type === "video",
      );

      if (!videoStream) {
        console.error("No video stream found in metadata");
        reject(new Error("No video stream found"));
        return;
      }

      const durationSec = parseFloat(String(metadata.format.duration || 0));
      const width = videoStream.width || 0;
      const height = videoStream.height || 0;
      // Parse frame rate like "30/1" to 30
      const fpsString = videoStream.r_frame_rate || "0/1";
      const [num, denom] = fpsString.split("/").map(Number);
      const fps = denom && denom !== 0 ? num / denom : 0;
      const codec = videoStream.codec_name || "unknown";

      console.log("Extracted metadata:", {
        durationSec,
        width,
        height,
        fps,
        codec,
      });

      resolve({
        durationSec,
        width,
        height,
        fps,
        codec,
      });
    });
  });
}

/**
 * Generate thumbnail at a specific timestamp
 */
export async function generateThumbnail(
  videoPath: string,
  outputPath: string,
  timestampSec: number = 0,
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .screenshots({
        timestamps: [timestampSec],
        filename: path.basename(outputPath),
        folder: path.dirname(outputPath),
        size: "640x360",
      })
      .on("end", () => resolve())
      .on("error", (err) =>
        reject(new Error(`Failed to generate thumbnail: ${err.message}`)),
      );
  });
}

/**
 * Ensure upload directories exist
 */
export function ensureUploadDirs() {
  const dirs = [
    path.join(process.cwd(), "public", "uploads", "videos"),
    path.join(process.cwd(), "public", "uploads", "thumbnails"),
  ];

  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

/**
 * Validate video file
 */
export function validateVideoFile(
  filename: string,
  filesize: number,
): { valid: boolean; error?: string } {
  const allowedExtensions = [".mp4", ".mov", ".avi", ".mkv", ".webm"];
  const maxSizeMB = 500;
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const ext = path.extname(filename).toLowerCase();

  if (!allowedExtensions.includes(ext)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${allowedExtensions.join(", ")}`,
    };
  }

  if (filesize > maxSizeBytes) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${maxSizeMB}MB`,
    };
  }

  return { valid: true };
}
