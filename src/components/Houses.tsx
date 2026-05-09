import { useDraggable, useDroppable } from '@dnd-kit/react'
import { useHouse } from '../HouseProvider'
import type { House, HouseType, LocationCode, PokemonRecord, CompatiblePokemon } from '../types'
import { useState, useRef, useEffect } from 'react'
import { DraggablePokemon } from './Pokemon'
import favoriteLinksJson from '../data/favoriteLinks.json'

const favoriteLinks = favoriteLinksJson as Record<string, string>

const locations: Record<LocationCode, string> = {
  ww: 'Withered Wastelands',
  bb: 'Bleak Beach',
  rr: 'Rocky Ridges',
  ss: 'Sparkling Skylands',
  pt: 'Palette Town',
  // ci: 'Cloud Island',
}

const slotCost: Record<number, number> = {
  1: 1,
  2: 1,
  4: 2
}

const DITTO_NAME = 'Ditto'

export type HouseProps = {
  house: House
  data: PokemonRecord[]
}

export type HouseListProps = {
  data: PokemonRecord[]
}

type DittoBadgeProps = {
  houseId: number
  onActivate: () => void
}

const getPokemonByName = (data: PokemonRecord[], name: string) => (
  data.find((pokemon) => pokemon.name === name) ?? null
)

const removePokemonFromHouse = (house: House, pokemonName: string): House => {
  const memberIndex = house.members.findIndex((member) => member === pokemonName)
  if (memberIndex === -1) {
    return house
  }

  const nextMembers = [...house.members]
  nextMembers[memberIndex] = null

  return {
    ...house,
    members: nextMembers,
  }
}

const getSharedFavorites = (members: House['members'], data: PokemonRecord[]): Array<string> => {
  const nonNullMembers = members.filter((m): m is string => m !== null)
  if (nonNullMembers.length === 0) {
    return []
  }

  const favorites = nonNullMembers
    .map((member) => getPokemonByName(data, member))
    .filter((pokemon): pokemon is PokemonRecord => pokemon !== null)
    .flatMap((pokemon) => pokemon.favorites)
    .filter((fav) => fav.length > 0)

  const favoriteSet = new Set(favorites)
  const sharedFavorites = Array.from(favoriteSet).filter((fav) => {
    const count = favorites.filter((f) => f === fav).length
    return count === nonNullMembers.length
  })

  return sharedFavorites
}

const getHabitats = (members: House['members'], data: PokemonRecord[]): string[] => {
  const habitats = members
    .filter((member): member is string => member !== null)
    .map((member) => getPokemonByName(data, member))
    .filter((pokemon): pokemon is PokemonRecord => pokemon !== null)
    .map((pokemon) => pokemon.habitat)

  return Array.from(new Set(habitats))
}

const DittoBadge = ({ houseId, onActivate }: DittoBadgeProps) => {
  const { ref } = useDraggable({
    id: `${DITTO_NAME}:${houseId}`,
  })

  return (
    <span
      ref={ref}
      className='ditto-badge ditto-badge-draggable'
      onClick={(event) => {
        event.stopPropagation()
        onActivate()
      }}
      title='Remove or drag Ditto flag'
      role='button'
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          event.stopPropagation()
          onActivate()
        }
      }}
    >
      <img src='https://www.serebii.net/pokemonpokopia/items/dittoflag.png' alt='Ditto flag' />
    </span>
  )
}

