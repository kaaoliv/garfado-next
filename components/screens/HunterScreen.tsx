'use client'
import { useState, useEffect } from 'react'
import { useApp } from '@/lib/context'
import { RestaurantPoster } from '@/components/shared/RestaurantPoster'
import { redeColor, redeEmoji } from '@/lib/constants'
import { Trophy, ChevronDown } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import type { Restaurant } from '@/lib/types'

const FRANCHISE_REDES = ["mcdonald's", 'burger king', "bob's", 'kfc', 'subway', 'popeyes']

const TOTAIS_POR_PAIS: Record<string, { flag: string; label: string; totais: Record<string, number> }> = {
  BR: { flag: '🇧🇷', label: 'Brasil', totais: { "mcdonald's": 1150, "burger king": 960, "bob's": 1070, "kfc": 260, "subway": 1518, "popeyes": 100 } },
  AR: { flag: '🇦🇷', label: 'Argentina', totais: { "mcdonald's": 230, "burger king": 120, "bob's": 0, "kfc": 60, "subway": 90, "popeyes": 15 } },
  US: { flag: '🇺🇸', label: 'United States', totais: { "mcdonald's": 13700, "burger king": 7000, "bob's": 0, "kfc": 3970, "subway": 20000, "popeyes": 3700 } },
  MX: { flag: '🇲🇽', label: 'México', totais: { "mcdonald's": 490, "burger king": 370, "bob's": 0, "kfc": 380, "subway": 830, "popeyes": 80 } },
  GB: { flag: '🇬🇧', label: 'United Kingdom', totais: { "mcdonald's": 1450, "burger king": 530, "bob's": 0, "kfc": 960, "subway": 2000, "popeyes": 30 } },
  PT: { flag: '🇵🇹', label: 'Portugal', totais: { "mcdonald's": 175, "burger king": 95, "bob's": 0, "kfc": 40, "subway": 130, "popeyes": 0 } },
  ES: { flag: '🇪🇸', label: 'España', totais: { "mcdonald's": 560, "burger king": 870, "bob's": 0, "kfc": 150, "subway": 480, "popeyes": 20 } },
  FR: { flag: '🇫🇷', label: 'France', totais: { "mcdonald's": 1550, "burger king": 540, "bob's": 0, "kfc": 350, "subway": 500, "popeyes": 15 } },
}

const COUNTRY_KEY = 'garfado_hunter_country'

interface HunterScreenProps {
  onOpenModal: (r: Restaurant) => void
}

