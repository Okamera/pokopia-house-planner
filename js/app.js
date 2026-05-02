/* ===================================================================
   Pokopia House Planner — main application logic
   =================================================================== */

// ── State ─────────────────────────────────────────────────────────────
let houses = [];          // Array of { id, name, slots: [pokemonId|null, ...] }
let selectedPokemonId = null;  // id of the Pokemon the user has clicked in the roster
let houseCounter = 0;

// ── Helpers ──────────────────────────────────────────────────────────
function getPokemonById(id) {
  return POKEMON.find(p => p.id === id) || null;
}

function spriteUrl(pokemonId) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`;
}

function habitatClass(habitat) {
  return `habitat-${habitat.toLowerCase()}`;
}

/** Returns the dominant habitat for a house (the one with the most residents, or null). */
function dominantHabitat(house) {
  const counts = {};
  for (const slotId of house.slots) {
    if (slotId === null) continue;
    const p = getPokemonById(slotId);
    if (!p) continue;
    counts[p.habitat] = (counts[p.habitat] || 0) + 1;
  }
  if (!Object.keys(counts).length) return null;
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

/** True if all occupied slots share the same habitat */
function isFullyCompatible(house) {
  const habitats = house.slots
    .filter(id => id !== null)
    .map(id => getPokemonById(id)?.habitat)
    .filter(Boolean);
  return habitats.length > 0 && new Set(habitats).size === 1;
}

function nextHouseId() {
  return ++houseCounter;
}

function createHouse(name) {
  return {
    id: nextHouseId(),
    name: name || `House ${houseCounter}`,
    slots: [null, null, null, null],
  };
}

// ── Toast notifications ───────────────────────────────────────────────
let toastTimer = null;
function showToast(message, type = 'info') {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.className = `toast toast-${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = 'toast hidden'; }, 2500);
}

// ── Persistence ──────────────────────────────────────────────────────
const STORAGE_KEY = 'pokopia-plan-v1';

function savePlan() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ houses, houseCounter }));
    showToast('Plan saved! 💾', 'success');
  } catch {
    showToast('Could not save plan.', 'error');
  }
}

function loadPlan() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) { showToast('No saved plan found.', 'info'); return; }
    const data = JSON.parse(raw);
    houses = data.houses || [];
    houseCounter = data.houseCounter || houses.length;
    renderHouses();
    showToast('Plan loaded! 📂', 'success');
  } catch {
    showToast('Could not load plan.', 'error');
  }
}

function clearAll() {
  if (!houses.length) return;
  if (!confirm('Clear all houses? This cannot be undone.')) return;
  houses = [];
  houseCounter = 0;
  selectedPokemonId = null;
  renderHouses();
  renderRoster();
  showToast('All houses cleared.', 'info');
}

// ── Render: Pokémon Roster ────────────────────────────────────────────
function getFilteredPokemon() {
  const search  = document.getElementById('pokemon-search').value.trim().toLowerCase();
  const habitat = document.getElementById('habitat-filter').value;
  return POKEMON.filter(p => {
    const matchName    = !search  || p.name.toLowerCase().includes(search);
    const matchHabitat = !habitat || p.habitat === habitat;
    return matchName && matchHabitat;
  });
}

function isAssigned(pokemonId) {
  return houses.some(h => h.slots.includes(pokemonId));
}

