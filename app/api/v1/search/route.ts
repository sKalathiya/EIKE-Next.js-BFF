import { NextRequest, NextResponse } from "next/server";
import { humanizeError } from "@/lib/human-error";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const GATEWAY_URL = process.env.GATEWAY_SERVICE_URL;

export async function POST(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  if (!token) {
    return NextResponse.json({ message: "Unauthorized session." }, { status: 401 });
  }

  try {
    const body: unknown = await request.json().catch(() => null);
    const query =
      body && typeof body === "object" && "query" in body && typeof body.query === "string"
        ? body.query.trim()
        : "";
    const teamId =
      body && typeof body === "object" && "team_id" in body && typeof body.team_id === "string"
        ? body.team_id.trim()
        : "";

    if (!query) {
      return NextResponse.json({ message: "Enter a question to search." }, { status: 400 });
    }
    if (!teamId) {
      return NextResponse.json({ message: "Choose a team to search." }, { status: 400 });
    }

    const nestResponse = await fetch(`${GATEWAY_URL}/api/v1/document/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, team_id: teamId }),
      signal: request.signal,
    });
    if (!nestResponse.ok) {
      const payload: unknown = await nestResponse.json().catch(() => null);
      const message = humanizeError(payload, "Could not start the search.");
      return NextResponse.json({ message }, { status: nestResponse.status });
    }

    if (!nestResponse.body) {
      return NextResponse.json({ message: "Could not start the search." }, { status: 502 });
    }

    return new NextResponse(nestResponse.body, {
      status: nestResponse.status,
      headers: {
        "Content-Type": nestResponse.headers.get("content-type") ?? "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error: any) {
    if (error instanceof Error && error.name === "AbortError") {
      return new NextResponse(null, { status: 499 });
    }
    return NextResponse.json({ message: "Could not search right now." }, { status: 500 });
  }
}
