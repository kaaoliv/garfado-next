'use client'
import { useState, useRef } from 'react'
import { useApp } from '@/lib/context'
import { ACHIEVEMENTS } from '@/lib/constants'
import { RestaurantPoster } from '@/components/shared/RestaurantPoster'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Camera, LogOut } from 'lucide-react'
import type { Restaurant } from '@/lib/types'

interface PerfilScreenProps {
  onOpenModal: (r: Restaurant) => void
}

export function PerfilScreen({ onOpenModal }: PerfilScreenProps) {
  const { profile, visits, visitDates, ratings, likes, achs, friends, followers,
    restaurants, signOut, setProfile } = useApp()
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(profile?.name || '')
  const [editUsername, setEditUsername] = useState(profile?.username || '')
  const [editBio, setEditBio] = useState(profile?.bio || '')
  const [saveLoading, setSaveLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const garfCount = restaurants.filter(r => (visits[r.id] || 0) > 0).length
  const totalVisits = Object.values(visits).reduce((a, b) => a + b, 0)

  // Últimas garfadas
  const recentVisited = restaurants
    .filter(r => (visits[r.id] || 0) > 0 && visitDates[r.id])
    .sort((a, b) => new Date(visitDates[b.id]).getTime() - new Date(visitDates[a.id]).getTime())
    .slice(0, 5)

  const handleSaveProfile = async () => {
    const un = editUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, '')
    if (!un || un.length < 3) { toast.error('Username precisa ter ao menos 3 letras'); return }
    setSaveLoading(true)
    const { error } = await supabase.from('profiles')
      .update({ name: editName.trim(), username: un, bio: editBio.trim() })
      .eq('id', profile!.id)
    setSaveLoading(false)
    if (error?.code === '23505') { toast.error('Esse @username já está em uso'); return }
    if (!error) {
      setProfile({ ...profile!, name: editName.trim(), username: un, bio: editBio.trim() })
      setEditing(false)
      toast.success('Perfil atualizado!')
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 3 * 1024 * 1024) { toast.error('Foto deve ter menos de 3MB'); return }
    const path = `avatars/${profile!.id}`
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (!error) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      const url = data.publicUrl + '?t=' + Date.now()
      await supabase.from('profiles').update({ avatar_url: url }).eq('id', profile!.id)
      setProfile({ ...profile!, avatar_url: url })
      toast.success('Foto atualizada!')
    }
  }

  const ini = (profile?.name || 'G').charAt(0).toUpperCase()

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide pb-6">
      <div className="px-4 pt-2">

        {/* Profile header */}
        <div className="flex flex-col items-center mb-6 pt-2">
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-3xl font-bold text-primary-foreground overflow-hidden outline-4 outline-primary outline">
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                : ini
              }
            </div>
            <button onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center touch-manipulation">
              <Camera className="w-3.5 h-3.5 text-primary-foreground" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
          </div>

          {editing ? (
            <div className="w-full flex flex-col gap-3 mb-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Nome</label>
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Username</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                  <input
                    value={editUsername}
                    onChange={e => setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="username"
                    className="w-full bg-card border border-border rounded-xl pl-8 pr-4 py-3 text-sm text-foreground outline-none focus:border-primary transition-colors"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">Só letras minúsculas, números e _</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Bio</label>
                <textarea
                  value={editBio}
                  onChange={e => setEditBio(e.target.value)}
                  placeholder="Conte um pouco sobre você..."
                  rows={2}
                  maxLength={120}
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground outline-none focus:border-primary resize-none transition-colors"
                />
                <p className="text-[10px] text-muted-foreground mt-1 text-right">{editBio.length}/120</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditing(false)}
                  className="flex-1 py-3 rounded-xl border border-border text-sm text-muted-foreground touch-manipulation">
                  Cancelar
                </button>
                <button onClick={handleSaveProfile} disabled={saveLoading}
                  className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold touch-manipulation disabled:opacity-60">
                  {saveLoading ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-xl font-bold">{profile?.name || 'Explorador'}</h1>
                <button
                  onClick={() => {
                    setEditing(true)
                    setEditName(profile?.name || '')
                    setEditUsername(profile?.username || '')
                    setEditBio(profile?.bio || '')
                  }}
                  className="w-7 h-7 rounded-full bg-card border border-border flex items-center justify-center touch-manipulation">
                  <svg className="w-3.5 h-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 0l.172.172a2 2 0 010 2.828L12 16H9v-3z" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-muted-foreground">@{profile?.username || '?'}</p>
              {profile?.bio
                ? <p className="text-sm text-muted-foreground mt-1 text-center px-4">{profile.bio}</p>
                : <button onClick={() => { setEditing(true); setEditName(profile?.name || ''); setEditUsername(profile?.username || ''); setEditBio('') }}
                    className="text-xs text-primary/70 mt-1 touch-manipulation">+ Adicionar bio</button>
              }
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {[
            { label: 'Garfados', value: garfCount },
            { label: 'Visitas', value: totalVisits },
            { label: 'Seguindo', value: friends.length },
            { label: 'Seguidores', value: followers.length },
          ].map(s => (
            <div key={s.label} className="bg-card rounded-xl p-3 text-center">
              <p className="font-serif text-xl font-bold text-primary">{s.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Conquistas */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-serif text-sm font-semibold">Conquistas</h2>
            <span className="text-xs text-muted-foreground">{achs.size}/{ACHIEVEMENTS.length}</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {ACHIEVEMENTS.map(a => {
              const unlocked = achs.has(a.id)
              return (
                <div key={a.id} title={`${a.name}: ${a.desc}`}
                  className={`bg-card rounded-xl p-3 text-center ${!unlocked ? 'opacity-30' : ''}`}>
                  <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center text-2xl mb-1 ${unlocked ? 'bg-primary/20' : 'bg-secondary'}`}>
                    {a.ico}
                  </div>
                  <p className="text-[9px] text-muted-foreground leading-tight">{a.name}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Últimas garfadas */}
        {recentVisited.length > 0 && (
          <div className="mb-6">
            <h2 className="font-serif text-sm font-semibold mb-3">Últimas garfadas</h2>
            <div className="flex flex-col gap-2">
              {recentVisited.map(r => (
                <button key={r.id} onClick={() => onOpenModal(r)}
                  className="flex items-center gap-3 bg-card rounded-xl p-3 touch-manipulation active:opacity-80 text-left">
                  <div className="w-10 h-14 rounded-lg overflow-hidden flex-shrink-0">
                    <RestaurantPoster restaurant={r} className="w-full h-full" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{r.addr.split(',')[0]}</p>
                    {r.rating && <p className="text-xs text-[#FFC72C]">★ {r.rating}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-primary">{visits[r.id]}x</p>
                    <p className="text-[10px] text-muted-foreground">visitas</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sign out */}
        <button onClick={signOut}
          className="w-full py-3 flex items-center justify-center gap-2 rounded-xl border border-border text-sm text-muted-foreground touch-manipulation active:bg-secondary">
          <LogOut className="w-4 h-4" />
          Sair da conta
        </button>
      </div>
    </div>
  )
}
