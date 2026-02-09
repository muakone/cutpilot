import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { EditOpSchema } from "@/lib/editPlanSchema";

const SaveDraftRequestSchema = z.object({
  projectId: z.string(),
  activeDraft: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  plan: z.array(EditOpSchema),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parseResult = SaveDraftRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "invalid_request",
          details: parseResult.error.format(),
        },
        { status: 400 },
      );
    }

    // Client will handle localStorage storage
    // This endpoint just validates the data
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error saving draft:", error);
    return NextResponse.json(
      {
        error: "server_error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
