import { useHouse } from '../HouseProvider';
import SortArrow from './SortArrow';
import type { House, Sort } from '../types';
import { favoriteLinks } from '../data/data'
import { removePokemonFromHouse, getFloorFavorites, getPokemonByName, getHabitats } from '../utils/houseUtils'

type HouseTableProps = {
  visibleHouses: House[]
  onDetailsClick: (houseId: number) => void
  sort: Sort
  onSort: (sort: Sort) => void
}

export const HouseTable = ({ visibleHouses, onDetailsClick, sort, onSort }: HouseTableProps) => {
  const { selectedHouseId, setSelectedHouseId, updateHouse, removeHouse } = useHouse()

  const updateSort = (col: string) => {
    if (sort.col === col) {
      if (sort.dir === 'desc') onSort({ col: 'id', dir: 'asc' })
      else onSort({ col, dir: sort.dir === 'asc' ? 'desc' : 'asc' })
    } else onSort({ col, dir: 'asc' })
  }

  const removePokemon = (house: House, pokemonName: string, event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    updateHouse(removePokemonFromHouse(house, pokemonName))
  }

  return (
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
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {visibleHouses.map((house) => {
            const isSelected = selectedHouseId === house.id
            const floorFavorites = getFloorFavorites(house)
            const hasAnyFavorites = floorFavorites.some(({ favorites }) => favorites.length > 0)

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
                <td className="table-habitat">{getHabitats(house.members).join(', ')}</td>
                <td className="table-members">
                  <div className="member-avatars">
                    {house.members.map((member, i) => {
                      const pokemon = member ? getPokemonByName(member) : null
                      return pokemon
                        ? <button key={i} type="button" className="member-avatar-button" onClick={(event) => removePokemon(house, pokemon.name, event)} title={`Remove ${pokemon.name}`}>
                            <img src={pokemon.image} alt={pokemon.name} />
                          </button>
                        : <span key={i} className="empty-slot">?</span>
                    })}
                  </div>
                </td>
                <td className="table-favorites">
                  {hasAnyFavorites
                    ? floorFavorites.map(({ label, favorites }) =>
                        favorites.length > 0 ? (
                          <div key={label ?? 'all'} className='floor-favorites'>
                            {label && <span className='floor-label'>{label}:</span>}
                            {favorites.map((f) => <a key={f} className="favorite" href={favoriteLinks[f]} target="_blank" rel="noopener noreferrer">{f}</a>)}
                          </div>
                        ) : null
                      )
                    : <span className="none">—</span>}
                </td>
                <td className="house-actions">
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
  )
}


export default HouseTable
