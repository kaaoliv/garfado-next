'use client'
import { useRef } from 'react'
import { useApp } from '@/lib/context'
import { RestaurantPoster } from '@/components/shared/RestaurantPoster'
import { TrendingUp } from 'lucide-react'
import type { Restaurant } from '@/lib/types'

const CHALLENGES = [
  { id: 'c1', ico: '🗺', title: 'Explorador', desc: 'Garfe um lugar novo esta semana', goal: 1 },
  { id: 'c2', ico: '🔥', title: 'Dupla garfada', desc: 'Garfe 2 lugares novos esta semana', goal: 2 },
  { id: 'c3', ico: '⭐', title: 'Crítico', desc: 'Avalie 2 restaurantes', goal: 2 },
]

function getWeekStart() {
  const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate() - d.getDay()); return d
}

interface DestaqueSectionProps {
  onOpenModal: (r: Restaurant) => void
}

export function DestaqueSection({ onOpenModal }: DestaqueSectionProps) {
  const { restaurants, visits, visitDates, ratings, trending } = useApp()
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
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-serif text-lg font-semibold">Desafios da semana</h2>
          <span className="text-xs text-muted-foreground">{timeLeft} restantes</span>
        </div>
        <div className="flex flex-col gap-3">
          {CHALLENGES.map((c, i) => {
            const prog = Math.min(c.goal, challengeProgress[i])
            const done = prog >= c.goal
            const pct = Math.round(prog / c.goal * 100)
            return (
              <div key={c.id} className={`bg-card rounded-xl p-4 border ${done ? 'border-primary/40' : 'border-border'}`}>
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-2xl flex-shrink-0">{c.ico}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{c.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{c.desc}</p>
                  </div>
                  {done && <span className="text-xl">✅</span>}
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${done ? 100 : pct}%` }} />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1.5">
                  {done ? 'Concluído! 🎉' : `${prog} de ${c.goal}`}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Em alta */}
      {trendRests.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between px-4 mb-3">
            <h2 className="font-serif text-lg font-semibold">Em alta</h2>
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <div className="flex flex-col gap-2 px-4">
            {trendRests.slice(0, 3).map(({ r, cnt }, i) => (
              <button key={r.id} onClick={() => onOpenModal(r)}
                className="flex items-center gap-3 bg-card rounded-xl p-3 touch-manipulation active:opacity-80">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-sm flex-shrink-0">
                  {i + 1}
                </div>
                <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                  <RestaurantPoster restaurant={r} className="w-full h-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-serif text-sm font-semibold truncate">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{cnt} garfado{cnt !== 1 ? 's' : ''} esta semana</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sugestões */}
      {suggestions.length > 0 && (
        <div className="mb-6">
          <div className="px-4 mb-3">
            <h2 className="font-serif text-lg font-semibold">Sugestões para você</h2>
            <p className="text-xs text-muted-foreground">melhor avaliados que você não foi</p>
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
