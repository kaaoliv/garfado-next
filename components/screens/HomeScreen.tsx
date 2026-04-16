'use client'
import { useState, useCallback, useRef, useEffect } from 'react'
import { Search, ArrowUpDown, X } from 'lucide-react'
import { useApp } from '@/lib/context'
import { RestaurantPoster } from '@/components/shared/RestaurantPoster'
import { ForkIcon } from '@/components/shared/ForkIcon'
import type { Restaurant } from '@/lib/types'

const CUISINE_FILTERS = ['Todos', 'Fast Food', 'Italiana', 'Japonesa', 'Brasileira', 'Bar', 'Pizza']
const SORT_OPTIONS = [
  { value: 'recente', label: 'Mais recentes' },
  { value: 'mais', label: 'Mais visitados' },
  { value: 'az', label: 'A-Z' },
]
const FILTER_MAP: Record<string, string[]> = {
  'Fast Food': ["mcdonald's", 'burger king', 'kfc', 'subway', "bob's"],
  'Italiana': ['pizzaria', 'italiano'],
  'Japonesa': ['japones', 'sushi', 'temaki'],
  'Brasileira': ['brasileiro', 'churrasco', 'boteco'],
  'Bar': ['bar', 'boteco'],
  'Pizza': ['pizzaria', 'pizza'],
}

interface HomeScreenProps {
  onOpenModal: (r: Restaurant) => void
}

