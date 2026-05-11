'use client'
import { motion } from 'framer-motion'
import { Grid3X3, Crosshair, Users, User, Map } from 'lucide-react'

export type Tab = 'visitados' | 'hunter' | 'mapa' | 'amigos' | 'perfil'

interface BottomNavProps {
  active: Tab
  onChange: (tab: Tab) => void
}

const tabs: { id: Tab; Icon: typeof Grid3X3; label: string }[] = [
  { id: 'visitados', Icon: Grid3X3, label: 'visitados' },
  { id: 'hunter', Icon: Crosshair, label: 'hunter' },
  { id: 'mapa', Icon: Map, label: 'mapa' },
  { id: 'amigos', Icon: Users, label: 'amigos' },
  { id: 'perfil', Icon: User, label: 'perfil' },
]

export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="flex-shrink-0 flex items-center justify-around border-t border-border/50 bg-nav-bg/95 backdrop-blur-lg pb-6 pt-1 transition-colors duration-300 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      {tabs.map(tab => {
        const isActive = active === tab.id
        return (
          <motion.button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex flex-col items-center gap-1.5 py-2.5 px-4 min-w-[60px] touch-manipulation relative rounded-xl transition-colors ${
              isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.15 }}
          >
            {isActive && (
              <motion.div
                className="absolute inset-0 bg-primary/10 rounded-xl"
                layoutId="activeTabBg"
                initial={false}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              />
            )}
            <motion.div
              className="relative z-10"
              animate={{
                scale: isActive ? 1.1 : 1,
              }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <tab.Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.5]'}`} />
            </motion.div>
            <motion.span
              className={`relative z-10 text-[10px] ${isActive ? 'font-semibold' : 'font-medium'}`}
              animate={{
                opacity: isActive ? 1 : 0.7,
              }}
              transition={{ duration: 0.2 }}
            >
              {tab.label}
            </motion.span>
          </motion.button>
        )
      })}
    </nav>
  )
}
