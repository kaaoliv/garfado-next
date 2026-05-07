'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useApp } from '@/lib/context'
import type { Restaurant } from '@/lib/types'
import { X, Navigation } from 'lucide-react'
import { ForkIcon } from '@/components/shared/ForkIcon'
import { RestaurantPoster } from '@/components/shared/RestaurantPoster'

interface MapaScreenProps {
  onOpenModal: (r: Restaurant) => void
}

async function geocodeAddress(addr: string, name: string): Promise<[number, number] | null> {
  try {
    const q = encodeURIComponent(`${addr}, Brasil`)
    const resp = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&countrycodes=br`,
      { headers: { 'Accept-Language': 'pt-BR', 'User-Agent': 'GarfadoApp/1.0' } }
    )
    const data = await resp.json()
    if (data?.[0]) return [parseFloat(data[0].lat), parseFloat(data[0].lon)]
    const q2 = encodeURIComponent(`${name}, ${addr.split(',').slice(-2).join(',')}, Brasil`)
    const resp2 = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${q2}&format=json&limit=1&countrycodes=br`,
      { headers: { 'Accept-Language': 'pt-BR', 'User-Agent': 'GarfadoApp/1.0' } }
    )
    const data2 = await resp2.json()
    if (data2?.[0]) return [parseFloat(data2[0].lat), parseFloat(data2[0].lon)]
  } catch {}
  return null
}

interface PinRestaurant extends Restaurant {
  lat: number
  lng: number
  visited: boolean
  visits: number
}

