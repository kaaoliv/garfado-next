'use client'
import { useState, useEffect } from 'react'
import { useApp } from '@/lib/context'
import { LoadingScreen } from '@/components/shared/LoadingScreen'
import { BottomNav, type Tab } from '@/components/shared/BottomNav'
import { ForkIcon } from '@/components/shared/ForkIcon'
import { AuthScreen } from '@/components/screens/AuthScreen'
import { OnboardingScreen } from '@/components/screens/OnboardingScreen'
import { HomeScreen } from '@/components/screens/HomeScreen'
import { DestaqueScreen } from '@/components/screens/DestaqueScreen'
import { HunterScreen } from '@/components/screens/HunterScreen'
import { AmigosScreen } from '@/components/screens/AmigosScreen'
import { PerfilScreen } from '@/components/screens/PerfilScreen'
import { UserProfileScreen } from '@/components/screens/UserProfileScreen'
import { RestaurantModal } from '@/components/screens/RestaurantModal'
import type { Restaurant } from '@/lib/types'

const TAB_TITLES: Record<Tab, string> = {
  visitados: 'garfado',
  destaques: 'destaques',
  hunter: 'hunter',
  amigos: 'amigos',
  perfil: 'perfil',
}

export default function GarfadoApp() {
  const { user, profile, loading, onboarding } = useApp()

  // Expor globalmente para componentes filhos abrirem perfis
  useEffect(() => {
    (window as any).__openUserProfile = (uid: string) => setViewingUserId(uid)
    return () => { delete (window as any).__openUserProfile }
  }, [])
  const [tab, setTab] = useState<Tab>('visitados')
  const [modal, setModal] = useState<Restaurant | null>(null)
  const [viewingUserId, setViewingUserId] = useState<string | null>(null)

  if (loading && !user) return <LoadingScreen />
  if (!user) return <AuthScreen />
  if (onboarding) return <OnboardingScreen />

  return (
    <div className="flex-1 flex flex-col overflow-hidden h-full">
      {/* Topbar */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 pt-12 pb-3">
        <div className="flex items-center gap-2">
          <ForkIcon className="w-5 h-6 text-primary" />
          <span className="font-serif text-xl font-bold">{TAB_TITLES[tab]}</span>
        </div>
        <button onClick={() => setTab('perfil')}
          aria-label="Ver perfil"
          className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground overflow-hidden outline-2 outline-primary/50 outline touch-manipulation">
          {profile?.avatar_url
            ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            : (profile?.name || 'G').charAt(0).toUpperCase()
          }
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {tab === 'visitados' && <HomeScreen onOpenModal={setModal} />}
        {tab === 'destaques' && <DestaqueScreen onOpenModal={setModal} />}
        {tab === 'hunter' && <HunterScreen onOpenModal={setModal} />}
        {tab === 'amigos' && <AmigosScreen onOpenModal={setModal} />}
        {tab === 'perfil' && <PerfilScreen onOpenModal={setModal} />}
      </main>

      {/* Bottom Nav */}
      <BottomNav active={tab} onChange={setTab} />

      {/* Modal */}
      {modal && <RestaurantModal restaurant={modal} onClose={() => setModal(null)} />}

      {/* Perfil de outro usuário */}
      {viewingUserId && (
        <UserProfileScreen
          userId={viewingUserId}
          onClose={() => setViewingUserId(null)}
          onOpenModal={r => { setViewingUserId(null); setTimeout(() => setModal(r), 50) }}
        />
      )}
    </div>
  )
}
