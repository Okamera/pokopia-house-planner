import { useEffect, useState, useRef } from 'react';

type Props = {
  selected: Set<string>;
  setSelected: (selected: Set<string>) => void;
  items: string[];
  text: string;
};

export const FilterDropdownMulti = ({ selected, setSelected, items, text }: Props) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleItem = (item: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(item)) {
      newSelected.delete(item);
    } else {
      newSelected.add(item);
    }
    setSelected(newSelected);
  };

  return (
    <div className="filter-dropdown" ref={ref}>
      <button
        className={`filter-dropdown-trigger ${dropdownOpen ? 'open' : ''}`}
        onClick={() => setDropdownOpen((o) => !o)}
      >
        <span>
          {text}
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {selected.size > 0 && (
        <button className="filter-dropdown-clear" onClick={() => setSelected(new Set())}>✕</button>
      )}
      {dropdownOpen && (
        <ul className="filter-dropdown-list">
          {items.map((item) => (
            <li key={item}>
              <label>
                <input
                  type="checkbox"
                  checked={selected.has(item)}
                  onChange={() => toggleItem(item)}
                />
                {item}
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

type SingleItem = {
  text: string;
  value: string;
};

type SingleProps = {
  selected: SingleItem;
  setSelected: (selected: SingleItem) => void;
  items: SingleItem[];
  selectedText: string;
};
export const FilterDropdownSingle = ({ selected, setSelected, items, selectedText }: SingleProps) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="single-filter" ref={ref}>
      <button
        className={`single-filter-trigger ${dropdownOpen ? 'open' : ''}`}
        onClick={() => setDropdownOpen((o) => !o)}
      >
        <span>
          {selectedText}
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {dropdownOpen && (
        <ul className="single-filter-list">
          {items.map((item) => (
            <li key={item.value}>
              <button
                className={selected.value === item.value ? 'active' : ''}
                onClick={() => {
                  setSelected(item)
                  setDropdownOpen(false)
                }}
              >
                {item.text}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default FilterDropdownMulti;
