import Select, { type SingleValue, type StylesConfig } from 'react-select'
import type { PokemonRecord } from '../types'

type PokemonOption = {
  value: string
  label: React.ReactElement
}

type SelectItemProps = {
  pokemon: PokemonRecord
}

type SelectorProps = {
  data: PokemonRecord[]
  setSelectedPokemon: (selectedPokemon: string | null) => void
}

const selectStyles: StylesConfig<PokemonOption, false> = {
  control: (baseStyles) => ({
    ...baseStyles,
    backgroundColor: 'var(--backgroundSecondary)',
    borderRadius: '8px',
    color: 'var(--textMain)',
  }),
  option: (baseStyles, { isFocused }) => ({
    ...baseStyles,
    backgroundColor: isFocused ? 'var(--backgroundSecondary)' : 'var(--backgroundMain)',
    color: 'var(--textMain)',
  }),
  singleValue: (baseStyles) => ({
    ...baseStyles,
    color: 'var(--textMain)',
  }),
}

function SelectItem({ pokemon }: SelectItemProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <img src={pokemon.image} alt={pokemon.name} style={{ width: '24px', height: '24px' }} />
      <span>{pokemon.name}</span>
    </div>
  )
}

function Selector({ data, setSelectedPokemon }: SelectorProps) {
  const options: PokemonOption[] = data.map((pokemon) => ({
    value: pokemon.name,
    label: <SelectItem pokemon={pokemon} />,
  }))

  const handleChange = (selectedOption: SingleValue<PokemonOption>) => {
    setSelectedPokemon(selectedOption?.value ?? null)
  }

  return (
    <div id="selector">
      <Select styles={selectStyles} options={options} onChange={handleChange} />
    </div>
  )
}

export default Selector