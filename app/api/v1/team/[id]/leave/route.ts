import { NextRequest, NextResponse } from "next/server";

const GATEWAY_URL = process.env.GATEWAY_SERVICE_URL;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const token = request.cookies.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ message: "Unauthorized session." }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ message: "Team id is required." }, { status: 400 });
    }

    const response = await fetch(`${GATEWAY_URL}/api/v1/team/${encodeURIComponent(id)}/leave`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    const payload: unknown = await response.json().catch(() => null);
    return NextResponse.json(
      isRecord(payload) ? payload : { message: "Could not leave the team." },
      { status: response.status },
    );
  } catch {
    return NextResponse.json({ message: "Could not leave the team." }, { status: 500 });
  }
}
