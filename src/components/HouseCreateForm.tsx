import { useState, useEffect } from 'react';
import { useHouse } from '../HouseProvider';
import type { HouseType, LocationCode } from '../types';
import { locations } from '../utils/houseUtils';

export const HouseCreateForm = () => {
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

export default HouseCreateForm