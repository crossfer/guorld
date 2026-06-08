export interface Keeper {
  id: string
  display_name: string | null
  instagram: string | null
  total_km: number
  created_at: string
}

export interface Entry {
  id: string
  coin_id: string
  keeper_id: string | null
  story: string | null
  photo_url: string | null
  lat: number | null
  lng: number | null
  location_name: string | null
  days_held: number | null
  created_at: string
  keeper: Keeper | null
}

export interface Coin {
  id: string
  slug: string
  name: string | null
  created_at: string
  total_km: number
  is_active: boolean
  story_so_far: string | null
  story_so_far_updated_at: string | null
}
