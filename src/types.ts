export type LocationCode = 'ww' | 'bb' | 'rr' | 'ss' | 'pt'// | 'ci'

export type HouseType = 'prefab' | 'custom'

export interface PokemonRecord {
  number: string
  name: string
  specialty1: string
  specialty2: string
  habitat: string
  type1: string
  type2: string
  favorites: string[]
  taste: string
  image: string
}

export interface CompatiblePokemon extends PokemonRecord {
  compatibility: number
}

export interface House {
  id: number
  location: LocationCode
  name: string
  type: HouseType
  hasDitto: boolean
  members: Array<string | null>
}