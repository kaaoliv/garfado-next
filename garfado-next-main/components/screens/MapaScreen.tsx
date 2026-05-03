'use client'
import { useEffect, useState, useRef } from 'react'
import { useApp } from '@/lib/context'
import type { Restaurant } from '@/lib/types'
import { MapPin, X, Navigation } from 'lucide-react'
import { ForkIcon } from '@/components/shared/ForkIcon'
import { RestaurantPoster } from '@/components/shared/RestaurantPoster'

interface MapaScreenProps {
  onOpenModal: (r: Restaurant) => void
}

// Geocoding via Nominatim (OpenStreetMap) — gratuito
async function geocodeAddress(addr: string, name: string): Promise<[number, number] | null> {
  try {
    // Tentar primeiro com endereço completo
    const q = encodeURIComponent(`${addr}, Brasil`)
    const resp = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&countrycodes=br`,
      { headers: { 'Accept-Language': 'pt-BR', 'User-Agent': 'GarfadoApp/1.0' } }
    )
    const data = await resp.json()
    if (data?.[0]) return [parseFloat(data[0].lat), parseFloat(data[0].lon)]
    // Fallback: nome + cidade
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
  const { restaurants, visits } = useApp()
  const mapRef = useRef<any>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const [pins, setPins] = useState<PinRestaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [selected, setSelected] = useState<PinRestaurant | null>(null)
  const [filter, setFilter] = useState<'todos' | 'visitados' | 'nao-visitados'>('todos')
  const [mapReady, setMapReady] = useState(false)

  // Carregar coordenadas dos restaurantes
  useEffect(() => {
    const loadCoords = async () => {
      const CACHE_KEY = 'garfado_geocache_v2'
      const cached: Record<number, { lat: number; lng: number; ts: number }> =
        JSON.parse(localStorage.getItem(CACHE_KEY) || '{}')

      const CACHE_TTL = 30 * 24 * 60 * 60 * 1000 // 30 dias
      const now = Date.now()

      // Primeiro: adicionar pins do cache imediatamente
      const targets = restaurants.filter(r => r.addr && r.addr !== 'Endereço não informado')
      const newPins: PinRestaurant[] = []
      const toGeocode: typeof targets = []

      for (const r of targets) {
        const c = cached[r.id]
        if (c && (now - c.ts) < CACHE_TTL) {
          // Cache válido — adicionar direto
          newPins.push({ ...r, lat: c.lat, lng: c.lng, visited: (visits[r.id] || 0) > 0, visits: visits[r.id] || 0 })
        } else {
          toGeocode.push(r)
        }
      }

      // Mostrar pins do cache imediatamente
      setPins([...newPins])
      if (toGeocode.length === 0) { setLoading(false); return }

      // Geocodificar só os novos
      setProgress({ done: 0, total: toGeocode.length })
      for (let i = 0; i < toGeocode.length; i++) {
        const r = toGeocode[i]
        if (i > 0) await new Promise(res => setTimeout(res, 1100)) // rate limit Nominatim
        const coords = await geocodeAddress(r.addr, r.name)
        if (coords) {
          cached[r.id] = { lat: coords[0], lng: coords[1], ts: now }
          const pin = { ...r, lat: coords[0], lng: coords[1], visited: (visits[r.id] || 0) > 0, visits: visits[r.id] || 0 }
          newPins.push(pin)
          setPins(prev => [...prev, pin])
        }
        setProgress({ done: i + 1, total: toGeocode.length })
      }

      localStorage.setItem(CACHE_KEY, JSON.stringify(cached))
      setLoading(false)
    }

    loadCoords()
  }, [restaurants, visits])

  // Inicializar mapa Leaflet
  useEffect(() => {
    if (loading || !mapContainerRef.current || mapReady) return

    const initMap = async () => {
      const L = (await import('leaflet')).default
      await import('leaflet/dist/leaflet.css')

      if (mapRef.current) return
      
      // Centro do Brasil por padrão, ou São Paulo
      const center: [number, number] = [-23.5505, -46.6333]

      const map = L.map(mapContainerRef.current!, {
        center,
        zoom: 12,
        zoomControl: false,
      })

      // OpenStreetMap tiles — gratuito
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
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

  // Adicionar pins ao mapa
  useEffect(() => {
    if (!mapReady || !mapRef.current) return

    const addPins = async () => {
      const L = (await import('leaflet')).default
      const map = mapRef.current

      // Limpar markers anteriores
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
        const size = pin.visited ? 32 : 24

        const icon = L.divIcon({
          className: '',
          html: `<div style="
            width:${size}px;height:${size}px;
            background:${color};
            border-radius:50% 50% 50% 0;
            transform:rotate(-45deg);
            border:2px solid white;
            box-shadow:0 2px 8px rgba(0,0,0,0.4);
            display:flex;align-items:center;justify-content:center;
          ">
            <div style="transform:rotate(45deg);color:${pin.visited ? '#0f1117' : 'white'};font-size:${pin.visited ? 14 : 10}px;font-weight:700">
              ${pin.visited ? (pin.visits > 1 ? pin.visits : '✓') : '·'}
            </div>
          </div>`,
          iconSize: [size, size],
          iconAnchor: [size / 2, size],
          popupAnchor: [0, -size],
        })

        const marker = L.marker([pin.lat, pin.lng], { icon })
          .addTo(map)
          .on('click', () => setSelected(pin))
      })

      // Ajustar zoom para mostrar todos os pins visitados
      const visitedPins = filtered.filter(p => p.visited)
      if (visitedPins.length > 0 && filtered.length === pins.length) {
        const bounds = L.latLngBounds(visitedPins.map(p => [p.lat, p.lng]))
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 })
      }
    }

    addPins()
  }, [mapReady, pins, filter])

  const visitedCount = pins.filter(p => p.visited).length
  const totalCount = pins.length

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">

      {/* Header */}
      <div className="px-4 pt-2 pb-3 flex-shrink-0 flex items-center justify-between">
        <div>
          <h2 className="font-serif text-lg font-semibold">Meu Mapa</h2>
          {!loading && (
            <p className="text-xs text-muted-foreground">
              <span className="text-primary font-medium">{visitedCount}</span> visitados de {totalCount} restaurantes
            </p>
          )}
        </div>
        <Navigation className="w-4 h-4 text-muted-foreground" />
      </div>

      {/* Filtros */}
      <div className="flex gap-2 px-4 pb-3 flex-shrink-0">
        {[
          { id: 'todos', label: 'Todos' },
          { id: 'visitados', label: '✓ Visitados' },
          { id: 'nao-visitados', label: 'Não visitados' },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id as any)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors touch-manipulation ${
              filter === f.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-foreground/80 border border-border'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8 text-center">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <div>
            <p className="text-sm font-medium text-foreground">Localizando restaurantes...</p>
            <p className="text-xs text-muted-foreground mt-1">
              {progress.done} de {progress.total}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Usando OpenStreetMap (gratuito)
            </p>
          </div>
        </div>
      )}

      {/* Mapa */}
      {!loading && (
        <div className="flex-1 relative">
          <div ref={mapContainerRef} className="w-full h-full" style={{ zIndex: 1 }} />

          {/* Legenda */}
          <div className="absolute top-3 right-3 bg-card/90 backdrop-blur-sm rounded-xl p-3 border border-border z-10 text-xs">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0" />
              <span className="text-foreground">Visitado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground">Não visitado</span>
            </div>
          </div>

          {/* Empty state */}
          {pins.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/80 z-10">
              <ForkIcon className="w-10 h-14 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Nenhum restaurante com endereço encontrado</p>
            </div>
          )}
        </div>
      )}

      {/* Card do restaurante selecionado */}
      {selected && (
        <div className="absolute bottom-4 left-4 right-4 z-20 bg-card rounded-2xl border border-border shadow-xl animate-slide-up">
          <div className="flex items-center gap-3 p-4">
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
