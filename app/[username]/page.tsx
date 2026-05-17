export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Props {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username: rawUsername } = await params
  const username = (rawUsername || '').replace('@', '')
  if (!username) return { title: 'Perfil não encontrado — Garfado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, username, avatar_url')
    .eq('username', username)
    .single()

  if (!profile) return { title: 'Perfil não encontrado — Garfado' }

  return {
    title: `${profile.name} (@${profile.username}) — Garfado`,
    description: `Veja os restaurantes que ${profile.name} garfou no Garfado.`,
    openGraph: {
      title: `${profile.name} no Garfado`,
      description: `${profile.name} está registrando seus restaurantes favoritos no Garfado.`,
      images: profile.avatar_url ? [profile.avatar_url] : [],
    }
  }
}

export default async function PublicProfile({ params }: Props) {
  const { username: rawUsername } = await params
  const username = (rawUsername || '').replace('@', '')
  if (!username) notFound()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, name, username, avatar_url, bio')
    .eq('username', username)
    .single()

  if (!profile) notFound()

  const [{ data: visits }, { data: restaurants }, { data: followers }] = await Promise.all([
    supabase.from('visits').select('restaurant_id, count').eq('user_id', profile.id),
    supabase.from('restaurants').select('id, name, addr, rede, rating, img'),
    supabase.from('friendships').select('follower_id').eq('following_id', profile.id),
  ])

  const visitMap: Record<number, number> = {}
  visits?.forEach(v => { visitMap[v.restaurant_id] = v.count || 1 })

  const visited = (restaurants || [])
    .filter(r => visitMap[r.id])
    .sort((a, b) => (visitMap[b.id] || 0) - (visitMap[a.id] || 0))
    .slice(0, 12)

  const totalVisits = Object.values(visitMap).reduce((a, b) => a + b, 0)
  const ini = (profile.name || '?').charAt(0).toUpperCase()

  return (
    <main style={{ minHeight: '100vh', background: '#0a0c0f', color: '#f0ede8', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ background: '#111318', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <svg width="16" height="22" viewBox="0 0 18 48" fill="none">
          <line x1="9" y1="1" x2="9" y2="28" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="4" y1="1" x2="4" y2="12" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="14" y1="1" x2="14" y2="12" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M4 12 Q9 18 14 12" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="9" y1="28" x2="9" y2="47" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round"/>
          <circle cx="9" cy="38" r="4" fill="#4ade80"/>
        </svg>
        <span style={{ fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>garfado</span>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', overflow: 'hidden', background: '#4ade80', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', fontWeight: 700, color: '#0a0c0f', flexShrink: 0 }}>
            {profile.avatar_url
              ? <img src={profile.avatar_url} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : ini}
          </div>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>{profile.name}</h1>
            <p style={{ color: '#4ade80', margin: '0.2rem 0', fontSize: '0.9rem' }}>@{profile.username}</p>
            {profile.bio && <p style={{ color: '#6b7280', fontSize: '0.85rem', margin: '0.3rem 0 0' }}>{profile.bio}</p>}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '2rem' }}>
          {[
            { label: 'garfados', value: visited.length },
            { label: 'visitas', value: totalVisits },
            { label: 'seguidores', value: followers?.length || 0 },
          ].map(s => (
            <div key={s.label} style={{ background: '#161a20', borderRadius: 12, padding: '0.75rem', textAlign: 'center', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#4ade80', margin: 0 }}>{s.value}</p>
              <p style={{ fontSize: '0.7rem', color: '#6b7280', margin: '0.2rem 0 0' }}>{s.label}</p>
            </div>
          ))}
        </div>

        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#f0ede8' }}>Últimos garfados</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '2rem' }}>
          {visited.map(r => (
            <div key={r.id} style={{ borderRadius: 10, overflow: 'hidden', aspectRatio: '3/4', position: 'relative', background: '#161a20' }}>
              {r.img
                ? <img src={r.img} alt={r.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>🍽</div>
              }
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 50%)' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0.4rem' }}>
                <p style={{ fontSize: '0.6rem', fontWeight: 700, color: 'white', margin: 0, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{r.name}</p>
                {visitMap[r.id] > 1 && <p style={{ fontSize: '0.55rem', color: '#4ade80', margin: 0 }}>{visitMap[r.id]}x</p>}
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', padding: '2rem', background: '#111318', borderRadius: 16, border: '1px solid rgba(74,222,128,0.2)' }}>
          <p style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '1rem' }}>Registre os restaurantes que você foi</p>
          <a href="https://garfado.com.br" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#4ade80', color: '#0a0c0f', padding: '0.75rem 1.5rem', borderRadius: 8, fontWeight: 600, textDecoration: 'none', fontSize: '0.9rem' }}>
            🍴 Abrir Garfado
          </a>
        </div>
      </div>
    </main>
  )
}
