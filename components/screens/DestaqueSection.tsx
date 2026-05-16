'use client'
import { useRef } from 'react'
import { motion } from 'framer-motion'
import { useI18n } from '@/lib/i18n'
import { useApp } from '@/lib/context'
import { RestaurantPoster } from '@/components/shared/RestaurantPoster'
import { TrendingUp, Flame, Target, Star } from 'lucide-react'
import type { Restaurant } from '@/lib/types'



function getWeekStart() {
  const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate() - d.getDay()); return d
}

interface DestaqueSectionProps {
  onOpenModal: (r: Restaurant) => void
}

export function DestaqueSection({ onOpenModal }: DestaqueSectionProps) {
  const { t } = useI18n()
  const { restaurants, visits, visitDates, ratings, trending } = useApp()

  const CHALLENGES = [
    { id: 'c1', Icon: Target, title: t('challenge.explorer'), desc: t('challenge.explorer_desc'), goal: 1, color: 'text-primary' },
    { id: 'c2', Icon: Flame, title: t('challenge.double'), desc: t('challenge.double_desc'), goal: 2, color: 'text-accent' },
    { id: 'c3', Icon: Star, title: t('challenge.critic'), desc: t('challenge.critic_desc'), goal: 2, color: 'text-chart-4' },
  ]
  const touchStartX = useRef(0)
  const isDragging = useRef(false)

  const ws = getWeekStart()
  const newThisWeek = Object.entries(visitDates).filter(([, date]) => new Date(date) >= ws).length
  const ratedCount = Object.values(ratings).filter((r: any) => r.Comida || r.Atendimento).length
  const challengeProgress = [newThisWeek, newThisWeek, ratedCount]

  const timeLeft = (() => {
    const end = new Date(ws); end.setDate(end.getDate() + 7)
    const diff = end.getTime() - Date.now()
    const days = Math.floor(diff / (1000*60*60*24))
    const hours = Math.floor((diff % (1000*60*60*24)) / (1000*60*60))
    return days > 0 ? `${days}d ${hours}h` : `${hours}h`
  })()

  // Trending
  const trendRests = (trending || [])
    .map((t: any) => ({ r: restaurants.find((x: Restaurant) => x.id === t.rid), cnt: t.cnt }))
    .filter((x: any) => x.r) as { r: Restaurant; cnt: number }[]

  // Sugestões
  const suggestions = restaurants
    .filter((r: Restaurant) => !(visits[r.id] || 0) && r.rating)
    .sort((a: Restaurant, b: Restaurant) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 8)

  const swipeProps = (r: Restaurant) => ({
    onTouchStart: (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; isDragging.current = false },
    onTouchMove: (e: React.TouchEvent) => { if (Math.abs(e.touches[0].clientX - touchStartX.current) > 8) isDragging.current = true },
    onTouchEnd: () => { if (!isDragging.current) onOpenModal(r) },
    onClick: () => { if (!isDragging.current) onOpenModal(r) },
  })

  return (
    <div className="mt-4">

      {/* Desafios da semana */}
      <motion.div
        className="px-4 mb-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-lg font-semibold">{t('destaque.challenges')}</h2>
          <span className="text-xs text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">{timeLeft}</span>
        </div>
        <div className="flex flex-col gap-3">
          {CHALLENGES.map((c, i) => {
            const prog = Math.min(c.goal, challengeProgress[i])
            const done = prog >= c.goal
            const pct = Math.round(prog / c.goal * 100)
            return (
              <motion.div
                key={c.id}
                className={`bg-card rounded-2xl p-4 border-2 transition-colors ${done ? 'border-primary/40 bg-primary/5' : 'border-border'}`}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.3 + i * 0.1 }}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0 ${c.color}`}>
                    <c.Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{c.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{c.desc}</p>
                  </div>
                  {done && (
                    <motion.div
                      className="w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                    >
                      <span className="text-primary-foreground text-xs">✓</span>
                    </motion.div>
                  )}
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${done ? 100 : pct}%` }}
                    transition={{ duration: 0.5, delay: 0.4 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  {done ? t('challenge.done') : `${prog} de ${c.goal}`}
                </p>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* Em alta */}
      {trendRests.length > 0 && (
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <div className="flex items-center justify-between px-4 mb-4">
            <h2 className="font-serif text-lg font-semibold">{t('destaque.trending')}</h2>
            <div className="flex items-center gap-1.5 text-accent">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-medium">{t('destaque.trending')}</span>
            </div>
          </div>
          <div className="flex flex-col gap-2 px-4">
            {trendRests.slice(0, 3).map(({ r, cnt }, i) => (
              <motion.button
                key={r.id}
                onClick={() => onOpenModal(r)}
                className="flex items-center gap-3 bg-card rounded-2xl p-3 border border-border touch-manipulation shadow-soft"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.4 + i * 0.1 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                  i === 0 ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                }`}>
                  {i + 1}
                </div>
                <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 shadow-soft">
                  <RestaurantPoster restaurant={r} className="w-full h-full" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="font-serif text-sm font-semibold truncate">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{cnt} garfado{cnt !== 1 ? 's' : ''} esta semana</p>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Sugestões */}
      {suggestions.length > 0 && (
        <div className="mb-6">
          <div className="px-4 mb-3">
            <h2 className="font-serif text-lg font-semibold">{t('destaque.suggestions')}</h2>
            <p className="text-xs text-muted-foreground">{t('destaque.suggestions_sub')}</p>
          </div>
          <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
            {suggestions.map((r: Restaurant) => (
              <button key={r.id} {...swipeProps(r)} className="w-36 shrink-0 touch-manipulation">
                <div className="relative rounded-xl overflow-hidden mb-2" style={{ aspectRatio: '3/4' }}>
                  <RestaurantPoster restaurant={r} className="w-full h-full" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    <p className="font-serif text-xs font-semibold text-white truncate">{r.name}</p>
                    {r.rating && <p className="text-[10px] text-[#FFC72C]">★ {r.rating}</p>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
