'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Restaurant, Profile, Review, RankingEntry, PlaceResult, FeedItem } from '@/lib/types'
import { GPLACES_KEY, detectRede } from '@/lib/constants'
import type { User } from '@supabase/supabase-js'

interface AppState {
  user: User | null
  profile: Profile | null
  restaurants: Restaurant[]
  visits: Record<number, number>
  visitDates: Record<number, string>
  ratings: Record<number, { Comida?: number; Atendimento?: number; Limpeza?: number; Banheiro?: number; nota?: string }>
  likes: Record<number, boolean>
  achs: Set<string>
  friends: string[]
  followers: Profile[]
  feed: FeedItem[]
  friendVisits: Record<number, { name: string; avatar: string | null; count: number; uid: string }[]>
  ranking: RankingEntry[]
  reactions: Record<string, number>
  myReactions: Record<string, boolean>
  placesCache: Record<number, string | null>
  trending: { rid: number; cnt: number }[]
  searchResults: PlaceResult[]
  loading: boolean
  onboarding: boolean
}

interface AppActions {
  loadData: () => Promise<void>
  fetchRestaurants: () => Promise<void>
  addVisit: (rid: number, delta: number) => Promise<void>
  toggleLike: (rid: number) => Promise<void>
  setRating: (rid: number, field: string, val: number) => Promise<void>
  setNote: (rid: number, nota: string) => Promise<void>
  searchPlaces: (q: string) => Promise<void>
  clearSearch: () => void
  addFromPlaces: (place: PlaceResult) => Promise<number | null>
  fetchPlacePhoto: (r: Restaurant) => Promise<void>
  reactFeed: (feedKey: string) => Promise<void>
  loadReviews: (rid: number) => Promise<Review[]>
  submitReview: (rid: number, text: string) => Promise<void>
  deleteReview: (id: string, rid: number) => Promise<void>
  finishOnboarding: (username: string, name: string) => Promise<boolean>
  signOut: () => Promise<void>
  setProfile: (p: Profile) => void
}

