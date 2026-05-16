import { useMemo, useState, useRef, useEffect } from 'react'
import { useDroppable } from '@dnd-kit/react'
import { DraggablePokemon } from './Pokemon'
import { useHouse } from '../HouseProvider'
import type { CompatiblePokemon, House, PokemonRecord } from '../types'
import { getPokemonByName, getSharedFavorites, getHabitats } from '../utils/houseUtils'

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

export const CompatabilityList = ({ data }: CompatibilityListProps) => {
  const { houses, selectedHouseId, dragAndDropEnabled, moveToHouse } = useHouse()
  const { ref: compatabilityRef } = useDroppable({
    id: 'compatability-list',
  })
  const selectedHouse = houses.find((house) => house.id === selectedHouseId) ?? null
  const [selectedSpecialties, setSelectedSpecialties] = useState<Set<string>>(new Set())
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [habitatFilter, setHabitatFilter] = useState<'all' | 'compatible' | 'matching'>('compatible')
  const [nameSearch, setNameSearch] = useState('')
  const [showSpecialtyIcons, setShowSpecialtyIcons] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const habitatDropdownRef = useRef<HTMLDivElement>(null)
  const [habitatDropdownOpen, setHabitatDropdownOpen] = useState(false)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
      if (habitatDropdownRef.current && !habitatDropdownRef.current.contains(e.target as Node)) {
        setHabitatDropdownOpen(false)
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
      .filter((pokemon) => pokemon.name === 'Ditto'
        ? !selectedHouse || canHouseHoldDitto(selectedHouse)
        : !assignedPokemon.has(pokemon.name))
      .filter((pokemon) => selectedSpecialties.size === 0 || selectedSpecialties.has(pokemon.specialty1) || selectedSpecialties.has(pokemon.specialty2))
      .filter((pokemon) => nameSearch.trim() === '' || pokemon.name.toLowerCase().includes(nameSearch.trim().toLowerCase()))
  }, [data, houses, nameSearch, selectedHouse, selectedSpecialties])

  const sharedSelectedData = useMemo<SharedSelectedData | null>(() => {
    if (!selectedHouse) {
      return null
    }

    const compatibilityMembers = getCompatibilityMembers(selectedHouse)
    const firstMember = compatibilityMembers.find((member): member is string => member !== null) ?? null
    if (!firstMember) {
      return null
    }

    const pokemon = getPokemonByName(data, firstMember)
    if (!pokemon) {
      return null
    }

    return {
      habitats: getHabitats(compatibilityMembers, data),
      favorites: getSharedFavorites(compatibilityMembers, data),
    }
  }, [data, selectedHouse])

  const compatiblePokemon = useMemo<CompatiblePokemon[]>(() => {
    if (!sharedSelectedData) {
      return filteredData.map((pokemon) => ({ ...pokemon, compatibility: 0 }))
    }

    const compatibleList = filteredData.map((pokemon: PokemonRecord) => {
      if (!sharedSelectedData) return { ...pokemon, compatibility: 0 }
      
      // For 'all' mode, skip habitat filtering entirely
      if (habitatFilter === 'all') {
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
      if (habitatFilter === 'matching' && !sharedSelectedData.habitats.includes(pokemon.habitat)) return { ...pokemon, compatibility: 0 }

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
          <div id="habitat-filter" ref={habitatDropdownRef}>
            <button
              id="habitat-filter-trigger"
              className={habitatDropdownOpen ? 'open' : ''}
              onClick={() => setHabitatDropdownOpen((o) => !o)}
            >
              <span>
                {habitatFilter === 'all' && 'Habitat: all'}
                {habitatFilter === 'compatible' && 'Habitat: compatible'}
                {habitatFilter === 'matching' && 'Habitat: matching'}
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {habitatDropdownOpen && (
              <ul id="habitat-dropdown">
                <li>
                  <button
                    className={habitatFilter === 'all' ? 'active' : ''}
                    onClick={() => {
                      setHabitatFilter('all')
                      setHabitatDropdownOpen(false)
                    }}
                  >
                    All habitats
                  </button>
                </li>
                <li>
                  <button
                    className={habitatFilter === 'compatible' ? 'active' : ''}
                    onClick={() => {
                      setHabitatFilter('compatible')
                      setHabitatDropdownOpen(false)
                    }}
                  >
                    Compatible
                  </button>
                </li>
                <li>
                  <button
                    className={habitatFilter === 'matching' ? 'active' : ''}
                    onClick={() => {
                      setHabitatFilter('matching')
                      setHabitatDropdownOpen(false)
                    }}
                  >
                    Matching only
                  </button>
                </li>
              </ul>
            )}
          </div>
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

