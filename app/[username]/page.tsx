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

const REDE_COLORS: Record<string, string> = {
  "mcdonald's": '#DA291C',
  'burger king': '#F5821F',
  "bob's": '#003087',
  'kfc': '#e4002b',
  'subway': '#009B48',
  'popeyes': '#F28C00',
  'pizzaria': '#cc3300',
  'hamburgueria': '#8B4513',
  'bar': '#7c3aed',
  'outro': '#4ade80',
}

const REDE_EMOJIS: Record<string, string> = {
  "mcdonald's": '🍔',
  'burger king': '👑',
  "bob's": '🧃',
  'kfc': '🍗',
  'subway': '🥖',
  'popeyes': '🍗',
  'pizzaria': '🍕',
  'hamburgueria': '🍔',
  'bar': '🍺',
}

function redeKey(rede: string) {
  return (rede || 'outro').toLowerCase().trim()
}

function redeColor(rede: string) {
  return REDE_COLORS[redeKey(rede)] || '#4ade80'
}

function redeEmoji(rede: string) {
  return REDE_EMOJIS[redeKey(rede)] || '🍽'
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
      {/* Header */}
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

      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '1.5rem 1rem 4rem' }}>
        {/* Perfil */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', background: '#4ade80', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', fontWeight: 700, color: '#0a0c0f', flexShrink: 0 }}>
            {profile.avatar_url
              ? <img src={profile.avatar_url} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : ini}
          </div>
          <div>
            <h1 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>{profile.name}</h1>
            <p style={{ color: '#4ade80', margin: '0.15rem 0 0', fontSize: '0.85rem' }}>@{profile.username}</p>
            {profile.bio && <p style={{ color: '#6b7280', fontSize: '0.8rem', margin: '0.25rem 0 0' }}>{profile.bio}</p>}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '1.75rem' }}>
          {[
            { label: 'garfados', value: visited.length },
            { label: 'visitas', value: totalVisits },
            { label: 'seguidores', value: followers?.length || 0 },
          ].map(s => (
            <div key={s.label} style={{ background: '#161a20', borderRadius: 12, padding: '0.75rem 0.5rem', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p style={{ fontSize: '1.4rem', fontWeight: 700, color: '#4ade80', margin: 0 }}>{s.value}</p>
              <p style={{ fontSize: '0.65rem', color: '#6b7280', margin: '0.15rem 0 0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Grid restaurantes */}
        <h2 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.75rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Últimos garfados</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
          {visited.map(r => {
            const color = redeColor(r.rede)
            const emoji = redeEmoji(r.rede)
            const city = r.addr ? r.addr.split(',').slice(-2, -1)[0]?.trim() || '' : ''
            return (
              <div key={r.id} style={{ borderRadius: 10, overflow: 'hidden', aspectRatio: '3/4', position: 'relative', background: `linear-gradient(135deg, ${color}22 0%, #161a20 60%)`, border: `1px solid ${color}33` }}>
                {/* Emoji grande centralizado */}
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', opacity: 0.5 }}>
                  {emoji}
                </div>
                {/* Gradiente bottom */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)' }} />
                {/* Badge visitas */}
                {visitMap[r.id] > 1 && (
                  <div style={{ position: 'absolute', top: 6, right: 6, background: color, borderRadius: 99, padding: '2px 7px', fontSize: '0.55rem', fontWeight: 700, color: '#fff' }}>
                    {visitMap[r.id]}x
                  </div>
                )}
                {/* Nome */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0.4rem 0.4rem 0.5rem' }}>
                  <p style={{ fontSize: '0.6rem', fontWeight: 700, color: 'white', margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{r.name}</p>
                  {city && <p style={{ fontSize: '0.55rem', color: '#9ca3af', margin: '1px 0 0', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{city}</p>}
                </div>
              </div>
            )
          })}
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', padding: '1.75rem 1.5rem', background: '#111318', borderRadius: 16, border: '1px solid rgba(74,222,128,0.15)', marginTop: '1.75rem' }}>
          <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '1rem', margin: '0 0 1rem' }}>Registre os restaurantes que você foi</p>
          <a href="https://garfado.com.br" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#4ade80', color: '#0a0c0f', padding: '0.7rem 1.4rem', borderRadius: 8, fontWeight: 700, textDecoration: 'none', fontSize: '0.875rem' }}>
            🍴 Abrir Garfado
          </a>
        </div>
      </div>
    </main>
  )
}
