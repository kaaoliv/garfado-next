import type { Job } from "./types";
import { scoreJob } from "./score";

function csv(name: string, fallback: string[] = []) {
  const configured = (process.env[name] ?? "").split(",").map(x => x.trim()).filter(Boolean);
  return configured.length ? configured : fallback;
}

const DEFAULT_LEVER_SITES = ["superside", "oneimpression"];
const DEFAULT_ASHBY_BOARDS = ["acentecom","the-global-talent-co","darkroom","myedspacecareers","newform","tempo","superpower","everai"];
const COMPANY_NAMES: Record<string, string> = {
  superside: "Superside",
  oneimpression: "One Impression",
  acentecom: "Acentecom",
  "the-global-talent-co": "The Global Talent Co.",
  darkroom: "Darkroom",
  myedspacecareers: "MyEdSpace",
  newform: "NewForm",
  tempo: "Tempo",
  superpower: "Superpower",
  everai: "EverAI",
};

async function fetchGreenhouse(board: string): Promise<Job[]> {
  const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(board)}/jobs?content=true`, { next: { revalidate: 900 } });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.jobs ?? []).map((j: any) => scoreJob({
    id: `greenhouse:${board}:${j.id}`, source: "greenhouse", company: COMPANY_NAMES[board] ?? board,
    title: j.title ?? "", location: j.location?.name ?? "", description: j.content ?? "",
    url: j.absolute_url ?? "", applyUrl: j.absolute_url ?? "", publishedAt: j.updated_at, salaryText: "",
    remote: /remote/i.test(`${j.location?.name ?? ""} ${j.content ?? ""}`)
  }));
}

async function fetchLever(site: string): Promise<Job[]> {
  const res = await fetch(`https://api.lever.co/v0/postings/${encodeURIComponent(site)}?mode=json`, { next: { revalidate: 900 } });
  if (!res.ok) return [];
  const data = await res.json();
  return (Array.isArray(data) ? data : []).map((j: any) => scoreJob({
    id: `lever:${site}:${j.id}`, source: "lever", company: COMPANY_NAMES[site] ?? site, title: j.text ?? "",
    location: j.categories?.location ?? "", description: `${j.descriptionPlain ?? ""} ${j.additionalPlain ?? ""}`,
    url: j.hostedUrl ?? j.applyUrl ?? "", applyUrl: j.applyUrl ?? j.hostedUrl ?? "", publishedAt: j.createdAt,
    salaryText: JSON.stringify(j.salaryRange ?? j.compensation ?? ""),
    remote: /remote/i.test(`${j.categories?.location ?? ""} ${j.descriptionPlain ?? ""}`)
  }));
}

async function fetchAshby(board: string): Promise<Job[]> {
  const res = await fetch(`https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(board)}?includeCompensation=true`, { next: { revalidate: 900 } });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.jobs ?? []).map((j: any) => scoreJob({
    id: `ashby:${board}:${j.jobUrl ?? j.title}`, source: "ashby", company: COMPANY_NAMES[board] ?? board,
    title: j.title ?? "", location: j.location ?? "", description: j.descriptionPlain ?? j.descriptionHtml ?? "",
    url: j.jobUrl ?? "", applyUrl: j.jobUrl ?? "", publishedAt: j.publishedAt,
    salaryText: j.compensation ? JSON.stringify(j.compensation) : "",
    remote: /remote/i.test(`${j.location ?? ""} ${j.descriptionPlain ?? ""}`)
  }));
}

export async function collectJobs() {
  const [greenhouse, lever, ashby] = await Promise.all([
    Promise.all(csv("GREENHOUSE_BOARDS").map(fetchGreenhouse)),
    Promise.all(csv("LEVER_SITES", DEFAULT_LEVER_SITES).map(fetchLever)),
    Promise.all(csv("ASHBY_BOARDS", DEFAULT_ASHBY_BOARDS).map(fetchAshby))
  ]);
  return [...greenhouse.flat(), ...lever.flat(), ...ashby.flat()]
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, Number(process.env.MAX_JOBS ?? 250));
}
