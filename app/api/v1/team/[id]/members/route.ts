import { NextRequest, NextResponse } from "next/server";

const GATEWAY_URL = process.env.GATEWAY_SERVICE_URL;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readEmail(body: unknown): string {
  if (!isRecord(body) || typeof body.email !== "string") return "";
  return body.email.trim();
}

async function gatewayJson(path: string, token: string, init: RequestInit) {
  const response = await fetch(`${GATEWAY_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  const payload: unknown = await response.json().catch(() => null);
  return { status: response.status, payload };
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
      return NextResponse.json({ message: "Team id and member email are required." }, { status: 400 });
    }

    const result = await gatewayJson(`/api/v1/team/${encodeURIComponent(id)}/add-member`, token, {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    return NextResponse.json(
      isRecord(result.payload) ? result.payload : { message: "Could not add member." },
      { status: result.status },
    );
  } catch {
    return NextResponse.json({ message: "Failed to add member." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const token = request.cookies.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ message: "Unauthorized session." }, { status: 401 });
    }

    const { id } = await context.params;
    const email = readEmail(await request.json().catch(() => null));
    if (!id || !email) {
      return NextResponse.json({ message: "Team id and member email are required." }, { status: 400 });
    }

    const result = await gatewayJson(`/api/v1/team/${encodeURIComponent(id)}/remove-member`, token, {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    return NextResponse.json(
      isRecord(result.payload) ? result.payload : { message: "Could not remove member." },
      { status: result.status },
    );
  } catch {
    return NextResponse.json({ message: "Failed to remove member." }, { status: 500 });
  }
}
