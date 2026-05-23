import { useEffect, useRef, useState } from 'react'
import { useHouse } from '../HouseProvider'
import { useFontSize } from '../FontSizeProvider'
import type { House } from '../types'

const IPHONE_SAFARI_WARNING_KEY = 'pokopia-iphone-safari-warning-seen'

const isIPhoneSafari = () => {
  const userAgent = navigator.userAgent
  const vendor = navigator.vendor
  const isIPhone = /iPhone/i.test(userAgent)
  const isSafari = /Safari/i.test(userAgent) && /Apple/i.test(vendor)
  const isOtherIosBrowser = /CriOS|FxiOS|EdgiOS|OPiOS/i.test(userAgent)

  return isIPhone && isSafari && !isOtherIosBrowser
}

export const AppMenu = () => {
  const { clearHouseData, dragAndDropEnabled, houses, importHouses, setDragAndDropEnabled } = useHouse()
  const { fontScale, setFontScale } = useFontSize()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [faqOpen, setFaqOpen] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [iphoneSafariWarningOpen, setIPhoneSafariWarningOpen] = useState(false)
  const [emailCopied, setEmailCopied] = useState(false)

  useEffect(() => {
    if (!isIPhoneSafari()) {
      return
    }

    const hasSeenWarning = localStorage.getItem(IPHONE_SAFARI_WARNING_KEY)
    if (hasSeenWarning) {
      return
    }

    localStorage.setItem(IPHONE_SAFARI_WARNING_KEY, 'true')
    setIPhoneSafariWarningOpen(true)
  }, [])

  const uploadBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string) as House[]
        if (Array.isArray(data)) {
          importHouses(data)
        }
      } catch {
        alert('Invalid backup file.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
    setMenuOpen(false)
  }

  const downloadBackup = () => {
    const blob = new Blob([JSON.stringify(houses, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pokopia-houses-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const copyEmailToClipboard = () => {
    navigator.clipboard.writeText('pokehouseplan@gmail.com')
    setEmailCopied(true)
    setTimeout(() => setEmailCopied(false), 2000)
  }

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
            <div className="menu-section">
              <label>Interactions</label>
              <button
                type="button"
                className={`menu-toggle-btn ${dragAndDropEnabled ? 'active' : ''}`}
                onClick={() => setDragAndDropEnabled((current) => !current)}
              >
                {dragAndDropEnabled ? 'Click, Drag and Drop' : 'Click only'}
              </button>
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
                setFaqOpen(true)
                setMenuOpen(false)
              }}
            >
              FAQ
            </button>
            <button
              type="button"
              onClick={() => {
                setContactOpen(true)
                setMenuOpen(false)
              }}
            >
              Contact Creator
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false)
              }}
            >
              Backup data to device
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
            >
              Restore from backup
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              style={{ display: 'none' }}
              onChange={uploadBackup}
            />
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
      {iphoneSafariWarningOpen && (
        <div id="about-modal-backdrop" onClick={() => setIPhoneSafariWarningOpen(false)}>
          <div id="about-modal" onClick={(event) => event.stopPropagation()}>
            <div className="about-modal-header">
              <h2>Backup Recommended</h2>
              <button type="button" aria-label="Close backup warning" onClick={() => setIPhoneSafariWarningOpen(false)}>
                ×
              </button>
            </div>
            <p>
              You&apos;re using Safari on an iPhone. Safari may clear this app&apos;s saved house data after about 7 days
              without use.
            </p>
            <p>
              To prevent this you can add this website to your home screen or use the Backup data to device option in the menu to save a copy of your houses in case your browser data gets wiped.
            </p>
            <div className="modal-actions">
              <button type="button" className="modal-cancel" onClick={() => setIPhoneSafariWarningOpen(false)}>
                Dismiss
              </button>
              <button
                type="button"
                onClick={() => {
                  downloadBackup()
                  setIPhoneSafariWarningOpen(false)
                }}
              >
                Back Up Now
              </button>
            </div>
          </div>
        </div>
      )}
      {faqOpen && (
        <div id="about-modal-backdrop" onClick={() => setFaqOpen(false)}>
          <div id="about-modal" className="faq-modal" onClick={(event) => event.stopPropagation()}>
            <div className="about-modal-header">
              <h2>FAQ</h2>
              <button type="button" aria-label="Close FAQ" onClick={() => setFaqOpen(false)}>×</button>
            </div>
            <dl className="faq-list">
              <dt>How do I add a Pokémon to a house?</dt>
              <dd>Select a house by clicking on it, then drag a Pokémon from the compatibility list on the right into the house. You can also turn drag and drop off in the menu and add Pokémon with clicks instead.</dd>

              <dt>How do I remove a Pokémon from a house?</dt>
              <dd>Click on a Pokémon inside a house to remove it. You can also drag it back to the compatibility list on the right.</dd>

              <dt>What does compatibility mean?</dt>
              <dd>The compatibility score reflects how many favorites a Pokémon shares with the current members of the selected house. Higher is better. Pokémon with no shared favorites appear in the Incompatible section at the bottom of the list.</dd>

              <dt>What are the colored location tags (WW, BB, etc.)?</dt>
              <dd>These represent the house's location: Withered Wastelands (WW), Bleak Beach (BB), Rocky Ridges (RR), Sparkling Skylands (SS), and Palette Town (PT). The number shown is the total prefab slot cost used at that location out of the 40-slot limit.</dd>

              <dt>What's the difference between Prefab and Custom houses?</dt>
              <dd>Prefab houses are houses that have a loading screen when you enter/exit them and count toward the 40-slot location limit. Custom houses do not.</dd>

              <dt>Will my house data be lost if I close the browser?</dt>
              <dd>No — house data is saved to your browser's local storage and will persist across sessions. However, Safari on iPhone may clear it after 7 days of inactivity. Use the Backup option in this menu to save a file to your device.</dd>

              <dt>How do I restore a backup?</dt>
              <dd>Use "Restore from backup" in this menu and select the <code>.json</code> file you previously downloaded. This will replace all current house data.</dd>

              <dt>How do I select furniture for a house?</dt>
              <dd>Click the furniture icon (table and chairs) in the table view or open the house details modal from the grid view. In the details modal, you'll find a furniture selector for each floor. You can search for items, filter by type or category, and click items to add or remove them from your selection.</dd>
            </dl>
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
              Pokemon Compatibility helps you organize Pokopia houses, plan furniture for a house, compare compatible Pokemon,
              and experiment with house combinations using habitat, favorites, and specialty data.
            </p>
            <p>
              House data is saved locally in your browser so your layout stays available after refresh
              unless you clear it from the menu.*
            </p>
            <p>Credit to Serebii.net for all of the Pokemon and furniture data and images used in this app.</p>
            <p>*Note: If you are using Safari on an iPhone, the house data will be automatically cleared after 7 days without use of the app. It is recommended to use a different browser or device to retain your data.</p>
          </div>
        </div>
      )}
      {contactOpen && (
        <div id="about-modal-backdrop" onClick={() => setContactOpen(false)}>
          <div id="about-modal" onClick={(event) => event.stopPropagation()}>
            <div className="about-modal-header">
              <h2>Contact</h2>
              <button type="button" aria-label="Close contact modal" onClick={() => setContactOpen(false)}>
                ×
              </button>
            </div>
            <p>If you have any questions or feedback, you can contact me at <button type="button" className="contact-email-btn" onClick={copyEmailToClipboard} title="Click to copy email">{emailCopied ? 'Copied!' : 'pokehouseplan@gmail.com'}</button> or on discord <a href="https://discord.com/channels/281794915736748032" target="_blank" rel="noopener noreferrer">@okamera</a>.</p>
          </div>
        </div>
      )}
    </>
  )
}
