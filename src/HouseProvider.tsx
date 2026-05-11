import { createContext, useContext, useState, useEffect, type Dispatch, type SetStateAction } from 'react'
import type { House, HouseType, LocationCode } from './types'

const STORAGE_KEY_HOUSES = 'pokemon-houses'
const STORAGE_KEY_SELECTED = 'pokemon-selected-house'
const STORAGE_KEY_DRAG_ENABLED = 'pokemon-drag-enabled'
const DITTO_NAME = 'Ditto'

const canHouseHoldDitto = (house: House) => !(house.type === 'custom' && house.members.length === 1)

const normalizeHouses = (inputHouses: House[]) => {
  return inputHouses.map((house, index) => ({
    ...house,
    id: inputHouses.length - index,
    hasDitto: house.hasDitto ?? false,
  }))
}

const getNextHouseId = (currentHouses: House[]) => {
  const highestId = currentHouses.reduce((maxId, house) => Math.max(maxId, house.id), 0)
  return highestId + 1
}

// Provider to maintain house state and provide dnd context
const HouseProvider = ({ children }: { children: React.ReactNode }) => {
  const [houses, setHouses] = useState<House[]>([])
  const [selectedHouseId, setSelectedHouseId] = useState<number | null>(null)
  const [filterLocation, setFilterLocation] = useState<LocationCode | null>(null)
  const [dragAndDropEnabled, setDragAndDropEnabled] = useState(true)
  const [isHydrated, setIsHydrated] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    const savedHouses = localStorage.getItem(STORAGE_KEY_HOUSES)
    const savedSelected = localStorage.getItem(STORAGE_KEY_SELECTED)
    const savedDragEnabled = localStorage.getItem(STORAGE_KEY_DRAG_ENABLED)
    
    if (savedHouses) {
      try {
        const loadedHouses = normalizeHouses(JSON.parse(savedHouses))
        setHouses(loadedHouses)
      } catch (e) {
        console.error('Failed to parse saved houses:', e)
      }
    }
    
    if (savedSelected) {
      setSelectedHouseId(parseInt(savedSelected))
    }

    if (savedDragEnabled !== null) {
      setDragAndDropEnabled(savedDragEnabled !== 'false')
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
        localStorage.setItem(STORAGE_KEY_SELECTED, String(selectedHouseId))
      } else {
        localStorage.removeItem(STORAGE_KEY_SELECTED)
      }
    }
  }, [selectedHouseId, isHydrated])

  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(STORAGE_KEY_DRAG_ENABLED, String(dragAndDropEnabled))
    }
  }, [dragAndDropEnabled, isHydrated])

  const generateHouse = ({ name, location, slots, type }: { name?: string; location?: LocationCode; slots?: number; type?: HouseType }) => {
    let nextSelectedId: number | null = null

    setHouses((currentHouses) => {
      const nextHouseId = getNextHouseId(currentHouses)
      nextSelectedId = nextHouseId

      const newHouse: House = {
        id: nextHouseId,
        location: location ?? 'ww',
        name: name || `House ${nextHouseId}`,
        type: type ?? 'custom',
        hasDitto: false,
        members: Array(slots ?? 4).fill(null),
      }

      return [newHouse, ...currentHouses]
    })

    if (nextSelectedId !== null) {
      setSelectedHouseId(nextSelectedId)
    }
  }

  const moveToHouse = (pokemonName: string, houseId: number, sourceHouseId?: number) => {
    setHouses((currentHouses) => {
      const targetHouse = currentHouses.find((house) => house.id === houseId)
      if (!targetHouse) {
        return currentHouses
      }

      if (pokemonName === DITTO_NAME) {
        if (sourceHouseId === houseId) {
          return currentHouses
        }

        if (!canHouseHoldDitto(targetHouse) || targetHouse.hasDitto) {
          return currentHouses
        }

        return currentHouses.map((house) => {
          if (house.id === sourceHouseId) {
            return {
              ...house,
              hasDitto: false,
            }
          }

          if (house.location !== targetHouse.location) {
            return house
          }

          if (house.id === targetHouse.id) {
            return {
              ...house,
              hasDitto: true,
            }
          }

          if (!house.hasDitto) {
            return house
          }

          return {
            ...house,
            hasDitto: false,
          }
        })
      }

      return currentHouses.map((house) => {
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
    })
    })
  }

  const updateHouse = (updatedHouse: House) => {
    setHouses((currentHouses) =>
      currentHouses.map((house) => {
        if (house.id === updatedHouse.id) {
          return updatedHouse
        }

        if (updatedHouse.hasDitto && house.location === updatedHouse.location && house.hasDitto) {
          return {
            ...house,
            hasDitto: false,
          }
        }

        return house
      })
    )
  }

  const removeHouse = (houseId: number) => {
    setHouses((currentHouses) => currentHouses.filter((house) => house.id !== houseId))
    setSelectedHouseId((current) => (current === houseId ? null : current))
  }

  const removeFromHouse = (pokemonName: string, sourceHouseId?: number) => {
    setHouses((currentHouses) =>
      currentHouses.map((house) => {
        if (pokemonName === DITTO_NAME && house.id === sourceHouseId) {
          return {
            ...house,
            hasDitto: false,
          }
        }

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

  const importHouses = (imported: House[]) => {
    setHouses(normalizeHouses(imported))
    setSelectedHouseId(null)
  }

  return (
    <HouseContext.Provider value={{ houses, selectedHouseId, setSelectedHouseId, filterLocation, setFilterLocation, dragAndDropEnabled, setDragAndDropEnabled, generateHouse, moveToHouse, updateHouse, removeHouse, removeFromHouse, clearHouseData, importHouses }}>
      {children}
    </HouseContext.Provider>
  )
}

const HouseContext = createContext<{
  houses: House[]
  selectedHouseId: number | null
  setSelectedHouseId: Dispatch<SetStateAction<number | null>>
  filterLocation: LocationCode | null
  setFilterLocation: Dispatch<SetStateAction<LocationCode | null>>
  dragAndDropEnabled: boolean
  setDragAndDropEnabled: Dispatch<SetStateAction<boolean>>
  generateHouse: (data: { name?: string; location?: LocationCode; slots?: number; type?: HouseType }) => void
  moveToHouse: (pokemonName: string, houseId: number, sourceHouseId?: number) => void
  updateHouse: (house: House) => void
  removeHouse: (houseId: number) => void
  removeFromHouse: (pokemonName: string, sourceHouseId?: number) => void
  clearHouseData: () => void
  importHouses: (houses: House[]) => void
}>({ 
  houses: [],
  selectedHouseId: null,
  setSelectedHouseId: () => {},
  filterLocation: null,
  setFilterLocation: () => {},
  dragAndDropEnabled: true,
  setDragAndDropEnabled: () => {},
  generateHouse: () => {},
  moveToHouse: () => {},
  updateHouse: () => {},
  removeHouse: () => {},
  removeFromHouse: () => {},
  clearHouseData: () => {},
  importHouses: () => {},
})

export { HouseProvider, HouseContext }

export const useHouse = () => {
  const context = useContext(HouseContext)
  if (!context) {
    throw new Error('useHouse must be used within a HouseProvider')
  }
  return context
}
