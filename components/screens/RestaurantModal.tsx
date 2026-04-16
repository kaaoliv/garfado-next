'use client'
import { useState, useEffect, useRef } from 'react'
import { X, Star, Calendar, Heart, Minus, Plus, Send } from 'lucide-react'
import { useApp } from '@/lib/context'
import { RestaurantPoster } from '@/components/shared/RestaurantPoster'
import { ForkIcon } from '@/components/shared/ForkIcon'
import type { Restaurant, Review } from '@/lib/types'
import { tAgo } from '@/lib/constants'
import { toast } from 'sonner'

const CRITERIA = ['Comida', 'Atendimento', 'Limpeza', 'Banheiro'] as const

interface RestaurantModalProps {
  restaurant: Restaurant
  onClose: () => void
}

export function RestaurantModal({ restaurant: r, onClose }: RestaurantModalProps) {
  const { visits, ratings, likes, visitDates, addVisit, toggleLike, setRating, setNote,
    loadReviews, submitReview, deleteReview, user, friendVisits } = useApp()
  const [reviews, setReviews] = useState<Review[]>([])
  const [celebrating, setCelebrating] = useState(false)
  const [reviewText, setReviewText] = useState('')
  const [notaColetiva, setNotaColetiva] = useState<string | null>(null)
  const [celebrating, setCelebrating] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [dragY, setDragY] = useState(0)
  const sheetRef = useRef<HTMLDivElement>(null)
  const startY = useRef(0)
  const startX = useRef(0)
  const isVertical = useRef<boolean | null>(null)

  const v = visits[r.id] || 0
  const prevV = typeof window !== 'undefined' ? (window as any).__prevVisit?.[r.id] ?? v : v
  const garfado = v > 0
  const liked = likes[r.id] || false
  const mr = ratings[r.id] || {}
  const note = mr.nota || ''
  const fw = friendVisits[r.id] || []
  const firstVisit = visitDates[r.id]
    ? new Date(visitDates[r.id]).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
    : null

  useEffect(() => {
    // fetchPlacePhoto desabilitado para economizar cota da API
    loadReviews(r.id).then(setReviews)
    // nota coletiva
    import('@/lib/supabase').then(({ supabase }) =>
      supabase.from('ratings').select('nota').eq('restaurant_id', r.id).not('nota', 'is', null)
        .then(({ data }) => {
          const notas = (data || []).map((x: any) => parseFloat(x.nota)).filter(n => n > 0)
          if (notas.length) setNotaColetiva((notas.reduce((a, b) => a + b, 0) / notas.length).toFixed(1))
        })
    )
  }, [r.id])

  const handleSubmitReview = async () => {
    if (!reviewText.trim() || reviewText.length < 3) { toast.error('Escreva pelo menos 3 caracteres'); return }
    await submitReview(r.id, reviewText)
    setReviewText('')
    const updated = await loadReviews(r.id)
    setReviews(updated)
    toast.success('Review publicado!')
  }

  const handleDeleteReview = async (id: string) => {
    await deleteReview(id, r.id)
    setReviews(prev => prev.filter(x => x.id !== id))
  }

  // Swipe to close
  const onTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY
    startX.current = e.touches[0].clientX
    isVertical.current = null
    setDragging(true)
  }
  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragging) return
    const dy = e.touches[0].clientY - startY.current
    const dx = Math.abs(e.touches[0].clientX - startX.current)
    if (isVertical.current === null && (Math.abs(dy) > 5 || dx > 5)) isVertical.current = Math.abs(dy) > dx
    if (!isVertical.current) return
    if (dy > 0 && sheetRef.current && sheetRef.current.scrollTop <= 0) setDragY(dy)
  }
  const onTouchEnd = () => {
    setDragging(false)
    if (dragY > 100) onClose()
    setDragY(0)
    isVertical.current = null
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative animate-slide-up bg-[#0f1117] rounded-t-2xl max-h-[90vh] flex flex-col"
        style={{ transform: dragY > 0 ? `translateY(${dragY}px)` : undefined, transition: dragging ? 'none' : 'transform 0.3s ease' }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Celebração */}
        {celebrating && (
          <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center" style={{ animation: 'fadeInUp 0.3s ease' }}>
            <div className="flex flex-col items-center gap-2">
              <div className="text-6xl" style={{ animation: 'foodPop 0.5s ease' }}>🎉</div>
              <div className="bg-primary text-primary-foreground px-6 py-2 rounded-full font-bold text-lg font-serif" style={{ animation: 'fadeInUp 0.4s ease 0.1s both' }}>
                Garfado!
              </div>
            </div>
          </div>
        )}

        {/* Handle */}
        <div className="w-10 h-1 bg-border rounded-full mx-auto mt-3 mb-0 flex-shrink-0" />
        {/* Celebração */}
        {celebrating && (
          <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="flex flex-col items-center gap-2 animate-bounce">
              <span className="text-6xl">🍴</span>
              <span className="text-xl font-serif font-bold text-primary bg-black/80 px-4 py-2 rounded-full">Garfado!</span>
            </div>
            <div className="absolute inset-0 bg-primary/10 rounded-t-2xl" />
          </div>
        )}

        {/* Scrollable content */}
        <div ref={sheetRef} className="overflow-y-auto scrollbar-hide flex-1">

          {/* Hero */}
          <div className="relative h-56">
            <RestaurantPoster restaurant={r} className="w-full h-full" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f1117] via-black/30 to-transparent" />
            <button onClick={onClose} aria-label="Fechar" className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center touch-manipulation">
              <X className="w-4 h-4 text-white" />
            </button>
            {garfado && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-bold px-4 py-1.5 rounded-b-xl uppercase tracking-wider">
                ✓ garfado
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <h2 className="font-serif text-2xl font-bold text-white">{r.name}</h2>
              <p className="text-sm text-white/70 mt-1">{r.addr}{r.hours && r.hours !== '–' ? ` · ${r.hours}` : ''}</p>
            </div>
          </div>

          <div className="p-5 flex flex-col gap-5">

            {/* Garfar button */}
            <button onClick={async () => {
        const wasZero = (visits[r.id] || 0) === 0
        await addVisit(r.id, 1)
        if (wasZero) { setCelebrating(true); setTimeout(() => setCelebrating(false), 1800) }
      }}
              className={`w-full py-4 rounded-xl font-semibold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-all ${
                garfado ? 'bg-card text-primary border border-primary' : 'bg-primary text-primary-foreground'
              }`}>
              <ForkIcon className="w-5 h-5" />
              {garfado ? `Garfado! + visita` : 'Garfar este lugar'}
            </button>

            {/* Secondary actions */}
            <div className="flex gap-3">
              <button onClick={() => toggleLike(r.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium touch-manipulation ${liked ? 'border-pink-500 text-pink-500' : 'border-border text-muted-foreground'}`}>
                <Heart className={`w-4 h-4 ${liked ? 'fill-pink-500' : ''}`} />
                {liked ? 'Favoritado' : 'Favoritar'}
              </button>
              <button onClick={() => addVisit(r.id, -1)} disabled={v === 0}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-border text-sm font-medium text-muted-foreground touch-manipulation disabled:opacity-30">
                <Minus className="w-4 h-4" />
                Remover
              </button>
            </div>

            {/* Ratings */}
            <div className="flex gap-3">
              {r.rating && (
                <div className="flex-1 bg-card rounded-xl p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Google Maps</p>
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-xl font-bold">{r.rating}</span>
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < Math.round(r.rating!) ? 'fill-[#FFC72C] text-[#FFC72C]' : 'text-muted-foreground'}`} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div className="flex-1 bg-card rounded-xl p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Garfado</p>
                {notaColetiva ? (
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-xl font-bold text-primary">{notaColetiva}</span>
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < Math.round(parseFloat(notaColetiva)) ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">sem avaliações</p>
                )}
              </div>
            </div>

            {/* Visit count */}
            {garfado && (
              <div className="bg-card rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <ForkIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Suas visitas</p>
                      <p className="font-serif text-2xl font-bold text-primary">{v}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => addVisit(r.id, -1)} disabled={v === 0}
                      aria-label="Remover visita"
                      className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground disabled:opacity-30 touch-manipulation">
                      <Minus className="w-4 h-4" />
                    </button>
                    <button onClick={async () => {
        const wasZero = (visits[r.id] || 0) === 0
        await addVisit(r.id, 1)
        if (wasZero) { setCelebrating(true); setTimeout(() => setCelebrating(false), 1800) }
      }}
                      className="w-8 h-8 rounded-full border border-primary text-primary flex items-center justify-center touch-manipulation">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {firstVisit && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Primeira visita em <span className="text-foreground">{firstVisit}</span></p>
                  </div>
                )}
              </div>
            )}

            {/* Friends who visited */}
            {fw.length > 0 && (
              <div className="bg-card rounded-xl p-4">
                <p className="font-serif text-sm font-semibold mb-3">Amigos que foram</p>
                <div className="flex flex-wrap gap-2">
                  {fw.map((f, i) => {
                    const ini = (f.name || '?').charAt(0).toUpperCase()
                    return (
                      <div key={i} className="flex items-center gap-2 bg-secondary rounded-full px-3 py-1.5">
                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-[9px] font-bold text-primary-foreground overflow-hidden">
                          {f.avatar ? <img src={f.avatar} alt="" className="w-full h-full object-cover" /> : ini}
                        </div>
                        <span className="text-xs text-foreground">{f.name.split(' ')[0]}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* My rating */}
            <div className="bg-card rounded-xl p-4">
              <p className="font-serif text-sm font-semibold mb-3">Minha avaliação</p>
              <div className="flex flex-col gap-3">
                {CRITERIA.map(c => {
                  const cur = (mr as any)[c] || 0
                  return (
                    <div key={c} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-24 flex-shrink-0">{c}</span>
                      <div className="flex gap-1">
                        {[1,2,3,4,5].map(n => (
                          <button key={n} onClick={() => setRating(r.id, c, n)}
                            className="touch-manipulation">
                            <Star className={`w-5 h-5 ${n <= cur ? 'fill-[#FFC72C] text-[#FFC72C]' : 'text-muted-foreground'}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
              <textarea
                value={note}
                onChange={e => setNote(r.id, e.target.value)}
                placeholder="Nota privada (só você vê)..."
                rows={3}
                className="mt-3 w-full bg-secondary rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/50 resize-none"
              />
            </div>

            {/* Public reviews */}
            <div>
              <p className="font-serif text-sm font-semibold mb-3">Reviews públicos</p>
              <div className="flex gap-2 mb-3">
                <input
                  value={reviewText}
                  onChange={e => setReviewText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmitReview()}
                  placeholder="Escreva um review público..."
                  className="flex-1 bg-card rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/50 border border-border"
                />
                <button onClick={handleSubmitReview}
                  className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground touch-manipulation flex-shrink-0">
                  <Send className="w-4 h-4" />
                </button>
              </div>
              {reviews.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Seja o primeiro a deixar um review!</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {reviews.map(rev => {
                    const ini = (rev.name || '?').charAt(0).toUpperCase()
                    const isMe = rev.user_id === user?.id
                    return (
                      <div key={rev.id} className="bg-card rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground overflow-hidden flex-shrink-0">
                            {rev.avatar ? <img src={rev.avatar} alt="" className="w-full h-full object-cover" /> : ini}
                          </div>
                          <span className="text-xs font-medium flex-1">{rev.name}</span>
                          <span className="text-[10px] text-muted-foreground">{tAgo(rev.created_at)}</span>
                          {isMe && (
                            <button onClick={() => handleDeleteReview(rev.id)} className="text-muted-foreground text-xs touch-manipulation">✕</button>
                          )}
                        </div>
                        <p className="text-sm text-foreground/80 leading-relaxed">{rev.text}</p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
