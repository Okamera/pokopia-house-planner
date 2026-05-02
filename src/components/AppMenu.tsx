import { useState } from 'react'
import { useHouse } from '../HouseProvider'
import { useFontSize } from '../FontSizeProvider'

export const AppMenu = () => {
  const { clearHouseData } = useHouse()
  const { fontScale, setFontScale } = useFontSize()
  const [menuOpen, setMenuOpen] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

  return (
    <>
      <div id="app-menu">
        <button
          id="app-menu-trigger"
          type="button"
          aria-label="Open app menu"
          onClick={() => setMenuOpen((current) => !current)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="5" x2="21" y2="5" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="19" x2="21" y2="19" />
          </svg>
        </button>
        {menuOpen && (
          <div id="app-menu-popover">
            <div className="menu-section">
              <label>Text Size</label>
              <div className="font-size-controls">
                {[0.875, 1, 1.125, 1.25].map((scale) => (
                  <button
                    key={scale}
                    type="button"
                    className={`font-scale-btn ${fontScale === scale ? 'active' : ''}`}
                    onClick={() => {
                      setFontScale(scale)
                      setMenuOpen(false)
                    }}
                    title={scale === 1 ? 'Default size' : `${Math.round((scale - 1) * 100)}% larger`}
                  >
                    {scale === 0.875 ? 'S' : scale === 1 ? 'M' : scale === 1.125 ? 'L' : 'XL'}
                  </button>
                ))}
              </div>
            </div>
            <hr className="menu-divider" />
            <button
              type="button"
              onClick={() => {
                setAboutOpen(true)
                setMenuOpen(false)
              }}
            >
              About
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirmDeleteOpen(true)
                setMenuOpen(false)
              }}
            >
              Delete House Data
            </button>
          </div>
        )}
      </div>
      {confirmDeleteOpen && (
        <div id="about-modal-backdrop" onClick={() => setConfirmDeleteOpen(false)}>
          <div id="about-modal" onClick={(event) => event.stopPropagation()}>
            <div className="about-modal-header">
              <h2>Delete House Data</h2>
              <button type="button" aria-label="Close" onClick={() => setConfirmDeleteOpen(false)}>
                ×
              </button>
            </div>
            <p>Are you sure you want to delete your house data? This cannot be undone.</p>
            <div className="modal-actions">
              <button type="button" className="modal-cancel" onClick={() => setConfirmDeleteOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="modal-confirm-delete"
                onClick={() => {
                  clearHouseData()
                  setConfirmDeleteOpen(false)
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {aboutOpen && (
        <div id="about-modal-backdrop" onClick={() => setAboutOpen(false)}>
          <div id="about-modal" onClick={(event) => event.stopPropagation()}>
            <div className="about-modal-header">
              <h2>About</h2>
              <button type="button" aria-label="Close about modal" onClick={() => setAboutOpen(false)}>
                ×
              </button>
            </div>
            <p>
              Pokemon Compatibility helps you organize Pokopia houses, compare compatible Pokemon,
              and experiment with house combinations using habitat, favorites, and specialty data.
            </p>
            <p>
              House data is saved locally in your browser so your layout stays available after refresh
              unless you clear it from the menu.*
            </p>
            <p>Credit to Serebii.net for all of the Pokemon data and images used in this app.</p>
            <p>*Note: If you are using Safari on an iPhone, the house data will be automatically cleared after 7 days without use of the app. It is recommended to use a different browser or device to retain your data.</p>
          </div>
        </div>
      )}
    </>
  )
}
