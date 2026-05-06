const cheerio = require("cheerio");
const fs = require("fs-extra");
const path = require("path");

const BASE_URL = "https://www.serebii.net/pokemonpokopia/";
const LITTER_URL = "https://www.serebii.net/pokemonpokopia/litter.shtml";

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

async function scrapeLitter() {
  const $ = await fetchPage(LITTER_URL);
  if (!$) return {
    pokemon: {},
    imgs: {}
  };

  const pokemon = {}
  const imgs = {}

  const rows = $("table.tab").eq(1).children("tbody").children("tr").toArray();
  const litterData = rows.forEach((row) => {
    const cols = $(row).children("td");

    if (cols.length < 5) return null;

    const number = $(cols[0]).text().trim().split("#")[1];
    const nameCell = $(cols[2]);
    const name = nameCell.text().trim();
    
    // Extract item from the last column
    const itemCell = $(cols[4]);
    const itemText = itemCell.text().trim();

    if (!name || !number) return null;

    if (!imgs[itemText]) {
      imgs[itemText] = itemCell.find("img").attr("src") ? BASE_URL + itemCell.find("img").attr("src") : null;
    }
    pokemon[name] = itemText;

    console.log(`Found: ${name} (#${number}) - Litters: ${itemText}`);
  });

  return { pokemon, imgs };
}

async function main() {
  const litterResults = await scrapeLitter();

  const outputPath = path.join(__dirname, "../src/data/litter.json");
  await fs.writeJson(outputPath, litterResults, { spaces: 2 });

  console.log(`Saved litter data for ${Object.keys(litterResults.pokemon).length} Pokémon`);
}

main();
