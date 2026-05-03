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
        <rect width="200" height="300" fill={col} opacity="0.08"/>
        <text x="100" y="115" textAnchor="middle" fontFamily="Arial" fontSize="80" fill={col} opacity="0.3">{ico}</text>
        <rect x="0" y="145" width="200" height="155" fill="rgba(0,0,0,0.78)"/>
        <line x1="0" y1="146" x2="200" y2="146" stroke={col} strokeWidth="2" opacity="0.6"/>
        <text x="100" y="180" textAnchor="middle" fontFamily="Georgia,serif" fontSize="17" fontWeight="700" fill="#ffffff">{name}</text>
        <text x="100" y="205" textAnchor="middle" fontFamily="Arial" fontSize="9" fill="#8899aa">
          {restaurant.addr.length > 22 ? restaurant.addr.slice(0, 21) + '…' : restaurant.addr}
        </text>
        {rede && (
          <>
            <rect x={100 - rede.length * 4 - 8} y="218" width={rede.length * 8 + 16} height="18" rx="9" fill={col} opacity="0.3"/>
            <rect x={100 - rede.length * 4 - 8} y="218" width={rede.length * 8 + 16} height="18" rx="9" fill="none" stroke={col} strokeWidth="1" opacity="0.7"/>
            <text x="100" y="230" textAnchor="middle" fontFamily="Arial" fontSize="9.5" fontWeight="700" fill={col}>{rede}</text>
          </>
        )}
        {restaurant.rating && (
          <text x="100" y="288" textAnchor="middle" fontFamily="Arial" fontSize="10" fill="#FFC72C">★ {restaurant.rating}</text>
        )}
      </svg>
    </div>
  )
}
