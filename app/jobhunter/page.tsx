"use client";

import { useEffect, useMemo, useState } from "react";
import type { Job } from "@/lib/jobhunter/types";
import { defaultProfile, type CandidateProfile } from "@/lib/jobhunter/profile";

type ApplicationAI = {
  matchScore: number;
  whyFit: string[];
  risks: string[];
  coverLetter: string;
  tailoredSummary: string;
  answers: { question: string; answer: string }[];
};
type Tab = "jobs" | "profile" | "tracker";
const STATUSES = ["Saved", "Applied", "Interview", "Test", "Offer", "Rejected"];

export default function JobHunterPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [profile, setProfile] = useState<CandidateProfile>(defaultProfile);
  const [tab, setTab] = useState<Tab>("jobs");
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiConfigured, setAiConfigured] = useState(false);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [minScore, setMinScore] = useState(60);
  const [onlyUsd, setOnlyUsd] = useState(false);
  const [onlyBrazil, setOnlyBrazil] = useState(false);
  const [aiOnly, setAiOnly] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [application, setApplication] = useState<ApplicationAI | null>(null);
  const [applicationLoading, setApplicationLoading] = useState(false);
  const [applications, setApplications] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem("jobhunter-profile");
      const tracker = localStorage.getItem("jobhunter-tracker");
      if (saved) setProfile({ ...defaultProfile, ...JSON.parse(saved) });
      if (tracker) setApplications(JSON.parse(tracker));
    } catch {}
    fetch("/jobhunter/api/profile").then(r => r.json()).then(d => setAiConfigured(Boolean(d.configured))).catch(() => {});
    load();
  }, []);

  useEffect(() => localStorage.setItem("jobhunter-profile", JSON.stringify(profile)), [profile]);
  useEffect(() => localStorage.setItem("jobhunter-tracker", JSON.stringify(applications)), [applications]);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/jobhunter/api/jobs", { cache: "no-store" });
      const data = await r.json();
      setJobs(data.jobs ?? []);
    } catch {
      setMessage("Não consegui carregar as vagas.");
    } finally {
      setLoading(false);
    }
  }

  async function refineWithAI() {
    if (!aiConfigured) {
      setMessage("Adicione OPENAI_API_KEY no Vercel para ativar a IA.");
      setTab("profile");
      return;
    }
    setAiLoading(true); setMessage("");
    try {
      const r = await fetch("/jobhunter/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rank", profile, jobs })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Falha ao usar IA.");
      const ranking = new Map((data.result ?? []).map((x: any) => [x.id, x]));
      setJobs(prev => prev.map(job => {
        const ai = ranking.get(job.id);
        return ai ? { ...job, aiScore: ai.score, aiWhy: ai.why, aiConcerns: ai.concerns } : job;
      }).sort((a, b) => (b.aiScore ?? b.matchScore) - (a.aiScore ?? a.matchScore)));
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Não foi possível usar a IA.");
    } finally {
      setAiLoading(false);
    }
  }

  async function analyzeApplication(job: Job) {
    setSelectedJob(job); setApplication(null); setApplicationLoading(true);
    try {
      const r = await fetch("/jobhunter/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "application", profile, job })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Falha ao analisar.");
      setApplication(data.result);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Não foi possível analisar a vaga.");
    } finally {
      setApplicationLoading(false);
    }
  }

  async function analyzeResume(file?: File) {
    setAiLoading(true); setMessage("");
    try {
      const form = new FormData();
      form.append("resumeText", profile.resumeText || "");
      if (file) form.append("file", file);
      const r = await fetch("/jobhunter/api/ai", { method: "POST", body: form });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Falha ao analisar currículo.");
      setProfile({ ...defaultProfile, ...data.profile });
      setMessage("Currículo analisado. Seu perfil internacional foi atualizado.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Não foi possível analisar o currículo.");
    } finally {
      setAiLoading(false);
    }
  }

  const filtered = useMemo(() => jobs.filter(j => {
    const q = query.toLowerCase();
    const text = (j.title + " " + j.company + " " + j.location + " " + j.description).toLowerCase();
    const score = j.aiScore ?? j.matchScore;
    return (!q || text.includes(q)) && score >= minScore &&
      (!onlyUsd || j.usdSignal === "yes" || j.usdSignal === "possible") &&
      (!onlyBrazil || ["yes", "latam", "worldwide"].includes(j.brazilSignal)) &&
      (!aiOnly || j.aiScore !== undefined);
  }), [jobs, query, minScore, onlyUsd, onlyBrazil, aiOnly]);

  const trackerJobs = jobs.filter(j => applications[j.id]);

  return (
    <main className="jobhunter-page min-h-screen bg-[#0f1117] text-white px-5 py-8 md:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <a href="/" className="text-xs text-white/40 hover:text-white/70">← Garfado</a>
            <p className="mt-4 text-xs uppercase tracking-[0.2em] text-emerald-400">JobHunter · AI</p>
            <h1 className="mt-2 text-3xl font-bold md:text-5xl">Seu assistente de carreira.</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/55">Currículo → vagas ideais → match com IA → cover letter → respostas. A candidatura só é enviada quando você decidir.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={load} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm">{loading ? "Buscando..." : "Atualizar vagas"}</button>
            <button onClick={refineWithAI} disabled={aiLoading} className="rounded-xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-black disabled:opacity-50">{aiLoading ? "IA analisando..." : "✨ Refinar com IA"}</button>
          </div>
        </header>

        <nav className="mt-5 flex gap-2">
          <Nav active={tab === "jobs"} onClick={() => setTab("jobs")}>Vagas <b>{jobs.length}</b></Nav>
          <Nav active={tab === "profile"} onClick={() => setTab("profile")}>Meu perfil</Nav>
          <Nav active={tab === "tracker"} onClick={() => setTab("tracker")}>Candidaturas <b>{trackerJobs.length}</b></Nav>
        </nav>

        {message && <div className="mt-5 rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-4 py-3 text-sm text-emerald-200">{message}</div>}

        {tab === "profile" && <ProfilePanel profile={profile} setProfile={setProfile} onAnalyze={analyzeResume} loading={aiLoading} aiConfigured={aiConfigured} />}
        {tab === "tracker" && <Tracker jobs={trackerJobs} applications={applications} setApplications={setApplications} onOpen={analyzeApplication} />}

        {tab === "jobs" && <>
          <section className="mt-5 grid gap-3 md:grid-cols-[1fr_auto_auto_auto_auto]">
            <input className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30 focus:border-emerald-400" placeholder="Buscar cargo, empresa..." value={query} onChange={e => setQuery(e.target.value)} />
            <select className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none" value={minScore} onChange={e => setMinScore(Number(e.target.value))}>
              <option value={0}>Qualquer match</option><option value={60}>Match 60+</option><option value={70}>Match 70+</option><option value={80}>Match 80+</option><option value={90}>Match 90+</option>
            </select>
            <Toggle active={onlyUsd} onClick={() => setOnlyUsd(!onlyUsd)}>💵 USD</Toggle>
            <Toggle active={onlyBrazil} onClick={() => setOnlyBrazil(!onlyBrazil)}>🇧🇷 Brasil/LATAM</Toggle>
            <Toggle active={aiOnly} onClick={() => setAiOnly(!aiOnly)}>✨ Só IA</Toggle>
          </section>

          <section className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat value={jobs.length} label="encontradas" /><Stat value={filtered.length} label="exibidas" />
            <Stat value={jobs.filter(j => (j.aiScore ?? j.matchScore) >= 80).length} label="match 80+" />
            <Stat value={jobs.filter(j => j.usdSignal === "yes").length} label="USD confirmado" />
          </section>

          <section className="mt-6 grid gap-4 md:grid-cols-2">
            {loading && <Empty text="Buscando vagas..." />}
            {!loading && filtered.length === 0 && <Empty text="Nenhuma vaga bateu os filtros. Tente Match 0 ou rode o refinamento com IA." />}
            {filtered.map(job => <JobCard key={job.id} job={job} status={applications[job.id]} onStatus={s => setApplications(p => ({ ...p, [job.id]: s }))} onAnalyze={() => analyzeApplication(job)} />)}
          </section>
        </>}
      </div>

      {selectedJob && <ApplicationModal job={selectedJob} application={application} loading={applicationLoading} onClose={() => setSelectedJob(null)} onSave={() => setApplications(p => ({ ...p, [selectedJob.id]: "Saved" }))} />}
    </main>
  );
}

