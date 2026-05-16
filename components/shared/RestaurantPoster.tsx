'use client'
import { redeColor } from '@/lib/constants'
import type { Restaurant } from '@/lib/types'

const REDE_CONFIG: Record<string, { bg: string; emoji: string; pattern: string }> = {
  "mcdonald's": { bg: '#1a0500', emoji: '🍔', pattern: 'arches' },
  'burger king': { bg: '#1a0800', emoji: '👑', pattern: 'flame' },
  "bob's": { bg: '#00081a', emoji: '🍦', pattern: 'dots' },
  'kfc': { bg: '#1a0000', emoji: '🍗', pattern: 'stripes' },
  'subway': { bg: '#001a04', emoji: '🥖', pattern: 'wave' },
  'popeyes': { bg: '#1a0a00', emoji: '🍗', pattern: 'dots' },
  'pizzaria': { bg: '#1a0800', emoji: '🍕', pattern: 'circle' },
  'hamburgueria': { bg: '#0f0800', emoji: '🍔', pattern: 'dots' },
  'japonesa': { bg: '#0f0014', emoji: '🍣', pattern: 'wave' },
  'italiana': { bg: '#1a0500', emoji: '🍝', pattern: 'circle' },
  'brasileira': { bg: '#001a00', emoji: '🥩', pattern: 'stripes' },
  'mexicana': { bg: '#1a0f00', emoji: '🌮', pattern: 'dots' },
  'chinesa': { bg: '#1a0000', emoji: '🥡', pattern: 'wave' },
  'árabe': { bg: '#0f0a00', emoji: '🧆', pattern: 'circle' },
  'bar': { bg: '#0a0014', emoji: '🍺', pattern: 'stripes' },
  'café': { bg: '#0f0800', emoji: '☕', pattern: 'dots' },
  'sorveteria': { bg: '#00101a', emoji: '🍨', pattern: 'circle' },
  'padaria': { bg: '#1a0f00', emoji: '🥐', pattern: 'wave' },
  'fast food': { bg: '#1a0800', emoji: '🍟', pattern: 'dots' },
  'churrascaria': { bg: '#1a0200', emoji: '🥩', pattern: 'flame' },
  'frutos do mar': { bg: '#001018', emoji: '🦞', pattern: 'wave' },
  'outro': { bg: '#0f1117', emoji: '🍽', pattern: 'dots' },
}

function getConfig(rede: string) {
  const key = (rede || 'outro').toLowerCase().trim()
  return REDE_CONFIG[key] || REDE_CONFIG['outro']
}

function PatternDots({ col }: { col: string }) {
  return (
    <>
      {[40, 80, 120, 160].map(x =>
        [30, 70, 110, 150].map(y => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="2" fill={col} opacity="0.08" />
        ))
      )}
    </>
  )
}

function PatternWave({ col }: { col: string }) {
  return (
    <>
      <path d="M0,50 Q50,30 100,50 Q150,70 200,50" stroke={col} strokeWidth="1.5" fill="none" opacity="0.08" />
      <path d="M0,90 Q50,70 100,90 Q150,110 200,90" stroke={col} strokeWidth="1.5" fill="none" opacity="0.06" />
      <path d="M0,130 Q50,110 100,130 Q150,150 200,130" stroke={col} strokeWidth="1.5" fill="none" opacity="0.04" />
    </>
  )
}

function PatternCircle({ col }: { col: string }) {
  return (
    <>
      <circle cx="160" cy="60" r="80" fill={col} opacity="0.06" />
      <circle cx="40" cy="240" r="60" fill={col} opacity="0.04" />
      <circle cx="100" cy="150" r="40" fill={col} opacity="0.03" />
    </>
  )
}

function PatternStripes({ col }: { col: string }) {
  return (
    <>
      {[0, 30, 60, 90, 120, 150, 180].map(x => (
        <line key={x} x1={x} y1="0" x2={x + 40} y2="165" stroke={col} strokeWidth="8" opacity="0.04" />
      ))}
    </>
  )
}

