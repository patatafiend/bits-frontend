import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

export async function GET() {
  try {
    const htmlPath = join(process.cwd(), "public/dist", "index.html");
    const htmlContent = readFileSync(htmlPath, "utf-8");

    return new Response(htmlContent, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: String(error) }, { status: 404 });
  }
}
