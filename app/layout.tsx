import type { Metadata, Viewport } from 'next'
import './globals.css'
import 'leaflet/dist/leaflet.css'
import { AppProvider } from '@/lib/context'
import { I18nProvider } from '@/lib/i18n'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from 'sonner'
import { ServiceWorkerRegister } from '@/components/shared/ServiceWorkerRegister'

export const metadata: Metadata = {
  title: 'Garfado — Registre os restaurantes que você foi',
  description: 'Garfado é o app para registrar, avaliar e descobrir restaurantes. Veja o que seus amigos estão garfando e colecione seus lugares favoritos.',
  keywords: ['restaurantes', 'gastronomia', 'avaliação', 'check-in', 'garfado'],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Garfado',
  },
  icons: {
    icon: [
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover', // permite conteúdo atrás do notch/home indicator
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8f9fa' },
    { media: '(prefers-color-scheme: dark)', color: '#0f1117' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="bg-background flex items-center justify-center overflow-hidden transition-colors duration-300" style={{ height: "100dvh" }}>

        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange={false}
          storageKey="garfado-theme"
        >
          <div className="w-full max-w-[430px] relative bg-background flex flex-col overflow-hidden transition-colors duration-300" style={{ height: "100dvh" }}>
            <I18nProvider>
            <AppProvider>
              {children}
            </AppProvider>
          </I18nProvider>
            <ServiceWorkerRegister />
            <Toaster position="top-center" />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
