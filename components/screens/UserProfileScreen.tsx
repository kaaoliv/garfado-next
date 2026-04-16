'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/lib/context'
import { RestaurantPoster } from '@/components/shared/RestaurantPoster'
import { ForkIcon } from '@/components/shared/ForkIcon'
import { ArrowLeft } from 'lucide-react'
import type { Restaurant } from '@/lib/types'

interface UserProfileScreenProps {
  userId: string
  onClose: () => void
  onOpenModal: (r: Restaurant) => void
}

export function UserProfileScreen({ userId, onClose, onOpenModal }: UserProfileScreenProps) {
  const { user, friends, restaurants } = useApp()
  const [profile, setProfile] = useState<any>(null)
  const [visits, setVisits] = useState<Record<number, number>>({})
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [followLoading, setFollowLoading] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [userId])

  const loadProfile = async () => {
    setLoading(true)
    const [profR, visR] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('visits').select('restaurant_id, count').eq('user_id', userId),
    ])
    setProfile(profR.data)
    const v: Record<number, number> = {}
    ;(visR.data || []).forEach((x: any) => { v[x.restaurant_id] = x.count || 1 })
    setVisits(v)
    setIsFollowing(friends.includes(userId))
    setLoading(false)
  }

  const toggleFollow = async () => {
    if (!user) return
    setFollowLoading(true)
    if (isFollowing) {
      await supabase.from('friendships').delete().eq('follower_id', user.id).eq('following_id', userId)
      setIsFollowing(false)
    } else {
      await supabase.from('friendships').insert({ follower_id: user.id, following_id: userId })
      setIsFollowing(true)
    }
    setFollowLoading(false)
  }

  const garfados = restaurants.filter(r => (visits[r.id] || 0) > 0)
    .sort((a, b) => (visits[b.id] || 0) - (visits[a.id] || 0))

  const ini = (profile?.name || '?').charAt(0).toUpperCase()
  const isMe = userId === user?.id

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0f1117] flex items-center justify-center">
        <div className="text-muted-foreground text-sm">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#0f1117] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4 flex-shrink-0">
        <button onClick={onClose} className="w-9 h-9 rounded-full bg-card flex items-center justify-center touch-manipulation">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="font-serif text-lg font-bold flex-1 truncate">{profile?.name || 'Perfil'}</h1>
        {!isMe && (
          <button onClick={toggleFollow} disabled={followLoading}
            className={`px-4 py-2 rounded-full text-sm font-medium touch-manipulation disabled:opacity-60 ${
              isFollowing ? 'bg-card border border-border text-foreground' : 'bg-primary text-primary-foreground'
            }`}>
            {followLoading ? '...' : isFollowing ? 'Seguindo' : 'Seguir'}
          </button>
        )}
      </div>

      {/* Scroll */}
      <div className="flex-1 overflow-y-auto scrollbar-hide pb-6">
        {/* Avatar + info */}
        <div className="flex flex-col items-center px-4 pb-6">
          <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-2xl font-bold text-primary-foreground overflow-hidden outline-4 outline-primary outline mb-3">
            {profile?.avatar_url
              ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              : ini
            }
          </div>
          <p className="font-serif text-xl font-bold">{profile?.name || 'Explorador'}</p>
          <p className="text-sm text-muted-foreground mt-0.5">@{profile?.username || '?'}</p>
          {profile?.bio && <p className="text-sm text-muted-foreground mt-2 text-center px-6">{profile.bio}</p>}

          {/* Stats */}
          <div className="flex gap-8 mt-4">
            <div className="text-center">
              <p className="font-serif text-xl font-bold text-primary">{garfados.length}</p>
              <p className="text-xs text-muted-foreground">garfados</p>
            </div>
            <div className="text-center">
              <p className="font-serif text-xl font-bold">{Object.values(visits).reduce((a, b) => a + b, 0)}</p>
              <p className="text-xs text-muted-foreground">visitas</p>
            </div>
          </div>
        </div>

        {/* Grid de garfados */}
        {garfados.length === 0 ? (
          <div className="flex flex-col items-center py-12 gap-3 text-center px-8">
            <ForkIcon className="w-10 h-14 text-muted-foreground/20" />
            <p className="text-sm text-muted-foreground">Nenhum lugar garfado ainda</p>
          </div>
        ) : (
          <div className="px-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Lugares garfados</p>
            <div className="grid grid-cols-3 gap-2">
              {garfados.map(r => (
                <button key={r.id} onClick={() => onOpenModal(r)}
                  className="relative rounded-xl overflow-hidden aspect-square touch-manipulation active:opacity-80">
                  <RestaurantPoster restaurant={r} className="w-full h-full" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  {(visits[r.id] || 0) > 1 && (
                    <div className="absolute bottom-1.5 right-1.5 bg-black/70 text-[#FFC72C] text-[8px] px-1.5 py-0.5 rounded-full">
                      {visits[r.id]}x
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-1.5">
                    <p className="font-serif text-[10px] font-semibold text-white leading-tight truncate">{r.name}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
