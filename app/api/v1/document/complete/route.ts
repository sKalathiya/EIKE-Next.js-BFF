import { NextRequest, NextResponse } from "next/server";

const GATEWAY_URL = process.env.GATEWAY_SERVICE_URL;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ message: "Unauthorized session." }, { status: 401 });
    }

    const body: unknown = await request.json().catch(() => null);
    const id = isRecord(body) && typeof body.id === "string" ? body.id.trim() : "";
    if (!id) {
      return NextResponse.json({ message: "Document ID is required." }, { status: 400 });
    }

    const nestResponse = await fetch(`${GATEWAY_URL}/api/v1/document/complete/${encodeURIComponent(id)}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    const payload: unknown = await nestResponse.json().catch(() => null);
    return NextResponse.json(
      isRecord(payload) ? payload : { message: "Could not finish the upload." },
      { status: nestResponse.status },
    );
  } catch {
    return NextResponse.json({ message: "Could not finish the upload." }, { status: 500 });
  }
}