function ProfilePanel({ profile, setProfile, onAnalyze, loading, aiConfigured }: { profile: CandidateProfile; setProfile: React.Dispatch<React.SetStateAction<CandidateProfile>>; onAnalyze: (file?: File) => void; loading: boolean; aiConfigured: boolean }) {
  return (
    <section className="mt-6 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
        <p className="text-xs uppercase tracking-[0.18em] text-emerald-400">01 · currículo</p>
        <h2 className="mt-2 text-xl font-bold">Coloque seu currículo aqui</h2>
        <p className="mt-2 text-sm leading-6 text-white/45">PDF ou DOCX. A IA extrai as informações e monta seu perfil internacional sem inventar experiência.</p>
        <label className="mt-5 flex cursor-pointer items-center justify-center rounded-2xl border border-dashed border-emerald-400/30 bg-emerald-400/5 p-8 text-center">
          <input type="file" accept=".pdf,.doc,.docx,.txt,.md" className="hidden" onChange={e => e.target.files?.[0] && onAnalyze(e.target.files[0])} />
          <span>{loading ? "Analisando currículo..." : "📄 Escolher currículo (PDF/DOCX)"}</span>
        </label>
        <textarea className="mt-4 min-h-48 w-full rounded-xl border border-white/10 bg-black/20 p-4 text-sm outline-none placeholder:text-white/25" placeholder="Ou cole seu currículo em inglês/português aqui..." value={profile.resumeText} onChange={e => setProfile(p => ({ ...p, resumeText: e.target.value }))} />
        <button onClick={() => onAnalyze()} disabled={loading || !profile.resumeText.trim()} className="mt-3 w-full rounded-xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-black disabled:opacity-40">✨ Transformar currículo com IA</button>
        <p className="mt-3 text-xs text-white/30">{aiConfigured ? "IA conectada." : "IA não configurada: adicione OPENAI_API_KEY no Vercel."}</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
        <p className="text-xs uppercase tracking-[0.18em] text-emerald-400">02 · perfil internacional</p>
        <h2 className="mt-2 text-xl font-bold">{profile.name || "Seu nome"}</h2>
        <input className="mt-4 w-full rounded-xl border border-white/10 bg-white/5 p-3" value={profile.headline} onChange={e => setProfile(p => ({ ...p, headline: e.target.value }))} />
        <textarea className="mt-3 min-h-32 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm leading-6" value={profile.summary} onChange={e => setProfile(p => ({ ...p, summary: e.target.value }))} />
        <Field title="Cargos alvo" value={profile.roles.join(", ")} onChange={v => setProfile(p => ({ ...p, roles: v.split(",").map(x => x.trim()).filter(Boolean) }))} />
        <Field title="Skills" value={profile.skills.join(", ")} onChange={v => setProfile(p => ({ ...p, skills: v.split(",").map(x => x.trim()).filter(Boolean) }))} />
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Field title="Mínimo US$/mês" value={String(profile.minimumMonthlyUsd)} onChange={v => setProfile(p => ({ ...p, minimumMonthlyUsd: Number(v) || 0 }))} />
          <Field title="Regiões" value={profile.preferredRegions.join(", ")} onChange={v => setProfile(p => ({ ...p, preferredRegions: v.split(",").map(x => x.trim()).filter(Boolean) }))} />
        </div>
        <div className="mt-5 rounded-xl bg-black/20 p-4">
          <p className="text-xs uppercase tracking-wider text-white/35">Currículo em inglês</p>
          <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap font-sans text-sm leading-6 text-white/65">{profile.resumeText || "Depois de analisar seu currículo, a versão internacional aparecerá aqui."}</pre>
        </div>
      </div>
    </section>
  );
}

