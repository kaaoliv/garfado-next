import type { CandidateProfile } from "./profile";
import type { Job } from "./types";

const MODEL = process.env.OPENAI_MODEL || "gpt-6-luna";

function requireKey() {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY não configurada no Vercel.");
  return process.env.OPENAI_API_KEY;
}

async function responses(input: unknown) {
  const key = requireKey();
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, input }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI API ${res.status}: ${body.slice(0, 500)}`);
  }
  const data = await res.json();
  return String(data.output_text ?? "");
}

function parseJson<T>(text: string): T {
  const cleaned = text.trim().replace(/^\`\`\`json\s*/i, "").replace(/^\`\`\`\s*/i, "").replace(/\s*\`\`\`$/i, "");
  try { return JSON.parse(cleaned) as T; } catch {
    const starts = [cleaned.indexOf("{"), cleaned.indexOf("[")].filter(x => x >= 0);
    const start = starts.length ? Math.min(...starts) : -1;
    const end = Math.max(cleaned.lastIndexOf("}"), cleaned.lastIndexOf("]"));
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1)) as T;
    throw new Error("A IA retornou um formato inválido.");
  }
}

export async function analyzeResume(resumeText: string, file?: { dataUrl: string; filename: string }) {
  const content: any[] = [{
    type: "input_text",
    text: `Transforme este currículo em um perfil profissional internacional. Não invente experiência, cargos, empresas, datas ou ferramentas. Preserve fatos e melhore redação e organização. Retorne SOMENTE JSON válido com:
{"name":string,"headline":string,"location":string,"summary":string,"roles":string[],"skills":string[],"industries":string[],"languages":string[],"preferredRegions":string[],"employmentTypes":string[],"minimumMonthlyUsd":number,"resumeText":string}
Escreva resumeText em inglês, pronto para currículo internacional. Objetivo: Video Editor / Motion Designer / Video Producer remoto, aceitando Brasil/LATAM/worldwide. Salário mínimo alvo: US$2.000/mês.
Texto fornecido: ${resumeText.slice(0, 30000)}`,
  }];
  if (file) content.push({ type: "input_file", filename: file.filename, file_data: file.dataUrl });
  return parseJson<CandidateProfile>(await responses([{ role: "user", content }]));
}

export async function rankJobs(profile: CandidateProfile, jobs: Job[]) {
  const compact = jobs.slice(0, 40).map(j => ({
    id: j.id, title: j.title, company: j.company, location: j.location,
    description: j.description.slice(0, 3500), salaryText: j.salaryText, remote: j.remote,
  }));
  const raw = await responses(`Você é um recrutador internacional especializado em audiovisual. Avalie estas vagas EXCLUSIVAMENTE contra o perfil real. Não invente requisitos atendidos. Priorize Brasil/LATAM/worldwide, remoto, full-time/permanent e remuneração >= US$2.000/mês quando informada. Penalize US-only, EU-only, presencial, freelance/contractor/temporary e salário abaixo do mínimo. Vaga sem salário não deve ser descartada só por isso.

PERFIL:
${JSON.stringify(profile)}

VAGAS:
${JSON.stringify(compact)}

Retorne SOMENTE JSON array:
[{"id":"...","score":0,"why":["..."],"concerns":["..."]}]
Score 0-100. Seja rigoroso.`);
  return parseJson<Array<{ id: string; score: number; why: string[]; concerns: string[] }>>(raw);
}

export async function applicationAssistant(profile: CandidateProfile, job: Job) {
  const raw = await responses(`Você é especialista em candidaturas para vagas internacionais de vídeo. Use somente fatos presentes no perfil. Nunca invente experiência. Escreva de forma humana e específica.

PERFIL:
${JSON.stringify(profile)}

VAGA:
${JSON.stringify({ title: job.title, company: job.company, location: job.location, description: job.description.slice(0, 12000), salaryText: job.salaryText })}

Retorne SOMENTE JSON:
{"matchScore":number,"whyFit":string[],"risks":string[],"coverLetter":string,"tailoredSummary":string,"answers":[{"question":"Why are you interested in this role?","answer":"..."},{"question":"Why are you a good fit for this role?","answer":"..."},{"question":"What salary are you looking for?","answer":"..."}]}

Cover letter: 3-5 parágrafos em inglês, específica para a vaga. Summary: parágrafo curto em inglês. Para salário, respeite o mínimo do perfil e deixe claro quando a vaga não informa faixa.`);
  return parseJson<{
    matchScore: number; whyFit: string[]; risks: string[]; coverLetter: string; tailoredSummary: string;
    answers: { question: string; answer: string }[];
  }>(raw);
}
