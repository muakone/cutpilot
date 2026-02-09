import { NextRequest, NextResponse } from "next/server";
import { detectSilence } from "@/lib/ffmpegProcessor";
import path from "path";

/**
 * POST /api/analyze
 * Analyzes uploaded video to detect silence and generate segments
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { videoPath, duration } = body;

    if (!videoPath) {
      return NextResponse.json(
        { error: "Video path is required" },
        { status: 400 }
      );
    }

    console.log(`[Analyze] Starting analysis for: ${videoPath}`);
    console.log(`[Analyze] Video duration: ${duration}s`);

    // Get absolute path to video
    const publicDir = path.join(process.cwd(), "public");
    const absolutePath = path.join(publicDir, videoPath.replace("/", ""));

    console.log(`[Analyze] Absolute path: ${absolutePath}`);

    // Step 1: Detect silence
    console.log("[Analyze] Step 1: Detecting silence...");
    const silenceRanges = await detectSilence(
      absolutePath,
      0.6, // minSilence: 0.6 seconds
      -30  // thresholdDb: -30dB
    );

    console.log(`[Analyze] Found ${silenceRanges.length} silence regions:`, silenceRanges);

    // Step 2: Generate segments based on silence
    console.log("[Analyze] Step 2: Generating segments...");
    const segments = generateSegments(silenceRanges, duration);
    console.log(`[Analyze] Generated ${segments.length} segments:`, segments);

    // Step 3: Analyze content characteristics
    const characteristics = analyzeCharacteristics(segments, silenceRanges, duration);
    console.log("[Analyze] Content characteristics:", characteristics);

    return NextResponse.json({
      success: true,
      analysis: {
        silenceRanges,
        segments,
        characteristics,
        totalDuration: duration,
      },
    });
  } catch (error) {
    console.error("[Analyze] Error:", error);
    return NextResponse.json(
      { error: "Analysis failed", details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * Generate smart segments from silence detection
 */
function generateSegments(
  silenceRanges: Array<{ start: number; end: number }>,
  totalDuration: number
): Array<{ id: string; label: string; startSec: number; endSec: number }> {
  const segments: Array<{
    id: string;
    label: string;
    startSec: number;
    endSec: number;
  }> = [];

  // If no silence, create one big segment
  if (silenceRanges.length === 0) {
    segments.push({
      id: "seg1",
      label: "Full Video",
      startSec: 0,
      endSec: totalDuration,
    });
    return segments;
  }

  let segmentIndex = 1;
  let lastEnd = 0;

  // Create segments between silence periods
  for (const silence of silenceRanges) {
    // Content before this silence
    if (silence.start > lastEnd + 1) {
      // Only create segment if it's longer than 1 second
      const label = getLabelForSegment(segmentIndex, lastEnd, totalDuration);

      segments.push({
        id: `seg${segmentIndex}`,
        label,
        startSec: Math.max(0, lastEnd),
        endSec: Math.min(silence.start, totalDuration),
      });
      segmentIndex++;
    }

    lastEnd = silence.end;
  }

  // Content after last silence
  if (lastEnd < totalDuration - 1) {
    segments.push({
      id: `seg${segmentIndex}`,
      label: getLabelForSegment(segmentIndex, lastEnd, totalDuration),
      startSec: lastEnd,
      endSec: totalDuration,
    });
  }

  return segments;
}

/**
 * Generate smart labels for segments based on position
 */
function getLabelForSegment(
  index: number,
  startSec: number,
  totalDuration: number
): string {
  // First 10 seconds = Intro
  if (startSec < 10) {
    return "Intro";
  }

  // Last 10 seconds = Outro
  if (startSec > totalDuration - 10) {
    return "Outro";
  }

  // Middle sections
  return `Content ${index}`;
}

/**
 * Analyze video characteristics to inform AI decisions
 */
function analyzeCharacteristics(
  segments: Array<{ startSec: number; endSec: number }>,
  silenceRanges: Array<{ start: number; end: number }>,
  totalDuration: number
): {
  totalSilenceDuration: number;
  silencePercentage: number;
  avgSegmentDuration: number;
  hasLongPauses: boolean;
  videoType: string;
  recommendations: string[];
} {
  // Calculate total silence
  const totalSilence = silenceRanges.reduce(
    (sum, s) => sum + (s.end - s.start),
    0
  );
  const silencePercentage = (totalSilence / totalDuration) * 100;

  // Average segment duration
  const avgSegmentDuration =
    segments.length > 0
      ? segments.reduce((sum, s) => sum + (s.endSec - s.startSec), 0) /
        segments.length
      : 0;

  // Check for long pauses (> 2 seconds)
  const hasLongPauses = silenceRanges.some((s) => s.end - s.start > 2);

  // Guess video type
  let videoType = "unknown";
  const recommendations: string[] = [];

  if (silencePercentage > 30 && hasLongPauses) {
    videoType = "tutorial-or-presentation";
    recommendations.push("Remove long pauses for better pacing");
    recommendations.push("Add captions for key points");
  } else if (silencePercentage > 15 && avgSegmentDuration < 10) {
    videoType = "vlog-or-talking-head";
    recommendations.push("Remove awkward pauses");
    recommendations.push("Add dynamic effects to maintain energy");
  } else if (silencePercentage < 10) {
    videoType = "fast-paced-content";
    recommendations.push("Already well-paced!");
    recommendations.push("Consider adding captions for emphasis");
  } else {
    videoType = "general-content";
    recommendations.push("Remove silence to tighten pacing");
    recommendations.push("Add effects at key moments");
  }

  return {
    totalSilenceDuration: totalSilence,
    silencePercentage: Math.round(silencePercentage * 10) / 10,
    avgSegmentDuration: Math.round(avgSegmentDuration * 10) / 10,
    hasLongPauses,
    videoType,
    recommendations,
  };
}
