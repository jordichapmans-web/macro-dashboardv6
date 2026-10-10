import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "aion_admin_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 8; // 8 hours

function getSecret(): Uint8Array {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "Missing ADMIN_SESSION_SECRET environment variable. Generate any long random string and set it in Vercel — see README.md."
    );
  }
  return new TextEncoder().encode(secret);
}

/**
 * Checks a submitted password against ADMIN_PASSWORD — an environment
 * variable, never a literal string in this codebase. Set its value in
 * Vercel's dashboard (Project Settings → Environment Variables), not in
 * any file that gets committed to GitHub.
 */
export function checkPassword(submitted: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    throw new Error("Missing ADMIN_PASSWORD environment variable. See README.md.");
  }
  return submitted === expected;
}

export async function createSessionToken(): Promise<string> {
  return await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecret());
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    await jwtVerify(token, getSecret());
    return true;
  } catch {
    return false;
  }
}

export const SESSION_COOKIE = {
  name: COOKIE_NAME,
  maxAge: SESSION_DURATION_SECONDS,
};

/**
 * Shared guard for every admin API route: pass the incoming request,
 * get back whether the session cookie is valid.
 */
export async function isAuthorizedRequest(req: Request): Promise<boolean> {
  const cookieHeader = req.headers.get("cookie") ?? "";
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  return verifySessionToken(match?.[1]);
}
