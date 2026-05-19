import favoriteLinksJson from '../data/favoriteLinks.json'
import furnitureTypes from '../data/furnitureTypes.json';
import pokemonDataRaw from '../data/pokemon.json'
import type { PokemonRecord } from '../types'

const unhouseablePokemon = ['Ho-Oh', 'Lugia', 'Kyogre']

export const pokemonData: PokemonRecord[] = pokemonDataRaw.filter((pokemon) => {
  return pokemon.name.trim().length > 0 && !unhouseablePokemon.includes(pokemon.name)
})

export const pokemonMap = Object.fromEntries(pokemonData.map((poke) => [poke.name, poke]))


export const favoriteLinks = favoriteLinksJson as Record<string, string>;
export const furnitureTypeImgs = furnitureTypes as Record<string, string>;
