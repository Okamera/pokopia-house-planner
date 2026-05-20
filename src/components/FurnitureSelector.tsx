import { useMemo, useState } from 'react';
import furnitureData from '../data/furniture.json';
import { furnitureTypeImgs } from '../data/data';
import { getPokemonByName } from '../utils/houseUtils';
import type { FurnitureItem } from '../types';

type FurnitureSelectorProps = {
  selected: string[];
  onChange: (selected: string[]) => void;
  floor: {
    label: string;
    floorIndex: number;
    members: (string | null)[];
    habitats: string[];
    favorites: string[];
  }
  selectedFavorite: string | null;
};

const getSharedFavPercent = (itemCategories: string[], members: (string | null)[]) => {
  const validMembers = members.filter((m) => m !== null);
  if (validMembers.length === 0) return 0;
  let count = 0;
  validMembers.forEach((poke) => {
    if (poke && getPokemonByName(poke).favorites.find((fav) => itemCategories.includes(fav))) {
      count++;
    }
  });
  return Math.round((count / validMembers.length) * 100);
}

const FurnitureItem = ({ item, onClick }: { item: FurnitureItem; onClick: () => void }) => {
  return (
    <li key={item.name} className={`percent${item.favPercent}`} onClick={onClick}>
      <img src={item.image} alt={item.name} />
      <div className="furniture-side-data">
        {furnitureTypeImgs[item.type] ? <img className='furniture-type' src={furnitureTypeImgs[item.type]} alt={item.type} /> : null}
      </div>
      <div className="furniture-item-info">{`${item.name}`}</div>
    </li>
  )
}

const FurnitureSelector = ({ selected, onChange, floor, selectedFavorite }: FurnitureSelectorProps) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const furnitureWithFavPercent = useMemo(() => {
    return furnitureData.map((item) => ({
      ...item,
      favPercent: getSharedFavPercent(item.categories, floor.members)
    }));
  }, [floor.members]);

  const types = useMemo(() => {
    return [{ label: 'All', value: 'All' }, ...Object.keys(furnitureTypeImgs).map((key) => ({ label: key, value: key })), { label: 'None', value: '' }];
  }, []);

  const filtered = useMemo(() => {
    return furnitureWithFavPercent.filter((item: FurnitureItem) => {
      if (typeFilter !== 'All' && item.type !== typeFilter) return false;
      if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (selected.includes(item.name)) return false;
      if (selectedFavorite && !item.categories.includes(selectedFavorite)) return false;
      return true;
    }).sort((a, b) => {
      if (b.favPercent === a.favPercent) {
        return a.name.localeCompare(b.name);
      }
      return b.favPercent - a.favPercent;
    });
  }, [selected, selectedFavorite, floor.members, search, typeFilter]);

  const toggle = (name: string) => {
    if (selected.includes(name)) {
      onChange(selected.filter((n) => n !== name));
    } else {
      onChange([...selected, name]);
    }
  };

  return (
    <div className="furniture-selector">
        <div className="furniture-selector-controls">
          <input
            type="text"
            placeholder="Search furniture"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            {types.map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
      <div className="furniture-list-container">
        <div className="furniture-selector-label">Furniture</div>
        <SelectedFurniture list={furnitureWithFavPercent} furniture={selected} removeItem={(name) => toggle(name)} />
      </div>
      <div className="furniture-list-container">
        <div className="furniture-selector-label">Suggested</div>
        <ul className="furniture-list">
          {filtered.map((item) => (
            <FurnitureItem key={item.name} item={item} onClick={() => toggle(item.name)} />
          ))}
        </ul>
      </div>
    </div>
  );
};

export const SelectedFurniture = ({ list, furniture, removeItem }: { list: FurnitureItem[]; furniture: string[]; removeItem: (name: string) => void }) => {
  const items = list.filter((item: FurnitureItem) => furniture.includes(item.name));

  if (items?.length === 0) {
    return <div className="house-details-empty-state">No furniture selected</div>;
  }

  return (
    <ul className="furniture-list">
      {items.map((item: FurnitureItem) => (
        <FurnitureItem key={item.name} item={item} onClick={() => removeItem(item.name)} />
      ))}
    </ul>
  );
}

export default FurnitureSelector;
