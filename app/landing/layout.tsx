export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, padding: 0, background: '#080b0f' }}>
        {children}
      </body>
    </html>
  )
}
