import { NextResponse } from "next/server";
import { getRegimeLog } from "@/lib/regimeLog";

export async function GET() {
  try {
    const log = await getRegimeLog(100);
    return NextResponse.json({ log });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Unknown error" }, { status: 500 });
  }
}
