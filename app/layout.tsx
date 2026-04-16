import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AppProvider } from '@/lib/context'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: 'Garfado — Registre os restaurantes que você foi',
  description: 'Garfado é o app para registrar, avaliar e descobrir restaurantes. Veja o que seus amigos estão garfando e colecione seus lugares favoritos.',
  keywords: ['restaurantes', 'gastronomia', 'avaliação', 'check-in', 'garfado'],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0f1117',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="bg-[#0f1117] flex items-center justify-center h-screen overflow-hidden">
        <div className="w-full max-w-[390px] h-screen relative bg-[#0f1117] flex flex-col overflow-hidden">
          <AppProvider>
            {children}
          </AppProvider>
          <Toaster theme="dark" position="top-center"
            toastOptions={{ style: { background: '#1a1d24', border: '1px solid #2a2d35', color: '#f5f5f7' } }}
          />
        </div>
      </body>
    </html>
  )
}
