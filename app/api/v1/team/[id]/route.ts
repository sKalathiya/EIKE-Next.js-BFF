import { NextRequest, NextResponse } from "next/server";

const GATEWAY_URL = process.env.GATEWAY_SERVICE_URL;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function gatewayJson(path: string, token: string, init: RequestInit) {
  const response = await fetch(`${GATEWAY_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
    },
  });
  const payload: unknown = await response.json().catch(() => null);
  return { status: response.status, payload };
}

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const token = request.cookies.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ message: "Unauthorized session." }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ message: "Team id is required." }, { status: 400 });
    }

    const body: unknown = await request.json().catch(() => null);
    const name = isRecord(body) && typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json({ message: "Team name is required." }, { status: 400 });
    }

    const result = await gatewayJson(`/api/v1/team/${encodeURIComponent(id)}`, token, {
      method: "PATCH",
      body: JSON.stringify({ name }),
    });
    return NextResponse.json(
      isRecord(result.payload) ? result.payload : { message: "Could not update team." },
      { status: result.status },
    );
  } catch {
    return NextResponse.json({ message: "Failed to update team." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const token = request.cookies.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ message: "Unauthorized session." }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ message: "Team id is required." }, { status: 400 });
    }

    const result = await gatewayJson(`/api/v1/team/${encodeURIComponent(id)}`, token, {
      method: "DELETE",
    });
    return NextResponse.json(
      isRecord(result.payload) ? result.payload : { message: "Could not delete team." },
      { status: result.status },
    );
  } catch {
    return NextResponse.json({ message: "Failed to delete team." }, { status: 500 });
  }
}
