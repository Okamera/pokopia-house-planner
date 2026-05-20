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

export type FurnitureFloorKey = 'house' | 'floor1' | 'floor2'

export type HouseFurnitureSelections = Partial<Record<FurnitureFloorKey, string[]>>

export type FurnitureSelectionsByHouse = Record<number, HouseFurnitureSelections>

export interface House {
  id: number
  location: LocationCode
  name: string
  type: HouseType
  hasDitto: boolean
  members: Array<string | null>
  furniture: string[][]
}

export type Sort = {
  col: string
  dir: 'asc' | 'desc'
}

export type FurnitureItem = {
  name: string;
  image: string;
  categories: string[];
  type: string;
  favPercent?: number;
};
