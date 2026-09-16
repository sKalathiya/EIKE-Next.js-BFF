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
    const teamId = isRecord(body) && typeof body.team_id === "string" ? body.team_id.trim() : "";
    const fileName = isRecord(body) && typeof body.fileName === "string" ? body.fileName.trim() : "";
    const contentType = isRecord(body) && typeof body.contentType === "string" ? body.contentType.trim() : "";
    const contentLength = isRecord(body) && typeof body.contentLength === "number" ? body.contentLength : NaN;

    if (!teamId) {
      return NextResponse.json({ message: "A team is required to upload." }, { status: 400 });
    }
    if (!fileName) {
      return NextResponse.json({ message: "A file name is required." }, { status: 400 });
    }
    if (contentType !== "application/pdf" && contentType !== "text/plain") {
      return NextResponse.json({ message: "Only PDF and plain text files are accepted." }, { status: 400 });
    }
    if (!Number.isInteger(contentLength) || contentLength < 1 || contentLength > 10 * 1024 * 1024) {
      return NextResponse.json({ message: "File exceeds the 10MB limit." }, { status: 400 });
    }

    const nestResponse = await fetch(`${GATEWAY_URL}/api/v1/document/presign`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ team_id: teamId, fileName, contentType, contentLength }),
    });
    const payload: unknown = await nestResponse.json().catch(() => null);
    return NextResponse.json(
      isRecord(payload) ? payload : { message: "Could not start the upload." },
      { status: nestResponse.status },
    );
  } catch {
    return NextResponse.json({ message: "Could not start the upload." }, { status: 500 });
  }
}
