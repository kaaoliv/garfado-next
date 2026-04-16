'use client'
import { useMemo, useState, useEffect } from 'react'

const FOODS = ['🍔', '🌮', '🍕', '🍜', '🌯', '🍣', '🥪', '🧆', '🥩', '🍱']
const MSGS = ['garfando por aí', 'procurando o melhor', 'vem que tem', 'qual vai ser hoje?', 'hora de garfar']

export function LoadingScreen() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const [f1, f2, f3, msg] = useMemo(() => {
    const pick = () => FOODS[Math.floor(Math.random() * FOODS.length)]
    return [pick(), pick(), pick(), MSGS[Math.floor(Math.random() * MSGS.length)]]
  }, [])

  if (!mounted) return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6">
      <div className="text-4xl">🍴</div>
      <p className="text-sm text-muted-foreground">carregando...</p>
    </div>
  )

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6">
      <div className="relative w-36 h-36">
        <div className="absolute bottom-2 left-2 text-[34px] animate-food-1">{f1}</div>
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[34px] animate-food-2">{f2}</div>
        <div className="absolute bottom-2 right-2 text-[34px] animate-food-3">{f3}</div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 origin-top animate-fork">
          <svg width="30" height="78" viewBox="0 0 18 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="9" y1="1" x2="9" y2="28" stroke="#4ade80" strokeWidth="2.2" strokeLinecap="round"/>
            <line x1="4" y1="1" x2="4" y2="12" stroke="#4ade80" strokeWidth="2.2" strokeLinecap="round"/>
            <line x1="14" y1="1" x2="14" y2="12" stroke="#4ade80" strokeWidth="2.2" strokeLinecap="round"/>
            <path d="M4 12 Q9 18 14 12" fill="none" stroke="#4ade80" strokeWidth="2.2" strokeLinecap="round"/>
            <line x1="9" y1="28" x2="9" y2="47" stroke="#4ade80" strokeWidth="2.2" strokeLinecap="round"/>
            <circle cx="9" cy="38" r="4" fill="#4ade80"/>
          </svg>
        </div>
      </div>
      <p className="text-sm text-muted-foreground animate-fade-in-up">
        {msg}<span className="inline-flex gap-0.5 ml-1">
          <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
          <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
          <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
        </span>
      </p>
    </div>
  )
}
