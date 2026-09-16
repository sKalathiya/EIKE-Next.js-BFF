import { NextRequest, NextResponse } from "next/server";

const GATEWAY_URL = process.env.GATEWAY_SERVICE_URL;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readShareBody(body: unknown): { id: string; teamIds: string[] } {
  if (!isRecord(body)) return { id: "", teamIds: [] };
  const id = typeof body.id === "string" ? body.id.trim() : "";
  const teamIds = Array.isArray(body.team_ids)
    ? body.team_ids.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
  return { id, teamIds };
}

async function proxyShare(path: string, token: string, id: string, teamIds: string[]) {
  const response = await fetch(`${GATEWAY_URL}${path}/${encodeURIComponent(id)}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ team_ids: teamIds }),
  });
  const payload: unknown = await response.json().catch(() => null);
  return { status: response.status, payload };
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ message: "Unauthorized session." }, { status: 401 });
    }

    const { id, teamIds } = readShareBody(await request.json().catch(() => null));
    if (!id || teamIds.length === 0) {
      return NextResponse.json({ message: "Document id and at least one team are required." }, { status: 400 });
    }

    const result = await proxyShare("/api/v1/document/share", token, id, teamIds);
    return NextResponse.json(
      isRecord(result.payload) ? result.payload : { message: "Could not share the file." },
      { status: result.status },
    );
  } catch {
    return NextResponse.json({ message: "Failed to share the file." }, { status: 500 });
  }
}
