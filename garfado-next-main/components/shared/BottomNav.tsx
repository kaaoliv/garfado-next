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
    <nav className="flex-shrink-0 flex items-center justify-around border-t border-border bg-nav-bg pb-6 transition-colors duration-300">
      {tabs.map(tab => {
        const isActive = active === tab.id
        return (
          <motion.button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex flex-col items-center gap-1 py-3 px-3 min-w-[56px] touch-manipulation relative ${
              isActive ? 'text-primary' : 'text-muted-foreground'
            }`}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.15 }}
          >
            <motion.div
              animate={{
                scale: isActive ? 1.1 : 1,
                y: isActive ? -2 : 0,
              }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <tab.Icon className="w-5 h-5" />
            </motion.div>
            <motion.span
              className="text-[10px] font-medium"
              animate={{
                opacity: isActive ? 1 : 0.7,
              }}
              transition={{ duration: 0.2 }}
            >
              {tab.label}
            </motion.span>
            {isActive && (
              <motion.div
                className="absolute -top-px left-1/2 w-8 h-0.5 bg-primary rounded-full"
                layoutId="activeTab"
                initial={false}
                style={{ x: '-50%' }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              />
            )}
          </motion.button>
        )
      })}
    </nav>
  )
}
