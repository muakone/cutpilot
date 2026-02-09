import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PlanRequestSchema, PlanResponseSchema } from "@/lib/planContracts";
import { buildPlannerPrompt, safeParseModelJson } from "@/lib/geminiPlanner";
import { normalizePlan } from "@/lib/editPlanSchema";

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const parseResult = PlanRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "invalid_request",
          details: parseResult.error.format(),
        },
        { status: 400 },
      );
    }

    const planRequest = parseResult.data;

    // Log selected assets for debugging
    console.log(
      "Plan request - selectedAssets:",
      planRequest.selectedAssets.map((a) => ({
        filename: a.filename,
        kind: a.kind,
        hasUrl: !!a.url,
        urlPreview: a.url ? a.url.substring(0, 50) + "..." : "none",
      })),
    );

    // Check for API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error: "model_error",
          details: "GEMINI_API_KEY not configured",
        },
        { status: 502 },
      );
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelName = process.env.GEMINI_MODEL || "models/gemini-2.5-flash";
    const model = genAI.getGenerativeModel({ model: modelName });

    // Build prompt and call Gemini
    const prompt = buildPlannerPrompt(planRequest);

    let modelResponse;
    try {
      const result = await model.generateContent(prompt);
      modelResponse = result.response.text();
    } catch (error) {
      console.error("Gemini API error:", error);
      return NextResponse.json(
        {
          error: "model_error",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 502 },
      );
    }

    // Extract JSON from model response
    let parsedJson;
    try {
      parsedJson = safeParseModelJson(modelResponse);
    } catch (error) {
      console.error("JSON extraction error:", error);
      return NextResponse.json(
        {
          error: "model_error",
          details: "Failed to extract valid JSON from model response",
        },
        { status: 502 },
      );
    }

    // Validate response schema
    const responseResult = PlanResponseSchema.safeParse(parsedJson);

    if (!responseResult.success) {
      console.error("Response validation error:", responseResult.error);
      return NextResponse.json(
        {
          error: "model_error",
          details: "Model response does not match expected schema",
        },
        { status: 502 },
      );
    }

    const planResponse = responseResult.data;

    // Log generated operations for debugging
    console.log(
      "Generated plan operations:",
      planResponse.plan.map((op) => ({
        op: op.op,
        label: op.label,
        startSec: op.startSec,
        endSec: op.endSec,
        hasImagePath: op.op === "overlay_image" && !!op.params.imagePath,
        imagePathPreview:
          op.op === "overlay_image" && op.params.imagePath
            ? (op.params.imagePath as string).substring(0, 50) + "..."
            : undefined,
      })),
    );

    console.log("=== BEFORE NORMALIZATION ===");
    console.log("Request totalDurationSec:", planRequest.totalDurationSec);
    console.log(
      "Raw plan operations:",
      planResponse.plan.map((op) => ({
        id: op.id,
        startSec: op.startSec,
        endSec: op.endSec,
        op: op.op,
      })),
    );

    // Normalize and clamp plan ranges
    const normalizedPlan = normalizePlan(
      planResponse.plan,
      planRequest.totalDurationSec,
    );

    console.log("=== AFTER NORMALIZATION ===");
    console.log(
      "Normalized operations:",
      normalizedPlan.map((op) => ({
        id: op.id,
        startSec: op.startSec,
        endSec: op.endSec,
        op: op.op,
      })),
    );

    // Return successful response
    return NextResponse.json({
      plan: normalizedPlan,
      notes: planResponse.notes,
    });
  } catch (error) {
    console.error("Unexpected error in /api/plan:", error);
    return NextResponse.json(
      {
        error: "server_error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
