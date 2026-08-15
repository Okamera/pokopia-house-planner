import { useMemo, useState, useRef, useEffect } from 'react'
import { useDroppable } from '@dnd-kit/react'
import { DraggablePokemon } from './Pokemon'
import { useHouse } from '../HouseProvider'
import type { CompatiblePokemon, House, PokemonRecord } from '../types'
import { getPokemonByName, getSharedFavorites, getHabitats } from '../utils/houseUtils'
import { pokemonData } from '../data/data'
import FilterDropdown, { FilterDropdownSingle } from './FilterDropdown'

const favoriteCount = 5

type SharedSelectedData = {
  habitats: string[]
  favorites: string[]
}

const getPokemonFavorites = (pokemon: PokemonRecord): string[] => (
  pokemon.favorites.filter((favorite) => favorite.length > 0)
)

const habitatConflicts: Record<string, string> = {
  Dry: 'Humid',
  Humid: 'Dry',
  Bright: 'Dark',
  Dark: 'Bright',
  Cool: 'Warm',
  Warm: 'Cool'
}

const canHouseHoldDitto = (house: House) => !(house.type === 'custom' && house.members.length === 1)

const getCompatibilityMembers = (house: House): House['members'] => {
  if (house.type !== 'prefab' || house.members.length !== 4) {
    return house.members
  }

  const emptyIndex = house.members.findIndex((member) => member === null)
  if (emptyIndex === -1) {
    return house.members
  }

  return emptyIndex < 2 ? house.members.slice(0, 2) : house.members.slice(2, 4)
}

const habitatFilterOptions = [
  { value: 'all', text: 'All habitats' },
  { value: 'compatible', text: 'Compatible' },
  { value: 'matching', text: 'Matching only' }
]

