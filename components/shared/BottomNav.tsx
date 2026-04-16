'use client'
import { Grid3X3, Flame, Users, User } from 'lucide-react'
import { ForkIcon } from './ForkIcon'

export type Tab = 'visitados' | 'destaques' | 'hunter' | 'amigos' | 'perfil'

interface BottomNavProps {
  active: Tab
  onChange: (tab: Tab) => void
}

const tabs: { id: Tab; icon: React.ReactNode; label: string }[] = [
  { id: 'visitados', icon: <Grid3X3 className="w-5 h-5" />, label: 'visitados' },
  { id: 'destaques', icon: <Flame className="w-5 h-5" />, label: 'destaques' },
  { id: 'hunter', icon: <ForkIcon className="w-5 h-5" />, label: 'hunter' },
  { id: 'amigos', icon: <Users className="w-5 h-5" />, label: 'amigos' },
  { id: 'perfil', icon: <User className="w-5 h-5" />, label: 'perfil' },
]

export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="flex-shrink-0 flex items-center justify-around border-t border-border bg-[#0a0c10] pb-6">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex flex-col items-center gap-1 py-3 px-3 min-w-[56px] transition-colors touch-manipulation ${
            active === tab.id ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          {tab.icon}
          <span className="text-[10px] font-medium">{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}
