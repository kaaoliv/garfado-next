import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const relevantEnvNames = Object.keys(process.env)
    .filter((key) => /^(OPENAI|JOBHUNTER|NEXT_PUBLIC_SUPABASE)/.test(key))
    .sort();

  return NextResponse.json({
    configured: Boolean(process.env.OPENAI_API_KEY),
    testVariable: process.env.JOBHUNTER_TEST === "hello123",
    testValuePresent: Boolean(process.env.JOBHUNTER_TEST),
    supabaseUrlPresent: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabaseAnonPresent: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    relevantEnvNames,
    model: process.env.OPENAI_MODEL || "gpt-6-luna",
    vercelEnv: process.env.VERCEL_ENV || "unknown",
    vercelUrl: process.env.VERCEL_URL || "unknown",
    commit: process.env.VERCEL_GIT_COMMIT_SHA || "unknown",
    branch: process.env.VERCEL_GIT_COMMIT_REF || "unknown",
  });
}
