import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    configured: Boolean(process.env.OPENAI_API_KEY),
    testVariable: process.env.JOBHUNTER_TEST === "hello123",
    testValuePresent: Boolean(process.env.JOBHUNTER_TEST),
    model: process.env.OPENAI_MODEL || "gpt-6-luna",
    vercelEnv: process.env.VERCEL_ENV || "unknown",
    vercelUrl: process.env.VERCEL_URL || "unknown",
    commit: process.env.VERCEL_GIT_COMMIT_SHA || "unknown",
    branch: process.env.VERCEL_GIT_COMMIT_REF || "unknown",
  });
}