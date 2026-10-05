export type CandidateProfile = {
  name: string;
  headline: string;
  location: string;
  summary: string;
  roles: string[];
  skills: string[];
  industries: string[];
  languages: string[];
  preferredRegions: string[];
  employmentTypes: string[];
  minimumMonthlyUsd: number;
  resumeText: string;
};

export const defaultProfile: CandidateProfile = {
  name: "Kaike Oliveira",
  headline: "Video Editor · Motion Designer · Video Producer",
  location: "São Paulo, Brazil · Remote",
  summary: "Video Editor and Motion Designer with hands-on experience producing digital content, social media campaigns, branded videos, live productions, podcasts and audiovisual projects. Skilled in Premiere Pro, After Effects, Photoshop, Lightroom and Audition.",
  roles: ["Video Editor","Senior Video Editor","Motion Designer","Video Producer","Content Editor","Short-form Video Editor","Creative Video Editor","Post Production Editor"],
  skills: ["Premiere Pro","After Effects","Photoshop","Lightroom","Audition","Motion Design","Social Media","YouTube","Reels","TikTok","Short-form","Long-form","Ads","DTC","Podcast","Live Production","Photography"],
  industries: ["DTC","Advertising","Education","Technology","Culture","Media"],
  languages: ["Portuguese — Native","English — Professional"],
  preferredRegions: ["Brazil","LATAM","Worldwide"],
  employmentTypes: ["Full-time","Permanent"],
  minimumMonthlyUsd: 2000,
  resumeText: "",
};
