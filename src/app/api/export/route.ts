import { NextRequest, NextResponse } from "next/server";
import path from "path";
import {
  PLATFORM_PRESETS,
  convertToPlatform,
  checkPlatformLimits,
} from "@/lib/platformPresets";

// Store active export jobs
const exportJobs = new Map<
  string,
  {
    status: "processing" | "completed" | "error";
    progress: number;
    outputPath?: string;
    error?: string;
  }
>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { videoPath, platform, duration } = body;

    if (!videoPath || !platform) {
      return NextResponse.json(
        { error: "videoPath and platform are required" },
        { status: 400 }
      );
    }

    // Validate platform
    if (!PLATFORM_PRESETS[platform]) {
      return NextResponse.json(
        { error: `Unknown platform: ${platform}` },
        { status: 400 }
      );
    }

    // Check duration limits
    if (duration) {
      const limitCheck = checkPlatformLimits(duration, platform);
      if (!limitCheck.valid) {
        return NextResponse.json(
          { error: limitCheck.message },
          { status: 400 }
        );
      }
    }

    // Generate job ID
    const jobId = `export_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Initialize job status
    exportJobs.set(jobId, {
      status: "processing",
      progress: 0,
    });

    // Start export in background
    exportVideoAsync(jobId, videoPath, platform);

    return NextResponse.json({
      jobId,
      message: "Export started",
      platform: PLATFORM_PRESETS[platform].name,
    });
  } catch (error) {
    console.error("[Export] Error:", error);
    return NextResponse.json(
      { error: "Export failed to start" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const jobId = url.searchParams.get("jobId");

  if (!jobId) {
    return NextResponse.json({ error: "jobId required" }, { status: 400 });
  }

  const job = exportJobs.get(jobId);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json(job);
}

async function exportVideoAsync(
  jobId: string,
  videoPath: string,
  platform: string
) {
  try {
    console.log(`[${jobId}] Starting export to ${platform}...`);

    const publicDir = path.join(process.cwd(), "public");
    const inputPath = path.join(publicDir, videoPath.replace("/", ""));
    const outputFilename = `${path.basename(videoPath, path.extname(videoPath))}_${platform}.mp4`;
    const outputPath = path.join(publicDir, "uploads", "exported", outputFilename);

    // Ensure output directory exists
    const fs = await import("fs");
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Convert to platform format
    await convertToPlatform(
      inputPath,
      outputPath,
      platform,
      (progress) => {
        const job = exportJobs.get(jobId);
        if (job) {
          exportJobs.set(jobId, {
            ...job,
            progress: Math.round(progress),
          });
        }
      }
    );

    // Update job status
    exportJobs.set(jobId, {
      status: "completed",
      progress: 100,
      outputPath: `/uploads/exported/${outputFilename}`,
    });

    console.log(`[${jobId}] Export completed successfully`);
  } catch (error) {
    console.error(`[${jobId}] Export failed:`, error);
    exportJobs.set(jobId, {
      status: "error",
      progress: 0,
      error: String(error),
    });
  }
}
