'use client'
import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { Search, X } from 'lucide-react'
import { useApp } from '@/lib/context'
import { RestaurantPoster } from '@/components/shared/RestaurantPoster'
import { ForkIcon } from '@/components/shared/ForkIcon'
import type { Restaurant } from '@/lib/types'
import { DestaqueSection } from './DestaqueSection'
import { RadarCarrossel } from './RadarCarrossel'
import { useI18n } from '@/lib/i18n'

interface HomeScreenProps {
  onOpenModal: (r: Restaurant) => void
}

export function HomeScreen({ onOpenModal }: HomeScreenProps) {
  const { restaurants, visits, ratings, friendVisits, searchResults, searchPlaces, clearSearch, addFromPlaces } = useApp()
  const { t } = useI18n()
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const isDragging = useRef(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    )
  }, [])

  const handleSearch = useCallback((q: string) => {
    setQuery(q)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (q.length < 4) { clearSearch(); return }
    debounceRef.current = setTimeout(async () => {
      const local = restaurants.filter(r =>
        r.name.toLowerCase().includes(q.toLowerCase()) ||
        r.addr.toLowerCase().includes(q.toLowerCase())
      )
      if (local.length < 3) {
        setSearching(true)
        await searchPlaces(q, userCoords || undefined)
        setSearching(false)
      }
    }, 1200)
  }, [searchPlaces, clearSearch, restaurants, userCoords])

  const handleManualAdd = async (name: string) => {
    const tempId = Date.now()
    const tempR = { id: tempId, name, addr: 'Endereço não informado', rede: 'Outro', rating: null, img: null, hours: '–', place_id: null }
    const { data: ins } = await import('@/lib/supabase').then(m =>
      m.supabase.from('restaurants').insert({ name, addr: 'Endereço não informado', rede: 'Outro', hours: '–' }).select().single()
    )
    setQuery(''); clearSearch()
    onOpenModal(ins || tempR as any)
  }

  const handleAddPlace = async (place: typeof searchResults[0]) => {
    try {
      setSearching(true)
      const rid = await addFromPlaces(place)
      setSearching(false)
      if (rid) {
        setQuery(''); clearSearch()
        const r = restaurants.find(x => x.id === rid) || {
          id: rid, name: place.name, addr: place.addr,
          rede: 'Outro', rating: place.rating, img: place.photo,
          hours: '–', place_id: place.placeId || null
        }
        setTimeout(() => onOpenModal(r as any), 50)
      }
    } catch (e) {
      setSearching(false)
      const fallback = { id: Date.now(), name: place.name, addr: place.addr, rede: 'Outro', rating: place.rating, img: place.photo, hours: '–', place_id: place.placeId || null }
      setQuery(''); clearSearch()
      setTimeout(() => onOpenModal(fallback as any), 50)
    }
  }

  // Últimas 6 garfadas
  const recentVisited = restaurants
    .filter(r => (visits[r.id] || 0) > 0)
    .slice(0, 6)

  // Recomendações personalizadas — restaurantes não visitados similares aos favoritos
  const recommendations = useMemo(() => {
    const visited = restaurants.filter(r => (visits[r.id] || 0) > 0)
    if (visited.length < 2) return []
    
    // Calcular culinárias favoritas (mais visitadas com nota alta)
    const redeCounts: Record<string, number> = {}
    visited.forEach(r => {
      const score = (visits[r.id] || 0) + (ratings[r.id] || 0)
      redeCounts[r.rede] = (redeCounts[r.rede] || 0) + score
    })
    const topRedes = Object.entries(redeCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([r]) => r)
    
    // Restaurantes não visitados das culinárias favoritas
    return restaurants
      .filter(r => !(visits[r.id] || 0) && topRedes.includes(r.rede))
      .slice(0, 6)
  }, [restaurants, visits, ratings])

  const localResults = query.length > 0
    ? restaurants.filter(r => r.name.toLowerCase().includes(query.toLowerCase()) || r.addr.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : []

  const showingSearch = query.length > 0

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto scrollbar-hide">

        {/* Search */}
        <div className="px-4 pb-3 pt-1">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={e => handleSearch(e.target.value)}
              placeholder={t('home.search')}
              className="w-full bg-card rounded-xl py-3 pl-11 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 border-none"
            />
            {query && (
              <button onClick={() => { setQuery(''); clearSearch() }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Search results */}
        {showingSearch && (
          <div className="px-4 pb-4">
            {localResults.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">{t('home.your_restaurants')}</p>
                <div className="flex flex-col gap-1">
                  {localResults.map(r => (
                    <button key={r.id} onClick={() => onOpenModal(r)}
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-secondary text-left w-full touch-manipulation">
                      <div className="w-10 h-14 rounded-lg overflow-hidden flex-shrink-0">
                        <RestaurantPoster restaurant={r} className="w-full h-full" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{r.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{r.addr}</p>
                        {r.rating && <p className="text-xs text-[#FFC72C]">★ {r.rating}</p>}
                      </div>
                      {(visits[r.id] || 0) > 0 && (
                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                          <ForkIcon className="w-3 h-3 text-primary-foreground" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {(searchResults.length > 0 || searching || (query.length >= 4 && !searching)) && (
              <div>
                <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide flex items-center gap-1.5">
                  {searching ? t('home.searching') : userCoords ? t('home.near_you') : t('home.add_google')}
                </p>
                {searchResults.length === 0 && !searching && query.length >= 4 && (
                  <button onClick={() => handleManualAdd(query)}
                    className="flex items-center gap-3 p-2 rounded-xl bg-secondary/50 w-full text-left touch-manipulation mb-2 border border-dashed border-border">
                    <div className="w-10 h-14 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 text-xl">➕</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{t('home.add_manual')}: "{query}"</p>
                      <p className="text-xs text-muted-foreground">{t('home.not_found')}</p>
                    </div>
                  </button>
                )}
                {searchResults.map((p, i) => (
                  <button key={i} onClick={() => handleAddPlace(p)}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-secondary text-left w-full touch-manipulation">
                    {p.photo
                      ? <img src={p.photo} alt={p.name} className="w-10 h-14 rounded-lg object-cover flex-shrink-0" />
                      : <div className="w-10 h-14 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 text-xl">🍽</div>
                    }
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{p.addr}</p>
                      {p.rating && <p className="text-xs text-[#FFC72C]">★ {p.rating}</p>}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 text-primary-foreground font-bold text-lg">+</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {!showingSearch && (
          <>
            {/* 📡 Radar — carrossel colapsável */}
            <RadarCarrossel onOpenModal={onOpenModal} restaurants={restaurants} visits={visits} friendVisits={friendVisits} t={t} />

            {/* Últimas garfadas — carrossel horizontal */}
            {recentVisited.length > 0 && (
              <div className="mb-6">
                <h2 className="font-serif text-base font-semibold px-4 mb-3">{t('home.recent_title')}</h2>
                <div className="flex gap-3 overflow-x-auto pb-2 px-4 scrollbar-hide">
                  {recentVisited.map(r => (
                    <button key={r.id}
                      onTouchStart={e => { touchStartX.current = e.touches[0].clientX; touchStartY.current = e.touches[0].clientY; isDragging.current = false }}
                      onTouchMove={e => { if (Math.abs(e.touches[0].clientX - touchStartX.current) > 8) isDragging.current = true }}
                      onTouchEnd={() => { if (!isDragging.current) onOpenModal(r) }}
                      onClick={() => { if (!isDragging.current) onOpenModal(r) }}
                      className="relative w-24 shrink-0 rounded-xl overflow-hidden touch-manipulation"
                      style={{ aspectRatio: '3/4' }}>
                      <RestaurantPoster restaurant={r} className="w-full h-full" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <ForkIcon className="w-2.5 h-2.5 text-primary-foreground" />
                      </div>

                      <div className="absolute bottom-0 left-0 right-0 p-2">
                        <h3 className="font-serif text-[10px] font-semibold text-white leading-tight truncate">{r.name}</h3>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {recentVisited.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 px-8 text-center gap-4">
                <ForkIcon className="w-12 h-16 text-muted-foreground/30" />
                <div>
                  <p className="font-serif text-lg font-semibold text-foreground mb-1">{t('home.empty')}</p>
                  <p className="text-sm text-muted-foreground">{t('home.empty_sub')}</p>
                </div>
              </div>
            )}

            {/* Destaques */}
            <DestaqueSection onOpenModal={onOpenModal} />
          </>
        )}
      </div>
    </div>
  )
}
