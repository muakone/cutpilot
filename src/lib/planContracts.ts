import { z } from "zod";
import {
  SegmentSchema,
  EffectChipSchema,
  AssetChipSchema,
  EditOpSchema,
  type Segment,
  type EffectChip,
  type AssetChip,
  type EditOp,
} from "./editPlanSchema";

// Re-export types from editPlanSchema
export type { Segment, EffectChip, AssetChip, EditOp };

// Selected range schema
export const SelectedRangeSchema = z.object({
  startSec: z.number().min(0),
  endSec: z.number().min(0),
});
export type SelectedRange = z.infer<typeof SelectedRangeSchema>;

// Plan request schema
export const PlanRequestSchema = z.object({
  projectId: z.string(),
  totalDurationSec: z.number().min(0),
  selectedRange: SelectedRangeSchema,
  instruction: z.string(),
  segments: z.array(SegmentSchema),
  selectedEffects: z.array(EffectChipSchema),
  selectedAssets: z.array(AssetChipSchema),
  existingPlan: z.array(EditOpSchema).optional(),
});
export type PlanRequest = z.infer<typeof PlanRequestSchema>;

// Plan response schema
export const PlanResponseSchema = z.object({
  plan: z.array(EditOpSchema),
  notes: z.string().optional(),
});
export type PlanResponse = z.infer<typeof PlanResponseSchema>;
