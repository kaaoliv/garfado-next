export interface Restaurant {
  id: number
  name: string
  addr: string
  rede: string
  rating: number | null
  img: string | null
  hours: string
  place_id: string | null
}

export interface Profile {
  id: string
  name: string
  username: string
  avatar_url: string | null
  bio: string | null
}

export interface Visit {
  restaurant_id: number
  count: number
  updated_at: string
}

export interface Rating {
  restaurant_id: number
  comida: number | null
  atendimento: number | null
  limpeza: number | null
  banheiro: number | null
  nota: string | null
}

export interface FeedItem {
  user_id: string
  restaurant_id: number
  restaurant_name: string
  restaurant_rede: string
  count: number
  updated_at: string
  profiles: {
    id: string
    name: string
    username: string
    avatar_url: string | null
  } | null
}

export interface FriendVisit {
  name: string
  avatar: string | null
  count: number
  uid: string
}

export interface RankingEntry {
  profile: Profile
  garfCount: number
  isMe: boolean
}

export interface PlaceResult {
  placeId: string
  name: string
  addr: string
  rating: number | null
  photo: string | null
}

export interface Review {
  id: string
  user_id: string
  text: string
  name: string
  avatar: string | null
  created_at: string
}

export interface Achievement {
  id: string
  ico: string
  name: string
  desc: string
}
