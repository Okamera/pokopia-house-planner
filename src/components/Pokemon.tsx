import { useDraggable } from '@dnd-kit/react'
import type { CompatiblePokemon } from '../types'
import specialtyImages from '../data/specialtyImages.json'
import litterData from '../data/litter.json'

type DraggablePokemonProps = {
  pokemon: CompatiblePokemon
  onClick: (name: string) => void
  showIcons?: boolean
  layout?: 'horizontal' | 'vertical'
  isDraggable?: boolean
}

export const PokemonIcons = ({ pokemon, showIcons = true }: { pokemon: CompatiblePokemon; showIcons?: boolean }) => {
  const specialties = getPokemonSpecialties(pokemon)
  const litterItem = getLitterItem(pokemon)

  return (
    <>
      <div className="compatability-pokemon-image-wrapper">
        <img className="compatability-pokemon-image" src={pokemon.image} alt={pokemon.name} />
        {litterItem && showIcons && (
          <img
            className="compatability-litter-icon"
            src={litterItem.itemImage}
            alt={litterItem.itemName}
            title={litterItem.itemName}
          />
        )}
      </div>
      {showIcons && specialties.length > 0 && (
        <div className="compatability-specialties" aria-label={`${pokemon.name} specialties`}>
          {specialties.map((specialty) => {
            const specialtyImage = specialtyImages[specialty as keyof typeof specialtyImages]

            if (!specialtyImage) {
              return null
            }

            return (
              <img
                key={specialty}
                className="compatability-specialty-icon"
                src={specialtyImage}
                alt={specialty}
                title={specialty}
              />
            )
          })}
        </div>
      )}
    </>
  )
}

const getPokemonSpecialties = (pokemon: CompatiblePokemon) => (
  [pokemon.specialty1, pokemon.specialty2].filter((specialty) => specialty.length > 0)
)

const getLitterItem = (pokemon: CompatiblePokemon) => {
  const hasLitterSpecialty = pokemon.specialty1 === 'Litter' || pokemon.specialty2 === 'Litter'
  if (!hasLitterSpecialty) return null
  
  const itemName = litterData.pokemon[pokemon.name as keyof typeof litterData.pokemon]
  if (!itemName) return null
  
  const itemImage = litterData.imgs[itemName as keyof typeof litterData.imgs]
  if (!itemImage) return null
  
  return { itemName, itemImage }
}

export const DraggablePokemon = ({ pokemon, onClick, showIcons = true, layout = 'horizontal', isDraggable = true }: DraggablePokemonProps) => {
  const { ref } = useDraggable({
    id: pokemon.name,
    disabled: !isDraggable,
  })

  const containerClass = layout === 'vertical' ? 'pokemon-member' : `compatability-item percent${pokemon.compatibility}`

  return (
    <li ref={ref} className={containerClass} title={pokemon.name} onClick={(e) => { e.stopPropagation(); onClick(pokemon.name) }}>
      <PokemonIcons pokemon={pokemon} showIcons={showIcons} />
    </li>
  )
}