const AppContext = createContext<(AppState & AppActions) | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>({
    user: null, profile: null, restaurants: [], visits: {}, visitDates: {},
    ratings: {}, likes: {}, achs: new Set(), friends: [], followers: [],
    feed: [], friendVisits: {}, ranking: [], reactions: {}, myReactions: {},
    placesCache: {}, searchResults: [], trending: [], loading: true, onboarding: false,
  })

  const update = (patch: Partial<AppState>) => setState(s => ({ ...s, ...patch }))

  // Auth
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
        update({ user: session.user, profile: prof, onboarding: !prof?.username, loading: false })
        loadDataFor(session.user.id)
        fetchRestaurantsData()
      } else {
        update({ loading: false })
      }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
        update({ user: session.user, profile: prof, onboarding: !prof?.username })
        loadDataFor(session.user.id)
        fetchRestaurantsData()
        loadTrending()
      } else if (event === 'SIGNED_OUT') {
        update({ user: null, profile: null, restaurants: [], visits: {}, likes: {}, achs: new Set(), friends: [], feed: [] })
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const loadDataFor = async (uid: string) => {
    const [vR, rR, lR, aR, fR, folR] = await Promise.all([
      supabase.from('visits').select('*').eq('user_id', uid),
      supabase.from('ratings').select('*').eq('user_id', uid),
      supabase.from('likes').select('*').eq('user_id', uid),
      supabase.from('achievements').select('*').eq('user_id', uid),
      supabase.from('friendships').select('following_id').eq('follower_id', uid),
      supabase.from('friendships').select('follower_id').eq('following_id', uid),
    ])
    const visits: Record<number, number> = {}
    const visitDates: Record<number, string> = {}
    ;(vR.data || []).forEach((v: any) => { visits[v.restaurant_id] = v.count || 1; if (v.updated_at) visitDates[v.restaurant_id] = v.updated_at })
    const ratings: Record<number, any> = {}
    ;(rR.data || []).forEach((r: any) => { ratings[r.restaurant_id] = { Comida: r.comida, Atendimento: r.atendimento, Limpeza: r.limpeza, Banheiro: r.banheiro, nota: r.nota } })
    const likes: Record<number, boolean> = {}
    ;(lR.data || []).forEach((l: any) => { likes[l.restaurant_id] = true })
    const achs = new Set<string>((aR.data || []).map((a: any) => a.achievement_id))
    const friends = (fR.data || []).map((f: any) => f.following_id)
    const followerIds = (folR.data || []).map((f: any) => f.follower_id).filter(Boolean)
    let followers: Profile[] = []
    if (followerIds.length) {
      const { data: fp } = await supabase.from('profiles').select('*').in('id', followerIds)
      followers = fp || []
    }
    update({ visits, visitDates, ratings, likes, achs, friends, followers })
    if (friends.length) loadFriendData(friends, uid)
  }

  const loadTrending = async () => {
    const weekAgo = new Date(Date.now() - 7*24*60*60*1000).toISOString()
    const { data } = await supabase.from('visits').select('restaurant_id,count').gte('updated_at', weekAgo)
    const map: Record<number, number> = {}
    ;(data || []).forEach((v: any) => { map[v.restaurant_id] = (map[v.restaurant_id] || 0) + (v.count || 1) })
    const trending = Object.entries(map)
      .sort((a, b) => +b[1] - +a[1]).slice(0, 6)
      .map(([rid, cnt]) => ({ rid: parseInt(rid), cnt: cnt as number }))
    update({ trending })
  }

  const loadFriendData = async (friends: string[], uid: string) => {
    const allIds = [uid, ...friends]
    const [feedR, fvR, rxR, myRxR, profR, visR] = await Promise.all([
      supabase.from('visits').select('*, profiles(id,name,username,avatar_url)').in('user_id', friends).order('updated_at', { ascending: false }).limit(40),
      supabase.from('visits').select('restaurant_id,count,user_id,profiles(name,avatar_url)').in('user_id', friends),
      supabase.from('reactions').select('feed_key,count').eq('type', 'fire'),
      supabase.from('reactions').select('feed_key').eq('user_id', uid),
      supabase.from('profiles').select('id,name,username,avatar_url').in('id', allIds),
      supabase.from('visits').select('user_id,restaurant_id').in('user_id', allIds),
    ])
    const feed = feedR.data || []
    const friendVisits: Record<number, any[]> = {}
    ;(fvR.data || []).forEach((v: any) => {
      if (!friendVisits[v.restaurant_id]) friendVisits[v.restaurant_id] = []
      const p = v.profiles || {}
      friendVisits[v.restaurant_id].push({ name: p.name || '?', avatar: p.avatar_url || null, count: v.count || 1, uid: v.user_id })
    })
    const reactions: Record<string, number> = {}
    ;(rxR.data || []).forEach((r: any) => { reactions[r.feed_key] = (reactions[r.feed_key] || 0) + 1 })
    const myReactions: Record<string, boolean> = {}
    ;(myRxR.data || []).forEach((r: any) => { myReactions[r.feed_key] = true })
    // ranking
    const profiles = profR.data || []
    const visitsByUser: Record<string, Set<number>> = {}
    ;(visR.data || []).forEach((v: any) => {
      if (!visitsByUser[v.user_id]) visitsByUser[v.user_id] = new Set()
      visitsByUser[v.user_id].add(v.restaurant_id)
    })
    const ranking: RankingEntry[] = profiles.map((p: any) => ({
      profile: p, garfCount: (visitsByUser[p.id] || new Set()).size, isMe: p.id === uid,
    })).sort((a: any, b: any) => b.garfCount - a.garfCount)
    update({ feed, friendVisits, reactions, myReactions, ranking })
  }

  const fetchRestaurantsData = async () => {
    const { data } = await supabase.from('restaurants').select('*').order('name')
    if (data) update({ restaurants: data })
  }

  const addVisit = async (rid: number, delta: number) => {
    const prev = state.visits[rid] || 0
    const next = Math.max(0, prev + delta)
    const now = new Date().toISOString()
    setState(s => {
      const visits = { ...s.visits, [rid]: next }
      const visitDates = { ...s.visitDates }
      if (next === 0) delete visitDates[rid]
      else if (!visitDates[rid]) visitDates[rid] = now
      return { ...s, visits, visitDates }
    })
    if (next === 0) {
      await supabase.from('visits').delete().eq('user_id', state.user!.id).eq('restaurant_id', rid)
    } else {
      const r = state.restaurants.find(x => x.id === rid)
      await supabase.from('visits').upsert({
        user_id: state.user!.id, restaurant_id: rid,
        restaurant_name: r?.name || '', restaurant_rede: r?.rede || 'Outro',
        count: next, updated_at: now,
      }, { onConflict: 'user_id,restaurant_id' })
    }
  }

  const toggleLike = async (rid: number) => {
    const val = !state.likes[rid]
    setState(s => ({ ...s, likes: { ...s.likes, [rid]: val } }))
    if (val) await supabase.from('likes').upsert({ user_id: state.user!.id, restaurant_id: rid })
    else await supabase.from('likes').delete().eq('user_id', state.user!.id).eq('restaurant_id', rid)
  }

  const setRating = async (rid: number, field: string, val: number) => {
    setState(s => ({ ...s, ratings: { ...s.ratings, [rid]: { ...s.ratings[rid], [field]: val } } }))
    const mr = state.ratings[rid] || {}
    await supabase.from('ratings').upsert({
      user_id: state.user!.id, restaurant_id: rid,
      comida: field === 'Comida' ? val : mr.Comida || null,
      atendimento: field === 'Atendimento' ? val : mr.Atendimento || null,
      limpeza: field === 'Limpeza' ? val : mr.Limpeza || null,
      banheiro: field === 'Banheiro' ? val : mr.Banheiro || null,
      nota: mr.nota || null, updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,restaurant_id' })
  }

  const setNote = async (rid: number, nota: string) => {
    setState(s => ({ ...s, ratings: { ...s.ratings, [rid]: { ...s.ratings[rid], nota } } }))
    const mr = state.ratings[rid] || {}
    await supabase.from('ratings').upsert({
      user_id: state.user!.id, restaurant_id: rid,
      comida: mr.Comida || null, atendimento: mr.Atendimento || null,
      limpeza: mr.Limpeza || null, banheiro: mr.Banheiro || null,
      nota, updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,restaurant_id' })
  }

  const searchPlaces = async (q: string) => {
    if (!q || q.length < 2) { update({ searchResults: [] }); return }
    try {
      const resp = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': GPLACES_KEY, 'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.photos,places.rating' },
        body: JSON.stringify({ textQuery: q + ' restaurante Brasil', languageCode: 'pt-BR', regionCode: 'BR', maxResultCount: 5 }),
      })
      const data = await resp.json()
      const results: PlaceResult[] = (data.places || []).map((p: any) => ({
        placeId: p.id, name: p.displayName?.text || '', addr: p.formattedAddress || '',
        rating: p.rating || null,
        photo: p.photos?.[0] ? `https://places.googleapis.com/v1/${p.photos[0].name}/media?maxHeightPx=600&maxWidthPx=400&key=${GPLACES_KEY}` : null,
      }))
      update({ searchResults: results })
    } catch { update({ searchResults: [] }) }
  }

  const clearSearch = () => update({ searchResults: [] })

  const addFromPlaces = async (place: PlaceResult): Promise<number | null> => {
    let rid: number | null = null
    const rede = detectRede(place.name)

    // 1. Verificar se já existe pelo place_id
    if (place.placeId) {
      const { data: ex } = await supabase.from('restaurants').select('id').eq('place_id', place.placeId).maybeSingle()
      if (ex) {
        rid = ex.id
        // Garantir que está na memória local
        setState(s => {
          if (s.restaurants.find(r => r.id === rid)) return s
          const newR = { id: rid!, name: place.name, addr: place.addr, rede, rating: place.rating, img: place.photo, hours: '–', place_id: place.placeId || null }
          return { ...s, restaurants: [...s.restaurants, newR] }
        })
      }
    }

    // 2. Inserir novo no Supabase
    if (!rid) {
      const { data: ins, error } = await supabase.from('restaurants').insert({
        name: place.name, addr: place.addr, rede, rating: place.rating,
        img: place.photo, place_id: place.placeId || null, hours: '–',
      }).select().single()

      if (ins && !error) {
        rid = ins.id
        setState(s => ({ ...s, restaurants: [...s.restaurants, ins] }))
      } else {
        // 3. Fallback: usar ID temporário em memória se Supabase falhar
        const tempId = Date.now()
        const tempR = { id: tempId, name: place.name, addr: place.addr, rede, rating: place.rating, img: place.photo, hours: '–', place_id: place.placeId || null }
        setState(s => ({ ...s, restaurants: [...s.restaurants, tempR] }))
        rid = tempId
      }
    }

    update({ searchResults: [] })
    return rid
  }

  const fetchPlacePhoto = async (r: Restaurant) => {
    if (r.img || state.placesCache[r.id] !== undefined) return
    try {
      const resp = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': GPLACES_KEY, 'X-Goog-FieldMask': 'places.id,places.photos' },
        body: JSON.stringify({ textQuery: r.name + ' ' + r.addr.split(',')[0], languageCode: 'pt-BR', regionCode: 'BR', maxResultCount: 1 }),
      })
      const data = await resp.json()
      const photo = data.places?.[0]?.photos?.[0]
      const url = photo ? `https://places.googleapis.com/v1/${photo.name}/media?maxHeightPx=600&maxWidthPx=400&key=${GPLACES_KEY}` : null
      setState(s => ({
        ...s,
        placesCache: { ...s.placesCache, [r.id]: url },
        restaurants: s.restaurants.map(x => x.id === r.id ? { ...x, img: url || x.img } : x),
      }))
    } catch {
      setState(s => ({ ...s, placesCache: { ...s.placesCache, [r.id]: null } }))
    }
  }

  const reactFeed = async (feedKey: string) => {
    const isOn = state.myReactions[feedKey]
    setState(s => ({
      ...s,
      myReactions: { ...s.myReactions, [feedKey]: !isOn },
      reactions: { ...s.reactions, [feedKey]: Math.max(0, (s.reactions[feedKey] || 0) + (isOn ? -1 : 1)) },
    }))
    if (isOn) await supabase.from('reactions').delete().eq('user_id', state.user!.id).eq('feed_key', feedKey)
    else await supabase.from('reactions').upsert({ user_id: state.user!.id, feed_key: feedKey, type: 'fire' }, { onConflict: 'user_id,feed_key' })
  }

  const loadReviews = async (rid: number): Promise<Review[]> => {
    const { data } = await supabase.from('reviews').select('*, profiles(name,avatar_url)').eq('restaurant_id', rid).order('created_at', { ascending: false }).limit(20)
    return (data || []).map((r: any) => ({ id: r.id, user_id: r.user_id, text: r.text, name: r.profiles?.name || 'Anônimo', avatar: r.profiles?.avatar_url || null, created_at: r.created_at }))
  }

  const submitReview = async (rid: number, text: string) => {
    await supabase.from('reviews').insert({ user_id: state.user!.id, restaurant_id: rid, text })
  }

  const deleteReview = async (id: string) => {
    await supabase.from('reviews').delete().eq('id', id).eq('user_id', state.user!.id)
  }

  const finishOnboarding = async (username: string, name: string): Promise<boolean> => {
    const { error } = await supabase.from('profiles').update({ username, name }).eq('id', state.user!.id)
    if (error?.code === '23505') return false
    setState(s => ({ ...s, profile: { ...s.profile!, username, name }, onboarding: false }))
    return true
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const setProfile = (p: Profile) => update({ profile: p })

  return (
    <AppContext.Provider value={{
      ...state,
      loadData: () => loadDataFor(state.user!.id),
      fetchRestaurants: fetchRestaurantsData,
      addVisit, toggleLike, setRating, setNote,
      searchPlaces, clearSearch, addFromPlaces, fetchPlacePhoto,
      reactFeed, loadReviews, submitReview, deleteReview,
      finishOnboarding, signOut, setProfile,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
