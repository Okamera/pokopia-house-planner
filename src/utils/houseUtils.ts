import type { House, PokemonRecord, LocationCode } from '../types';

export const locations: Record<LocationCode, string> = {
  ww: 'Withered Wastelands',
  bb: 'Bleak Beach',
  rr: 'Rocky Ridges',
  ss: 'Sparkling Skylands',
  pt: 'Palette Town',
}

export const getPokemonByName = (data: PokemonRecord[], name: string) => (
  data.find((pokemon) => pokemon.name === name) ?? null
);

export const getSharedFavorites = (members: House['members'], data: PokemonRecord[]): Array<string> => {
  const nonNullMembers = members.filter((m): m is string => m !== null);
  if (nonNullMembers.length === 0) {
    return [];
  }

  const favorites = nonNullMembers
    .map((member) => getPokemonByName(data, member))
    .filter((pokemon): pokemon is PokemonRecord => pokemon !== null)
    .flatMap((pokemon) => pokemon.favorites)
    .filter((fav) => fav.length > 0);

  const favoriteSet = new Set(favorites);
  const sharedFavorites = Array.from(favoriteSet).filter((fav) => {
    const count = favorites.filter((f) => f === fav).length;
    return count === nonNullMembers.length;
  });

  return sharedFavorites;
};

export const getHabitats = (members: House['members'], data: PokemonRecord[]): string[] => {
  const habitats = members
    .filter((member): member is string => member !== null)
    .map((member) => getPokemonByName(data, member))
    .filter((pokemon): pokemon is PokemonRecord => pokemon !== null)
    .map((pokemon) => pokemon.habitat);

  return Array.from(new Set(habitats));
};

export const getFloorFavorites = (
  house: House,
  data: PokemonRecord[]
): Array<{ label: string | null; favorites: string[] }> => {
  if (house.type === 'prefab' && house.members.length === 4) {
    return [
      { label: 'F1', favorites: getSharedFavorites(house.members.slice(0, 2), data) },
      { label: 'F2', favorites: getSharedFavorites(house.members.slice(2, 4), data) },
    ];
  }
  return [{ label: null, favorites: getSharedFavorites(house.members, data) }];
}

export const removePokemonFromHouse = (house: House, pokemonName: string): House => {
  const memberIndex = house.members.findIndex((member) => member === pokemonName)
  if (memberIndex === -1) {
    return house
  }

  const nextMembers = [...house.members]
  nextMembers[memberIndex] = null

  return {
    ...house,
    members: nextMembers,
  }
}
