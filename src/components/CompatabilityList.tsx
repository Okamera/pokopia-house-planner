import { useMemo, useState, useRef, useEffect } from 'react'
import { DraggablePokemon } from './Pokemon'
import { useHouse } from '../HouseProvider'
import type { CompatiblePokemon, House, PokemonRecord } from '../types'

const favoriteCount = 5

type SharedSelectedData = {
  habitats: string[]
  favorites: string[]
}

type CompatibilityListProps = {
  data: PokemonRecord[]
}

const getPokemonFavorites = (pokemon: PokemonRecord): string[] => (
  pokemon.favorites.filter((favorite) => favorite.length > 0)
)

const getPokemonByName = (data: PokemonRecord[], name: string) => (
  data.find((pokemon) => pokemon.name === name) ?? null
)

const getSharedFavorites = (members: House['members'], data: PokemonRecord[]): string[] => {
  const memberFavorites = members
    .filter((member): member is string => member !== null)
    .map((member) => getPokemonByName(data, member))
    .filter((pokemon): pokemon is PokemonRecord => pokemon !== null)
    .map(getPokemonFavorites)

  if (memberFavorites.length === 0) {
    return []
  }

  return memberFavorites.slice(1).reduce(
    (sharedFavorites, favorites) => sharedFavorites.filter((favorite) => favorites.includes(favorite)),
    memberFavorites[0],
  )
}

const habitatConflicts: Record<string, string> = {
  Dry: 'Humid',
  Humid: 'Dry',
  Bright: 'Dark',
  Dark: 'Bright',
  Cool: 'Warm',
  Warm: 'Cool'
}

const getHabitats = (members: House['members'], data: PokemonRecord[]): string[] => {
  const habitats = members
    .filter((member): member is string => member !== null)
    .map((member) => getPokemonByName(data, member))
    .filter((pokemon): pokemon is PokemonRecord => pokemon !== null)
    .map((pokemon) => pokemon.habitat)

  return Array.from(new Set(habitats))
}

function CompatabilityList({ data }: CompatibilityListProps) {
  const { houses, selectedHouseId, moveToHouse } = useHouse()
  const selectedHouse = houses.find((house) => house.id === selectedHouseId) ?? null
  const [selectedSpecialties, setSelectedSpecialties] = useState<Set<string>>(new Set())
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [hideDiffHabitat, setHideDiffHabitat] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleSpecialty = (specialty: string) => {
    setSelectedSpecialties((prev) => {
      const next = new Set(prev)
      if (next.has(specialty)) next.delete(specialty)
      else next.add(specialty)
      return next
    })
  }

  const specialties = useMemo(() => {
    const set = new Set<string>()
    data.forEach((pokemon) => {
      if (pokemon.specialty1.trim()) set.add(pokemon.specialty1.trim())
      if (pokemon.specialty2.trim()) set.add(pokemon.specialty2.trim())
    })
    return Array.from(set).sort((a, b) => {
      if (a === '???') return 1
      if (b === '???') return -1
      return a.localeCompare(b)
    })
  }, [data])

  const filteredData = useMemo(() => {
    const assignedPokemon = new Set(
      houses.flatMap((house) => house.members.filter((member): member is string => member !== null)),
    )

    return data
      .filter((pokemon) => !assignedPokemon.has(pokemon.name))
      .filter((pokemon) => selectedSpecialties.size === 0 || selectedSpecialties.has(pokemon.specialty1) || selectedSpecialties.has(pokemon.specialty2))
  }, [data, houses, selectedSpecialties])

  const sharedSelectedData = useMemo<SharedSelectedData | null>(() => {
    const firstMember = selectedHouse?.members.find((member): member is string => member !== null) ?? null
    if (!selectedHouse || !firstMember) {
      return null
    }

    const pokemon = getPokemonByName(data, firstMember)
    if (!pokemon) {
      return null
    }

    return {
      habitats: getHabitats(selectedHouse.members, data),
      favorites: getSharedFavorites(selectedHouse.members, data),
    }
  }, [data, selectedHouse])

  const compatiblePokemon = useMemo<CompatiblePokemon[]>(() => {
    if (!sharedSelectedData) {
      return filteredData.map((pokemon) => ({ ...pokemon, compatibility: 0 }))
    }

    const compatibleList = filteredData.reduce((acc: CompatiblePokemon[], pokemon: PokemonRecord) => {
      if (!sharedSelectedData) return acc
      const conflictingHabitats = sharedSelectedData.habitats.map(h => habitatConflicts[h])
      // Always hide directly conflicting habitats
      if (conflictingHabitats.some(h => h && pokemon.habitat === h)) return acc
      // When toggle is on, also hide non-matching habitats
      if (hideDiffHabitat && !sharedSelectedData.habitats.includes(pokemon.habitat)) return acc

      const sharedFavorites = getPokemonFavorites(pokemon).filter((favorite) =>
        sharedSelectedData.favorites.includes(favorite)
      )

      // If there are no shared favorites, the pokemon is not compatible, so we skip it
      if (sharedFavorites.length === 0) return acc

      acc.push({
        ...pokemon,
        compatibility: sharedFavorites.length > 0 ? (sharedFavorites.length * 100) / favoriteCount : 0,
      })
      return acc
    }, [])

    compatibleList.sort((leftPokemon, rightPokemon) => rightPokemon.compatibility - leftPokemon.compatibility)
    return compatibleList
  }, [filteredData, sharedSelectedData, hideDiffHabitat])

  return (
    <div id="compatability-container">
      <div id="compatability-header">
        <div id="specialty-filter" ref={dropdownRef}>
          <button
            id="specialty-filter-trigger"
            className={dropdownOpen ? 'open' : ''}
            onClick={() => setDropdownOpen((o) => !o)}
          >
            <span>
              {selectedSpecialties.size === 0
                ? 'All Specialties'
                : `${selectedSpecialties.size} selected`}
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {selectedSpecialties.size > 0 && (
            <button id="specialty-filter-clear" onClick={() => setSelectedSpecialties(new Set())}>✕</button>
          )}
          {dropdownOpen && (
            <ul id="specialty-dropdown">
              {specialties.map((specialty) => (
                <li key={specialty}>
                  <label>
                    <input
                      type="checkbox"
                      checked={selectedSpecialties.has(specialty)}
                      onChange={() => toggleSpecialty(specialty)}
                    />
                    {specialty}
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
        {selectedHouse && (
          <button
            id="habitat-filter-toggle"
            className={hideDiffHabitat ? 'active' : ''}
            onClick={() => setHideDiffHabitat((v) => !v)}
            title={hideDiffHabitat ? 'Showing matching habitat only' : 'Showing all habitats'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M7 12h10M11 18h2" />
            </svg>
            {hideDiffHabitat ? 'Habitat: match' : 'Habitat: compatible'}
          </button>
        )}
      </div>
      <ul id="compatability-list">
        {compatiblePokemon.map((pokemon) => (
          <DraggablePokemon key={pokemon.name} pokemon={pokemon} onClick={() => selectedHouseId ? moveToHouse(pokemon.name, selectedHouseId) : null} />
        ))}
      </ul>
    </div>
  )
}

export { CompatabilityList }
