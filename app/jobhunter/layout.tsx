import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "JobHunter — vagas remotas em USD",
  description: "Encontre vagas de vídeo, motion e conteúdo remoto que aceitam profissionais do Brasil."
};

export default function JobHunterLayout({ children }: { children: React.ReactNode }) {
  return children;
}