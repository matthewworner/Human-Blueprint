/**
 * curate-met-corpus.js — build an honest demo corpus from the real Met records.
 *
 * Of the 2,041 records in public/images.json, only 41 point at real
 * images.metmuseum.org assets (and are the only ones carrying featureVectors).
 * The other 2,000 use a fabricated upload.wikimedia.org pattern. This script
 * downloads + resizes the 41 to local WebP and rewrites images.json to just
 * those records, so the scene renders real art with no CORS/CSP/latency tax.
 *
 *   node scripts/curate-met-corpus.js --dry-run   # list targets + reachability, no writes
 *   node scripts/curate-met-corpus.js             # download, resize, rewrite images.json
 *
 * images.json is in git (commit 7fcc81c), so the rewrite is reversible.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';

const IMAGES_JSON = 'public/images.json';
const OUT_DIR = 'public/images';
const WIDTH = 800;          // max edge; portrait/landscape kept via fit:'inside'
const QUALITY = 80;
const RATE_MS = 250;        // polite gap between Met requests
const TIMEOUT_MS = 30000;

const localPath = (id) => `/images/${id}.webp`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function loadRecords(raw) {
  return Array.isArray(raw) ? raw : raw.images || raw.records || [];
}
function metRecords(all) {
  return all.filter((r) => /images\.metmuseum\.org/.test(r.url || ''));
}

async function head(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { method: 'HEAD', signal: ctrl.signal });
    return { ok: res.ok, status: res.status, len: Number(res.headers.get('content-length') || 0) };
  } catch (e) {
    return { ok: false, status: 0, len: 0, err: String(e).split('\n')[0] };
  } finally {
    clearTimeout(t);
  }
}

async function downloadResize(rec, sharp) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(rec.url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    return await sharp(buf)
      .rotate() // honour EXIF orientation
      .resize({ width: WIDTH, height: WIDTH, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toBuffer();
  } finally {
    clearTimeout(t);
  }
}

async function main() {
  const dry = process.argv.includes('--dry-run');
  const all = loadRecords(JSON.parse(await readFile(IMAGES_JSON, 'utf8')));
  const targets = metRecords(all);
  console.log(`images.json: ${all.length} records → ${targets.length} real Met targets (dropping ${all.length - targets.length} fabricated).`);

  if (dry) {
    let ok = 0;
    let bytes = 0;
    for (const r of targets) {
      const h = await head(r.url);
      ok += h.ok ? 1 : 0;
      bytes += h.len;
      console.log(`  ${h.ok ? 'OK ' : 'FAIL'} ${String(h.status).padEnd(3)} ${r.id} → ${localPath(r.id)}  ${h.ok ? '' : h.err || ''}`);
      await sleep(RATE_MS);
    }
    console.log(`\nReachable: ${ok}/${targets.length}. Sum primary bytes ≈ ${(bytes / 1e6).toFixed(1)} MB → ~WebP ${(bytes / 1e6 * 0.12).toFixed(1)} MB at q${QUALITY}/${WIDTH}px.`);
    console.log('Dry run only. Re-run without --dry-run to download + resize + rewrite images.json.');
    return;
  }

  const sharp = (await import('sharp')).default;
  await mkdir(OUT_DIR, { recursive: true });
  const cleaned = [];
  let done = 0;
  let failed = 0;
  for (const r of targets) {
    try {
      const webp = await downloadResize(r, sharp);
      await writeFile(`${OUT_DIR}/${r.id}.webp`, webp);
      cleaned.push({ ...r, url: localPath(r.id) });
      done++;
      console.log(`  ✓ ${r.id} ${(webp.length / 1024).toFixed(0)} KB`);
    } catch (e) {
      failed++;
      cleaned.push(r); // keep remote url so the record still resolves (fallback path)
      console.error(`  ✗ ${r.id} ${r.url} — ${String(e).split('\n')[0]}`);
    }
    await sleep(RATE_MS);
  }
  await writeFile(IMAGES_JSON, JSON.stringify(cleaned, null, 2));
  console.log(`\nDone: ${done} downloaded+resized, ${failed} kept-on-remote. images.json now ${cleaned.length} records at ${IMAGES_JSON}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