function renderRoster() {
  const list = document.getElementById('pokemon-list');
  const filtered = getFilteredPokemon();

  if (!filtered.length) {
    list.innerHTML = '<p class="empty-msg">No Pokémon match your search.</p>';
    return;
  }

  list.innerHTML = filtered.map(p => {
    const assigned  = isAssigned(p.id);
    const selected  = selectedPokemonId === p.id;
    const classes   = [
      'pokemon-card',
      habitatClass(p.habitat),
      assigned  ? 'assigned' : '',
      selected  ? 'selected' : '',
    ].filter(Boolean).join(' ');

    return `
      <div class="${classes}" data-id="${p.id}" title="${p.name} — ${p.habitat} habitat">
        <img
          src="${spriteUrl(p.id)}"
          alt="${p.name}"
          class="pokemon-sprite"
          loading="lazy"
          onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 64 64%22><text y=%2248%22 font-size=%2248%22>🔵</text></svg>'"
        />
        <span class="pokemon-name">${p.name}</span>
        <span class="pokemon-type type-${p.type.toLowerCase()}">${p.type}</span>
        <span class="habitat-badge ${habitatClass(p.habitat)}">
          ${HABITAT_META[p.habitat].emoji} ${p.habitat}
        </span>
        ${assigned ? '<span class="assigned-badge">✓ Housed</span>' : ''}
      </div>`;
  }).join('');
}

