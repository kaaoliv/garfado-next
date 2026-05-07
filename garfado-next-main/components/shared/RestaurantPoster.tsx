'use client'
import { redeColor } from '@/lib/constants'
import type { Restaurant } from '@/lib/types'

const REDE_BG: Record<string, string> = {
  "mcdonald's": '#1a0000', 'burger king': '#1a0800', "bob's": '#00081a',
  'kfc': '#1a0000', 'subway': '#001a00', 'pizzaria': '#1a0800',
  'hamburgueria': '#0f0800', 'bar': '#0a0014', 'outro': '#0f1117',
}

const REDE_ICO: Record<string, string> = {
  "mcdonald's": '✦', 'burger king': '♨', "bob's": '◈',
  'kfc': '☖', 'subway': '≋', 'pizzaria': '✿', 'hamburgueria': '☀', 'bar': '◉', 'outro': '◎',
}

function bk(r: string) { return (r || 'outro').toLowerCase().trim() }

export function RestaurantPoster({ restaurant, className = '' }: { restaurant: Restaurant; className?: string }) {
  if (restaurant.img) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={restaurant.img} alt={restaurant.name} className="w-full h-full object-cover" />
      </div>
    )
  }

  const key = bk(restaurant.rede)
  const col = redeColor(restaurant.rede)
  const bg = REDE_BG[key] || '#0f1117'
  const ico = REDE_ICO[key] || '◎'
  const rede = key === 'outro' ? '' : restaurant.rede.charAt(0).toUpperCase() + restaurant.rede.slice(1)
  const name = restaurant.name.length > 16 ? restaurant.name.slice(0, 15) + '…' : restaurant.name

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ background: bg }}>
      <svg viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <defs>
          <linearGradient id={`g${restaurant.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={col} stopOpacity="0.15"/>
            <stop offset="100%" stopColor={col} stopOpacity="0.05"/>
          </linearGradient>
        </defs>
        {/* Fundo com gradiente */}
        <rect width="200" height="300" fill={`url(#g${restaurant.id})`}/>
        {/* Padrão sutil */}
        <circle cx="160" cy="60" r="80" fill={col} opacity="0.06"/>
        <circle cx="40" cy="240" r="60" fill={col} opacity="0.04"/>
        {/* Ícone central grande */}
        <text x="100" y="130" textAnchor="middle" fontFamily="Arial" fontSize="72" opacity="0.25">{ico}</text>
        {/* Barra inferior */}
        <rect x="0" y="165" width="200" height="135" fill="rgba(0,0,0,0.82)"/>
        {/* Linha colorida */}
        <rect x="0" y="165" width="200" height="3" fill={col} opacity="0.8"/>
        {/* Tag de rede */}
        {rede && (
          <>
            <rect x="12" y="178" width={rede.length * 7 + 14} height="16" rx="8" fill={col} opacity="0.25"/>
            <text x="19" y="190" fontFamily="Arial" fontSize="9" fontWeight="700" fill={col}>{rede.toUpperCase()}</text>
          </>
        )}
        {/* Nome */}
        <text x="12" y="218" fontFamily="Georgia,serif" fontSize="16" fontWeight="700" fill="#ffffff">{name}</text>
        {/* Endereço */}
        <text x="12" y="235" fontFamily="Arial" fontSize="8.5" fill="#7a8899">
          {restaurant.addr.length > 26 ? restaurant.addr.slice(0, 25) + '…' : restaurant.addr}
        </text>
        {/* Rating */}
        {restaurant.rating && (
          <text x="12" y="288" fontFamily="Arial" fontSize="11" fill="#FFC72C" fontWeight="600">★ {restaurant.rating}</text>
        )}
      </svg>
    </div>
  )
}
