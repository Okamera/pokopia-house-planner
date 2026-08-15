import { useState, useRef, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/react';
import { useHouse } from '../HouseProvider';
import DittoBadge from './DittoBadge';
import { locations, getPokemonByName, getHabitats, getSharedFavorites, getFloorFavorites, removePokemonFromHouse } from '../utils/houseUtils';
import type { House, LocationCode, CompatiblePokemon } from '../types';
import { DraggablePokemon } from './Pokemon';
import { favoriteLinks } from '../data/data'

type HouseProps = {
  house: House
  onDetailsClick: (id: number) => void
  onlyHouse: boolean
}

export const HouseCard = ({ house, onDetailsClick, onlyHouse }: HouseProps) => {
  const { selectedHouseId, setSelectedHouseId, dragAndDropEnabled, updateHouse, removeHouse, hasDLC } = useHouse()
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
              {(Object.entries(locations) as Array<[LocationCode, string]>)
                .filter(([code]) => code !== 'bu' || hasDLC)
                .map(([code, name]) => (
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
        <div className='house-actions'>
        <button
          onClick={(event) => {
            event.stopPropagation()
            onDetailsClick(house.id)
          }}
          aria-label={`Select furniture for ${house.name}`}
          title={`Select furniture for ${house.name}`}
        >
          <svg width="20px" stroke="currentColor" fill="currentColor" version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="-10.73 -10.73 236.00 236.00" strokeWidth="2.789007">
            <g> 
              <g>
                <g>
                  <path d="M121.164,154.578h-6.625V89.14h38.937c4.014,0,7.269-3.254,7.269-7.269s-3.254-7.269-7.269-7.269h-92.41 c-4.014,0-7.269,3.254-7.269,7.269s3.254,7.269,7.269,7.269h38.936v65.438h-6.625c-4.014,0-7.269,3.254-7.269,7.27 c0,4.015,3.254,7.269,7.269,7.269h27.787c4.015,0,7.27-3.254,7.27-7.269C128.433,157.832,125.179,154.578,121.164,154.578z"></path> <path d="M73.783,120.777c0-4.014-3.254-7.269-7.269-7.269H54.833H34.219c-11.08,0-13.41-16.14-13.509-16.869l-6.239-45.122 c-0.55-3.977-4.217-6.748-8.196-6.205c-3.976,0.55-6.754,4.219-6.205,8.196l6.229,45.053c0.831,6.47,4.167,16.593,11.367,23.133 l-7.485,38.956c-0.758,3.942,1.824,7.752,5.766,8.509c3.946,0.761,7.752-1.825,8.509-5.766l6.792-35.349h17.579l6.792,35.349 c0.668,3.479,3.714,5.897,7.13,5.897c0.455,0,0.916-0.043,1.379-0.132c3.942-0.757,6.524-4.566,5.766-8.509l-6.265-32.605h2.883 C70.527,128.046,73.783,124.791,73.783,120.777z"></path> <path d="M208.267,45.313c-3.975-0.543-7.646,2.229-8.196,6.205l-6.244,45.165c-0.094,0.687-2.424,16.827-13.504,16.827h-20.614 h-11.681c-4.014,0-7.27,3.254-7.27,7.269s3.255,7.269,7.27,7.269h2.883l-6.265,32.605c-0.758,3.942,1.824,7.752,5.766,8.509 c3.946,0.761,7.752-1.825,8.509-5.766l6.792-35.349h17.579l6.792,35.349c0.668,3.479,3.714,5.897,7.13,5.897 c0.455,0,0.916-0.043,1.38-0.132c3.941-0.757,6.523-4.566,5.766-8.509l-7.485-38.953c7.198-6.534,10.532-16.64,11.357-23.065 l6.238-45.123C215.021,49.533,212.242,45.863,208.267,45.313z"></path> </g> </g> </g>
          </svg>
        </button>
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
      </div>
      {house.type === 'prefab' && house.members.length === 4 ? (
        <div className='house-floors'>
          {[house.members.slice(0, 2), house.members.slice(2, 4)].map((floorMembers, floorIndex) => {
            const floorHabitats = getHabitats(floorMembers)
            const floorFavs = getSharedFavorites(floorMembers)
            return (
              <div key={floorIndex} className='house-floor'>
                <ul>
                  {floorMembers.map((member, i) => {
                    const memberPokemon = member ? getPokemonByName(member) : null
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
              const memberPokemon = member ? getPokemonByName(member) : null
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
            const habitats = getHabitats(house.members)
            return habitats.length > 0 ? (
              <div className='house-habitats'>
                {habitats.map((habitat) => (
                  <span key={habitat} className='habitat-chip'>{habitat}</span>
                ))}
              </div>
            ) : null
          })()}
          <div className='favorites'>
            {getFloorFavorites(house).map(({ label, favorites }) =>
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
      {onlyHouse && !house.members.find((m) => m) ? (
        <div id="house-list-empty">
          <svg className="arrow" width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20V6" />
            <path d="M6 12l6-6 6 6" />
          </svg>
          <div>
            <p>Click the on the house card and click or drag a pokemon to the card to add it.</p>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default HouseCard;