// ── Render: Houses ────────────────────────────────────────────────────
function renderHouses() {
  const container = document.getElementById('houses-container');
  const hint      = document.getElementById('how-to-hint');

  if (hint) hint.classList.toggle('hidden', houses.length > 0);

  if (!houses.length) {
    container.innerHTML = `
      <div class="empty-houses">
        <p>No houses yet.</p>
        <p>Click <strong>+ Add House</strong> to get started!</p>
      </div>`;
    return;
  }

  container.innerHTML = houses.map(house => {
    const compatible   = isFullyCompatible(house);
    const dominant     = dominantHabitat(house);
    const occupantCount = house.slots.filter(id => id !== null).length;

    const slotsHtml = house.slots.map((slotId, slotIndex) => {
      if (slotId === null) {
        return `
          <div class="house-slot empty" data-house-id="${house.id}" data-slot="${slotIndex}"
               title="Click to place selected Pokémon here">
            <span class="slot-label">Empty</span>
          </div>`;
      }
      const p = getPokemonById(slotId);
      if (!p) return '';
      return `
        <div class="house-slot occupied ${habitatClass(p.habitat)}" data-house-id="${house.id}" data-slot="${slotIndex}"
             title="${p.name} — click to remove">
          <img src="${spriteUrl(p.id)}" alt="${p.name}" class="slot-sprite"
               onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 64 64%22><text y=%2248%22 font-size=%2248%22>🔵</text></svg>'" />
          <span class="slot-name">${p.name}</span>
          <button class="slot-remove" data-house-id="${house.id}" data-slot="${slotIndex}" title="Remove ${p.name}">✕</button>
        </div>`;
    }).join('');

    const compatIcon  = compatible ? '✅' : (occupantCount < 2 ? '' : '⚠️');
    const compatLabel = compatible
      ? `All ${dominant} — fully compatible!`
      : (occupantCount < 2 ? 'Add more Pokémon' : 'Mixed habitats — less efficient');

    return `
      <div class="house-card ${dominant ? habitatClass(dominant) + '-border' : ''}" data-house-id="${house.id}">
        <div class="house-header">
          <div class="house-title-row">
            <input class="house-name-input" type="text" value="${escapeHtml(house.name)}"
                   data-house-id="${house.id}" maxlength="30" />
            <button class="btn btn-sm btn-danger house-delete" data-house-id="${house.id}" title="Delete house">🗑️</button>
          </div>
          <div class="house-meta">
            <span class="occupant-count">${occupantCount}/4 Pokémon</span>
            ${occupantCount > 0 ? `<span class="compat-badge">${compatIcon} ${compatLabel}</span>` : ''}
          </div>
        </div>
        <div class="house-slots">${slotsHtml}</div>
      </div>`;
  }).join('');
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// ── Event Handlers ────────────────────────────────────────────────────
function handleRosterClick(e) {
  const card = e.target.closest('.pokemon-card');
  if (!card) return;

  const pokemonId = Number(card.dataset.id);
  const pokemon   = getPokemonById(pokemonId);
  if (!pokemon) return;

  if (isAssigned(pokemonId)) {
    showToast(`${pokemon.name} is already housed.`, 'info');
    return;
  }

  if (selectedPokemonId === pokemonId) {
    // Deselect
    selectedPokemonId = null;
    renderRoster();
    showToast('Selection cleared.', 'info');
    return;
  }

  selectedPokemonId = pokemonId;
  renderRoster();
  showToast(`${pokemon.name} selected — now click an empty slot in a house.`, 'info');
}

function handleHousesClick(e) {
  // Delete house
  const deleteBtn = e.target.closest('.house-delete');
  if (deleteBtn) {
    const houseId = Number(deleteBtn.dataset.houseId);
    if (!confirm('Delete this house? All residents will be returned to the roster.')) return;
    houses = houses.filter(h => h.id !== houseId);
    renderHouses();
    renderRoster();
    showToast('House deleted.', 'info');
    return;
  }

  // Remove resident from slot
  const removeBtn = e.target.closest('.slot-remove');
  if (removeBtn) {
    const houseId  = Number(removeBtn.dataset.houseId);
    const slotIndex = Number(removeBtn.dataset.slot);
    const house    = houses.find(h => h.id === houseId);
    if (!house) return;
    const pId = house.slots[slotIndex];
    const p   = getPokemonById(pId);
    house.slots[slotIndex] = null;
    renderHouses();
    renderRoster();
    if (p) showToast(`${p.name} removed from ${house.name}.`, 'info');
    return;
  }

  // Place selected Pokémon into an empty slot
  const emptySlot = e.target.closest('.house-slot.empty');
  if (emptySlot) {
    if (selectedPokemonId === null) {
      showToast('Select a Pokémon from the roster first!', 'info');
      return;
    }
    const houseId   = Number(emptySlot.dataset.houseId);
    const slotIndex = Number(emptySlot.dataset.slot);
    const house     = houses.find(h => h.id === houseId);
    if (!house) return;

    house.slots[slotIndex] = selectedPokemonId;
    const p = getPokemonById(selectedPokemonId);
    selectedPokemonId = null;

    // Warn on habitat mismatch
    const dominant = dominantHabitat(house);
    if (dominant && p && p.habitat !== dominant) {
      showToast(`⚠️ ${p.name} prefers ${p.habitat} — house dominant is ${dominant}.`, 'info');
    } else if (p) {
      showToast(`${p.name} moved into ${house.name}! 🏠`, 'success');
    }

    renderHouses();
    renderRoster();
    return;
  }
}

function handleHouseNameChange(e) {
  const input = e.target.closest('.house-name-input');
  if (!input) return;
  const houseId = Number(input.dataset.houseId);
  const house   = houses.find(h => h.id === houseId);
  if (house) house.name = input.value;
}

// ── Toolbar ───────────────────────────────────────────────────────────
document.getElementById('btn-add-house').addEventListener('click', () => {
  if (houses.length >= 20) { showToast('Maximum 20 houses reached.', 'info'); return; }
  houses.push(createHouse());
  renderHouses();
  showToast('New house added! 🏠', 'success');
});

document.getElementById('btn-save').addEventListener('click', savePlan);
document.getElementById('btn-load').addEventListener('click', loadPlan);
document.getElementById('btn-clear-all').addEventListener('click', clearAll);

// ── Search & Filter ───────────────────────────────────────────────────
document.getElementById('pokemon-search').addEventListener('input', renderRoster);
document.getElementById('habitat-filter').addEventListener('change', renderRoster);

// ── Delegated events ──────────────────────────────────────────────────
document.getElementById('pokemon-list').addEventListener('click', handleRosterClick);
document.getElementById('houses-container').addEventListener('click', handleHousesClick);
document.getElementById('houses-container').addEventListener('change', handleHouseNameChange);

// ── Initial render ────────────────────────────────────────────────────
renderRoster();
renderHouses();

// Auto-load any saved plan
(function autoLoad() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      houses = data.houses || [];
      houseCounter = data.houseCounter || houses.length;
      renderHouses();
    }
  } catch { /* ignore */ }
})();
