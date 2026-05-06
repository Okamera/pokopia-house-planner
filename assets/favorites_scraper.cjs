const cheerio = require("cheerio");
const fs = require("fs-extra");
const path = require("path");

const BASE_URL = "https://www.serebii.net";
const FAVORITES_PAGE = "https://www.serebii.net/pokemonpokopia/favorites/blockystuff.shtml";

async function fetchPage(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    return cheerio.load(html);
  } catch (err) {
    console.error(`Error fetching ${url}:`, err.message);
    return null;
  }
}

async function scrapeFavorites() {
  const $ = await fetchPage(FAVORITES_PAGE);
  if (!$) return {};

  const favorites = {};

  // Find the combobox (select) element
  const selectElement = $("main combobox, main select");
  
  if (selectElement.length === 0) {
    console.error("Could not find select element");
    return {};
  }

  // Get all option elements
  const options = selectElement.find("option");
  
  options.each((index, el) => {
    const optionText = $(el).text().trim();
    const optionValue = $(el).attr("value").trim();
    
    // Skip the first option (database header) and empty options
    if (optionText && optionText !== "Pokémon Pokopia - Favorites Database") {
      const url = `${BASE_URL}${optionValue}`;
      
      favorites[optionText] = url;
      
      console.log(`Found: ${optionText} -> ${url}`);
    }
  });

  return favorites;
}

async function main() {
  const favoritesData = await scrapeFavorites();

  const outputPath = path.join(__dirname, "../src/data/favoriteLinks.json");
  await fs.writeJson(outputPath, favoritesData, { spaces: 2 });

  console.log(`\nSaved ${Object.keys(favoritesData).length} favorite categories`);
}

main();
