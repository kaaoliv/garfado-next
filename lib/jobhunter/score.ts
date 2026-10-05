import { defaultProfile } from "./profile";
import type { Job } from "./types";

const hardNo = ["us only","usa only","united states only","u.s. only","eu only","europe only","uk only","canada only"];

function containsAny(text: string, terms: string[]) {
  const t = text.toLowerCase();
  return terms.some(x => t.includes(x));
}

export function scoreJob(input: Omit<Job, "matchScore" | "matchReasons" | "brazilSignal" | "usdSignal">): Job {
  const text = `${input.title} ${input.location} ${input.description} ${input.salaryText ?? ""}`.toLowerCase();
  let score = 0;
  const reasons: string[] = [];

  const roleHits = defaultProfile.roles.filter(r => text.includes(r));
  if (roleHits.length) {
    score += Math.min(30, 15 + roleHits.length * 5);
    reasons.push(`cargo: ${roleHits.slice(0, 2).join(", ")}`);
  }

  const skillHits = defaultProfile.skills.filter(s => text.includes(s));
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

  const salary = `${input.salaryText ?? ""} ${input.description}`;
  let usdSignal: Job["usdSignal"] = "unknown";
  if (/\bUSD\b|\bUS\$/i.test(salary)) {
    usdSignal = "yes"; score += 20; reasons.push("USD");
  } else if (/\$ ?[\d,.]+/.test(salary)) {
    usdSignal = "possible"; score += 12; reasons.push("$ encontrado");
  } else score += 8;

  if (input.remote) { score += 5; reasons.push("remoto"); }
  if (brazilSignal === "no") score = Math.max(0, score - 60);

  return { ...input, brazilSignal, usdSignal, matchScore: Math.min(100, score), matchReasons: reasons };
}