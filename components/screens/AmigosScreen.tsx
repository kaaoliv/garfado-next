'use client'
import { useState } from 'react'
import { useApp } from '@/lib/context'
import { RestaurantPoster } from '@/components/shared/RestaurantPoster'
import { tAgo } from '@/lib/constants'
import { Flame, Search, UserPlus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { Restaurant } from '@/lib/types'

type SubTab = 'feed' | 'ranking' | 'pessoas'

interface AmigosScreenProps {
  onOpenModal: (r: Restaurant) => void
}

export function AmigosScreen({ onOpenModal }: AmigosScreenProps) {
  const { feed, ranking, followers, friends, restaurants, reactions, myReactions, reactFeed, user } = useApp()
  const [tab, setTab] = useState<SubTab>('feed')
  const [searchQ, setSearchQ] = useState('')
  const [searchRes, setSearchRes] = useState<any[]>([])

  const searchUsers = async (q: string) => {
    setSearchQ(q)
    if (q.length < 2) { setSearchRes([]); return }
    const { data } = await supabase.from('profiles').select('id,name,username,avatar_url')
      .or(`username.ilike.%${q}%,name.ilike.%${q}%`).limit(10)
    setSearchRes(data || [])
  }

  const openProfile = (uid: string) => {
    if (typeof window !== 'undefined' && (window as any).__openUserProfile) {
      (window as any).__openUserProfile(uid)
    }
  }

  const toggleFollow = async (uid: string) => {
    const isFollowing = friends.includes(uid)
    if (isFollowing) {
      await supabase.from('friendships').delete().eq('follower_id', user!.id).eq('following_id', uid)
      toast.success('Deixou de seguir')
    } else {
      await supabase.from('friendships').insert({ follower_id: user!.id, following_id: uid })
      toast.success('Seguindo!')
    }
  }

  const tabs: { id: SubTab; label: string }[] = [
    { id: 'feed', label: 'Feed 📰' },
    { id: 'ranking', label: 'Ranking 🏅' },
    { id: 'pessoas', label: 'Pessoas 👥' },
  ]

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* Busca de amigos — visível em todas as abas */}
      <div className="px-4 pt-3 pb-2 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            value={searchQ}
            onChange={e => searchUsers(e.target.value)}
            placeholder="Buscar por nome ou @username..."
            className="w-full bg-card rounded-xl py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/50"
          />
          {searchQ && (
            <button onClick={() => { setSearchQ(''); setSearchRes([]) }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground touch-manipulation">
              ✕
            </button>
          )}
        </div>

        {/* Resultados da busca — aparecem em qualquer aba */}
        {searchRes.length > 0 && (
          <div className="mt-2 flex flex-col gap-2 bg-card rounded-xl p-2 border border-border">
            {searchRes.map(u => {
              if (u.id === user?.id) return null
              const ini = (u.name || '?').charAt(0).toUpperCase()
              const isF = friends.includes(u.id)
              return (
                <div key={u.id} className="flex items-center gap-3 p-2 rounded-lg">
                  <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground overflow-hidden flex-shrink-0">
                    {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" /> : ini}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{u.name || 'Sem nome'}</p>
                    <p className="text-xs text-muted-foreground">@{u.username || '?'}</p>
                  </div>
                  <button onClick={() => toggleFollow(u.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium touch-manipulation flex-shrink-0 ${
                      isF ? 'bg-secondary text-foreground' : 'bg-primary text-primary-foreground'
                    }`}>
                    {isF ? 'Seguindo' : 'Seguir'}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Sub tabs */}
      <div className="flex border-b border-border flex-shrink-0">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-2.5 text-xs font-medium transition-colors touch-manipulation border-b-2 -mb-px ${
              tab === t.id ? 'text-primary border-primary' : 'text-muted-foreground border-transparent'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">

        {/* FEED */}
        {tab === 'feed' && (
          <div className="p-4 flex flex-col gap-3">
            {feed.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                <span className="text-4xl">📰</span>
                <p className="font-serif text-base font-semibold">Feed vazio</p>
                <p className="text-sm text-muted-foreground">Siga amigos para ver o que eles estão garfando</p>
              </div>
            ) : feed.map(v => {
              const r = restaurants.find(x => x.id === v.restaurant_id)
              const pr = v.profiles || { id: '', name: 'Alguém', username: '', avatar_url: null }
              const ini = (pr.name || '?').charAt(0).toUpperCase()
              const fk = `${v.user_id}_${v.restaurant_id}`
              const rxCount = reactions[fk] || 0
              const myRx = myReactions[fk]

              return (
                <div key={`${v.user_id}-${v.restaurant_id}`} className="bg-card rounded-xl p-4">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-3">
                    <button onClick={() => openProfile(pr.id)} className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground overflow-hidden outline-2 outline-primary/30 outline flex-shrink-0 touch-manipulation">
                      {pr.avatar_url ? <img src={pr.avatar_url} alt="" className="w-full h-full object-cover" /> : ini}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{pr.name || pr.username || 'Alguém'}</p>
                      <p className="text-xs text-muted-foreground">
                        garfou <span className="text-foreground font-medium">{v.restaurant_name}</span>
                        {v.count > 1 && <span className="text-[#FFC72C] ml-1">{v.count}x</span>}
                      </p>
                    </div>
                    </button>
                    <span className="text-xs text-muted-foreground flex-shrink-0">{tAgo(v.updated_at)}</span>
                  </div>

                  {/* Restaurant preview */}
                  {r && (
                    <button onClick={() => onOpenModal(r)}
                      className="flex gap-3 mb-3 w-full text-left touch-manipulation active:opacity-80">
                      <div className="w-14 h-20 rounded-lg overflow-hidden flex-shrink-0">
                        <RestaurantPoster restaurant={r} className="w-full h-full" />
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <p className="text-sm font-semibold">{r.name}</p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{r.addr.split(',')[0]}</p>
                        {r.rating && <p className="text-xs text-[#FFC72C] mt-1">★ {r.rating}</p>}
                      </div>
                    </button>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <button onClick={() => reactFeed(fk)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors touch-manipulation ${
                        myRx ? 'bg-orange-500/20 text-orange-400' : 'bg-secondary text-muted-foreground'
                      }`}>
                      <Flame className={`w-4 h-4 ${myRx ? 'fill-orange-400' : ''}`} />
                      {rxCount > 0 ? rxCount : 'Reagir'}
                    </button>
                    {r && (
                      <button onClick={() => onOpenModal(r)} className="text-xs text-primary font-medium touch-manipulation">
                        Ver restaurante →
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* RANKING */}
        {tab === 'ranking' && (
          <div className="p-4">
            {ranking.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                <span className="text-4xl">🏅</span>
                <p className="font-serif text-base font-semibold">Sem ranking ainda</p>
                <p className="text-sm text-muted-foreground">Siga amigos para ver o ranking</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {ranking.map((entry, i) => {
                  const p = entry.profile
                  const ini = (p.name || '?').charAt(0).toUpperCase()
                  const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null
                  return (
                    <div key={p.id}
                      className={`flex items-center gap-3 p-3 rounded-xl ${entry.isMe ? 'bg-primary/10 border border-primary/30' : 'bg-card'}`}>
                      <div className="w-8 text-center flex-shrink-0">
                        {medal ? <span className="text-xl">{medal}</span> : <span className="text-sm font-bold text-muted-foreground">#{i+1}</span>}
                      </div>
                      <div className={`w-10 h-10 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground overflow-hidden flex-shrink-0 ${entry.isMe ? 'outline-2 outline-primary outline' : ''}`}>
                        {p.avatar_url ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover" /> : ini}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${entry.isMe ? 'text-primary' : ''}`}>{entry.isMe ? 'Você' : p.name || '?'}</p>
                        <p className="text-xs text-muted-foreground">@{p.username || '?'}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-lg font-bold ${entry.isMe ? 'text-primary' : ''}`}>{entry.garfCount}</p>
                        <p className="text-[10px] text-muted-foreground">garfados</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* PESSOAS */}
        {tab === 'pessoas' && (
          <div className="p-4">
            {/* Seguidores */}
            {followers.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Seguidores · {followers.length}</p>
                <div className="flex flex-col gap-2">
                  {followers.map(u => {
                    const ini = (u.name || '?').charAt(0).toUpperCase()
                    const isF = friends.includes(u.id)
                    return (
                      <div key={u.id} className="flex items-center gap-3 bg-card rounded-xl p-3">
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground overflow-hidden flex-shrink-0">
                          {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" /> : ini}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{u.name || 'Sem nome'}</p>
                          <p className="text-xs text-muted-foreground">@{u.username || '?'}</p>
                        </div>
                        <button onClick={() => toggleFollow(u.id)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium touch-manipulation ${
                            isF ? 'bg-secondary text-foreground' : 'bg-primary/20 text-primary border border-primary/40'
                          }`}>
                          {isF ? 'Seguindo' : 'Seguir back'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {followers.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                <UserPlus className="w-10 h-10 text-muted-foreground/30" />
                <p className="font-serif text-base font-semibold">Nenhum seguidor ainda</p>
                <p className="text-sm text-muted-foreground">Use a busca acima para encontrar amigos</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
