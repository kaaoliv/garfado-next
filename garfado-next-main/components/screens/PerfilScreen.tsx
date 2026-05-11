'use client'
import { useState, useRef } from 'react'
import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '@/lib/context'
import { ACHIEVEMENTS } from '@/lib/constants'
import { RestaurantPoster } from '@/components/shared/RestaurantPoster'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Camera, LogOut, Lock, Globe, Plus, X, ChevronRight, Sun, Moon } from 'lucide-react'
import type { Restaurant } from '@/lib/types'

interface PerfilScreenProps {
  onOpenModal: (r: Restaurant) => void
}

interface Lista {
  id: string
  name: string
  isPublic: boolean
  restaurantIds: number[]
  createdAt: string
}

export function PerfilScreen({ onOpenModal }: PerfilScreenProps) {
  const { theme, setTheme } = useTheme()
  const { profile, visits, visitDates, ratings, likes, achs, friends, followers,
    restaurants, signOut, setProfile } = useApp()

  const [tab, setTab] = useState<'garfados' | 'listas' | 'conquistas'>('garfados')
  const [showAllGarfados, setShowAllGarfados] = useState(false)
  const [editing, setEditing] = useState(false)
  const [achTooltip, setAchTooltip] = useState<string | null>(null)
  const [editName, setEditName] = useState(profile?.name || '')
  const [editUsername, setEditUsername] = useState(profile?.username || '')
  const [editBio, setEditBio] = useState(profile?.bio || '')
  const [saveLoading, setSaveLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Listas — salvas no localStorage por ora (migrar para Supabase depois)
  const LISTS_KEY = `garfado_lists_${profile?.id}`
  const [listas, setListas] = useState<Lista[]>(() => {
    try { return JSON.parse(localStorage.getItem(LISTS_KEY) || '[]') } catch { return [] }
  })
  const [showNewList, setShowNewList] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [newListPublic, setNewListPublic] = useState(true)
  const [selectedList, setSelectedList] = useState<Lista | null>(null)

  const saveListas = (next: Lista[]) => {
    setListas(next)
    localStorage.setItem(LISTS_KEY, JSON.stringify(next))
  }

  const handleCreateList = () => {
    if (!newListName.trim()) return
    const nova: Lista = {
      id: Date.now().toString(),
      name: newListName.trim(),
      isPublic: newListPublic,
      restaurantIds: [],
      createdAt: new Date().toISOString(),
    }
    saveListas([nova, ...listas])
    setNewListName('')
    setNewListPublic(true)
    setShowNewList(false)
    toast.success('Lista criada!')
  }

  const handleDeleteList = (id: string) => {
    saveListas(listas.filter(l => l.id !== id))
    if (selectedList?.id === id) setSelectedList(null)
  }

  const handleAddToList = (lista: Lista, restaurantId: number) => {
    const updated = listas.map(l =>
      l.id === lista.id
        ? { ...l, restaurantIds: l.restaurantIds.includes(restaurantId) ? l.restaurantIds.filter(x => x !== restaurantId) : [...l.restaurantIds, restaurantId] }
        : l
    )
    saveListas(updated)
    setSelectedList(updated.find(l => l.id === lista.id) || null)
  }

  const garfCount = restaurants.filter(r => (visits[r.id] || 0) > 0).length
  const totalVisits = Object.values(visits).reduce((a, b) => a + b, 0)

  const allVisited = restaurants
    .filter(r => (visits[r.id] || 0) > 0)
    .sort((a, b) => {
      if (visitDates[a.id] && visitDates[b.id])
        return new Date(visitDates[b.id]).getTime() - new Date(visitDates[a.id]).getTime()
      return 0
    })

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
        <div className="flex flex-col items-center mb-5 pt-2">
          <div className="relative mb-3">
            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-2xl font-bold text-primary-foreground overflow-hidden outline-4 outline-primary outline">
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                : ini
              }
            </div>
            <button onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center touch-manipulation">
              <Camera className="w-3 h-3 text-primary-foreground" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
          </div>

          {editing ? (
            <div className="w-full flex flex-col gap-3 mb-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Nome</label>
                <input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Seu nome"
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground outline-none focus:border-primary transition-colors" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Username</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                  <input value={editUsername} onChange={e => setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} placeholder="username"
                    className="w-full bg-card border border-border rounded-xl pl-8 pr-4 py-3 text-sm text-foreground outline-none focus:border-primary transition-colors" />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">Só letras minúsculas, números e _</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Bio</label>
                <textarea value={editBio} onChange={e => setEditBio(e.target.value)} placeholder="Conte um pouco sobre você..."
                  rows={2} maxLength={120}
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground outline-none focus:border-primary resize-none transition-colors" />
                <p className="text-[10px] text-muted-foreground mt-1 text-right">{editBio.length}/120</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditing(false)} className="flex-1 py-3 rounded-xl border border-border text-sm text-muted-foreground touch-manipulation">Cancelar</button>
                <button onClick={handleSaveProfile} disabled={saveLoading} className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold touch-manipulation disabled:opacity-60">
                  {saveLoading ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-xl font-bold">{profile?.name || 'Explorador'}</h1>
                <button onClick={() => { setEditing(true); setEditName(profile?.name || ''); setEditUsername(profile?.username || ''); setEditBio(profile?.bio || '') }}
                  className="w-7 h-7 rounded-full bg-card border border-border flex items-center justify-center touch-manipulation">
                  <svg className="w-3.5 h-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 0l.172.172a2 2 0 010 2.828L12 16H9v-3z" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-muted-foreground">@{profile?.username || '?'}</p>
              {profile?.bio
                ? <p className="text-sm text-muted-foreground mt-1 text-center px-4">{profile.bio}</p>
                : <button onClick={() => { setEditing(true); setEditBio('') }} className="text-xs text-primary/70 mt-1 touch-manipulation">+ Adicionar bio</button>
              }
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mb-5">
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

        {/* Tabs */}
        <div className="flex border-b border-border mb-4">
          {[
            { id: 'garfados', label: 'Garfados' },
            { id: 'listas', label: 'Listas' },
            { id: 'conquistas', label: 'Conquistas' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors touch-manipulation border-b-2 -mb-px ${
                tab === t.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab: Garfados — estilo Letterboxd com preview + "ver todos" */}
        {tab === 'garfados' && (
          <>
            {/* Tela fullscreen de todos os garfados */}
            {showAllGarfados ? (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <button onClick={() => setShowAllGarfados(false)} className="touch-manipulation">
                    <ChevronRight className="w-5 h-5 text-muted-foreground rotate-180" />
                  </button>
                  <div>
                    <h3 className="font-serif text-base font-bold">Todos os garfados</h3>
                    <p className="text-xs text-muted-foreground">{allVisited.length} restaurantes</p>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {allVisited.map(r => (
                    <button key={r.id} onClick={() => onOpenModal(r)}
                      className="relative rounded-lg overflow-hidden touch-manipulation active:opacity-80"
                      style={{ aspectRatio: '2/3' }}>
                      <RestaurantPoster restaurant={r} className="w-full h-full" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      {(visits[r.id] || 0) > 1 && (
                        <div className="absolute bottom-1 right-1 bg-black/80 text-primary text-[8px] px-1 py-0.5 rounded-full font-bold">
                          {visits[r.id]}x
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Preview estilo Letterboxd — só mostra seções resumidas */
              <div className="flex flex-col gap-5">
                {allVisited.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                    <p className="font-serif text-base text-muted-foreground">Nenhum restaurante garfado ainda</p>
                  </div>
                ) : (
                  <>
                    {/* Recentes */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Recentes</p>
                        <button onClick={() => setShowAllGarfados(true)}
                          className="text-xs text-primary touch-manipulation flex items-center gap-0.5">
                          Ver todos ({allVisited.length}) <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {allVisited.slice(0, 8).map(r => (
                          <button key={r.id} onClick={() => onOpenModal(r)}
                            className="relative rounded-lg overflow-hidden touch-manipulation active:opacity-80"
                            style={{ aspectRatio: '2/3' }}>
                            <RestaurantPoster restaurant={r} className="w-full h-full" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            {(visits[r.id] || 0) > 1 && (
                              <div className="absolute bottom-1 right-1 bg-black/80 text-primary text-[8px] px-1 py-0.5 rounded-full font-bold">
                                {visits[r.id]}x
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Mais visitados */}
                    {(() => {
                      const top = [...allVisited].sort((a, b) => (visits[b.id] || 0) - (visits[a.id] || 0)).filter(r => (visits[r.id] || 0) > 1).slice(0, 4)
                      if (top.length === 0) return null
                      return (
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-2">Mais visitados</p>
                          <div className="grid grid-cols-4 gap-1.5">
                            {top.map(r => (
                              <button key={r.id} onClick={() => onOpenModal(r)}
                                className="relative rounded-lg overflow-hidden touch-manipulation active:opacity-80"
                                style={{ aspectRatio: '2/3' }}>
                                <RestaurantPoster restaurant={r} className="w-full h-full" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                <div className="absolute bottom-1 right-1 bg-primary text-primary-foreground text-[8px] px-1 py-0.5 rounded-full font-bold">
                                  {visits[r.id]}x
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )
                    })()}

                    {/* Ver todos — botão Letterboxd style */}
                    <button onClick={() => setShowAllGarfados(true)}
                      className="w-full py-3 rounded-xl border border-border text-sm text-muted-foreground touch-manipulation hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2">
                      Ver todos os {allVisited.length} garfados
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            )}
          </>
        )}

        {/* Tab: Listas */}
        {tab === 'listas' && (
          <>
            {/* Visualizando uma lista */}
            {selectedList ? (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <button onClick={() => setSelectedList(null)} className="touch-manipulation">
                    <ChevronRight className="w-5 h-5 text-muted-foreground rotate-180" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif text-base font-bold truncate">{selectedList.name}</h3>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      {selectedList.isPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                      <span>{selectedList.isPublic ? 'Pública' : 'Privada'}</span>
                      <span>· {selectedList.restaurantIds.length} restaurantes</span>
                    </div>
                  </div>
                </div>

                {/* Grade da lista */}
                {selectedList.restaurantIds.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhum restaurante nessa lista ainda</p>
                ) : (
                  <div className="grid grid-cols-4 gap-1.5 mb-4">
                    {selectedList.restaurantIds.map(id => {
                      const r = restaurants.find(x => x.id === id)
                      if (!r) return null
                      return (
                        <button key={id} onClick={() => onOpenModal(r)}
                          className="relative rounded-lg overflow-hidden touch-manipulation active:opacity-80"
                          style={{ aspectRatio: '2/3' }}>
                          <RestaurantPoster restaurant={r} className="w-full h-full" />
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Adicionar restaurantes da lista */}
                <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Adicionar à lista</p>
                <div className="flex flex-col gap-1.5">
                  {allVisited.map(r => {
                    const inList = selectedList.restaurantIds.includes(r.id)
                    return (
                      <button key={r.id} onClick={() => handleAddToList(selectedList, r.id)}
                        className={`flex items-center gap-3 p-2 rounded-xl touch-manipulation text-left ${inList ? 'bg-primary/10 border border-primary/30' : 'bg-card'}`}>
                        <div className="w-8 h-11 rounded-lg overflow-hidden flex-shrink-0">
                          <RestaurantPoster restaurant={r} className="w-full h-full" />
                        </div>
                        <span className="flex-1 text-sm truncate">{r.name}</span>
                        {inList
                          ? <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0"><X className="w-3 h-3 text-primary-foreground" /></div>
                          : <div className="w-5 h-5 rounded-full border border-border flex items-center justify-center flex-shrink-0"><Plus className="w-3 h-3 text-muted-foreground" /></div>
                        }
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : (
              <>
                {/* Criar nova lista */}
                {showNewList ? (
                  <div className="bg-card rounded-2xl p-4 mb-4 border border-border">
                    <p className="text-sm font-medium mb-3">Nova lista</p>
                    <input value={newListName} onChange={e => setNewListName(e.target.value)}
                      placeholder="Nome da lista..." maxLength={40}
                      className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary mb-3" />
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        {newListPublic
                          ? <Globe className="w-4 h-4 text-primary" />
                          : <Lock className="w-4 h-4 text-muted-foreground" />
                        }
                        <span className="text-sm">{newListPublic ? 'Pública' : 'Privada'}</span>
                      </div>
                      <button onClick={() => setNewListPublic(!newListPublic)}
                        className={`w-11 h-6 rounded-full transition-colors touch-manipulation ${newListPublic ? 'bg-primary' : 'bg-secondary border border-border'}`}>
                        <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform mx-0.5 ${newListPublic ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setShowNewList(false); setNewListName('') }}
                        className="flex-1 py-2.5 rounded-xl border border-border text-sm text-muted-foreground touch-manipulation">Cancelar</button>
                      <button onClick={handleCreateList} disabled={!newListName.trim()}
                        className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold touch-manipulation disabled:opacity-40">Criar</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setShowNewList(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border text-sm text-muted-foreground touch-manipulation mb-4 hover:border-primary hover:text-primary transition-colors">
                    <Plus className="w-4 h-4" />
                    Nova lista
                  </button>
                )}

                {/* Lista de listas */}
                {listas.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Crie sua primeira lista de restaurantes</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {listas.map(lista => {
                      const previews = lista.restaurantIds.slice(0, 4).map(id => restaurants.find(r => r.id === id)).filter(Boolean) as Restaurant[]
                      return (
                        <div key={lista.id} className="bg-card rounded-2xl overflow-hidden border border-border">
                          <button onClick={() => setSelectedList(lista)} className="w-full text-left touch-manipulation">
                            {/* Preview de posters */}
                            <div className="flex h-20 overflow-hidden">
                              {previews.length > 0
                                ? previews.map((r, i) => (
                                    <div key={i} className="flex-1 overflow-hidden">
                                      <RestaurantPoster restaurant={r} className="w-full h-full" />
                                    </div>
                                  ))
                                : <div className="flex-1 bg-secondary flex items-center justify-center">
                                    <p className="text-xs text-muted-foreground">Vazia</p>
                                  </div>
                              }
                            </div>
                            <div className="p-3 flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium">{lista.name}</p>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                  {lista.isPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                                  <span>{lista.isPublic ? 'Pública' : 'Privada'} · {lista.restaurantIds.length} restaurantes</span>
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            </div>
                          </button>
                          <div className="px-3 pb-3 -mt-1">
                            <button onClick={() => handleDeleteList(lista.id)}
                              className="text-xs text-muted-foreground/60 touch-manipulation hover:text-destructive transition-colors">
                              Excluir lista
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Tab: Conquistas */}
        {tab === 'conquistas' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground">{achs.size}/{ACHIEVEMENTS.length} desbloqueadas</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {ACHIEVEMENTS.map(a => {
                const unlocked = achs.has(a.id)
                const isActive = achTooltip === a.id
                return (
                  <button key={a.id} onClick={() => setAchTooltip(isActive ? null : a.id)}
                    className={`bg-card rounded-xl p-3 text-center touch-manipulation relative ${!unlocked ? 'opacity-40' : ''}`}>
                    <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center text-2xl mb-1 ${unlocked ? 'bg-primary/20' : 'bg-secondary'}`}>
                      {a.ico}
                    </div>
                    <p className="text-[9px] text-muted-foreground leading-tight">{a.name}</p>
                    {isActive && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10 w-44 bg-card border border-border rounded-xl p-3 shadow-lg text-left">
                        <p className="text-xs font-semibold text-foreground mb-1">{unlocked ? '✅ ' : '🔒 '}{a.name}</p>
                        <p className="text-[10px] text-muted-foreground leading-relaxed">{a.desc}</p>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Configuracoes */}
        <div className="mt-8 flex flex-col gap-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">Configuracoes</p>
          
          {/* Theme Toggle */}
          <motion.button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-full py-3.5 px-4 flex items-center justify-between rounded-xl bg-card border border-border touch-manipulation"
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-3">
              <motion.div
                className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center"
                animate={{ rotate: theme === 'dark' ? 0 : 180 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <AnimatePresence mode="wait">
                  {theme === 'dark' ? (
                    <motion.div
                      key="moon"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Moon className="w-4 h-4 text-primary" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="sun"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Sun className="w-4 h-4 text-accent" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">Aparencia</p>
                <p className="text-xs text-muted-foreground">{theme === 'dark' ? 'Tema escuro' : 'Tema claro'}</p>
              </div>
            </div>
            <div className="w-12 h-7 rounded-full bg-secondary p-1 relative">
              <motion.div
                className="w-5 h-5 rounded-full bg-primary shadow-sm"
                animate={{ x: theme === 'dark' ? 0 : 20 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          </motion.button>

          {/* Sign out */}
          <motion.button
            onClick={signOut}
            className="w-full py-3.5 flex items-center justify-center gap-2 rounded-xl border border-border text-sm text-muted-foreground touch-manipulation"
            whileTap={{ scale: 0.98 }}
            whileHover={{ backgroundColor: 'var(--secondary)' }}
          >
            <LogOut className="w-4 h-4" />
            Sair da conta
          </motion.button>
        </div>
      </div>
    </div>
  )
}
