import './App.css'
import pokemonData from './data/pokemon.json'
import { DragDropProvider } from '@dnd-kit/react'
import { HouseProvider, useHouse } from './HouseProvider'
import { FontSizeProvider } from './FontSizeProvider'
import { HouseCreateForm, HouseList } from './components/Houses'
import { CompatabilityList } from './components/CompatabilityList'
import { AppMenu } from './components/AppMenu'
import type { PokemonRecord } from './types'

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

function AppContent() {
  const { moveToHouse, removeFromHouse } = useHouse()
  const data: PokemonRecord[] = pokemonData.filter((pokemon) => {
    return pokemon.name.trim().length > 0 && !unhouseablePokemon.includes(pokemon.name)
  })

  const handleDragEnd = (event: DragEndEventLike) => {
    if (event.canceled) {
      return
    }

    const sourceId = typeof event.operation.source?.id === 'string' ? event.operation.source.id : null
    const targetId = typeof event.operation.target?.id === 'string' ? event.operation.target.id : null

    if (!sourceId || !targetId) {
      return
    }

    // If dragging to compatibility list, remove from house
    if (targetId === 'compatability-list') {
      removeFromHouse(sourceId)
      return
    }

    // Otherwise, move to target house
    moveToHouse(sourceId, targetId)
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