export function HomeScreen({ onOpenModal }: HomeScreenProps) {
  const { restaurants, visits, friendVisits, searchResults, searchPlaces, clearSearch, addFromPlaces } = useApp()
  const [filter, setFilter] = useState('Todos')
  const [sort, setSort] = useState('recente')
  const [showSort, setShowSort] = useState(false)
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  // Swipe detection para carrossel
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const isDragging = useRef(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSearch = useCallback((q: string) => {
    setQuery(q)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (q.length < 3) { clearSearch(); return }
    // Só chama Google Places após 600ms sem digitar
    debounceRef.current = setTimeout(async () => {
      const local = restaurants.filter(r =>
        r.name.toLowerCase().includes(q.toLowerCase()) ||
        r.addr.toLowerCase().includes(q.toLowerCase())
      )
      // Só busca no Google se tiver menos de 3 resultados locais
      if (local.length < 3) {
        setSearching(true)
        await searchPlaces(q)
        setSearching(false)
      }
    }, 600)
  }, [searchPlaces, clearSearch, restaurants])

  const handleAddPlace = async (place: typeof searchResults[0]) => {
    const rid = await addFromPlaces(place)
    if (rid) {
      setQuery('')
      clearSearch()
      const r = restaurants.find(x => x.id === rid)
      if (r) onOpenModal(r)
    }
  }

  // Restaurantes visitados
  const visited = restaurants.filter(r => (visits[r.id] || 0) > 0).filter(r => {
    if (filter === 'Todos') return true
    const keys = FILTER_MAP[filter] || []
    const rk = r.rede.toLowerCase()
    return keys.some(k => rk.includes(k)) || r.name.toLowerCase().includes(filter.toLowerCase())
  }).sort((a, b) => {
    if (sort === 'mais') return (visits[b.id] || 0) - (visits[a.id] || 0)
    if (sort === 'az') return a.name.localeCompare(b.name)
    return 0
  })

  // Friend strip — restaurantes que amigos foram mas eu não fui ainda
  const friendStrip = restaurants.filter(r => {
    const fw = friendVisits[r.id] || []
    return fw.length > 0 && !(visits[r.id] || 0)
  }).slice(0, 10)

  // Busca local
  const localResults = query.length > 0
    ? restaurants.filter(r => r.name.toLowerCase().includes(query.toLowerCase()) || r.addr.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : []

  const showingSearch = query.length > 0

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Scroll area */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">

        {/* Search */}
        <div className="px-4 pb-3 pt-1">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Buscar ou adicionar restaurante..."
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
                <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Seus restaurantes</p>
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

            {(searchResults.length > 0 || searching) && (
              <div>
                <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">
                  {searching ? 'Buscando no Google...' : 'Adicionar pelo Google'}
                </p>
                {searchResults.map((p, i) => (
                  <button key={i} onClick={() => handleAddPlace(p)}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-secondary text-left w-full touch-manipulation">
                    {p.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.photo} alt={p.name} className="w-10 h-14 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-14 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 text-xl">🍽</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{p.addr}</p>
                      {p.rating && <p className="text-xs text-[#FFC72C]">★ {p.rating}</p>}
                    </div>
                    <span className="text-2xl text-primary font-light flex-shrink-0">+</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {!showingSearch && (
          <>
            {/* Amigos foram aqui */}
            {friendStrip.length > 0 && (
              <div className="mb-6">
                <h2 className="font-serif text-lg font-semibold px-4 mb-3">Amigos foram aqui</h2>
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-0 px-4 scrollbar-hide">
                  {friendStrip.map(r => {
                    const fw = friendVisits[r.id] || []
                    const f = fw[0]
                    return (
                      <button key={r.id}
                        onTouchStart={e => { touchStartX.current = e.touches[0].clientX; touchStartY.current = e.touches[0].clientY; isDragging.current = false }}
                        onTouchMove={e => { if (Math.abs(e.touches[0].clientX - touchStartX.current) > 8) isDragging.current = true }}
                        onTouchEnd={() => { if (!isDragging.current) onOpenModal(r) }}
                        onClick={() => { if (!isDragging.current) onOpenModal(r) }}
                        className="relative w-28 shrink-0 rounded-xl overflow-hidden touch-manipulation"
                        style={{ aspectRatio: '3/4' }}>
                        <RestaurantPoster restaurant={r} className="w-full h-full" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        {f?.avatar && (
                          <div className="absolute top-2 left-2 w-7 h-7 rounded-full overflow-hidden outline-2 outline-primary outline">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={f.avatar} alt={f.name} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 p-2">
                          <h3 className="font-serif text-xs font-semibold text-white leading-tight truncate">{r.name}</h3>
                          {f && <p className="text-[10px] text-primary mt-0.5">{f.name.split(' ')[0]}</p>}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Visitados header */}
            <div className="flex items-center justify-between px-4 mb-3">
              <h2 className="font-serif text-lg font-semibold">Visitados</h2>
              <div className="relative">
                <button onClick={() => setShowSort(!showSort)}
                  aria-label={`Ordenar por: ${SORT_OPTIONS.find(s => s.value === sort)?.label}`}
                  aria-expanded={showSort}
                  className="flex items-center gap-1 text-sm text-muted-foreground touch-manipulation">
                  <ArrowUpDown className="w-4 h-4" />
                  <span>{SORT_OPTIONS.find(s => s.value === sort)?.label}</span>
                </button>
                {showSort && (
                  <div className="absolute top-full right-0 mt-2 bg-card rounded-xl border border-border p-1 z-10 min-w-[140px] shadow-lg">
                    {SORT_OPTIONS.map(opt => (
                      <button key={opt.value} onClick={() => { setSort(opt.value); setShowSort(false) }}
                        className={`w-full text-left px-3 py-2 text-sm rounded-lg touch-manipulation ${sort === opt.value ? 'bg-primary/20 text-primary' : 'text-foreground'}`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Cuisine filters */}
            <div className="flex gap-2 overflow-x-auto pb-3 px-4 scrollbar-hide mb-3">
              {CUISINE_FILTERS.map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  aria-pressed={filter === f}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors touch-manipulation ${
                    filter === f ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground'
                  }`}>
                  {f}
                </button>
              ))}
            </div>

            {/* Grid */}
            {visited.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-8 text-center gap-4">
                <ForkIcon className="w-12 h-16 text-muted-foreground/30" />
                <div>
                  <p className="font-serif text-lg font-semibold text-foreground mb-1">Nenhum lugar garfado ainda</p>
                  <p className="text-sm text-muted-foreground">Use a busca acima para adicionar seu primeiro restaurante</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 px-4 pb-6">
                {visited.map(r => (
                  <button key={r.id} onClick={() => onOpenModal(r)}
                    className="relative rounded-xl overflow-hidden aspect-square touch-manipulation active:opacity-80">
                    <RestaurantPoster restaurant={r} className="w-full h-full" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <ForkIcon className="w-2.5 h-2.5 text-primary-foreground" />
                    </div>
                    {(visits[r.id] || 0) > 1 && (
                      <div className="absolute bottom-6 right-1.5 bg-black/70 text-[#FFC72C] text-[8px] px-1.5 py-0.5 rounded-full">
                        {visits[r.id]}x
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 p-2">
                      <h3 className="font-serif text-[11px] font-semibold text-white leading-tight truncate">{r.name}</h3>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
