import { NextResponse } from "next/server";
import { collectJobs } from "@/lib/jobhunter/collectors";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const jobs = await collectJobs();
    return NextResponse.json({ jobs, count: jobs.length });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Não foi possível buscar as vagas." }, { status: 500 });
  }
}