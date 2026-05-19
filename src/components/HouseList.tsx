import { useState } from 'react';
import { useHouse } from '../HouseProvider';
import HouseCard from './HouseCard';
import HouseDetailsModal from './HouseDetailsModal';
import type { LocationCode, PokemonRecord, Sort } from '../types';
import { locations, getHabitats, getSharedFavorites } from '../utils/houseUtils'
import { HouseTable } from './HouseTable';

const STORAGE_KEY_VIEW = 'pokemon-app-view'

const slotCost: Record<number, number> = {
  1: 1,
  2: 1,
  4: 2
}

export const HouseList = () => {
  const { houses, setSelectedHouseId, filterLocation, setFilterLocation } = useHouse()
  const [view, setView] = useState<'grid' | 'table'>(() => {
    const savedView = localStorage.getItem(STORAGE_KEY_VIEW)
    return savedView === 'table' ? 'table' : 'grid'
  })
  const [sort, setSort] = useState<Sort>({ col: 'id', dir: 'asc' })
  const [detailsHouseId, setDetailsHouseId] = useState<number | null>(null)

  const locationCosts = (Object.keys(locations) as LocationCode[]).map((loc) => {
    const cost = houses
      .filter((h) => h.location === loc && h.type === 'prefab')
      .reduce((sum, h) => sum + (slotCost[h.members.length] ?? 0), 0)
    return { loc, cost }
  })

  const onSetView = (newView: 'grid' | 'table') => {
    setView(newView)
    localStorage.setItem(STORAGE_KEY_VIEW, newView)
  }

  const visibleHouses = (filterLocation
    ? houses.filter((h) => h.location === filterLocation)
    : houses).sort((a, b) => {
      let compare = 0
      if (sort.col === 'id') return a.id > b.id ? -1 : 1
      if (sort.col === 'name') {
        compare = a.name.localeCompare(b.name)
      } else if (sort.col === 'habitats') {
        const aHabitats = getHabitats(a.members).length
        const bHabitats = getHabitats(b.members).length
        compare = aHabitats - bHabitats
      } else if (sort.col === 'sharedFavorites') {
        const fav1 = getSharedFavorites(a.members)
        const fav2 = getSharedFavorites(b.members)
        compare = fav1[0]?.localeCompare(fav2[0])
      }
      return sort.dir === 'asc' ? compare : -compare
    })
  const detailsHouse = detailsHouseId === null ? null : houses.find((house) => house.id === detailsHouseId) ?? null

  return (
    <>
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
          <button className={view === 'grid' ? 'active' : ''} onClick={() => onSetView('grid')}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
            </svg>
            Grid
          </button>
          <button className={view === 'table' ? 'active' : ''} onClick={() => onSetView('table')}>
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
            <HouseCard key={house.id} house={house} />
          ))}
        </ul>
      ) : (
        <HouseTable visibleHouses={visibleHouses} onDetailsClick={setDetailsHouseId} onSort={(nSort: Sort) => setSort(nSort)} sort={sort} />
      )}
      </div>
      {detailsHouse && (
        <HouseDetailsModal house={detailsHouse} onClose={() => setDetailsHouseId(null)} />
      )}
    </>
  )
}


export default HouseList;