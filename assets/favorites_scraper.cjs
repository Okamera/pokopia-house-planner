const cheerio = require("cheerio");
const fs = require("fs-extra");
const path = require("path");

const BASE_URL = "https://www.serebii.net";
const FAVORITES_PAGE = "https://www.serebii.net/pokemonpokopia/favorites/blockystuff.shtml";
const FAVORITES_OUTPUT_PATH = path.join(__dirname, "../src/data/favoriteLinks.json");
const FURNITURE_OUTPUT_PATH = path.join(__dirname, "../src/data/furniture.json");
const FURNITURE_TYPES_OUTPUT_PATH = path.join(__dirname, "../src/data/furnitureTypes.json");

function toAbsoluteUrl(value) {
  if (!value) return "";
  return new URL(value, BASE_URL).href;
}

function normalizeText(value) {
  return value.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

function findItemsTable($) {
  const tables = $("table.dextable").toArray();

  return tables.find((table) => {
    const headers = $(table)
      .find("tr")
      .first()
      .find("td, th")
      .map((_, cell) => normalizeText($(cell).text()))
      .get();

    return headers.length >= 4
      && headers[0] === "Picture"
      && headers[1] === "Name"
      && headers[2] === "Description"
      && headers[3] === "Category";
  }) ?? null;
}

function getFurnitureType($, cell) {
  const cellClone = $(cell).clone();
  cellClone.find("img, br").remove();
  const name = normalizeText(cellClone.text()) || "";
  return name ? {
    name,
    image: toAbsoluteUrl($(cell).find("img").attr("src")),
  } : null;
}

function mergeFurnitureItems(itemsByName, nextItem) {
  const existingItem = itemsByName.get(nextItem.name);

  if (!existingItem) {
    itemsByName.set(nextItem.name, nextItem);
    return;
  }

  if (!existingItem.categories.includes(nextItem.categories[0])) {
    existingItem.categories.push(nextItem.categories[0]);
    existingItem.categories.sort((left, right) => left.localeCompare(right));
  }

  if (!existingItem.image && nextItem.image) {
    existingItem.image = nextItem.image;
  }

  if (existingItem.type === "Unknown" && nextItem.type !== "Unknown") {
    existingItem.type = nextItem.type;
  }

  // If any source indicates the item is DLC, mark it true
  if (!existingItem.isDLC && nextItem.isDLC) {
    existingItem.isDLC = true;
  }
}

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

async function scrapeFavorites(showLogs) {
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
    const optionValue = $(el).attr("value")?.trim();
    
    // Skip the first option (database header) and empty options
    if (optionText && optionValue && optionText !== "Pokémon Pokopia - Favorites Database") {
      const url = toAbsoluteUrl(optionValue);
      
      favorites[optionText] = url;
      
      if (showLogs) console.log(`Found: ${optionText} -> ${url}`);
    }
  });

  return favorites;
}

async function scrapeFurnitureForCategory(categoryName, url, allTypes, showLogs) {
  const $ = await fetchPage(url);
  if (!$) return [];

  const itemsTable = findItemsTable($);

  if (!itemsTable) {
    console.error(`Could not find furniture items table for ${categoryName}`);
    return [];
  }

  const furniture = [];

  // iterate rows sequentially so we can await item page fetches
  const rows = $(itemsTable).find('tr').slice(1).toArray();
  for (const row of rows) {
    const cells = $(row).find('td');

    if (cells.length < 4) continue;

    const name = normalizeText($(cells[1]).text());
    if (!name) continue;

    const image = toAbsoluteUrl($(cells[0]).find('img').attr('src'));
    const type = getFurnitureType($, cells[3]);

    // detect item page link (name cell anchor or image link)
    const relHref = $(cells[1]).find('a').attr('href') || $(cells[0]).find('a').attr('href') || '';
    const itemUrl = relHref ? toAbsoluteUrl(relHref) : null;

    // default isDLC false; check item page text for the special phrase when available
    let isDLC = false;
    if (itemUrl) {
      try {
        const item$ = await fetchPage(itemUrl);
        if (item$) {
          const bodyText = item$.root().text();
          if (bodyText && bodyText.indexOf('Requires Expansion Pass') !== -1) {
            isDLC = true;
          }
        }
      } catch (e) {
        // non-fatal: leave isDLC false
      }
    }

    furniture.push({
      name,
      image,
      categories: [categoryName],
      type: type?.name || "",
      isDLC,
    });
    if (type) {
      allTypes[type.name] = type.image;
    }
  }

  if (showLogs) console.log(`Scraped ${furniture.length} furniture items from ${categoryName}`);
  return { furniture, types: allTypes };
}

async function scrapeAllFurniture(favorites, showLogs) {
  const furnitureByName = new Map();
  const allTypes = {};

  for (const [categoryName, url] of Object.entries(favorites)) {
    const { furniture, types } = await scrapeFurnitureForCategory(categoryName, url, allTypes, showLogs);
    for (const furnitureItem of furniture) {
      mergeFurnitureItems(furnitureByName, furnitureItem);
    }
  }

  return {
    furniture: Array.from(furnitureByName.values()).sort((left, right) => left.name.localeCompare(right.name)),
    types: allTypes,
  };
}

async function main(showLogs) {
  const favoritesData = await scrapeFavorites(showLogs);
  const { furniture: furnitureData, types: furnitureTypes } = await scrapeAllFurniture(favoritesData, showLogs);

  await fs.writeJson(FAVORITES_OUTPUT_PATH, favoritesData, { spaces: 2 });
  await fs.writeJson(FURNITURE_OUTPUT_PATH, furnitureData, { spaces: 2 });
  await fs.writeJson(FURNITURE_TYPES_OUTPUT_PATH, furnitureTypes, { spaces: 2 });

  console.log(`Saved ${Object.keys(favoritesData).length} favorite categories`);
  console.log(`Saved ${furnitureData.length} furniture items`);
  console.log(`Saved ${Object.keys(furnitureTypes).length} furniture types`);
}

main(false);
