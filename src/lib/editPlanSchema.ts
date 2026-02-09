import { z } from "zod";

// Base types
export const TimeSecSchema = z.number().min(0);
export type TimeSec = z.infer<typeof TimeSecSchema>;

// Effect chip schema
export const EffectChipSchema = z.object({
  id: z.string(),
  name: z.string(),
  strength: z.number().min(0).max(100).optional(),
});
export type EffectChip = z.infer<typeof EffectChipSchema>;

// Asset chip schema
export const AssetChipSchema = z.object({
  id: z.string(),
  filename: z.string(),
  kind: z.enum(["audio", "video", "image"]),
  url: z.string().optional(),
});
export type AssetChip = z.infer<typeof AssetChipSchema>;

// Segment schema
export const SegmentSchema = z.object({
  id: z.string(),
  label: z.string(),
  startSec: z.number().min(0),
  endSec: z.number().min(0),
});
export type Segment = z.infer<typeof SegmentSchema>;

// Edit operation schema
export const EditOpSchema = z.object({
  id: z.string(),
  startSec: z.number().min(0),
  endSec: z.number().min(0),
  op: z.enum([
    "remove_silence",
    "effect",
    "overlay_audio",
    "overlay_video",
    "overlay_image",
    "captions",
    "trim",
    "speed",
    "color_grade",
  ]),
  label: z.string(),
  params: z.record(z.string(), z.any()),
  status: z.enum(["planned", "rendered"]),
});
export type EditOp = z.infer<typeof EditOpSchema>;

// Edit plan schema (array with max 50 operations)
export const EditPlanSchema = z.array(EditOpSchema).max(50);
export type EditPlan = z.infer<typeof EditPlanSchema>;

// Helper functions

/**
 * Clamps a time range to ensure it's within bounds and start <= end
 */
export function clampRange(
  startSec: number,
  endSec: number,
  totalDurationSec: number,
): { startSec: number; endSec: number } {
  const clampedStart = Math.max(0, Math.min(startSec, totalDurationSec));
  const clampedEnd = Math.max(0, Math.min(endSec, totalDurationSec));

  // Ensure start is always before end
  if (clampedStart >= clampedEnd) {
    return {
      startSec: Math.max(0, clampedEnd - 1),
      endSec: clampedEnd,
    };
  }

  return {
    startSec: clampedStart,
    endSec: clampedEnd,
  };
}

/**
 * Formats seconds into MM:SS format
 */
export function formatSec(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * Normalizes an edit plan by clamping ranges and ensuring required fields
 */
export function normalizePlan(
  plan: EditOp[],
  totalDurationSec: number,
): EditOp[] {
  return plan.map((op) => {
    const { startSec, endSec } = clampRange(
      op.startSec,
      op.endSec,
      totalDurationSec,
    );

    return {
      ...op,
      startSec,
      endSec,
      params: op.params || {},
      status: op.status || "planned",
    };
  });
}
