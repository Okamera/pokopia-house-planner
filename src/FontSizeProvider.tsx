import { createContext, useContext, useState, useEffect } from 'react'

const STORAGE_KEY_FONT_SCALE = 'pokemon-font-scale'
const BASE_FONT_SIZE = 16

const FontSizeContext = createContext<{
  fontScale: number
  setFontScale: (scale: number) => void
}>({
  fontScale: 1,
  setFontScale: () => {},
})

export const FontSizeProvider = ({ children }: { children: React.ReactNode }) => {
  const [fontScale, setFontScale] = useState(1)

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY_FONT_SCALE)
    if (saved) {
      const scale = parseFloat(saved)
      setFontScale(scale)
      applyFontScale(scale)
    }
  }, [])

  // Apply font scale to root
  const applyFontScale = (scale: number) => {
    document.documentElement.style.fontSize = `${BASE_FONT_SIZE * scale}px`
  }

  const handleSetFontScale = (scale: number) => {
    setFontScale(scale)
    applyFontScale(scale)
    localStorage.setItem(STORAGE_KEY_FONT_SCALE, scale.toString())
  }

  return (
    <FontSizeContext.Provider value={{ fontScale, setFontScale: handleSetFontScale }}>
      {children}
    </FontSizeContext.Provider>
  )
}

export const useFontSize = () => {
  const context = useContext(FontSizeContext)
  if (!context) {
    throw new Error('useFontSize must be used within a FontSizeProvider')
  }
  return context
}
