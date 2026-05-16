import { useState, useRef, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/react';
import { useHouse } from '../HouseProvider';
import DittoBadge from './DittoBadge';
import { locations, getPokemonByName, getHabitats, getSharedFavorites, getFloorFavorites, removePokemonFromHouse } from '../utils/houseUtils';
import type { House, LocationCode, PokemonRecord, CompatiblePokemon } from '../types';
import { DraggablePokemon } from './Pokemon';
import { favoriteLinks } from '../data/data'

type HouseProps = {
  house: House
  data: PokemonRecord[]
}

export const HouseCard = ({ house, data }: HouseProps) => {
  const { selectedHouseId, setSelectedHouseId, dragAndDropEnabled, updateHouse, removeHouse } = useHouse()
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
    <div ref={ref} className={`house ${selectedHouseId === house.id ? 'selected ' : ''}${house.location}${house.type === 'prefab' && house.members.length === 4 ? ' two-floor' : ''}`} onClick={toggleSelect}>
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
                <DittoBadge houseId={house.id} onActivate={removeDitto} isDraggable={dragAndDropEnabled} />
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
      {house.type === 'prefab' && house.members.length === 4 ? (
        <div className='house-floors'>
          {[house.members.slice(0, 2), house.members.slice(2, 4)].map((floorMembers, floorIndex) => {
            const floorHabitats = getHabitats(floorMembers, data)
            const floorFavs = getSharedFavorites(floorMembers, data)
            return (
              <div key={floorIndex} className='house-floor'>
                <ul>
                  {floorMembers.map((member, i) => {
                    const memberPokemon = member ? getPokemonByName(data, member) : null
                    const memberIndex = floorIndex * 2 + i
                    return member && memberPokemon ? (
                      <DraggablePokemon
                        key={`${house.id}-${memberIndex}`}
                        pokemon={{ ...memberPokemon, compatibility: 0 } as CompatiblePokemon}
                        showIcons
                        layout='vertical'
                        isDraggable={dragAndDropEnabled}
                        onClick={handleMemberClick}
                      />
                    ) : (
                      <li key={`${house.id}-${memberIndex}`} className='member empty'>?</li>
                    )
                  })}
                </ul>
                {floorHabitats.length > 0 && (
                  <div className='house-habitats'>
                    {floorHabitats.map((habitat) => (
                      <span key={habitat} className='habitat-chip'>{habitat}</span>
                    ))}
                  </div>
                )}
                {floorFavs.length > 0 && (
                  <div className='favorites'>
                    {floorFavs.map((favorite) => (
                      <a key={favorite} className='favorite' href={favoriteLinks[favorite]} target='_blank' rel='noopener noreferrer'>{favorite}</a>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <>
          <ul>
            {house.members.map((member, memberIndex) => {
              const memberPokemon = member ? getPokemonByName(data, member) : null
              return member && memberPokemon ? (
                <DraggablePokemon
                  key={`${house.id}-${memberIndex}`}
                  pokemon={{ ...memberPokemon, compatibility: 0 } as CompatiblePokemon}
                  showIcons
                  layout='vertical'
                  isDraggable={dragAndDropEnabled}
                  onClick={handleMemberClick}
                />
              ) : (
                <li key={`${house.id}-${memberIndex}`} className='member empty'>?</li>
              )
            })}
          </ul>
          {(() => {
            const habitats = getHabitats(house.members, data)
            return habitats.length > 0 ? (
              <div className='house-habitats'>
                {habitats.map((habitat) => (
                  <span key={habitat} className='habitat-chip'>{habitat}</span>
                ))}
              </div>
            ) : null
          })()}
          <div className='favorites'>
            {getFloorFavorites(house, data).map(({ label, favorites }) =>
              favorites.length > 0 ? (
                <div key={label ?? 'all'} className='floor-favorites'>
                  {label && <span className='floor-label'>{label}:</span>}
                  {favorites.map((favorite) => (
                    <a key={favorite} className='favorite' href={favoriteLinks[favorite]} target='_blank' rel='noopener noreferrer'>{favorite}</a>
                  ))}
                </div>
              ) : null
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default HouseCard;