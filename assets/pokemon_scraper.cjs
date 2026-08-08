const cheerio = require("cheerio");
const fs = require("fs-extra");
const { type } = require("os");
const path = require("path");

const BASE_URL = "https://www.serebii.net";
const START_URL = "https://www.serebii.net/pokemonpokopia/availablepokemon.shtml";
const EVENT_DEX_URL = "https://www.serebii.net/pokemonpokopia/eventpokedex.shtml";
const DLC1_DEX_URL = "https://www.serebii.net/pokemonpokopia/basinpokedex.shtml";

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

// Extract extra details from individual page
function extractDetail($, label) {
  let value = "";

  $("td").each((_, el) => {
    const text = $(el).text().trim().toLowerCase();

    if (text.includes(label.toLowerCase())) {
      value = $(el).next("td").text().trim();
    }
  });

  return value;
}

async function scrapeDetails(url) {
  const $ = await fetchPage(url);
  if (!$) return {};

  const typeImgs = $("table.tab").eq(0).find('tr').eq(5).children('td').eq(0).find('img');
  const dataRow = $("table.tab").eq(2).find("tr").eq(2);

  const favesText = dataRow.children("td").eq(2).text().trim();
  const favorites = favesText.split(/,|\n|\/|&/).map(s => s.trim()).filter(Boolean);

  return {
    habitat: dataRow.children("td").eq(1).text().trim(),
    type1: typeImgs.eq(0).attr('alt'),
    type2: typeImgs.eq(1) ? typeImgs.eq(1).attr('alt') : "",
    favorites: favorites.splice(0, favorites.length - 1), // all but last
    taste: favorites[favorites.length - 1] || ""
  };
}

async function scrapeList(url, showLogs, isDLC) {
  const $ = await fetchPage(url);
  if (!$) return [];

  const specialtyImageMap = {};
  const rows = $("table.tab").eq(1).children("tbody").children("tr").toArray();
  const rowResults = await Promise.all(
    rows.map(async (row) => {
      const cols = $(row).find("td");

      if (cols.length < 4) return null;

      const id = $(cols[0]).text().trim().split("#")[1];

      let image = $(cols[1]).find("img").attr("src");
      if (image && !image.startsWith("http")) {
        image = BASE_URL + image;
      }

      const nameCell = $(cols[2]);
      const name = nameCell.text().trim();
      const relativeLink = nameCell.find("a").attr("href");

      if(showLogs) console.log(`Scraping ${name}...`);

      if (!relativeLink) return null;

      const detailUrl = BASE_URL + relativeLink;

      const specialties = [];
      $(cols[3]).find('a').each((i, el) => {
        if ($(el).text().trim()) {
          specialties.push($(el).text().trim());
        }
        if ($(el).find('img').attr('src')) {
          specialtyImageMap[$(el).find('img').attr('alt')] = BASE_URL + $(el).find('img').attr('src');
        }
      });

      const details = await scrapeDetails(detailUrl);

      await new Promise((resolve) => setTimeout(resolve, 200));

      return {
        number: id,
        name,
        specialty1: specialties[0] || "",
        specialty2: specialties[1] || "",
        habitat: details.habitat || "",
        type1: details.type1 || "",
        type2: details.type2 || "",
        favorites: details.favorites || [],
        taste: details.taste || "",
        image,
        isDLC: isDLC
      };
    })
  );

  return {
    rowResults: rowResults.filter(Boolean),
    specialtyImageMap
  };
}

async function main(showLogs) {
  const {rowResults: results, specialtyImageMap} = await scrapeList(START_URL, showLogs);
  const {rowResults: eventResults, specialtyImageMap: eventSpecialtyImageMap } = await scrapeList(EVENT_DEX_URL, showLogs);
  const {rowResults: dlc1Results, specialtyImageMap: dlc1SpecialtyImageMap } = await scrapeList(DLC1_DEX_URL, showLogs, true);
  results.push(...eventResults);
  results.push(...dlc1Results);

  const outputPath = path.join(__dirname, "../src/data/pokemon.json");
  await fs.writeJson(outputPath, results, { spaces: 2 });

  const combinedSpecialtyImageMap = { ...specialtyImageMap, ...eventSpecialtyImageMap, ...dlc1SpecialtyImageMap };
  const specialtyImgPath = path.join(__dirname, "../src/data/specialtyImages.json");
  await fs.writeJson(specialtyImgPath, combinedSpecialtyImageMap, { spaces: 2 });

  console.log(`Saved ${results.length} Pokémon`);
}

main(false);