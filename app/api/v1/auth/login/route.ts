import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const GATEWAY_URL = process.env.GATEWAY_SERVICE_URL;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const nestResponse = await fetch(`${GATEWAY_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await nestResponse.json();
    if (!nestResponse.ok) {
      return NextResponse.json(data, { status: nestResponse.status });
    }

    const cookieStore = await cookies();
    cookieStore.set("auth_token", data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24,
      path: "/",
      sameSite: "lax",
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Could not sign you in. Try again." }, { status: 500 });
  }
}
