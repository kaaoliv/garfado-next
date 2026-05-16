'use client'
import { useMemo } from 'react'
import { useApp } from '@/lib/context'
import { useI18n } from '@/lib/i18n'
import { Crown, Lock } from 'lucide-react'

interface StatsScreenProps {
  onUpgrade: () => void
  isPro: boolean
}

export function StatsScreen({ onUpgrade, isPro }: StatsScreenProps) {
  const { restaurants, visits, visitDates, ratings } = useApp()
  const { t } = useI18n()

  const stats = useMemo(() => {
    const visitedList = restaurants.filter(r => (visits[r.id] || 0) > 0)
    const totalVisits = Object.values(visits).reduce((a, b) => a + b, 0)

    const redeCounts: Record<string, number> = {}
    visitedList.forEach(r => {
      const rede = r.rede || 'Outro'
      redeCounts[rede] = (redeCounts[rede] || 0) + (visits[r.id] || 0)
    })
    const topRede = Object.entries(redeCounts).sort((a, b) => b[1] - a[1])[0]
    const topRestaurant = [...visitedList].sort((a, b) => (visits[b.id] || 0) - (visits[a.id] || 0))[0]

    const ratingVals = Object.values(ratings).map((r: any) => {
      const vals = [r?.Comida, r?.Atendimento, r?.Limpeza].filter(Boolean)
      return vals.length > 0 ? vals.reduce((a: number, b: number) => a + b, 0) / vals.length : null
    }).filter(Boolean) as number[]
    const avgRating = ratingVals.length > 0 ? (ratingVals.reduce((a, b) => a + b, 0) / ratingVals.length).toFixed(1) : null

    const months: Record<string, number> = {}
    Object.entries(visitDates).forEach(([id, date]) => {
      if (!date) return
      const key = new Date(date).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
      months[key] = (months[key] || 0) + (visits[Number(id)] || 1)
    })
    const monthsChart = Object.entries(months).slice(-6)
    const maxMonthVal = Math.max(...monthsChart.map(([, v]) => v), 1)

    const days: Record<number, number> = {}
    Object.entries(visitDates).forEach(([, date]) => {
      if (!date) return
      const day = new Date(date).getDay()
      days[day] = (days[day] || 0) + 1
    })
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    const topDay = Object.entries(days).sort((a, b) => b[1] - a[1])[0]

    const redeRatings: Record<string, number[]> = {}
    visitedList.forEach(r => {
      const rt = ratings[r.id] as any
      if (rt?.Comida) {
        const rede = r.rede || 'Outro'
        if (!redeRatings[rede]) redeRatings[rede] = []
        redeRatings[rede].push(rt.Comida)
      }
    })
    const redeAvgRatings = Object.entries(redeRatings).map(([rede, rs]) => ({
      rede, avg: rs.reduce((a, b) => a + b, 0) / rs.length,
    })).sort((a, b) => b.avg - a.avg)

    const regions = new Set(visitedList.map(r => {
      const parts = r.addr.split('-')
      return parts.length > 1 ? parts[parts.length - 2].trim() : r.addr.split(',')[0]
    }))

    const loyalCount = visitedList.filter(r => (visits[r.id] || 0) > 1).length
    const loyalPct = visitedList.length > 0 ? Math.round(loyalCount / visitedList.length * 100) : 0

    let profileTitle = '🍽 Garfador Casual'
    if (visitedList.length >= 20) profileTitle = '🔥 Garfador Assíduo'
    if (visitedList.length >= 50) profileTitle = '⭐ Expert Gastronômico'
    if (regions.size >= 10) profileTitle = '🗺 Explorador Urbano'
    if (loyalPct >= 60) profileTitle = '❤️ Fiel aos Favoritos'
    if (topRede && topRede[1] >= 5) profileTitle = `🏆 Hunter de ${topRede[0]}`

    return { visitedList, totalVisits, topRede, topRestaurant, avgRating, monthsChart, maxMonthVal, dayNames, topDay, redeAvgRatings, regions, loyalPct, profileTitle }
  }, [restaurants, visits, visitDates, ratings])

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide px-4 py-4 pb-8">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-serif text-lg font-bold">{t('stats.title')}</h2>
          <p className="text-xs text-muted-foreground">{t('stats.subtitle')}</p>
        </div>
        {isPro && (
          <div className="flex items-center gap-1 bg-primary/20 text-primary rounded-full px-3 py-1">
            <Crown className="w-3.5 h-3.5" />
            <span className="text-xs font-bold">PRO</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-card rounded-2xl p-4 border border-border">
          <p className="text-3xl font-bold text-primary font-serif">{stats.visitedList.length}</p>
          <p className="text-xs text-muted-foreground mt-1">{t('stats.places_visited')}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border">
          <p className="text-3xl font-bold text-primary font-serif">{stats.totalVisits}</p>
          <p className="text-xs text-muted-foreground mt-1">{t('stats.total_visits')}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border">
          <p className="text-3xl font-bold text-primary font-serif">{stats.avgRating || '—'}</p>
          <p className="text-xs text-muted-foreground mt-1">{t('stats.avg_rating')}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border">
          <p className="text-3xl font-bold text-primary font-serif">{stats.topRede ? stats.topRede[1] : '—'}</p>
          <p className="text-xs text-muted-foreground mt-1">{stats.topRede ? stats.topRede[0] : t('stats.fav_cuisine')}</p>
        </div>
      </div>

      {!isPro ? (
        <button onClick={onUpgrade} className="w-full bg-card rounded-2xl border border-border overflow-hidden touch-manipulation">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Lock className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm font-medium text-muted-foreground">{t('stats.pro_locked')}</p>
            </div>
            <div className="relative">
              <div className="flex flex-col gap-3 blur-sm pointer-events-none select-none">
                <div className="h-24 bg-secondary rounded-xl" />
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-16 bg-secondary rounded-xl" />
                  <div className="h-16 bg-secondary rounded-xl" />
                </div>
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <div className="bg-primary rounded-2xl px-4 py-2.5 flex items-center gap-2">
                  <Crown className="w-4 h-4 text-primary-foreground" />
                  <span className="text-sm font-bold text-primary-foreground">{t('stats.unlock_pro')}</span>
                </div>
                <p className="text-xs text-muted-foreground">R$ 19,90/mês</p>
              </div>
            </div>
          </div>
        </button>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="bg-card rounded-2xl p-4 border border-border">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">{t('stats.taste_profile')}</p>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-2xl flex-shrink-0">
                {stats.profileTitle.split(' ')[0]}
              </div>
              <div>
                <p className="font-serif text-base font-bold">{stats.profileTitle.split(' ').slice(1).join(' ')}</p>
                <p className="text-xs text-muted-foreground">{stats.visitedList.length} lugares · {stats.regions.size} regiões</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-secondary rounded-xl p-3">
                <p className="text-xs text-muted-foreground">{t('stats.loyalty')}</p>
                <p className="text-lg font-bold text-primary">{stats.loyalPct}%</p>
                <p className="text-xs text-muted-foreground">{t('stats.loyalty_desc')}</p>
              </div>
              <div className="bg-secondary rounded-xl p-3">
                <p className="text-xs text-muted-foreground">{t('stats.explorer')}</p>
                <p className="text-lg font-bold text-primary">{stats.regions.size}</p>
                <p className="text-xs text-muted-foreground">{t('stats.regions')}</p>
              </div>
            </div>
            {stats.redeAvgRatings.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-muted-foreground mb-2">{t('stats.best_cuisine')}</p>
                {stats.redeAvgRatings.slice(0, 3).map(({ rede, avg }) => (
                  <div key={rede} className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs w-24 truncate text-foreground">{rede}</span>
                    <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${(avg / 5) * 100}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground">★ {avg.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {stats.monthsChart.length > 0 && (
            <div className="bg-card rounded-2xl p-4 border border-border">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-4">{t('stats.visits_by_month')}</p>
              <div className="flex items-end gap-2 h-20">
                {stats.monthsChart.map(([month, val]) => (
                  <div key={month} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full rounded-t-md bg-primary transition-all" style={{ height: `${(val / stats.maxMonthVal) * 100}%`, minHeight: '4px', opacity: 0.8 }} />
                    <span className="text-[9px] text-muted-foreground">{month}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stats.topRestaurant && (
            <div className="bg-card rounded-2xl p-4 border border-border">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">{t('stats.most_visited')}</p>
              <div className="flex items-center gap-3">
                <span className="text-3xl">🏆</span>
                <div>
                  <p className="font-serif text-base font-bold">{stats.topRestaurant.name}</p>
                  <p className="text-xs text-muted-foreground">{visits[stats.topRestaurant.id]}x {t('stats.visits_label')}</p>
                </div>
              </div>
            </div>
          )}

          {stats.topDay && (
            <div className="bg-card rounded-2xl p-4 border border-border">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">{t('stats.fav_day')}</p>
              <div className="flex gap-1.5">
                {[0,1,2,3,4,5,6].map(day => (
                  <div key={day} className={`flex-1 rounded-lg py-2 text-center text-[10px] font-medium ${Number(stats.topDay![0]) === day ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                    {stats.dayNames[day]}
                  </div>
                ))}
              </div>
            </div>
          )}

          {stats.topRede && (
            <div className="bg-card rounded-2xl p-4 border border-border">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">{t('stats.fav_cuisine')}</p>
              <div className="flex flex-col gap-2">
                {Object.entries(
                  stats.visitedList.reduce((acc, r) => {
                    const k = r.rede || 'Outro'
                    acc[k] = (acc[k] || 0) + (visits[r.id] || 0)
                    return acc
                  }, {} as Record<string, number>)
                ).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([rede, count]) => (
                  <div key={rede} className="flex items-center gap-2">
                    <span className="text-xs w-20 truncate text-foreground">{rede}</span>
                    <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${(count / stats.topRede![1]) * 100}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground w-6 text-right">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>

    </div>
    </div>
  )
}