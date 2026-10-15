import { NextResponse } from "next/server";
import { classifySignal, isSignalShape } from "@/lib/os/signals";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { shape?: string } | null;
  const shape = body?.shape ?? "";
  if (!isSignalShape(shape)) {
    return NextResponse.json({ error: "未知的遥测形状" }, { status: 400 });
  }
  return NextResponse.json(classifySignal(shape));
}