export const CompatabilityList = () => {
  const { houses, selectedHouseId, dragAndDropEnabled, moveToHouse, hasDLC } = useHouse()
  const { ref: compatabilityRef } = useDroppable({
    id: 'compatability-list',
  })
  const selectedHouse = houses.find((house) => house.id === selectedHouseId) ?? null
  const [selectedSpecialties, setSelectedSpecialties] = useState<Set<string>>(new Set())
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set())
  const [habitatFilter, setHabitatFilter] = useState({value: 'all', text: 'All habitats'})
  const [nameSearch, setNameSearch] = useState('')
  const [showSpecialtyIcons, setShowSpecialtyIcons] = useState(true)

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
    pokemonData.forEach((pokemon) => {
      if (pokemon.specialty1.trim()) set.add(pokemon.specialty1.trim())
      if (pokemon.specialty2.trim()) set.add(pokemon.specialty2.trim())
    })
    return Array.from(set).sort((a, b) => {
      if (a === '???') return 1
      if (b === '???') return -1
      return a.localeCompare(b)
    })
  }, [])

  const types = useMemo(() => {
    const set = new Set<string>()
    pokemonData.forEach((pokemon) => {
      if (pokemon.type1.trim()) set.add(pokemon.type1.trim())
      if (pokemon.type2.trim()) set.add(pokemon.type2.trim())
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [])

  const filteredData = useMemo(() => {
    const assignedPokemon = new Set(
      houses.flatMap((house) => house.members.filter((member): member is string => member !== null)),
    )
    console.log('types', selectedTypes)
    return pokemonData
      .filter((pokemon) => 
        (pokemon.name === 'Ditto'
          ? !selectedHouse || canHouseHoldDitto(selectedHouse)
          : !assignedPokemon.has(pokemon.name))
        && (hasDLC || !pokemon.isDLC)
        && (selectedSpecialties.size === 0
          || selectedSpecialties.has(pokemon.specialty1)
          || selectedSpecialties.has(pokemon.specialty2))
        && (selectedTypes.size === 0
          || selectedTypes.has(pokemon.type1)
          || selectedTypes.has(pokemon.type2))
        && (nameSearch.trim() === '' || pokemon.name.toLowerCase().includes(nameSearch.trim().toLowerCase()))
      )
  }, [pokemonData, houses, nameSearch, selectedHouse, selectedSpecialties, hasDLC, selectedTypes])

  const sharedSelectedData = useMemo<SharedSelectedData | null>(() => {
    if (!selectedHouse) {
      return null
    }

    const compatibilityMembers = getCompatibilityMembers(selectedHouse)
    const firstMember = compatibilityMembers.find((member): member is string => member !== null) ?? null
    if (!firstMember) {
      return null
    }

    const pokemon = getPokemonByName(firstMember)
    if (!pokemon) {
      return null
    }

    return {
      habitats: getHabitats(compatibilityMembers),
      favorites: getSharedFavorites(compatibilityMembers),
    }
  }, [selectedHouse])

  const compatiblePokemon = useMemo<CompatiblePokemon[]>(() => {
    if (!sharedSelectedData) {
      return filteredData.map((pokemon) => ({ ...pokemon, compatibility: 0 }))
    }

    const compatibleList = filteredData.map((pokemon: PokemonRecord) => {
      if (!sharedSelectedData) return { ...pokemon, compatibility: 0 }
      
      // For 'all' mode, skip habitat filtering entirely
      if (habitatFilter.value === 'all') {
        const sharedFavorites = getPokemonFavorites(pokemon).filter((favorite) =>
          sharedSelectedData.favorites.includes(favorite)
        )
        if (sharedFavorites.length === 0) return { ...pokemon, compatibility: 0 }
        return {
          ...pokemon,
          compatibility: sharedFavorites.length > 0 ? (sharedFavorites.length * 100) / favoriteCount : 0,
        }
      }

      // For 'compatible' and 'matching' modes, always hide conflicting habitats
      const conflictingHabitats = sharedSelectedData.habitats.map(h => habitatConflicts[h])
      if (conflictingHabitats.some(h => h && pokemon.habitat === h)) return { ...pokemon, compatibility: 0 }
      
      // For 'matching' mode, also hide non-matching habitats
      if (habitatFilter.value === 'matching' && !sharedSelectedData.habitats.includes(pokemon.habitat)) return { ...pokemon, compatibility: 0 }

      const sharedFavorites = getPokemonFavorites(pokemon).filter((favorite) =>
        sharedSelectedData.favorites.includes(favorite)
      )

      if (sharedFavorites.length === 0) return { ...pokemon, compatibility: 0 }

      return {
        ...pokemon,
        compatibility: sharedFavorites.length > 0 ? (sharedFavorites.length * 100) / favoriteCount : 0,
      }
    })

    compatibleList.sort((leftPokemon, rightPokemon) => rightPokemon.compatibility - leftPokemon.compatibility)
    return compatibleList
  }, [filteredData, sharedSelectedData, habitatFilter])

  return (
    <div id="compatability-container">
      <div id="compatability-header">
        <div id="name-search-wrapper">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            id="name-search"
            type="text"
            placeholder="Search"
            value={nameSearch}
            onChange={(e) => setNameSearch(e.target.value)}
          />
          {nameSearch && (
            <button id="name-search-clear" onClick={() => setNameSearch('')}>✕</button>
          )}
        </div>
        <FilterDropdown
          selected={selectedSpecialties}
          setSelected={setSelectedSpecialties}
          items={specialties}
          text={selectedSpecialties.size === 0 ? 'All Specialties' : selectedSpecialties.size === 1 ? '1 Specialty' : `${selectedSpecialties.size} Specialties`}
        />
        <FilterDropdown
          selected={selectedTypes}
          setSelected={setSelectedTypes}
          items={types}
          text={selectedTypes.size === 0 ? 'All Types' : selectedTypes.size === 1 ? `${selectedTypes.values().next().value} Type` : `${selectedTypes.size} Types`}
        />
        <button
          id="specialty-icons-toggle"
          className={showSpecialtyIcons ? 'active' : ''}
          onClick={() => setShowSpecialtyIcons((v) => !v)}
          title={showSpecialtyIcons ? 'Hide specialty icons' : 'Show specialty icons'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="9" y1="9" x2="15" y2="9" />
            <line x1="9" y1="15" x2="15" y2="15" />
          </svg>
          {showSpecialtyIcons ? 'Icons: on' : 'Icons: off'}
        </button>
        {selectedHouse && (
          <FilterDropdownSingle
            selected={habitatFilter}
            setSelected={setHabitatFilter}
            items={habitatFilterOptions}
            selectedText={`Habitat: ${habitatFilter.value}`}
          />
        )}
      </div>
      <ul ref={compatabilityRef} id="compatability-list">
        {compatiblePokemon.map((pokemon) => (
          <DraggablePokemon key={pokemon.name} pokemon={pokemon} showIcons={showSpecialtyIcons} isDraggable={dragAndDropEnabled} onClick={() => selectedHouseId ? moveToHouse(pokemon.name, selectedHouseId) : null} />
        ))}
      </ul>
    </div>
  )
}

