export type Job = {
  id: string;
  source: "greenhouse" | "lever" | "ashby";
  company: string;
  title: string;
  location: string;
  description: string;
  url: string;
  applyUrl?: string;
  publishedAt?: string;
  salaryText?: string;
  remote: boolean;
  brazilSignal: "yes" | "latam" | "worldwide" | "unknown" | "no";
  usdSignal: "yes" | "possible" | "unknown" | "no";
  matchScore: number;
  matchReasons: string[];
};