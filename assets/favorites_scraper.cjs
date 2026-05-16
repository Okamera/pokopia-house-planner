const cheerio = require("cheerio");
const fs = require("fs-extra");
const path = require("path");

const BASE_URL = "https://www.serebii.net";
const FAVORITES_PAGE = "https://www.serebii.net/pokemonpokopia/favorites/blockystuff.shtml";
const FAVORITES_OUTPUT_PATH = path.join(__dirname, "../src/data/favoriteLinks.json");
const FURNITURE_OUTPUT_PATH = path.join(__dirname, "../src/data/furniture.json");

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
  return normalizeText(cellClone.text()) || "Unknown";
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
    const optionValue = $(el).attr("value")?.trim();
    
    // Skip the first option (database header) and empty options
    if (optionText && optionValue && optionText !== "Pokémon Pokopia - Favorites Database") {
      const url = toAbsoluteUrl(optionValue);
      
      favorites[optionText] = url;
      
      console.log(`Found: ${optionText} -> ${url}`);
    }
  });

  return favorites;
}

async function scrapeFurnitureForCategory(categoryName, url) {
  const $ = await fetchPage(url);
  if (!$) return [];

  const itemsTable = findItemsTable($);

  if (!itemsTable) {
    console.error(`Could not find furniture items table for ${categoryName}`);
    return [];
  }

  const furniture = [];

  $(itemsTable)
    .find("tr")
    .slice(1)
    .each((_, row) => {
      const cells = $(row).find("td");

      if (cells.length < 4) {
        return;
      }

      const name = normalizeText($(cells[1]).text());
      if (!name) {
        return;
      }

      const image = toAbsoluteUrl($(cells[0]).find("img").attr("src"));
      const type = getFurnitureType($, cells[3]);

      furniture.push({
        name,
        image,
        categories: [categoryName],
        type,
      });
    });

  console.log(`Scraped ${furniture.length} furniture items from ${categoryName}`);
  return furniture;
}

async function scrapeAllFurniture(favorites) {
  const furnitureByName = new Map();

  for (const [categoryName, url] of Object.entries(favorites)) {
    const furnitureItems = await scrapeFurnitureForCategory(categoryName, url);
    for (const furnitureItem of furnitureItems) {
      mergeFurnitureItems(furnitureByName, furnitureItem);
    }
  }

  return Array.from(furnitureByName.values()).sort((left, right) => left.name.localeCompare(right.name));
}

async function main() {
  const favoritesData = await scrapeFavorites();
  const furnitureData = await scrapeAllFurniture(favoritesData);

  await fs.writeJson(FAVORITES_OUTPUT_PATH, favoritesData, { spaces: 2 });
  await fs.writeJson(FURNITURE_OUTPUT_PATH, furnitureData, { spaces: 2 });

  console.log(`\nSaved ${Object.keys(favoritesData).length} favorite categories`);
  console.log(`Saved ${furnitureData.length} furniture items`);
}

main();