function JobCard({ job, status, onStatus, onAnalyze }: { job: Job; status?: string; onStatus: (s: string) => void; onAnalyze: () => void }) {
  const score = job.aiScore ?? job.matchScore;
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 shadow-2xl shadow-black/10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-white/35">{job.company} · {job.source}</p>
          <h2 className="mt-1 text-lg font-semibold">{job.title}</h2>
          <p className="mt-1 text-xs text-white/45">📍 {job.location || "Localização não informada"} · {job.remote ? "Remoto" : "Remoto não confirmado"} · {job.employmentType}</p>
        </div>
        <div className="rounded-full bg-emerald-400/10 px-3 py-1 text-sm font-bold text-emerald-300">★ {score}</div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {job.brazilSignal !== "no" && <Tag>🇧🇷 {job.brazilSignal}</Tag>}
        <Tag>💵 {job.usdSignal}</Tag>
        {job.salaryMonthlyMin && <Tag>{"~US$" + Math.round(job.salaryMonthlyMin).toLocaleString() + "/mês+"}</Tag>}
        {job.aiScore !== undefined && <Tag>✨ IA {job.aiScore}</Tag>}
        {job.matchReasons.slice(0, 3).map(r => <Tag key={r}>{r}</Tag>)}
      </div>
      {job.aiWhy?.length ? <p className="mt-3 text-xs leading-5 text-emerald-200/70">✨ {job.aiWhy.slice(0, 2).join(" · ")}</p> : null}
      {job.aiConcerns?.length ? <p className="mt-2 text-xs leading-5 text-amber-200/60">⚠ {job.aiConcerns.slice(0, 2).join(" · ")}</p> : null}
      <div className="mt-5 flex flex-wrap gap-2">
        <button onClick={onAnalyze} className="rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-black">✨ Analisar candidatura</button>
        {job.url && <a className="rounded-xl border border-white/10 px-4 py-2 text-sm" href={job.url} target="_blank" rel="noreferrer">Ver vaga</a>}
        <select value={status || ""} onChange={e => e.target.value && onStatus(e.target.value)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70">
          <option value="">Acompanhar...</option>{STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
    </article>
  );
}

function ApplicationModal({ job, application, loading, onClose, onSave }: { job: Job; application: ApplicationAI | null; loading: boolean; onClose: () => void; onSave: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm md:items-center md:p-6" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-t-3xl border border-white/10 bg-[#151821] p-5 md:rounded-3xl md:p-7" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-xs uppercase tracking-wider text-emerald-400">{job.company}</p><h2 className="mt-1 text-2xl font-bold">{job.title}</h2><p className="mt-1 text-sm text-white/45">{job.location} · {job.employmentType}</p></div>
          <button onClick={onClose} className="rounded-full bg-white/5 px-3 py-2 text-white/60">✕</button>
        </div>
        {loading && <div className="py-16 text-center text-white/50">✨ A IA está comparando seu perfil com a vaga e preparando sua candidatura...</div>}
        {application && <div className="mt-6 space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-emerald-400/10 px-4 py-2 font-bold text-emerald-300">★ {application.matchScore}% match IA</span>
            <a href={job.applyUrl || job.url} target="_blank" rel="noreferrer" className="rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-black">Abrir candidatura</a>
            <button onClick={onSave} className="rounded-xl border border-white/10 px-4 py-2 text-sm">Salvar vaga</button>
          </div>
          <TwoCol title="Por que combina" items={application.whyFit} />
          <TwoCol title="Pontos de atenção" items={application.risks} />
          <TextBox title="Professional Summary" text={application.tailoredSummary} />
          <TextBox title="Cover Letter" text={application.coverLetter} />
          <div><h3 className="mb-2 text-sm font-semibold text-white/70">Application answers</h3><div className="space-y-3">{application.answers.map(a => <TextBox key={a.question} title={a.question} text={a.answer} />)}</div></div>
          <p className="text-xs text-white/30">Revise tudo antes de enviar. O JobHunter não envia candidaturas automaticamente.</p>
        </div>}
      </div>
    </div>
  );
}

function Tracker({ jobs, applications, setApplications, onOpen }: { jobs: Job[]; applications: Record<string, string>; setApplications: React.Dispatch<React.SetStateAction<Record<string, string>>>; onOpen: (j: Job) => void }) {
  return <section className="mt-6"><div className="mb-4"><p className="text-xs uppercase tracking-[0.18em] text-emerald-400">05 · application tracker</p><h2 className="mt-2 text-2xl font-bold">Suas candidaturas</h2></div><div className="grid gap-3 md:grid-cols-2">{jobs.map(j => <div key={j.id} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"><div className="flex justify-between gap-4"><div><p className="text-xs text-white/35">{j.company}</p><h3 className="font-semibold">{j.title}</h3></div><span className="text-xs text-emerald-300">{applications[j.id]}</span></div><div className="mt-3 flex gap-2"><button onClick={() => onOpen(j)} className="rounded-lg border border-white/10 px-3 py-2 text-xs">Abrir análise</button><select value={applications[j.id]} onChange={e => setApplications(p => ({ ...p, [j.id]: e.target.value }))} className="rounded-lg border border-white/10 bg-white/5 px-2 text-xs"><option>Saved</option>{STATUSES.slice(1).map(s => <option key={s}>{s}</option>)}</select></div></div>)}</div>{jobs.length === 0 && <Empty text="Salve uma vaga para ela aparecer aqui." />}</section>;
}

function TextBox({ title, text }: { title: string; text: string }) {
  return <div className="rounded-2xl border border-white/10 bg-black/15 p-4"><div className="flex items-center justify-between gap-3"><h3 className="text-sm font-semibold text-white/70">{title}</h3><button onClick={() => navigator.clipboard?.writeText(text)} className="text-xs text-white/35 hover:text-white/70">Copiar</button></div><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-white/75">{text}</p></div>;
}
function TwoCol({ title, items }: { title: string; items: string[] }) {
  return <div><h3 className="mb-2 text-sm font-semibold text-white/70">{title}</h3><ul className="space-y-2">{items.map(x => <li key={x} className="rounded-xl bg-white/5 px-3 py-2 text-sm text-white/65">• {x}</li>)}</ul></div>;
}
function Field({ title, value, onChange }: { title: string; value: string; onChange: (v: string) => void }) {
  return <label className="mt-3 block"><span className="mb-1 block text-xs text-white/35">{title}</span><input className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm" value={value} onChange={e => onChange(e.target.value)} /></label>;
}
function Nav({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick} className={"rounded-xl px-4 py-2 text-sm " + (active ? "bg-white/10 text-white" : "text-white/40 hover:text-white")}>{children}</button>;
}
function Toggle({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button className={"rounded-xl border px-4 py-3 text-sm " + (active ? "border-emerald-400 bg-emerald-400 text-black" : "border-white/10 bg-white/5")} onClick={onClick}>{children}</button>;
}
function Tag({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-white/60">{children}</span>;
}
function Stat({ value, label }: { value: number; label: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"><b className="text-2xl">{value}</b><p className="text-xs text-white/40">{label}</p></div>;
}
function Empty({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-sm text-white/40 md:col-span-2">{text}</div>;
}
