import { NextRequest, NextResponse } from "next/server";
import { checkPassword, createSessionToken, SESSION_COOKIE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();
    if (!password || !checkPassword(password)) {
      return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
    }

    const token = await createSessionToken();
    const res = NextResponse.json({ success: true });
    res.cookies.set(SESSION_COOKIE.name, token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: SESSION_COOKIE.maxAge,
      path: "/",
    });
    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Unknown error" }, { status: 500 });
  }
}
