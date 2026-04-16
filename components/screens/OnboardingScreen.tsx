'use client'
import { useState } from 'react'
import { useApp } from '@/lib/context'
import { ForkIcon } from '@/components/shared/ForkIcon'
import { toast } from 'sonner'

export function OnboardingScreen() {
  const { finishOnboarding } = useApp()
  const [username, setUsername] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    const un = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '')
    if (!un || un.length < 3) { toast.error('Username precisa ter ao menos 3 letras'); return }
    setLoading(true)
    const ok = await finishOnboarding(un, name.trim() || 'Explorador')
    if (!ok) { toast.error('Esse username já está em uso'); setLoading(false) }
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 gap-8">
      <div className="flex flex-col items-center gap-3">
        <ForkIcon className="w-12 h-16 text-primary" />
        <h1 className="font-serif text-2xl font-bold">Bem-vindo!</h1>
        <p className="text-sm text-muted-foreground text-center">Escolha um @username para seus amigos te encontrarem</p>
      </div>

      <div className="w-full flex flex-col gap-3">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Seu nome"
          className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
        />
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
          <input
            value={username}
            onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            placeholder="username (mín. 3 letras)"
            className="w-full bg-card border border-border rounded-xl pl-8 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
          />
        </div>
        <p className="text-xs text-muted-foreground">Só letras minúsculas, números e _</p>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-semibold text-sm disabled:opacity-50 active:scale-[0.98] transition-all">
          {loading ? 'Salvando...' : 'Entrar no app'}
        </button>
      </div>
    </div>
  )
}
