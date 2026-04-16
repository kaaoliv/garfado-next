'use client'
import { useState } from 'react'
import { useApp } from '@/lib/context'
import { RestaurantPoster } from '@/components/shared/RestaurantPoster'
import { redeColor, redeEmoji } from '@/lib/constants'
import { Trophy } from 'lucide-react'
import type { Restaurant } from '@/lib/types'

const FRANCHISE_REDES = ["mcdonald's", 'burger king', "bob's", 'kfc', 'subway']

// Total de unidades no Brasil por rede (fonte: dados públicos 2024)
const TOTAL_BRASIL: Record<string, number> = {
  "mcdonald's": 1055,
  "burger king": 850,
  "bob's": 350,
  "kfc": 320,
  "subway": 1900,
}

type HunterScope = 'meus' | 'brasil'

interface HunterScreenProps {
  onOpenModal: (r: Restaurant) => void
}

export function HunterScreen({ onOpenModal }: HunterScreenProps) {
  const { restaurants, visits } = useApp()
  const [openRede, setOpenRede] = useState<string | null>(null)
  const [scope, setScope] = useState<HunterScope>('meus')

  const redes = FRANCHISE_REDES.filter(rede =>
    restaurants.filter(r => r.rede.toLowerCase().trim() === rede).length >= 2
  )

  const totalUnidades = redes.reduce((s, rede) => s + restaurants.filter(r => r.rede.toLowerCase().trim() === rede).length, 0)
  const totalGarfadas = redes.reduce((s, rede) => s + restaurants.filter(r => r.rede.toLowerCase().trim() === rede && (visits[r.id] || 0) > 0).length, 0)
  const totalBrasil = redes.reduce((s, rede) => s + (TOTAL_BRASIL[rede] || restaurants.filter(r => r.rede.toLowerCase().trim() === rede).length), 0)
  const pctGeral = totalUnidades ? Math.round(totalGarfadas / totalUnidades * 100) : 0

  if (redes.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-8 gap-4">
        <span className="text-5xl">🎯</span>
        <p className="font-serif text-lg font-semibold">Hunter vazio</p>
        <p className="text-sm text-muted-foreground">Adicione restaurantes de franquias como McDonald's, Subway ou Burger King para começar a caçar todas as unidades.</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide">
      <div className="px-4 pt-2 pb-6">

        {/* Descrição */}
        {/* Toggle de escopo */}
        <div className="flex gap-1 p-1 bg-card rounded-xl mb-4">
          <button onClick={() => setScope('meus')}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors touch-manipulation ${scope === 'meus' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
            Meus restaurantes
          </button>
          <button onClick={() => setScope('brasil')}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors touch-manipulation ${scope === 'brasil' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
            Total no Brasil 🇧🇷
          </button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          {scope === 'meus' ? 'Franquias que você adicionou no app' : 'Todas as unidades no Brasil — quantas você já foi?'}
        </p>

        {/* Progresso Total */}
        <div className="bg-card rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-serif text-base font-semibold">Progresso Total</h3>
            <span className="text-primary font-bold text-sm">
              {totalGarfadas}/{scope === 'brasil' ? totalBrasil.toLocaleString('pt-BR') : totalUnidades}
            </span>
          </div>
          <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${scope === 'brasil' ? Math.round(totalGarfadas / totalBrasil * 100) : pctGeral}%` }} />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {scope === 'brasil'
              ? `${Math.round(totalGarfadas / totalBrasil * 100)}% de todas as unidades do Brasil`
              : `${pctGeral}% das franquias adicionadas`}
          </p>
        </div>

        {/* Lista de Franquias */}
        <h2 className="font-serif text-lg font-semibold mb-3">Franquias</h2>
        <div className="flex flex-col gap-3">
          {redes.map(rede => {
            const todos = restaurants.filter(r => r.rede.toLowerCase().trim() === rede)
            const garfadas = todos.filter(r => (visits[r.id] || 0) > 0)
            const totalRef = scope === 'brasil' ? (TOTAL_BRASIL[rede] || todos.length) : todos.length
            const pct = totalRef ? Math.round(garfadas.length / totalRef * 100) : 0
            const col = redeColor(rede)
            const emoji = redeEmoji(rede) || '🍽'
            const nome = rede.charAt(0).toUpperCase() + rede.slice(1)
            const isComplete = scope === 'meus' && garfadas.length === todos.length && todos.length > 0
            const isOpen = openRede === rede

            return (
              <div key={rede} className="bg-card rounded-xl overflow-hidden">
                <button onClick={() => setOpenRede(isOpen ? null : rede)}
                  className="w-full p-4 text-left touch-manipulation">
                  <div className="flex items-center gap-3 mb-3">
                    {/* Ícone da franquia — emoji grande com fundo colorido */}
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
                        {garfadas.length} de {totalRef.toLocaleString('pt-BR')} unidades {scope === 'brasil' ? 'no Brasil' : 'adicionadas'}
                      </p>
                    </div>
                    <span className={`text-lg font-bold flex-shrink-0 ${isComplete ? 'text-primary' : ''}`}
                      style={!isComplete ? { color: col } : {}}>
                      {pct}%
                    </span>
                  </div>

                  {/* Barra de progresso */}
                  <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: isComplete ? 'var(--primary)' : col }} />
                  </div>

                  {!isComplete && (
                    <p className="text-[11px] text-muted-foreground mt-2">
                      Faltam {(totalRef - garfadas.length).toLocaleString('pt-BR')} unidade{(totalRef - garfadas.length) !== 1 ? 's' : ''} para completar
                    </p>
                  )}
                </button>

                {/* Lista de unidades expandida */}
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
