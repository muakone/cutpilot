import { NextRequest, NextResponse } from "next/server";
import path from "path";
import {
  processOperations,
  type EditOperation,
  type ProcessingProgress,
} from "@/lib/ffmpegProcessor";

// Store active render jobs (in production, use Redis or database)
const renderJobs = new Map<
  string,
  {
    status: "processing" | "completed" | "error";
    progress: number;
    currentOperation: string;
    outputPath?: string;
    error?: string;
  }
>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { videoPath, operations } = body;

    if (!videoPath || !operations || !Array.isArray(operations)) {
      return NextResponse.json(
        { error: "videoPath and operations are required" },
        { status: 400 }
      );
    }

    // Generate job ID
    const jobId = `render_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Initialize job status
    renderJobs.set(jobId, {
      status: "processing",
      progress: 0,
      currentOperation: "Starting...",
    });

    // Start processing in background
    processVideoAsync(jobId, videoPath, operations);

    return NextResponse.json({
      jobId,
      message: "Render started",
    });
  } catch (error) {
    console.error("Render API error:", error);
    return NextResponse.json(
      {
        error: "server_error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const jobId = searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json(
        { error: "jobId is required" },
        { status: 400 }
      );
    }

    const job = renderJobs.get(jobId);

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error("Render status error:", error);
    return NextResponse.json(
      {
        error: "server_error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

async function processVideoAsync(
  jobId: string,
  videoPath: string,
  operations: EditOperation[]
) {
  try {
    // Convert relative path to absolute
    const absoluteVideoPath = videoPath.startsWith("/uploads/")
      ? path.join(process.cwd(), "public", videoPath)
      : videoPath;

    console.log(`[${jobId}] Starting render job`);
    console.log(`[${jobId}] Input video: ${absoluteVideoPath}`);
    console.log(`[${jobId}] Operations count: ${operations.length}`);
    console.log(`[${jobId}] Operations:`, JSON.stringify(operations, null, 2));

    const outputPath = await processOperations(
      absoluteVideoPath,
      operations,
      (progress: ProcessingProgress) => {
        // Update job status
        const job = renderJobs.get(jobId);
        if (job) {
          job.progress = progress.percent;
          job.currentOperation = progress.currentOperation;
          job.status = progress.status;
          if (progress.outputPath) {
            job.outputPath = progress.outputPath;
          }
          if (progress.error) {
            job.error = progress.error;
          }
          console.log(
            `[${jobId}] Progress: ${Math.round(progress.percent)}% - ${progress.currentOperation}`
          );
        }
      }
    );

    // Update final status
    const job = renderJobs.get(jobId);
    if (job) {
      job.status = "completed";
      job.progress = 100;
      job.outputPath = outputPath;
      job.currentOperation = "Complete";
    }

    console.log(`[${jobId}] Render completed successfully: ${outputPath}`);
  } catch (error) {
    console.error(`[${jobId}] Render failed:`, error);
    const job = renderJobs.get(jobId);
    if (job) {
      job.status = "error";
      job.error = error instanceof Error ? error.message : "Unknown error";
      job.currentOperation = "Error";
      console.error(`[${jobId}] Error details:`, job.error);
    }
  }
}
