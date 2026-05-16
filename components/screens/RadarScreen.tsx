'use client'
import { useState, useEffect, useRef } from 'react'
import { useApp } from '@/lib/context'
import { useI18n } from '@/lib/i18n'
import { RestaurantPoster } from '@/components/shared/RestaurantPoster'
import { Navigation, MapPin, Users } from 'lucide-react'
import type { Restaurant } from '@/lib/types'

interface RadarScreenProps {
  onOpenModal: (r: Restaurant) => void
}

interface RadarRestaurant extends Restaurant {
  friendsWhoWent: { name: string; avatar: string | null; count: number }[]
  distanceKm: number | null
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function RadarScreen({ onOpenModal }: RadarScreenProps) {
  const { restaurants, visits, friendVisits } = useApp()
  const { t } = useI18n()
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [locLoading, setLocLoading] = useState(true)
  const [filter, setFilter] = useState<'distancia' | 'amigos'>('distancia')

  // Ler cache de geocoding do mapa
  const [geoCache, setGeoCache] = useState<Record<number, { lat: number; lng: number }>>({})

  useEffect(() => {
    try {
      const cached = JSON.parse(localStorage.getItem('garfado_geocache_v2') || '{}')
      const coords: Record<number, { lat: number; lng: number }> = {}
      Object.entries(cached).forEach(([id, val]: any) => {
        coords[Number(id)] = { lat: val.lat, lng: val.lng }
      })
      setGeoCache(coords)
    } catch {}
  }, [])

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      pos => { setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocLoading(false) },
      () => setLocLoading(false)
    )
  }, [])

  // Restaurantes que amigos foram mas eu nunca fui
  const radarList: RadarRestaurant[] = restaurants
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
      if (filter === 'distancia') {
        if (a.distanceKm === null && b.distanceKm === null) return 0
        if (a.distanceKm === null) return 1
        if (b.distanceKm === null) return -1
        return a.distanceKm - b.distanceKm
      }
      return b.friendsWhoWent.length - a.friendsWhoWent.length
    })

  const formatDist = (km: number | null) => {
    if (km === null) return null
    if (km < 1) return `${Math.round(km * 1000)}m`
    return `${km.toFixed(1)}km`
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* Filtros */}
      <div className="flex gap-2 px-4 pt-1 pb-3 flex-shrink-0">
        <button onClick={() => setFilter('distancia')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors touch-manipulation ${
            filter === 'distancia' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
          }`}>
          <Navigation className="w-3 h-3" />
          {t('radar.by_distance')}
        </button>
        <button onClick={() => setFilter('amigos')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors touch-manipulation ${
            filter === 'amigos' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
          }`}>
          <Users className="w-3 h-3" />
          {t('radar.by_friends')}
        </button>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pb-6">
        {radarList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
            <span className="text-5xl">📡</span>
            <p className="font-serif text-base font-semibold">{t('radar.empty_title')}</p>
            <p className="text-sm text-muted-foreground">{t('radar.empty_sub')}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {radarList.map(r => (
              <button key={r.id} onClick={() => onOpenModal(r)}
                className="w-full flex items-start gap-3 bg-card rounded-2xl p-3 border border-border touch-manipulation active:opacity-80 text-left">

                {/* Poster */}
                <div className="w-16 h-22 rounded-xl overflow-hidden flex-shrink-0" style={{ height: '88px' }}>
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

                  {/* Amigos que foram */}
                  <div className="flex items-center gap-1.5 mt-2">
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
        )}
      </div>
    </div>
  )
}
