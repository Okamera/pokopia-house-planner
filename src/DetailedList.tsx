import type { PokemonRecord } from './types'

type DetailedListProps = {
  data: PokemonRecord[]
}

function DetailedList({ data }: DetailedListProps) {
  return (
    <section id="center">
      {data.map((pokemon) => (
        <div key={pokemon.name} className="pokemon-card">
          <img src={pokemon.image} alt={pokemon.name} className="pokemon-image" />
          <div className="pokemon-details">
            <h2>{pokemon.name}</h2>
            <div className="details">
              <div className="left">
                <div className="habitat">
                  <div className="label">Habitat</div>
                  <div className="value">{pokemon.habitat}</div>
                </div>
                <div className="taste">
                  <div className="label">Taste</div>
                  <div className="value">{pokemon.taste}</div>
                </div>
              </div>
              <div className="favorites">
                <div className="label">Favorites</div>
                <div className="value">
                  {pokemon.favorites.map((favorite) => (
                    <div key={favorite}>{favorite}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </section>
  )
}

export default DetailedList