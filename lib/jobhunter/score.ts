import { defaultProfile } from "./profile";
import type { Job, EmploymentType } from "./types";

const hardNo = ["us only","usa only","united states only","u.s. only","eu only","europe only","uk only","canada only"];
const temporaryTerms = ["contractor","contractual","freelance","freelancer","temporary","short-term","project-based"];
const fullTimeTerms = ["full-time","full time","permanent"];

function containsAny(text: string, terms: string[]) {
  const t = text.toLowerCase();
  return terms.some(x => t.includes(x));
}

function employmentType(text: string): EmploymentType {
  if (containsAny(text, ["freelance","freelancer"])) return "freelance";
  if (containsAny(text, ["temporary","short-term","project-based"])) return "temporary";
  if (containsAny(text, ["contractor","contractual","contract"])) return "contract";
  if (containsAny(text, ["part-time","part time"])) return "part-time";
  if (containsAny(text, fullTimeTerms)) return "full-time";
  return "unknown";
}

function salaryMonthly(text: string) {
  const t = text.toLowerCase().replace(/,/g, "");
  const nums = [...t.matchAll(/(?:usd|us\$|\$)\s*([\d.]+)(?:k)?/gi)].map(m => {
    const raw = Number(m[1]);
    return m[0].toLowerCase().includes("k") ? raw * 1000 : raw;
  });
  if (!nums.length) return {};
  const values = nums.filter(n => n > 100);
  if (!values.length) return {};
  const annual = /per year|per annum|annual|annually|\/year|yearly/.test(t);
  const monthly = /per month|monthly|\/month/.test(t);
  if (annual) return { min: Math.min(...values) / 12, max: Math.max(...values) / 12 };
  if (monthly) return { min: Math.min(...values), max: Math.max(...values) };
  const max = Math.max(...values);
  if (max >= 10000) return { min: Math.min(...values) / 12, max: max / 12 };
  return { min: Math.min(...values), max };
}

export function scoreJob(input: Omit<Job, "matchScore" | "matchReasons" | "brazilSignal" | "usdSignal" | "employmentType" | "salaryMonthlyMin" | "salaryMonthlyMax">): Job {
  const text = `${input.title} ${input.location} ${input.description} ${input.salaryText ?? ""}`.toLowerCase();
  let score = 0;
  const reasons: string[] = [];

  const roleHits = defaultProfile.roles.filter(r => text.includes(r.toLowerCase()));
  if (roleHits.length) {
    score += Math.min(30, 15 + roleHits.length * 5);
    reasons.push(`cargo: ${roleHits.slice(0, 2).join(", ")}`);
  }

  const skillHits = defaultProfile.skills.filter(s => text.includes(s.toLowerCase()));
  score += Math.min(20, skillHits.length * 3);
  if (skillHits.length) reasons.push(`skills: ${skillHits.slice(0, 4).join(", ")}`);

  const locationText = `${input.location} ${input.description}`.toLowerCase();
  let brazilSignal: Job["brazilSignal"] = "unknown";
  if (containsAny(locationText, ["brazil","brasil"])) brazilSignal = "yes";
  else if (containsAny(locationText, ["latam","latin america"])) brazilSignal = "latam";
  else if (containsAny(locationText, ["worldwide","anywhere","global","international"])) brazilSignal = "worldwide";
  else if (containsAny(locationText, hardNo)) brazilSignal = "no";

  if (brazilSignal === "yes") { score += 25; reasons.push("Brasil"); }
  else if (brazilSignal === "latam") { score += 23; reasons.push("LATAM"); }
  else if (brazilSignal === "worldwide") { score += 20; reasons.push("worldwide"); }
  else if (brazilSignal === "unknown") score += 10;

  const salaryText = `${input.salaryText ?? ""} ${input.description}`;
  let usdSignal: Job["usdSignal"] = "unknown";
  if (/\bUSD\b|\bUS\$/i.test(salaryText)) {
    usdSignal = "yes"; score += 20; reasons.push("USD");
  } else if (/\$ ?[\d,.]+/i.test(salaryText)) {
    usdSignal = "possible"; score += 12; reasons.push("$ encontrado");
  } else score += 8;

  const salary = salaryMonthly(salaryText);
  if (salary.max !== undefined) {
    if (salary.max < defaultProfile.minimumMonthlyUsd) {
      score -= 25;
      reasons.push(`abaixo de US$${defaultProfile.minimumMonthlyUsd}/mês`);
    } else if (salary.min !== undefined && salary.min >= defaultProfile.minimumMonthlyUsd) {
      score += 10;
      reasons.push(`US$${Math.round(salary.min).toLocaleString()}/mês+`);
    }
  }

  const type = employmentType(text);
  if (type === "full-time") { score += 6; reasons.push("full-time"); }
  if (type === "contract" || type === "freelance" || type === "temporary") {
    score -= 12;
    reasons.push(type);
  }

  if (input.remote) { score += 5; reasons.push("remoto"); }
  if (brazilSignal === "no") score = Math.max(0, score - 60);

  return {
    ...input,
    employmentType: type,
    brazilSignal,
    usdSignal,
    salaryMonthlyMin: salary.min,
    salaryMonthlyMax: salary.max,
    matchScore: Math.max(0, Math.min(100, score)),
    matchReasons: reasons,
  };
}
