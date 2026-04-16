import type { Achievement } from './types'

export const GPLACES_KEY = ['AIzaSyAhzE6fe', 'vFrKs5q5MiZQr', 'Pp2l326QtN0FI'].join('')

export const REDE_COLORS: Record<string, string> = {
  "mcdonald's": '#DA291C',
  'burger king': '#F5821F',
  "bob's": '#003087',
  'kfc': '#e4002b',
  'subway': '#009B48',
  'pizzaria': '#cc3300',
  'hamburgueria': '#8B4513',
  'bar': '#7c3aed',
  'outro': '#4ade80',
}

export const REDE_EMOJIS: Record<string, string> = {
  "mcdonald's": '🍔',
  'burger king': '👑',
  "bob's": '🧃',
  'kfc': '🍗',
  'subway': '🥖',
}

export function bk(rede: string) {
  return (rede || 'outro').toLowerCase().trim()
}

export function redeColor(rede: string) {
  return REDE_COLORS[bk(rede)] || '#4ade80'
}

export function redeEmoji(rede: string): string | null {
  return REDE_EMOJIS[bk(rede)] || null
}

export function detectRede(name: string): string {
  const n = name.toLowerCase()
  if (n.includes("mcdonald") || n.includes("méqui")) return "McDonald's"
  if (n.includes("burger king")) return "Burger King"
  if (n.includes("bob's") || n.includes("bobs")) return "Bob's"
  if (n.includes("kfc")) return "KFC"
  if (n.includes("subway")) return "Subway"
  if (n.includes("pizz")) return "Pizzaria"
  if (n.includes("hamburguer") || n.includes("smash") || n.includes("burger")) return "Hamburgueria"
  if (n.includes("bar ") || n.startsWith("bar") || n.includes("boteco")) return "Bar"
  return "Outro"
}

export function tAgo(ts: string): string {
  if (!ts) return ''
  const d = (Date.now() - new Date(ts).getTime()) / 1000
  if (d < 60) return 'agora'
  if (d < 3600) return Math.floor(d / 60) + 'min'
  if (d < 86400) return Math.floor(d / 3600) + 'h'
  return Math.floor(d / 86400) + 'd'
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first', ico: '🍴', name: 'Primeiro Garfado', desc: 'Garfou seu primeiro restaurante' },
  { id: 'five', ico: '⭐', name: 'Cinco Estrelas', desc: 'Garfou 5 lugares diferentes' },
  { id: 'ten', ico: '🔥', name: 'Em Chamas', desc: 'Garfou 10 lugares diferentes' },
  { id: 'twenty', ico: '🏆', name: 'Garfador', desc: 'Garfou 20 lugares diferentes' },
  { id: 'fifty', ico: '👑', name: 'Rei do Garfo', desc: 'Garfou 50 lugares diferentes' },
  { id: 'hundred', ico: '💎', name: 'Lendário', desc: 'Garfou 100 lugares diferentes' },
  { id: 'critic', ico: '📝', name: 'Crítico', desc: 'Avaliou 10 restaurantes' },
  { id: 'social', ico: '👥', name: 'Social', desc: 'Seguiu 5 amigos' },
  { id: 'hunter_mcdonalds', ico: '🍔', name: 'Fã do Méqui', desc: 'Garfou 3 McDonald\'s' },
  { id: 'hunter_bk', ico: '👑', name: 'O Rei', desc: 'Garfou 3 Burger Kings' },
  { id: 'lover', ico: '❤️', name: 'Apaixonado', desc: 'Favoritou 5 restaurantes' },
  { id: 'repeater', ico: '🔄', name: 'Fiel', desc: 'Voltou 5 vezes ao mesmo lugar' },
]