export function HunterScreen({ onOpenModal }: HunterScreenProps) {
  const { restaurants, visits } = useApp()
  const { t } = useI18n()
  const [openRede, setOpenRede] = useState<string | null>(null)
  const [showCountryPicker, setShowCountryPicker] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState<string>('BR')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(COUNTRY_KEY)
    if (stored && TOTAIS_POR_PAIS[stored]) {
      setSelectedCountry(stored)
      setMounted(true)
      return
    }
    setMounted(true)
    navigator.geolocation?.getCurrentPosition(async (pos) => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`,
          { headers: { 'Accept-Language': 'en', 'User-Agent': 'GarfadoApp/1.0' } }
        )
        const data = await res.json()
        const code = data.address?.country_code?.toUpperCase()
        if (code && TOTAIS_POR_PAIS[code]) setSelectedCountry(code)
      } catch {}
    }, () => {})
  }, [])

  const selectCountry = (code: string) => {
    setSelectedCountry(code)
    localStorage.setItem(COUNTRY_KEY, code)
    setShowCountryPicker(false)
  }

  const countryData = TOTAIS_POR_PAIS[selectedCountry] || TOTAIS_POR_PAIS.BR
  const TOTAL_PAIS = countryData.totais

  const restaurantCountry = (r: { addr: string }): string => {
    const addr = (r.addr || '').toLowerCase()
    if (addr.includes('argentina') || addr.includes('buenos aires')) return 'AR'
    if (addr.includes('united states') || addr.includes(', usa') || addr.includes(', ny') || addr.includes(', ca,') || addr.includes(', tx') || addr.includes(', fl')) return 'US'
    if (addr.includes('méxico') || addr.includes('mexico') || addr.includes('ciudad de méxico')) return 'MX'
    if (addr.includes('united kingdom') || addr.includes('england') || addr.includes(', london')) return 'GB'
    if (addr.includes('portugal') || addr.includes('lisboa')) return 'PT'
    if (addr.includes('españa') || addr.includes('spain') || addr.includes('madrid') || addr.includes('barcelona')) return 'ES'
    if (addr.includes('france') || addr.includes('paris,')) return 'FR'
    return 'BR'
  }

  const redeMatch = (r: { rede: string; name: string }, rede: string) => {
    const rr = r.rede.toLowerCase().trim()
    const rn = r.name.toLowerCase()
    if (rr === rede) return true
    if (rede === "mcdonald's" && (rn.includes('mcdonald') || rn.includes('méqui'))) return true
    if (rede === 'burger king' && rn.includes('burger king')) return true
    if (rede === "bob's" && (rn.includes("bob's") || rn.includes('bobs'))) return true
    if (rede === 'kfc' && rn.includes('kfc')) return true
    if (rede === 'subway' && rn.includes('subway')) return true
    if (rede === 'popeyes' && rn.includes('popeyes')) return true
    return false
  }

  const restaurantsInCountry = mounted
    ? restaurants.filter(r => restaurantCountry(r) === selectedCountry)
    : restaurants

  const redes = FRANCHISE_REDES.filter(rede =>
    restaurantsInCountry.filter(r => redeMatch(r, rede)).length >= 2
  )

  const seletor = (
    <div className="mb-4">
      <button
        onClick={() => setShowCountryPicker(!showCountryPicker)}
        className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-xl touch-manipulation"
      >
        <span className="text-lg">{countryData.flag}</span>
        <span className="text-sm font-medium">{countryData.label}</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showCountryPicker ? 'rotate-180' : ''}`} />
      </button>
      {showCountryPicker && (
        <div className="mt-2 bg-card border border-border rounded-xl overflow-hidden shadow-lg">
          {Object.entries(TOTAIS_POR_PAIS).map(([code, info]) => (
            <button
              key={code}
              onClick={() => selectCountry(code)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left touch-manipulation border-b border-border/50 last:border-0 transition-colors ${
                selectedCountry === code ? 'bg-primary/10' : 'hover:bg-secondary'
              }`}
            >
              <span className="text-xl">{info.flag}</span>
              <span className="text-sm font-medium flex-1">{info.label}</span>
              {selectedCountry === code && (
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )

  if (redes.length === 0) {
    return (
      <div className="flex-1 flex flex-col px-4 pt-2">
        {seletor}
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
          <span className="text-5xl">🎯</span>
          <p className="font-serif text-lg font-semibold">{t('hunter.empty_title')}</p>
          <p className="text-sm text-muted-foreground">{t('hunter.empty_sub')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide">
      <div className="px-4 pt-2 pb-6">
        {seletor}
        <h2 className="font-serif text-lg font-semibold mb-3">{t('hunter.franchises')}</h2>
        <div className="flex flex-col gap-3">
          {redes.map(rede => {
            const todos = restaurantsInCountry.filter(r => redeMatch(r, rede))
            const garfadas = todos.filter(r => (visits[r.id] || 0) > 0)
            const totalRef = TOTAL_PAIS[rede] || todos.length
            const pct = totalRef ? Math.round(garfadas.length / totalRef * 100) : 0
            const col = redeColor(rede)
            const emoji = redeEmoji(rede) || '🍽'
            const nome = rede.charAt(0).toUpperCase() + rede.slice(1)
            const isComplete = garfadas.length >= totalRef
            const isOpen = openRede === rede

            return (
              <div key={rede} className="bg-card rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenRede(isOpen ? null : rede)}
                  className="w-full p-4 text-left touch-manipulation"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ background: col + '22', border: `1.5px solid ${col}44` }}>
                      {emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-serif text-sm font-semibold">{nome}</h3>
                        {isComplete && (
                          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                            <Trophy className="w-3 h-3 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {garfadas.length} {t('hunter.of')} {totalRef.toLocaleString()} {t('hunter.units')} {countryData.flag}
                      </p>
                    </div>
                    <span className="text-lg font-bold flex-shrink-0"
                      style={{ color: isComplete ? 'var(--primary)' : col }}>
                      {pct}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, pct)}%`, backgroundColor: isComplete ? 'var(--primary)' : col }} />
                  </div>
                  {!isComplete && (
                    <p className="text-[11px] text-muted-foreground mt-2">
                      {(totalRef - garfadas.length).toLocaleString()} {t('hunter.remaining')}
                    </p>
                  )}
                </button>

                {isOpen && (
                  <div className="border-t border-border">
                    {todos.map(r => {
                      const v = visits[r.id] || 0
                      return (
                        <button key={r.id} onClick={() => onOpenModal(r)}
                          className="w-full flex items-center gap-3 px-4 py-3 border-b border-border/50 last:border-0 touch-manipulation active:bg-secondary text-left">
                          <div className="w-10 h-14 rounded-lg overflow-hidden flex-shrink-0">
                            <RestaurantPoster restaurant={r} className="w-full h-full" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{r.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{r.addr}</p>
                            {r.rating && <p className="text-xs text-[#FFC72C]">★ {r.rating}</p>}
                          </div>
                          {v > 0
                            ? <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground flex-shrink-0">✓</div>
                            : <div className="w-6 h-6 rounded-full border border-border flex-shrink-0" />
                          }
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
