import { NextResponse } from "next/server";
import { analyzeResume, applicationAssistant, rankJobs } from "@/lib/jobhunter/ai";
import type { CandidateProfile } from "@/lib/jobhunter/profile";
import type { Job } from "@/lib/jobhunter/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      const resumeText = String(form.get("resumeText") || "");
      let payload: { dataUrl: string; filename: string } | undefined;

      if (file instanceof File && file.size > 0) {
        if (file.size > 12 * 1024 * 1024) {
          return NextResponse.json({ error: "O currículo deve ter no máximo 12 MB." }, { status: 400 });
        }
        const bytes = Buffer.from(await file.arrayBuffer());
        payload = {
          filename: file.name,
          dataUrl: `data:${file.type || "application/octet-stream"};base64,${bytes.toString("base64")}`,
        };
      }

      if (!resumeText.trim() && !payload) {
        return NextResponse.json({ error: "Envie um arquivo ou cole o texto do currículo." }, { status: 400 });
      }

      const profile = await analyzeResume(resumeText, payload);
      return NextResponse.json({ profile });
    }

    const body = await req.json();
    if (body.action === "rank") {
      return NextResponse.json({ result: await rankJobs(body.profile as CandidateProfile, body.jobs as Job[]) });
    }
    if (body.action === "application") {
      return NextResponse.json({ result: await applicationAssistant(body.profile as CandidateProfile, body.job as Job) });
    }
    return NextResponse.json({ error: "Ação de IA inválida." }, { status: 400 });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: message.includes("OPENAI_API_KEY") ? 503 : 500 });
  }
}
