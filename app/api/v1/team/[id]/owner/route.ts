import { NextRequest, NextResponse } from "next/server";

const GATEWAY_URL = process.env.GATEWAY_SERVICE_URL;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readEmail(body: unknown): string {
  if (!isRecord(body) || typeof body.email !== "string") return "";
  return body.email.trim();
}

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const token = request.cookies.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ message: "Unauthorized session." }, { status: 401 });
    }

    const { id } = await context.params;
    const email = readEmail(await request.json().catch(() => null));
    if (!id || !email) {
      return NextResponse.json({ message: "Team id and the new owner’s email are required." }, { status: 400 });
    }

    const response = await fetch(`${GATEWAY_URL}/api/v1/team/${encodeURIComponent(id)}/change-owner`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });
    const payload: unknown = await response.json().catch(() => null);
    return NextResponse.json(
      isRecord(payload) ? payload : { message: "Could not transfer ownership." },
      { status: response.status },
    );
  } catch {
    return NextResponse.json({ message: "Could not transfer ownership." }, { status: 500 });
  }
}
