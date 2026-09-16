import { NextResponse } from "next/server";

const GATEWAY_URL = process.env.GATEWAY_SERVICE_URL;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const nestResponse = await fetch(`${GATEWAY_URL}/api/v1/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await nestResponse.json();
    if (!nestResponse.ok) {
      return NextResponse.json(data, { status: nestResponse.status });
    }
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Could not create your account. Try again." }, { status: 500 });
  }
}
