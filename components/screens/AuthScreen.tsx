'use client'
import { useState } from 'react'
import { ForkIcon } from '@/components/shared/ForkIcon'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export function AuthScreen() {
  const [loading, setLoading] = useState(false)

  const handleGoogle = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'https://garfado-next.vercel.app',
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    })
    if (error) {
      toast.error('Erro ao entrar com Google')
      setLoading(false)
    }
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-8 gap-8" aria-label="Tela de login">
      {/* Logo */}
      <div className="flex flex-col items-center gap-4">
        <ForkIcon className="w-14 h-20 text-primary" />
        <h1 className="font-serif text-4xl font-bold">garfado</h1>
        <p className="text-sm text-muted-foreground text-center leading-relaxed">
          Registre, avalie e descubra os melhores restaurantes que você já foi
        </p>
      </div>

      {/* Features */}
      <ul className="w-full flex flex-col gap-3 list-none p-0 m-0" role="list" aria-label="Funcionalidades do app">
        {[
          { ico: '◎', text: 'Marque os restaurantes que você foi' },
          { ico: '⭐', text: 'Avalie e deixe reviews públicos' },
          { ico: '👥', text: 'Veja o que seus amigos estão garfando' },
          { ico: '🎯', text: 'Caçe todas as unidades das suas franquias' },
        ].map(f => (
          <li key={f.ico} className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="text-lg w-7 text-center flex-shrink-0" aria-hidden="true">{f.ico}</span>
            <span>{f.text}</span>
          </li>
        ))}
      </ul>

      {/* Google Button */}
      <ul className="w-full flex flex-col gap-3 list-none p-0 m-0" role="list" aria-label="Funcionalidades do app">
        <button
          onClick={handleGoogle}
          disabled={loading}
          aria-label="Entrar no Garfado com sua conta Google"
          className="w-full flex items-center justify-center gap-3 py-4 bg-white text-gray-800 rounded-2xl font-semibold text-sm disabled:opacity-60 active:scale-[0.98] transition-all shadow-sm"
        >
          {loading ? (
            <span className="w-5 h-5 border-2 border-gray-400 border-t-gray-800 rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          <span>{loading ? 'Conectando...' : 'Continuar com Google'}</span>
        </button>
        <p className="text-center text-xs text-muted-foreground">
          Ao entrar, você concorda com os termos de uso do Garfado
        </p>
      </div>
    </main>
  )
}
