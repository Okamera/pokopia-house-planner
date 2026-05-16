import './App.css'
import pokemonData from './data/pokemon.json'
import { DragDropProvider } from '@dnd-kit/react'
import { HouseProvider, useHouse } from './HouseProvider'
import { FontSizeProvider } from './FontSizeProvider'
import { HouseList } from './components/HouseList'
import { HouseCreateForm } from './components/HouseCreateForm'
import { CompatabilityList } from './components/CompatabilityList'
import { AppMenu } from './components/AppMenu'
import type { PokemonRecord } from './types'
import { DITTO_NAME } from './constants'

type DragEndEventLike = {
  canceled?: boolean
  operation: {
    source?: {
      id?: unknown
    }
    target?: {
      id?: unknown
    }
  }
}

const unhouseablePokemon = ['Ho-Oh', 'Lugia', 'Kyogre']

const parseDragSource = (sourceId: string) => {
  if (!sourceId.startsWith(`${DITTO_NAME}:`)) {
    return { pokemonName: sourceId, sourceHouseId: undefined as number | undefined }
  }

  const sourceHouseId = Number.parseInt(sourceId.slice(DITTO_NAME.length + 1), 10)
  return {
    pokemonName: DITTO_NAME,
    sourceHouseId: Number.isNaN(sourceHouseId) ? undefined : sourceHouseId,
  }
}

function AppContent() {
  const { houses, dragAndDropEnabled, moveToHouse, removeFromHouse } = useHouse()
  const data: PokemonRecord[] = pokemonData.filter((pokemon) => {
    return pokemon.name.trim().length > 0 && !unhouseablePokemon.includes(pokemon.name)
  })

  const handleDragEnd = (event: DragEndEventLike) => {
    if (!dragAndDropEnabled || event.canceled) {
      return
    }

    const sourceId = typeof event.operation.source?.id === 'string' ? event.operation.source.id : null
    const targetId = typeof event.operation.target?.id === 'number'
      ? event.operation.target.id
      : typeof event.operation.target?.id === 'string'
        ? event.operation.target.id
        : null

    if (!sourceId || targetId === null) {
      return
    }

    const { pokemonName, sourceHouseId } = parseDragSource(sourceId)

    // If dragging to compatibility list, remove from house
    if (targetId === 'compatability-list') {
      removeFromHouse(pokemonName, sourceHouseId)
      return
    }

    if (typeof targetId !== 'number') {
      return
    }

    // Check if the Pokemon is already in the target house
    const targetHouse = houses.find((h) => h.id === targetId)
    if (targetHouse?.members.includes(pokemonName) || (pokemonName === DITTO_NAME && targetHouse?.hasDitto)) {
      return
    }

    // Otherwise, move to target house
    moveToHouse(pokemonName, targetId, sourceHouseId)
  }

  return (
    // @ts-ignore
    <DragDropProvider onDragEnd={handleDragEnd}>
      <AppMenu />
      <section id="container">
        <div id="left">
          <HouseCreateForm />
          <HouseList data={data} />
        </div>
        <div id="right">
          <CompatabilityList data={data} />
        </div>
      </section>
    </DragDropProvider>
  )
}

function App() {
  return (
    <FontSizeProvider>
      <HouseProvider>
        <AppContent />
      </HouseProvider>
    </FontSizeProvider>
  )
}

export default App