export const HouseCreateForm = ()=> {
  const { generateHouse, filterLocation } = useHouse()
  const [location, setLocation] = useState<LocationCode>('ww')
  const [slots, setSlots] = useState(4)
  const [type, setType] = useState<HouseType>('custom')
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (filterLocation) setLocation(filterLocation)
  }, [filterLocation])

  const onGenerate = () => {
    generateHouse({ location, slots, type })
    setMobileOpen(false)
  }

  const pickType = (t: HouseType) => {
    setType(t)
    if (t === 'custom') {
      setSlots(4)
    }
  }

  return (
    <div id="house-create-form" className={mobileOpen ? 'mobile-open' : ''}>
      <button
        id="house-create-toggle"
        type="button"
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen((o) => !o)}
      >
        <span>Add House</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {mobileOpen
            ? <path d="M18 15l-6-6-6 6" />
            : <path d="M6 9l6 6 6-6" />}
        </svg>
      </button>
      <div className="house-create-header">Add House {">"}</div>
      <div id="house-create-fields">
        <div>
        <label>Type</label>
        <div className="toggle-group">
          {(['prefab', 'custom'] as HouseType[]).map((t) => (
            <button key={t} className={type === t ? 'active' : ''} onClick={() => pickType(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label>Slots</label>
        <div className="toggle-group">
          {(type === 'prefab' ? [1, 2, 4] : [1, 4]).map((n) => (
            <button key={n} className={slots === n ? 'active' : ''} onClick={() => setSlots(n)}>{n}</button>
          ))}
        </div>
      </div>
      <div>
        <label>Location</label>
        <select name="location" id="location" value={location} onChange={(e) => setLocation(e.target.value as LocationCode)}>
          {Object.entries(locations).map(([code, name]) => (
            <option key={code} value={code}>{name}</option>
          ))}
        </select>
      </div>
      </div>
      <button className="house-create-submit" onClick={onGenerate}>
        Add</button>
    </div>
  )
}

export const HouseCard = ({ house, data }: HouseProps) => {
  const { selectedHouseId, setSelectedHouseId, updateHouse, removeHouse } = useHouse()
  const { ref } = useDroppable({
    id: house.id,
  })
  const [editingName, setEditingName] = useState(false)
  const [editingLocation, setEditingLocation] = useState(false)
  const [nameValue, setNameValue] = useState(house.name)
  const inputRef = useRef<HTMLInputElement>(null)
  const locationSelectRef = useRef<HTMLSelectElement>(null)

  useEffect(() => {
    if (editingName) inputRef.current?.select()
  }, [editingName])

  useEffect(() => {
    if (editingLocation) locationSelectRef.current?.focus()
  }, [editingLocation])

  const commitName = () => {
    const trimmed = nameValue.trim()
    if (trimmed) updateHouse({ ...house, name: trimmed })
    else setNameValue(house.name)
    setEditingName(false)
  }

  const updateLocation = (location: LocationCode) => {
    updateHouse({ ...house, location })
    setEditingLocation(false)
  }

  const toggleSelect = () => {
    if (selectedHouseId === house.id) {
      setSelectedHouseId(null)
      return
    }
    setSelectedHouseId(house.id)
  }

  const handleMemberClick = (pokemonName: string) => {
    updateHouse(removePokemonFromHouse(house, pokemonName))
  }

  const removeDitto = () => {
    updateHouse({ ...house, hasDitto: false })
  }

  return (
    <div ref={ref} className={`house ${selectedHouseId === house.id ? 'selected ' : ''}${house.location}`} onClick={toggleSelect}>
      <div className="house-header">
        <div className='house-info'>
          {editingName ? (
            <input
              ref={inputRef}
              className='title-input'
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onBlur={commitName}
              onKeyDown={(e) => { if (e.key === 'Enter') commitName(); if (e.key === 'Escape') { setNameValue(house.name); setEditingName(false) } }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <h2 className='title' onClick={(e) => { e.stopPropagation(); setEditingName(true) }}>
              {house.hasDitto && (
                <DittoBadge houseId={house.id} onActivate={removeDitto} />
              )}
              {house.name}
              <svg className='edit-icon' xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                <path d='M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7'/>
                <path d='M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z'/>
              </svg>
            </h2>
          )}
          {editingLocation ? (
            <select
              ref={locationSelectRef}
              className='location-select'
              value={house.location}
              onChange={(e) => updateLocation(e.target.value as LocationCode)}
              onBlur={() => setEditingLocation(false)}
              onClick={(e) => e.stopPropagation()}
            >
              {(Object.entries(locations) as Array<[LocationCode, string]>).map(([code, name]) => (
                <option key={code} value={code}>{name}</option>
              ))}
            </select>
          ) : (
            <button
              type='button'
              className='location location-button'
              onClick={(e) => {
                e.stopPropagation()
                setEditingLocation(true)
              }}
            >
              {`${locations[house.location]} - ${house.type}`}
            </button>
          )}
        </div>
        <button className="remove-house" onClick={(e) => { e.stopPropagation(); removeHouse(house.id) }} title="Remove house">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--textDanger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        </button>
      </div>
      <ul>
        {house.members.map((member, memberIndex) => {
          const memberPokemon = member ? getPokemonByName(data, member) : null

          return member && memberPokemon ? (
            <DraggablePokemon
              key={`${house.id}-${memberIndex}`}
              pokemon={{ ...memberPokemon, compatibility: 0 } as CompatiblePokemon}
              showIcons
              layout="vertical"
              onClick={handleMemberClick}
            />
          ) : (
            <li key={`${house.id}-${memberIndex}`} className="member empty">?</li>
          )
        })}
      </ul>
      {(() => {
        const habitats = getHabitats(house.members, data)
        return habitats.length > 0 ? (
          <div className="house-habitats">
            {habitats.map((habitat) => (
              <span key={habitat} className="habitat-chip">{habitat}</span>
            ))}
          </div>
        ) : null
      })()}
      <div className='favorites'>{
      getSharedFavorites(house.members, data).map((favorite) => (
        <a key={favorite} className='favorite' href={favoriteLinks[favorite]} target="_blank" rel="noopener noreferrer">{favorite}</a>
      ))}</div>
    </div>
  )
}

const SortArrow = ({ col, sort }: { col: string; sort: { col: string; dir: string } }) => {
  if (sort.col !== col) {
    return (
      <svg className="sort-arrow sort-arrow-inactive" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14M5 12l7-7 7 7" />
      </svg>
    )
  }
  return sort.dir === 'asc' ? (
    <svg className="sort-arrow" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  ) : (
    <svg className="sort-arrow" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12l7 7 7-7" />
    </svg>
  )
}

export const HouseList = ({ data }: HouseListProps) => {
  const { houses, selectedHouseId, setSelectedHouseId, updateHouse, removeHouse, filterLocation, setFilterLocation } = useHouse()
  const [view, setView] = useState<'grid' | 'table'>('grid')
  const [sort, setSort] = useState({ col: 'id', dir: 'asc' })

  const updateSort = (col: string) => {
    setSort((prev) => {
      if (prev.col === col) {
        if (prev.dir === 'desc') {
          return { col: 'id', dir: 'asc' }
        }
        return { col, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
      }
      return { col, dir: 'asc' }
    })
  }

  const removePokemon = (house: House, pokemonName: string, event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    updateHouse(removePokemonFromHouse(house, pokemonName))
  }

  const locationCosts = (Object.keys(locations) as LocationCode[]).map((loc) => {
    const cost = houses
      .filter((h) => h.location === loc && h.type === 'prefab')
      .reduce((sum, h) => sum + (slotCost[h.members.length] ?? 0), 0)
    return { loc, cost }
  })

  const visibleHouses = (filterLocation
    ? houses.filter((h) => h.location === filterLocation)
    : houses).sort((a, b) => {
      let compare = 0
      if (sort.col === 'id') return a.id > b.id ? -1 : 1
      if (sort.col === 'name') {
        compare = a.name.localeCompare(b.name)
      } else if (sort.col === 'habitats') {
        const aHabitats = getHabitats(a.members, data).length
        const bHabitats = getHabitats(b.members, data).length
        compare = aHabitats - bHabitats
      } else if (sort.col === 'sharedFavorites') {
        const fav1 = getSharedFavorites(a.members, data)
        const fav2 = getSharedFavorites(b.members, data)
        compare = fav1[0]?.localeCompare(fav2[0])
      }
      return sort.dir === 'asc' ? compare : -compare
    })

  return (
    <div id="house-list-container">
      <div id="house-list-header">
        <div className="location-costs">
          {locationCosts.map(({ loc, cost }) => (
            <button
              key={loc}
              type="button"
              className={`location-cost ${loc}${cost > 40 ? ' over-limit' : ''}${filterLocation === loc ? ' active' : ''}`}
              onClick={() => { setFilterLocation((prev) => (prev === loc ? null : loc)); setSelectedHouseId(null) }}
              title={filterLocation === loc ? 'Clear filter' : `Filter by ${locations[loc]}`}
            >
              <span className="location-cost-label">{loc.toUpperCase()}</span>
              <span className="location-cost-value">{cost}/40</span>
            </button>
          ))}
        </div>
        <div className="toggle-group view-toggle">
          <button className={view === 'grid' ? 'active' : ''} onClick={() => setView('grid')}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
            </svg>
            Grid
          </button>
          <button className={view === 'table' ? 'active' : ''} onClick={() => setView('table')}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/>
            </svg>
            Table
          </button>
        </div>
      </div>

      {view === 'grid' ? (
        <ul id="houses">
          {visibleHouses.map((house) => (
            <HouseCard key={house.id} house={house} data={data} />
          ))}
        </ul>
      ) : (
        <div id='houses-table-container'>
          <table id="houses-table">
            <thead>
              <tr>
                <th onClick={() => updateSort('name')} className="sortable">
                  Name
                  <SortArrow col="name" sort={sort} />
                </th>
                <th onClick={() => updateSort('habitats')} className="sortable">
                  Habitats
                  <SortArrow col="habitats" sort={sort} />
                </th>
                <th>Members</th>
                <th onClick={() => updateSort('sharedFavorites')} className="sortable">
                  Shared Favorites
                  <SortArrow col="sharedFavorites" sort={sort} />
                </th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visibleHouses.map((house) => {
                const isSelected = selectedHouseId === house.id
                const shared = getSharedFavorites(house.members, data)

                return (
                  <tr
                    key={house.id}
                    className={`${house.location}${isSelected ? ' selected' : ''}`}
                    onClick={() => setSelectedHouseId(isSelected ? null : house.id)}
                  >
                    <td className="table-name">
                      <span>{house.name}</span>
                      {house.hasDitto && (
                        <button type="button" className="ditto-badge" onClick={(event) => { event.stopPropagation(); updateHouse({ ...house, hasDitto: false }) }} title="Remove Ditto">
                          <img src="https://www.serebii.net/pokemonpokopia/items/dittoflag.png" alt="Ditto flag" />
                        </button>
                      )}
                    </td>
                    <td className="table-habitat">{getHabitats(house.members, data).join(', ')}</td>
                    <td className="table-members">
                      <div className="member-avatars">
                        {house.members.map((member, i) => {
                          const pokemon = member ? getPokemonByName(data, member) : null
                          return pokemon
                            ? <button key={i} type="button" className="member-avatar-button" onClick={(event) => removePokemon(house, pokemon.name, event)} title={`Remove ${pokemon.name}`}>
                                <img src={pokemon.image} alt={pokemon.name} />
                              </button>
                            : <span key={i} className="empty-slot">?</span>
                        })}
                      </div>
                    </td>
                    <td className="table-favorites">
                      {shared.length > 0
                        ? shared.map((f) => <a key={f} className="favorite" href={favoriteLinks[f]} target="_blank" rel="noopener noreferrer">{f}</a>)
                        : <span className="none">—</span>}
                    </td>
                    <td>
                      <button className="remove-house" onClick={(e) => { e.stopPropagation(); removeHouse(house.id) }} title="Remove house">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6" /><path d="M14 11v6" />
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
