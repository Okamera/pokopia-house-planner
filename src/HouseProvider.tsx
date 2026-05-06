import { createContext, useContext, useState, useEffect, type Dispatch, type SetStateAction } from 'react'
import type { House, HouseType, LocationCode } from './types'

const STORAGE_KEY_HOUSES = 'pokemon-houses'
const STORAGE_KEY_SELECTED = 'pokemon-selected-house'

// Provider to maintain house state and provide dnd context
const HouseProvider = ({ children }: { children: React.ReactNode }) => {
  const [houses, setHouses] = useState<House[]>([])
  const [selectedHouseId, setSelectedHouseId] = useState<string | null>(null)
  const [filterLocation, setFilterLocation] = useState<LocationCode | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    const savedHouses = localStorage.getItem(STORAGE_KEY_HOUSES)
    const savedSelected = localStorage.getItem(STORAGE_KEY_SELECTED)
    
    if (savedHouses) {
      try {
        setHouses(JSON.parse(savedHouses))
      } catch (e) {
        console.error('Failed to parse saved houses:', e)
      }
    }
    
    if (savedSelected) {
      setSelectedHouseId(savedSelected)
    }
    
    setIsHydrated(true)
  }, [])

  // Save houses to localStorage whenever they change
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(STORAGE_KEY_HOUSES, JSON.stringify(houses))
    }
  }, [houses, isHydrated])

  // Save selected house ID to localStorage whenever it changes
  useEffect(() => {
    if (isHydrated) {
      if (selectedHouseId) {
        localStorage.setItem(STORAGE_KEY_SELECTED, selectedHouseId)
      } else {
        localStorage.removeItem(STORAGE_KEY_SELECTED)
      }
    }
  }, [selectedHouseId, isHydrated])

  const generateHouse = ({ name, location, slots, type }: { name?: string; location?: LocationCode; slots?: number; type?: HouseType }) => {
    const newHouse: House = {
      id: crypto.randomUUID(),
      location: location ?? 'ww',
      name: name || `House ${houses.length + 1}`,
      type: type ?? 'custom',
      members: Array(slots ?? 4).fill(null),
    }

    setHouses((currentHouses) => [newHouse, ...currentHouses])
    setSelectedHouseId(newHouse.id)
  }

  const moveToHouse = (pokemonName: string, houseId: string) => {
    setHouses((currentHouses) => currentHouses.map((house) => {
      // Remove pokemon from any house that currently has it
      if (house.members.includes(pokemonName)) {
        const nextMembers = [...house.members]
        const memberIndex = nextMembers.findIndex((member) => member === pokemonName)
        if (memberIndex !== -1) {
          nextMembers[memberIndex] = null
        }
        return {
          ...house,
          members: nextMembers,
        }
      }

      // Add pokemon to the target house
      if (house.id !== houseId) {
        return house
      }

      const emptyIndex = house.members.findIndex((member) => member === null)
      if (emptyIndex === -1) {
        return house
      }

      const nextMembers = [...house.members]
      nextMembers[emptyIndex] = pokemonName

      return {
        ...house,
        members: nextMembers,
      }
    }))
  }

  const updateHouse = (updatedHouse: House) => {
    setHouses((currentHouses) =>
      currentHouses.map((house) => (house.id === updatedHouse.id ? updatedHouse : house))
    )
  }

  const removeHouse = (houseId: string) => {
    setHouses((currentHouses) => currentHouses.filter((house) => house.id !== houseId))
    setSelectedHouseId((current) => (current === houseId ? null : current))
  }

  const removeFromHouse = (pokemonName: string) => {
    setHouses((currentHouses) =>
      currentHouses.map((house) => {
        if (house.members.includes(pokemonName)) {
          const nextMembers = [...house.members]
          const memberIndex = nextMembers.findIndex((member) => member === pokemonName)
          if (memberIndex !== -1) {
            nextMembers[memberIndex] = null
          }
          return {
            ...house,
            members: nextMembers,
          }
        }
        return house
      })
    )
  }

  const clearHouseData = () => {
    setHouses([])
    setSelectedHouseId(null)
    localStorage.removeItem(STORAGE_KEY_HOUSES)
    localStorage.removeItem(STORAGE_KEY_SELECTED)
  }

  return (
    <HouseContext.Provider value={{ houses, selectedHouseId, setSelectedHouseId, filterLocation, setFilterLocation, generateHouse, moveToHouse, updateHouse, removeHouse, removeFromHouse, clearHouseData }}>
      {children}
    </HouseContext.Provider>
  )
}

const HouseContext = createContext<{
  houses: House[]
  selectedHouseId: string | null
  setSelectedHouseId: Dispatch<SetStateAction<string | null>>
  filterLocation: LocationCode | null
  setFilterLocation: Dispatch<SetStateAction<LocationCode | null>>
  generateHouse: (data: { name?: string; location?: LocationCode; slots?: number; type?: HouseType }) => void
  moveToHouse: (pokemonName: string, houseId: string) => void
  updateHouse: (house: House) => void
  removeHouse: (houseId: string) => void
  removeFromHouse: (pokemonName: string) => void
  clearHouseData: () => void
}>({ 
  houses: [],
  selectedHouseId: null,
  setSelectedHouseId: () => {},
  filterLocation: null,
  setFilterLocation: () => {},
  generateHouse: () => {},
  moveToHouse: () => {},
  updateHouse: () => {},
  removeHouse: () => {},
  removeFromHouse: () => {},
  clearHouseData: () => {},
})

export { HouseProvider, HouseContext }

export const useHouse = () => {
  const context = useContext(HouseContext)
  if (!context) {
    throw new Error('useHouse must be used within a HouseProvider')
  }
  return context
}