function PatternFlame({ col }: { col: string }) {
  return (
    <>
      <path d="M100,20 Q120,60 100,90 Q80,60 100,20" fill={col} opacity="0.08" />
      <path d="M100,50 Q115,75 100,95 Q85,75 100,50" fill={col} opacity="0.06" />
      <circle cx="60" cy="100" r="30" fill={col} opacity="0.04" />
      <circle cx="140" cy="80" r="25" fill={col} opacity="0.04" />
    </>
  )
}

export function RestaurantPoster({ restaurant, className = '' }: { restaurant: Restaurant; className?: string }) {
  if (restaurant.img) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={restaurant.img} alt={restaurant.name} className="w-full h-full object-cover" />
      </div>
    )
  }

  const col = redeColor(restaurant.rede)
  const config = getConfig(restaurant.rede)
  const rede = restaurant.rede.toLowerCase().trim()
  const redeName = rede === 'outro' ? '' : restaurant.rede.charAt(0).toUpperCase() + restaurant.rede.slice(1)
  const name = restaurant.name.length > 16 ? restaurant.name.slice(0, 15) + '…' : restaurant.name
  const addr = restaurant.addr.length > 28 ? restaurant.addr.slice(0, 27) + '…' : restaurant.addr
  const gId = `g${restaurant.id}`

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ background: config.bg, display: "block", minHeight: "60px" }}>
      <svg viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%", display: "block", position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id={gId} x1="0" y1="0" x2="0.3" y2="1">
            <stop offset="0%" stopColor={col} stopOpacity="0.2" />
            <stop offset="60%" stopColor={col} stopOpacity="0.06" />
            <stop offset="100%" stopColor={col} stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id={`${gId}b`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="40%" stopColor="rgba(0,0,0,0.6)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.95)" />
          </linearGradient>
        </defs>

        {/* Fundo base */}
        <rect width="200" height="300" fill={`url(#${gId})`} />

        {/* Padrão decorativo */}
        {config.pattern === 'dots' && <PatternDots col={col} />}
        {config.pattern === 'wave' && <PatternWave col={col} />}
        {config.pattern === 'circle' && <PatternCircle col={col} />}
        {config.pattern === 'stripes' && <PatternStripes col={col} />}
        {config.pattern === 'flame' && <PatternFlame col={col} />}

        {/* Emoji central */}
        <text x="100" y="125" textAnchor="middle" fontSize="72" opacity="0.35">{config.emoji}</text>

        {/* Gradiente inferior */}
        <rect width="200" height="300" fill={`url(#${gId}b)`} />

        {/* Linha colorida */}
        <rect x="0" y="195" width="4" height="105" fill={col} opacity="0.9" rx="2" />

        {/* Tag de rede */}
        {redeName && (
          <>
            <rect x="12" y="202" width={redeName.length * 6.5 + 12} height="14" rx="7" fill={col} opacity="0.2" />
            <text x="18" y="213" fontFamily="Arial" fontSize="8" fontWeight="700" fill={col} opacity="0.9">
              {redeName.toUpperCase()}
            </text>
          </>
        )}

        {/* Nome do restaurante */}
        <text x="12" y="237" fontFamily="Georgia,serif" fontSize="15" fontWeight="700" fill="#ffffff" opacity="0.95">
          {name}
        </text>

        {/* Endereço */}
        {addr !== 'Endereço não informado' && (
          <text x="12" y="254" fontFamily="Arial" fontSize="8" fill="#8899aa" opacity="0.8">
            {addr}
          </text>
        )}

        {/* Rating */}
        {restaurant.rating && (
          <text x="12" y="285" fontFamily="Arial" fontSize="11" fill="#FFC72C" fontWeight="600" opacity="0.9">
            ★ {restaurant.rating}
          </text>
        )}
      </svg>
    </div>
  )
}
