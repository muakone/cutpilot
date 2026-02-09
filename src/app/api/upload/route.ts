import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import {
  extractVideoMetadata,
  generateThumbnail,
  ensureUploadDirs,
  validateVideoFile,
} from "@/lib/videoUtils";

export async function POST(request: NextRequest) {
  try {
    // Ensure upload directories exist
    ensureUploadDirs();

    // Get the form data
    const formData = await request.formData();
    const videoFile = formData.get("video") as File;
    const projectId = formData.get("projectId") as string;

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 },
      );
    }

    if (!videoFile) {
      return NextResponse.json(
        { error: "No video file provided" },
        { status: 400 },
      );
    }

    // Validate file
    const validation = validateVideoFile(videoFile.name, videoFile.size);

    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const ext = path.extname(videoFile.name);
    const filename = `video_${timestamp}${ext}`;
    const thumbnailFilename = `thumb_${timestamp}.jpg`;

    // Define paths
    const videoDir = path.join(process.cwd(), "public", "uploads", "videos");
    const thumbnailDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "thumbnails",
    );
    const videoPath = path.join(videoDir, filename);
    const thumbnailPath = path.join(thumbnailDir, thumbnailFilename);

    // Convert File to Buffer and save
    const bytes = await videoFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    fs.writeFileSync(videoPath, buffer);

    // Extract metadata
    let metadata;
    try {
      metadata = await extractVideoMetadata(videoPath);
    } catch (error) {
      // Clean up uploaded file if metadata extraction fails
      fs.unlinkSync(videoPath);
      return NextResponse.json(
        {
          error: "Failed to extract video metadata",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 400 },
      );
    }

    // Generate thumbnail
    try {
      await generateThumbnail(videoPath, thumbnailPath, 0);
    } catch (error) {
      console.error("Failed to generate thumbnail:", error);
      // Continue even if thumbnail generation fails
    }

    // Return video data (client will store in localStorage)
    const videoData = {
      id: `video_${timestamp}`,
      filename: videoFile.name,
      filepath: `/uploads/videos/${filename}`,
      durationSec: metadata.durationSec,
      width: metadata.width,
      height: metadata.height,
      fps: metadata.fps,
      thumbnail: fs.existsSync(thumbnailPath)
        ? `/uploads/thumbnails/${thumbnailFilename}`
        : null,
    };

    return NextResponse.json({
      success: true,
      video: videoData,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        error: "server_error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
