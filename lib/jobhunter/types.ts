export type EmploymentType = "full-time" | "part-time" | "contract" | "freelance" | "temporary" | "unknown";

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
  employmentType: EmploymentType;
  brazilSignal: "yes" | "latam" | "worldwide" | "unknown" | "no";
  usdSignal: "yes" | "possible" | "unknown" | "no";
  salaryMonthlyMin?: number;
  salaryMonthlyMax?: number;
  matchScore: number;
  matchReasons: string[];
  aiScore?: number;
  aiWhy?: string[];
  aiConcerns?: string[];
};