export function MapaScreen({ onOpenModal }: MapaScreenProps) {
  const { restaurants, visits, friendVisits } = useApp()
  const mapRef = useRef<any>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)

  const [coords, setCoords] = useState<Record<number, { lat: number; lng: number }>>({})
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [selected, setSelected] = useState<PinRestaurant | null>(null)
  const [filter, setFilter] = useState<'todos' | 'visitados' | 'nao-visitados'>('todos')
  const [mapReady, setMapReady] = useState(false)

  const pins: PinRestaurant[] = restaurants
    .filter(r => coords[r.id])
    .map(r => ({
      ...r,
      lat: coords[r.id].lat,
      lng: coords[r.id].lng,
      visited: (visits[r.id] || 0) > 0,
      visits: visits[r.id] || 0,
    }))

  useEffect(() => {
    const loadCoords = async () => {
      const CACHE_KEY = 'garfado_geocache_v2'
      const cached: Record<number, { lat: number; lng: number; ts: number }> =
        JSON.parse(localStorage.getItem(CACHE_KEY) || '{}')
      const CACHE_TTL = 30 * 24 * 60 * 60 * 1000
      const now = Date.now()
      const targets = restaurants.filter(r => r.addr && r.addr !== 'Endereço não informado')
      const newCoords: Record<number, { lat: number; lng: number }> = {}
      const toGeocode: typeof targets = []

      for (const r of targets) {
        const c = cached[r.id]
        if (c && (now - c.ts) < CACHE_TTL) {
          newCoords[r.id] = { lat: c.lat, lng: c.lng }
        } else {
          toGeocode.push(r)
        }
      }

      setCoords({ ...newCoords })
      if (toGeocode.length === 0) { setLoading(false); return }

      setProgress({ done: 0, total: toGeocode.length })
      for (let i = 0; i < toGeocode.length; i++) {
        const r = toGeocode[i]
        if (i > 0) await new Promise(res => setTimeout(res, 1100))
        const result = await geocodeAddress(r.addr, r.name)
        if (result) {
          cached[r.id] = { lat: result[0], lng: result[1], ts: now }
          newCoords[r.id] = { lat: result[0], lng: result[1] }
          setCoords(prev => ({ ...prev, [r.id]: { lat: result[0], lng: result[1] } }))
        }
        setProgress({ done: i + 1, total: toGeocode.length })
      }
      localStorage.setItem(CACHE_KEY, JSON.stringify(cached))
      setLoading(false)
    }
    loadCoords()
  }, [restaurants])

  useEffect(() => {
    if (loading || !mapContainerRef.current || mapReady) return
    const initMap = async () => {
      const L = (await import('leaflet')).default
      await import('leaflet/dist/leaflet.css')
      if (mapRef.current) return

      const map = L.map(mapContainerRef.current!, {
        center: [-23.5505, -46.6333] as [number, number],
        zoom: 12,
        zoomControl: false,
        attributionControl: false, // removemos o attribution nativo
      })

      // Tile escuro estilo Carto — combina com o dark mode do app
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map)

      mapRef.current = map
      setMapReady(true)
    }
    initMap()
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        setMapReady(false)
      }
    }
  }, [loading])

  useEffect(() => {
    if (!mapReady || !mapRef.current) return
    const addPins = async () => {
      const L = (await import('leaflet')).default
      const map = mapRef.current

      map.eachLayer((layer: any) => {
        if (layer instanceof L.Marker) map.removeLayer(layer)
      })

      const filtered = pins.filter(p => {
        if (filter === 'visitados') return p.visited
        if (filter === 'nao-visitados') return !p.visited
        return true
      })

      filtered.forEach(pin => {
        const color = pin.visited ? '#4ade80' : '#6b7280'
        const size = pin.visited ? 34 : 26

        const icon = L.divIcon({
          className: '',
          html: `<div style="
            width:${size}px;height:${size}px;
            background:${color};
            border-radius:50% 50% 50% 0;
            transform:rotate(-45deg);
            border:2px solid ${pin.visited ? '#fff' : '#9ca3af'};
            box-shadow:0 2px 10px rgba(0,0,0,0.6);
            display:flex;align-items:center;justify-content:center;
          ">
            <div style="transform:rotate(45deg);color:${pin.visited ? '#0f1117' : 'white'};font-size:${pin.visited ? 13 : 10}px;font-weight:800;line-height:1;">
              ${pin.visited ? (pin.visits > 1 ? pin.visits : '✓') : '·'}
            </div>
          </div>`,
          iconSize: [size, size],
          iconAnchor: [size / 2, size],
          popupAnchor: [0, -size],
        })

        L.marker([pin.lat, pin.lng], { icon })
          .addTo(map)
          .on('click', () => setSelected(pin))
      })

      if (filter === 'todos') {
        const visitedPins = filtered.filter(p => p.visited)
        if (visitedPins.length > 0) {
          const bounds = L.latLngBounds(visitedPins.map(p => [p.lat, p.lng]))
          map.fitBounds(bounds, { padding: [80, 80], maxZoom: 14 })
        }
      }
    }
    addPins()
  }, [mapReady, pins, filter])

  const centerOnLocation = useCallback(() => {
    if (!mapRef.current) return
    navigator.geolocation.getCurrentPosition(
      (pos) => mapRef.current.setView([pos.coords.latitude, pos.coords.longitude], 15, { animate: true }),
      () => {}
    )
  }, [])

  const visitedCount = pins.filter(p => p.visited).length
  const totalCount = pins.length
  const friendsWhoWent = selected && !selected.visited ? (friendVisits[selected.id] || []) : []

  return (
    <div className="flex-1 relative overflow-hidden">

      {/* MAPA — ocupa toda a área disponível */}
      <div ref={mapContainerRef} className="absolute inset-0" style={{ zIndex: 1 }} />

      {/* Loading overlay — por cima do mapa */}
      {loading && (
        <div className="absolute inset-0 z-20 bg-background flex flex-col items-center justify-center gap-4 px-8 text-center">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <div>
            <p className="text-sm font-medium">Localizando restaurantes...</p>
            <p className="text-xs text-muted-foreground mt-1">{progress.done} de {progress.total}</p>
          </div>
        </div>
      )}

      {/* Header flutuante — topo */}
      {!loading && (
        <div className="absolute top-0 left-0 right-0 z-10 px-4 pt-3 pb-2 pointer-events-none">
          {/* Pill com stats */}
          <div className="inline-flex items-center gap-2 bg-black/70 backdrop-blur-md rounded-full px-4 py-2 border border-white/10 pointer-events-auto shadow-lg">
            <span className="text-primary font-bold text-sm">{visitedCount}</span>
            <span className="text-white/60 text-xs">de {totalCount} restaurantes</span>
          </div>
        </div>
      )}

      {/* Filtros flutuantes — abaixo do header */}
      {!loading && (
        <div className="absolute top-14 left-0 right-0 z-10 flex gap-2 px-4 pointer-events-none">
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'visitados', label: 'Visitados' },
            { id: 'nao-visitados', label: 'Não visitados' },
          ].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id as any)}
              className={`pointer-events-auto px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all touch-manipulation shadow-lg ${
                filter === f.id
                  ? 'bg-primary text-primary-foreground shadow-primary/30'
                  : 'bg-black/70 backdrop-blur-md text-white/80 border border-white/15'
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Legenda flutuante — canto superior direito */}
      {!loading && (
        <div className="absolute top-14 right-4 z-10 bg-black/70 backdrop-blur-md rounded-xl p-2.5 border border-white/10 text-xs shadow-lg">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-2.5 h-2.5 rounded-full bg-primary flex-shrink-0" />
            <span className="text-white/80">Visitado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#6b7280] flex-shrink-0" />
            <span className="text-white/50">Não visitado</span>
          </div>
        </div>
      )}

      {/* Botão localização — canto inferior direito */}
      {!loading && (
        <button
          onClick={centerOnLocation}
          className="absolute bottom-6 right-4 z-10 w-12 h-12 rounded-full bg-black/70 backdrop-blur-md border border-white/15 shadow-xl flex items-center justify-center touch-manipulation active:scale-95 transition-transform"
        >
          <Navigation className="w-5 h-5 text-primary" />
        </button>
      )}

      {/* Empty state */}
      {!loading && pins.length === 0 && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 pointer-events-none">
          <div className="bg-black/70 backdrop-blur-md rounded-2xl px-6 py-4 text-center border border-white/10">
            <ForkIcon className="w-8 h-12 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-white/60">Nenhum restaurante com endereço</p>
          </div>
        </div>
      )}

      {/* Card do restaurante selecionado — bottom sheet */}
      {selected && (
        <div className="absolute bottom-4 left-4 right-4 z-20 bg-card/95 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl animate-slide-up">
          <div className="flex items-start gap-3 p-4">
            <div className="w-14 h-20 rounded-xl overflow-hidden flex-shrink-0">
              <RestaurantPoster restaurant={selected} className="w-full h-full" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-serif text-sm font-bold truncate">{selected.name}</p>
              <p className="text-xs text-muted-foreground truncate mt-0.5">{selected.addr}</p>
              {selected.rating && <p className="text-xs text-[#FFC72C] mt-1">★ {selected.rating}</p>}
              <div className="flex items-center gap-2 mt-2">
                {selected.visited
                  ? <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">✓ {selected.visits}x garfado</span>
                  : <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">Não visitado</span>
                }
              </div>

              {!selected.visited && friendsWhoWent.length > 0 && (
                <div className="mt-2.5 border-t border-border pt-2">
                  <p className="text-[10px] text-muted-foreground mb-1.5 uppercase tracking-wide font-medium">Amigos que foram</p>
                  <div className="flex flex-col gap-1.5">
                    {friendsWhoWent.slice(0, 3).map((f, i) => (
                      <button key={i} onClick={() => { setSelected(null); onOpenModal(selected) }}
                        className="flex items-center gap-2 touch-manipulation group text-left">
                        <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 bg-secondary border border-border">
                          {f.avatar
                            ? <img src={f.avatar} alt={f.name} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-muted-foreground">{f.name.charAt(0).toUpperCase()}</div>
                          }
                        </div>
                        <span className="text-xs text-foreground/80 group-hover:text-primary transition-colors truncate">{f.name}</span>
                        {f.count > 1 && <span className="text-[10px] text-muted-foreground flex-shrink-0">{f.count}x</span>}
                      </button>
                    ))}
                    {friendsWhoWent.length > 3 && (
                      <p className="text-[10px] text-muted-foreground">+{friendsWhoWent.length - 3} outros amigos</p>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2 flex-shrink-0">
              <button onClick={() => setSelected(null)}
                className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center touch-manipulation">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
              <button onClick={() => { setSelected(null); onOpenModal(selected) }}
                className="w-8 h-8 rounded-full bg-primary flex items-center justify-center touch-manipulation">
                <ForkIcon className="w-4 h-4 text-primary-foreground" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
