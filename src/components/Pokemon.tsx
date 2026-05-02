import { useDraggable } from '@dnd-kit/react'
import type { CompatiblePokemon } from '../types'

type DraggablePokemonProps = {
  pokemon: CompatiblePokemon
  onClick: (name: string) => void
}

export const DraggablePokemon = ({ pokemon, onClick }: DraggablePokemonProps) => {
  const { ref } = useDraggable({
    id: pokemon.name,
  })

  return (
    <li ref={ref} className={`compatability-item percent${pokemon.compatibility}`} title={pokemon.name} onClick={() => onClick(pokemon.name)}>
      <img src={pokemon.image} alt={pokemon.name} />
    </li>
  )
}
