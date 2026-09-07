import { NextResponse } from "next/server";
import { queryNotion } from "@/lib/notion";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const items = await queryNotion();
    return NextResponse.json({ items });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "خطا در اتصال به Notion" },
      { status: 500 }
    );
  }
}