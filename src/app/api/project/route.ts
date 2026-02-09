import { NextRequest, NextResponse } from "next/server";

// Simple project ID generator - actual data stored in localStorage on client

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { totalDurationSec, segments } = body;

    if (typeof totalDurationSec !== "number" || totalDurationSec <= 0) {
      return NextResponse.json(
        { error: "totalDurationSec must be a positive number" },
        { status: 400 },
      );
    }

    // Generate a unique project ID
    const projectId = `project_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    return NextResponse.json({ projectId });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      {
        error: "server_error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Missing id parameter" },
        { status: 400 },
      );
    }

    // Data is stored in localStorage on the client, so just return success
    return NextResponse.json({
      id,
      message: "Project data is stored in localStorage on the client",
    });
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      {
        error: "server_error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
