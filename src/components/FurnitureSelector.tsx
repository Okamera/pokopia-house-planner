import { useState, useMemo } from 'react';
import furnitureData from '../data/furniture.json';
import { furnitureTypeImgs } from '../data/data';
import pokemonData from '../data/pokemon.json';

type FurnitureItem = {
  name: string;
  image: string;
  categories: string[];
  type: string;
};

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

const getSharedFavPercent = (itemCategories: string[], members: string[]) => {
  if (members.length === 0) return 0;
  // members.forEach((poke) => {
}

const FurnitureSelector = ({ selected, onChange, floor, selectedFavorite }: FurnitureSelectorProps) => {
  const favorites = floor.favorites;
  const [search, setSearch] = useState('');
  // const [typeFilter, setTypeFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // const types = useMemo(() => {
  //   const set = new Set<string>();
  //   furnitureData.forEach((item: FurnitureItem) => set.add(item.type));
  //   return ['All', ...Array.from(set).sort()];
  // }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    furnitureData.forEach((item: FurnitureItem) => item.categories.forEach((cat) => set.add(cat)));
    return ['All', ...Array.from(set).sort()];
  }, []);

  const filtered = useMemo(() => {
    const favObj = favorites.reduce((obj, fav) => ({ ...obj, [fav]: true }), {} as Record<string, boolean>);
    return furnitureData.filter((item: FurnitureItem) => {
      if (selected.includes(item.name)) return false;
      if (selectedFavorite && !item.categories.includes(selectedFavorite)) return false;
      // if (!item.categories.find((cat) => favObj[cat])) return false; // show all favorites
      // if (categoryFilter !== 'All' && !item.categories.includes(categoryFilter)) return false;
      // if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    }).map((item) => ({
      ...item,
      sharedFav: favorites.some((fav) => item.categories.includes(fav)),
      favCount: item.categories.filter((cat) => favorites.includes(cat)).length,
      favPercent: getSharedFavPercent(item.categories, favorites)
    })).sort((a, b) => {
      const aFav = a.sharedFav;
      const bFav = b.sharedFav;
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      return 0;
    });
  }, [search, categoryFilter, selected, selectedFavorite]);

  const toggle = (name: string) => {
    if (selected.includes(name)) {
      onChange(selected.filter((n) => n !== name));
    } else {
      onChange([...selected, name]);
    }
  };

  return (
    <div className="furniture-selector">

      <div className="furniture-list-container">
        <div className="furniture-selector-label">Furniture</div>
        <SelectedFurniture furniture={selected} removeItem={(name) => toggle(name)} favorites={favorites}/>
      </div>
      <div className="furniture-list-container">
        <div className="furniture-selector-label">Suggested</div>
        {/* <div className="furniture-selector-controls">
          <input
            type="text"
            placeholder="Search furniture"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            {types.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div> */}
        <ul className="furniture-list">
          {filtered.map((item) => (
            <li key={item.name} className={selected.includes(item.name) ? 'selected' : ''} onClick={() => toggle(item.name)}>
              <img src={item.image} alt={item.name} />
              {furnitureTypeImgs[item.type] ? <img className='furniture-type' src={furnitureTypeImgs[item.type]} alt={item.type} /> : null}
              <div className="furniture-item-info">{`${item.name}`}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export const SelectedFurniture = ({ furniture, removeItem, favorites }: { furniture: string[], removeItem: (name: string) => void, favorites: string[] }) => {
  const items = furnitureData.filter((item: FurnitureItem) => furniture.includes(item.name));

  if (items?.length === 0) {
    return <div className="house-details-empty-state">No furniture selected</div>;
  }

  return (
    <ul className="furniture-list">
      {items.map((item) => (
        <li key={item.name} className="selected-furniture-item" onClick={() => removeItem(item.name)}>
          <img src={item.image} alt={item.name} />
          {furnitureTypeImgs[item.type] ? <img className='furniture-type' src={furnitureTypeImgs[item.type]} alt={item.type} /> : null}
          <div className="furniture-item-info">{item.name}</div>
        </li>
      ))}
    </ul>
  );
}

export default FurnitureSelector;
