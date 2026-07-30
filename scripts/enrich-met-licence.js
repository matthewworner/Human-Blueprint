/**
 * enrich-met-licence.js — record rights/provenance for the 41 Met records.
 *
 * The audit flagged that the corpus carried no licence, attribution or
 * canonical-source fields. This fetches each object's record from the Met's
 * public Collection API and writes a `licence` block onto every record so the
 * corpus is auditable: isPublicDomain, accessionNumber, the canonical object
 * URL, the exact source image we derived the local WebP from, and a credit line.
 *
 *   node scripts/enrich-met-licence.js --dry-run   # preview + public-domain tally, no writes
 *   node scripts/enrich-met-licence.js             # write licence blocks into images.json
 *
 * images.json is in git, so the rewrite is reversible.
 */
import { readFile, writeFile } from 'node:fs/promises';

const IMAGES_JSON = 'public/images.json';
const MET_API = 'https://collectionapi.metmuseum.org/public/collection/v1/objects/';
const RATE_MS = 250;
const TIMEOUT_MS = 30000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function loadRecords(raw) {
  return Array.isArray(raw) ? raw : raw.images || raw.records || [];
}

function objectIdOf(rec) {
  // source: "met_466105" or id: "museum_met_466105"
  const m = String(rec.source || rec.id || '').match(/(\d+)$/);
  return m ? Number(m[1]) : null;
}

async function fetchMet(objectID) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${MET_API}${objectID}`, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

function licenceBlock(o) {
  const pd = o.isPublicDomain === true;
  return {
    isPublicDomain: pd,
    accessionNumber: o.accessionNumber || null,
    objectURL: o.objectURL || null,
    sourceImage: o.primaryImage || null,
    credit: pd
      ? 'Metropolitan Museum of Art, Open Access (CC0)'
      : 'Metropolitan Museum of Art — rights restricted, review before distribution'
  };
}

async function enrichRecord(rec) {
  const objectID = objectIdOf(rec);
  if (!objectID) throw new Error(`no object id in source/id: ${rec.source || rec.id}`);
  const met = await fetchMet(objectID);
  return { objectID, block: licenceBlock(met) };
}

async function main() {
  const dry = process.argv.includes('--dry-run');
  const records = loadRecords(JSON.parse(await readFile(IMAGES_JSON, 'utf8')));
  console.log(`images.json: ${records.length} records.`);

  let pd = 0;
  let restricted = 0;
  const enriched = [];
  for (const rec of records) {
    const { objectID, block } = await enrichRecord(rec);
    pd += block.isPublicDomain ? 1 : 0;
    restricted += block.isPublicDomain ? 0 : 1;
    enriched.push({ ...rec, licence: block });
    const flag = block.isPublicDomain ? 'PD ' : 'RSTR';
    if (dry) {
      console.log(`  ${flag} ${rec.id} (${block.accessionNumber}) ${block.objectURL}`);
    } else {
      console.log(`  ✓ ${rec.id} ${block.credit}`);
    }
    await sleep(RATE_MS);
  }

  console.log(`\nPublic domain: ${pd}/${records.length}. Restricted: ${restricted}/${records.length}.`);
  if (restricted > 0) {
    console.log('!! Restricted records should be reviewed before any public distribution.');
  }
  if (dry) {
    console.log('Dry run only. Re-run without --dry-run to write licence blocks into images.json.');
    return;
  }
  await writeFile(IMAGES_JSON, JSON.stringify(enriched, null, 2));
  console.log(`Wrote licence blocks to ${IMAGES_JSON}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
