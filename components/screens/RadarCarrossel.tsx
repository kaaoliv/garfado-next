'use client'
import { useState, useEffect, useRef } from 'react'
import { RestaurantPoster } from '@/components/shared/RestaurantPoster'
import { MapPin, ChevronRight, X } from 'lucide-react'
import type { Restaurant } from '@/lib/types'

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

interface RadarCarrosselProps {
  onOpenModal: (r: Restaurant) => void
  restaurants: Restaurant[]
  visits: Record<number, number>
  friendVisits: Record<number, { name: string; avatar: string | null; count: number }[]>
  t: (key: string) => string
}

export function RadarCarrossel({ onOpenModal, restaurants, visits, friendVisits, t }: RadarCarrosselProps) {
  const [expanded, setExpanded] = useState(false)
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [geoCache, setGeoCache] = useState<Record<number, { lat: number; lng: number }>>({})
  const touchStartX = useRef(0)
  const isDragging = useRef(false)

  useEffect(() => {
    try {
      const cached = JSON.parse(localStorage.getItem('garfado_geocache_v2') || '{}')
      const coords: Record<number, { lat: number; lng: number }> = {}
      Object.entries(cached).forEach(([id, val]: any) => {
        coords[Number(id)] = { lat: val.lat, lng: val.lng }
      })
      setGeoCache(coords)
    } catch {}
    navigator.geolocation?.getCurrentPosition(
      pos => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    )
  }, [])

  const radarList = restaurants
    .filter(r => {
      const fw = friendVisits[r.id] || []
      return fw.length > 0 && !(visits[r.id] || 0)
    })
    .map(r => {
      const fw = friendVisits[r.id] || []
      const coords = geoCache[r.id]
      const distanceKm = (userCoords && coords)
        ? haversine(userCoords.lat, userCoords.lng, coords.lat, coords.lng)
        : null
      return { ...r, friendsWhoWent: fw, distanceKm }
    })
    .sort((a, b) => {
      if (a.distanceKm === null && b.distanceKm === null) return b.friendsWhoWent.length - a.friendsWhoWent.length
      if (a.distanceKm === null) return 1
      if (b.distanceKm === null) return -1
      return a.distanceKm - b.distanceKm
    })

  if (radarList.length === 0) return null

  const formatDist = (km: number | null) => {
    if (km === null) return null
    if (km < 1) return `${Math.round(km * 1000)}m`
    return `${km.toFixed(1)}km`
  }

  return (
    <div className="mb-6">
      {/* Header */}
      <div className="flex items-center justify-between px-4 mb-3">
        <div className="flex items-center gap-2">
          <h2 className="font-serif text-base font-semibold">{t('radar.friends_visited')}</h2>
          <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
            {radarList.length}
          </span>
        </div>
        <button
          onClick={() => setExpanded(true)}
          className="flex items-center gap-1 text-xs text-primary touch-manipulation"
        >
          {t('radar.see_all')} ({radarList.length})
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Carrossel compacto */}
      {!expanded && (
        <div className="flex gap-3 overflow-x-auto pb-2 px-4 scrollbar-hide">
          {radarList.slice(0, 10).map(r => (
            <button key={r.id}
              onTouchStart={e => { touchStartX.current = e.touches[0].clientX; isDragging.current = false }}
              onTouchMove={e => { if (Math.abs(e.touches[0].clientX - touchStartX.current) > 8) isDragging.current = true }}
              onTouchEnd={() => { if (!isDragging.current) { const { friendsWhoWent, distanceKm, ...rest } = r; onOpenModal(rest as any) } }}
              onClick={() => { if (!isDragging.current) { const { friendsWhoWent, distanceKm, ...rest } = r; onOpenModal(rest as any) } }}
              className="relative w-24 shrink-0 rounded-xl overflow-hidden touch-manipulation"
              style={{ aspectRatio: '3/4' }}
            >
              <RestaurantPoster restaurant={r} className="w-full h-full" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

              {/* Avatares dos amigos */}
              <div className="absolute top-2 left-1.5 flex -space-x-1.5">
                {r.friendsWhoWent.slice(0, 2).map((f, i) => (
                  <div key={i} className="w-5 h-5 rounded-full border border-card overflow-hidden bg-primary flex items-center justify-center flex-shrink-0">
                    {f.avatar
                      ? <img src={f.avatar} alt={f.name} className="w-full h-full object-cover" />
                      : <span className="text-[8px] font-bold text-primary-foreground">{f.name.charAt(0)}</span>
                    }
                  </div>
                ))}
              </div>

              {/* Distância */}
              {r.distanceKm !== null && (
                <div className="absolute top-1.5 right-1.5 bg-black/70 rounded-full px-1.5 py-0.5 flex items-center gap-0.5">
                  <MapPin className="w-2 h-2 text-primary" />
                  <span className="text-[9px] text-primary font-medium">{formatDist(r.distanceKm)}</span>
                </div>
              )}

              <div className="absolute bottom-0 left-0 right-0 p-2">
                <h3 className="font-serif text-[10px] font-semibold text-white leading-tight truncate">{r.name}</h3>
                <p className="text-[9px] text-primary mt-0.5">
                  {r.friendsWhoWent[0]?.name.split(' ')[0]}
                  {r.friendsWhoWent.length > 1 && ` +${r.friendsWhoWent.length - 1}`}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Modal fullscreen */}
      {expanded && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-4 border-b border-border flex-shrink-0">
            <button onClick={() => setExpanded(false)}
              className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center touch-manipulation">
              <X className="w-5 h-5" />
            </button>
            <div>
              <h2 className="font-serif text-base font-bold">{t('radar.friends_visited')}</h2>
              <p className="text-xs text-muted-foreground">{radarList.length} {t('radar.places')}</p>
            </div>
          </div>
          {/* Lista */}
          <div className="flex-1 overflow-y-auto scrollbar-hide px-4 py-3 flex flex-col gap-3">
            {radarList.map(r => (
              <button key={r.id} onClick={() => { setExpanded(false); const { friendsWhoWent, distanceKm, ...rest } = r; onOpenModal(rest as any) }}
                className="w-full flex items-start gap-3 bg-card rounded-2xl p-3 border border-border touch-manipulation active:opacity-80 text-left">
                <div className="w-14 rounded-xl overflow-hidden flex-shrink-0" style={{ height: '72px' }}>
                  <RestaurantPoster restaurant={r} className="w-full h-full" />
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-serif text-sm font-bold leading-tight">{r.name}</p>
                    {r.distanceKm !== null && (
                      <div className="flex items-center gap-1 bg-primary/10 text-primary rounded-full px-2 py-0.5 flex-shrink-0">
                        <MapPin className="w-2.5 h-2.5" />
                        <span className="text-[10px] font-medium">{formatDist(r.distanceKm)}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{r.addr}</p>
                  {r.rating && <p className="text-xs text-[#FFC72C] mt-0.5">★ {r.rating}</p>}
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <div className="flex -space-x-1.5">
                      {r.friendsWhoWent.slice(0, 3).map((f, i) => (
                        <div key={i} className="w-5 h-5 rounded-full border-2 border-card overflow-hidden bg-primary flex items-center justify-center flex-shrink-0">
                          {f.avatar
                            ? <img src={f.avatar} alt={f.name} className="w-full h-full object-cover" />
                            : <span className="text-[8px] font-bold text-primary-foreground">{f.name.charAt(0)}</span>
                          }
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {r.friendsWhoWent.slice(0, 2).map(f => f.name.split(' ')[0]).join(', ')}
                      {r.friendsWhoWent.length > 2 && ` +${r.friendsWhoWent.length - 2}`}
                      {' '}{r.friendsWhoWent.length === 1 ? t('radar.friend_went') : t('radar.friends_went')}
                    </p>
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