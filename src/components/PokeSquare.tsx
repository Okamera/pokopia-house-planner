import { useDraggable } from '@dnd-kit/react'
import type { CompatiblePokemon } from '../types'

type DraggablePokemonProps = {
  pokemon: CompatiblePokemon
}

function DraggablePokemon({ pokemon }: DraggablePokemonProps) {
  const { ref } = useDraggable({
    id: pokemon.name,
  })

  return (
    <li ref={ref} className={`compatability-item percent${pokemon.compatibility}`}>
      <img src={pokemon.image} alt={pokemon.name} />
    </li>
  )
}

export default DraggablePokemon