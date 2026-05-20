import { locations, getPokemonByName, getHabitats, getSharedFavorites } from '../utils/houseUtils';
import type { House } from '../types';
import FurnitureSelector from './FurnitureSelector';
import { useHouse } from '../HouseProvider';
import { useState } from 'react';

type FloorType = {
  label: string;
  members: (string | null)[];
  habitats: string[];
  favorites: string[];
  floorIndex: number;
}

const FloorDetails = ({ floor, furniture, updateFurniture }: { floor: FloorType, furniture: string[], updateFurniture: (updated: any, floorIndex: number) => void }) => {
  const [selectedFavorite, setSelectedFavorite] = useState<(string | null)>(null);
  const selectFav = (favorite: string) => {
    setSelectedFavorite(selectedFavorite === favorite ? null : favorite);
  }
  return (
    <div key={floor.label} className="house-details-floor">
      {floor.label !== 'House' && <div className="house-details-floor-label">{floor.label}</div>}
      <div className="house-details-members">
        {floor.members.map((member, index) => {
          const pokemon = member ? getPokemonByName(member) : null
          return pokemon ? (
            <div key={`${floor.label}-${pokemon.name}-${index}`} className="house-details-member">
              <img src={pokemon.image} alt={pokemon.name} />
              <span>{pokemon.name}</span>
            </div>
          ) : (
            <div key={`${floor.label}-empty-${index}`} className="house-details-member empty">
              <span>Empty</span>
            </div>
          )
        })}
      </div>
      <div className="house-details-habitats">
        {floor.habitats.join(', ') || 'None'}
      </div>
      <div className="house-details-favorites">
        {floor.favorites.length > 0
          ? floor.favorites.map((favorite) => (
              <div key={`${floor.label}-${favorite}`} className={`favorite ${selectedFavorite === favorite ? ' selected' : ''}`} onClick={() => selectFav(favorite)}>{favorite}</div>
            ))
          : <span className="none">No shared favorites</span>}
      </div>
      <div key={`furniture-${floor.label}`} className="house-details-furniture-floor">
        <FurnitureSelector
          floor={floor}
          selected={furniture}
          selectedFavorite={selectedFavorite}
          onChange={(selected) => {
            updateFurniture(selected, floor.floorIndex)
          }}
        />
      </div>
    </div>
  )
}

const HouseDetailsModal = ({ house, onClose }: { house: House; onClose: () => void }) => {
  const { updateHouse } = useHouse();
  const isPrefab = house.type === 'prefab' && house.members.length === 4;
  const detailFloors = isPrefab
    ? [
        {
          label: 'Floor 1',
          members: house.members.slice(0, 2),
          habitats: getHabitats(house.members.slice(0, 2)),
          favorites: getSharedFavorites(house.members.slice(0, 2)),
          floorIndex: 0,
        },
        {
          label: 'Floor 2',
          members: house.members.slice(2, 4),
          habitats: getHabitats(house.members.slice(2, 4)),
          favorites: getSharedFavorites(house.members.slice(2, 4)),
          floorIndex: 1,
        },
      ]
    : [
        {
          label: 'House',
          members: house.members,
          habitats: getHabitats(house.members),
          favorites: getSharedFavorites(house.members),
          floorIndex: 0,
        },
      ];

  const updateFurniture = (updated: any, floorIndex: number) => {
    const newHouse = { ...house, furniture: house.furniture || [] };
    newHouse.furniture[floorIndex] = updated;
    updateHouse(newHouse);
  };

  return (
    <div className="app-modal-backdrop" onClick={onClose}>
      <div className="app-modal house-details-modal" onClick={(event) => event.stopPropagation()}>
        <div className="app-modal-header">
          <div>
            <h2 className="house-details-title">
              {house.hasDitto && (
                <span className="ditto-badge" aria-label="Ditto present" title="Ditto present">
                  <img src="https://www.serebii.net/pokemonpokopia/items/dittoflag.png" alt="Ditto flag" />
                </span>
              )}
              {house.name}
            </h2>
            <p className="house-details-subtitle">{locations[house.location]} • {house.type === 'prefab' ? 'Prefab' : 'Custom'}</p>
          </div>
          <button type="button" aria-label="Close house details" onClick={onClose}>×</button>
        </div>
        <div className="house-details-content">
            <div className={`house-details-floors${detailFloors.length > 1 ? ' split' : ''}`}>
              {detailFloors.map((floor) => (
                <FloorDetails
                  key={floor.floorIndex}
                  floor={floor}
                  furniture={house.furniture?.[floor.floorIndex] || []}
                  updateFurniture={updateFurniture}
                />
              ))}
            </div>
        </div>
      </div>
    </div>
  )
}

export default HouseDetailsModal;