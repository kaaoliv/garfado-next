"use client";

import { useEffect, useMemo, useState } from "react";
import type { Job } from "@/lib/jobhunter/types";

export default function JobHunterPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [minScore, setMinScore] = useState(60);
  const [onlyUsd, setOnlyUsd] = useState(false);
  const [onlyBrazil, setOnlyBrazil] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/jobhunter/api/jobs", { cache: "no-store" });
      const data = await r.json();
      setJobs(data.jobs ?? []);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => jobs.filter(j => {
    const q = query.toLowerCase();
    const text = `${j.title} ${j.company} ${j.location} ${j.description}`.toLowerCase();
    return (!q || text.includes(q)) &&
      j.matchScore >= minScore &&
      (!onlyUsd || j.usdSignal === "yes" || j.usdSignal === "possible") &&
      (!onlyBrazil || ["yes","latam","worldwide"].includes(j.brazilSignal));
  }), [jobs, query, minScore, onlyUsd, onlyBrazil]);

  return (
    <main className="jobhunter-page min-h-screen bg-[#0f1117] text-white px-5 py-8 md:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-7 md:flex-row md:items-end md:justify-between">
          <div>
            <a href="/" className="text-xs text-white/40 hover:text-white/70">← Garfado</a>
            <p className="mt-4 text-xs uppercase tracking-[0.2em] text-emerald-400">JobHunter · V0.1</p>
            <h1 className="mt-2 text-3xl font-bold md:text-5xl">Vagas que valem a pena.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">
              Priorizamos vídeo, motion e conteúdo remoto com sinais de contratação no Brasil/LATAM e pagamento em USD.
            </p>
          </div>
          <button onClick={load} className="rounded-xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-black hover:bg-emerald-300">
            {loading ? "Buscando..." : "Atualizar vagas"}
          </button>
        </header>

        <section className="mt-6 grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
          <input className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none placeholder:text-white/30 focus:border-emerald-400" placeholder="Buscar cargo, empresa..." value={query} onChange={e => setQuery(e.target.value)} />
          <select className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none" value={minScore} onChange={e => setMinScore(Number(e.target.value))}>
            <option value={0}>Qualquer match</option><option value={60}>Match 60+</option><option value={70}>Match 70+</option><option value={80}>Match 80+</option><option value={90}>Match 90+</option>
          </select>
          <button className={`rounded-xl border px-4 py-3 text-sm ${onlyUsd ? "border-emerald-400 bg-emerald-400 text-black" : "border-white/10 bg-white/5"}`} onClick={() => setOnlyUsd(!onlyUsd)}>💵 USD</button>
          <button className={`rounded-xl border px-4 py-3 text-sm ${onlyBrazil ? "border-emerald-400 bg-emerald-400 text-black" : "border-white/10 bg-white/5"}`} onClick={() => setOnlyBrazil(!onlyBrazil)}>🇧🇷 Brasil/LATAM</button>
        </section>

        <section className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat value={jobs.length} label="encontradas" /><Stat value={filtered.length} label="exibidas" />
          <Stat value={jobs.filter(j => j.matchScore >= 80).length} label="match 80+" />
          <Stat value={jobs.filter(j => j.usdSignal === "yes").length} label="USD" />
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          {loading && <Empty text="Buscando vagas..." />}
          {!loading && filtered.length === 0 && <Empty text="Nenhuma vaga bateu os filtros. Configure as fontes no Vercel para começar." />}
          {filtered.map(job => (
            <article key={job.id} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 shadow-2xl shadow-black/10">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-white/35">{job.company} · {job.source}</p>
                  <h2 className="mt-1 text-lg font-semibold">{job.title}</h2>
                  <p className="mt-1 text-xs text-white/45">📍 {job.location || "Localização não informada"} · {job.remote ? "Remoto" : "Remoto não confirmado"}</p>
                </div>
                <div className="rounded-full bg-emerald-400/10 px-3 py-1 text-sm font-bold text-emerald-300">★ {job.matchScore}</div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {job.brazilSignal !== "no" && <Tag>🇧🇷 {job.brazilSignal}</Tag>}
                <Tag>💵 {job.usdSignal}</Tag>
                {job.matchReasons.slice(0,4).map(r => <Tag key={r}>{r}</Tag>)}
              </div>
              <div className="mt-5 flex gap-2">
                {job.url && <a className="rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-black" href={job.url} target="_blank" rel="noreferrer">Ver vaga</a>}
                {job.applyUrl && job.applyUrl !== job.url && <a className="rounded-xl border border-white/10 px-4 py-2 text-sm" href={job.applyUrl} target="_blank" rel="noreferrer">Candidatar</a>}
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
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