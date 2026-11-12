// Downloads the site's fonts once, so the live site never loads anything from Google.
//   node tools/fetch-fonts.mjs
// Writes src/fonts/*.woff2, src/fonts/OFL.txt and two stylesheets:
//   src/fonts.css        fonts every page uses (loaded in <head>)
//   src/looks-fonts.css  the five sample looks on the home page (loaded only when that section is near)
// Only the latin and latin-ext subsets are kept; the browser fetches latin-ext only for characters such as ₹.
// All families are under the SIL Open Font License 1.1.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'src/fonts');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

const sets = {
  'fonts.css': [
    { q: 'Instrument+Serif:ital@0;1', dir: 'instrumentserif' },
    { q: 'Figtree:wght@400;500;600', dir: 'figtree' },
    { q: 'Fraunces:opsz,wght@9..144,600', dir: 'fraunces' },
    // Only the three letters of भाव, for the name on the home page.
    { q: 'Tiro+Devanagari+Hindi', text: 'भाव', dir: 'tirodevanagarihindi' },
  ],
  'looks-fonts.css': [
    { q: 'Cormorant+Garamond:wght@700', dir: 'cormorantgaramond' },
    { q: 'Jost:wght@400;700', dir: 'jost' },
    { q: 'DM+Serif+Display', dir: 'dmserifdisplay' },
    { q: 'Manrope:wght@400;700', dir: 'manrope' },
    { q: 'Bricolage+Grotesque:opsz,wght@12..96,800', dir: 'bricolagegrotesque' },
    { q: 'Nunito:wght@400;700', dir: 'nunito' },
    { q: 'Space+Grotesk:wght@700', dir: 'spacegrotesk' },
    { q: 'Inter:wght@400;700', dir: 'inter' },
    { q: 'Lora:wght@700', dir: 'lora' },
    { q: 'Work+Sans:wght@400;700', dir: 'worksans' },
  ],
};

const get = async (url, type) => {
  const r = await fetch(url, { headers: { 'user-agent': UA } });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return type === 'buf' ? Buffer.from(await r.arrayBuffer()) : r.text();
};
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
const licences = [];

for (const [sheet, families] of Object.entries(sets)) {
  const faces = new Map(); // one @font-face per file, style and subset; weights merged into a range
  for (const f of families) {
    const url = `https://fonts.googleapis.com/css2?family=${f.q}${f.text ? `&text=${encodeURIComponent(f.text)}` : ''}&display=swap`;
    const css = await get(url);
    for (const m of css.matchAll(/(?:\/\* ([\w-]+) \*\/\s*)?@font-face\s*\{([^}]+)\}/g)) {
      const subset = m[1] || 'text';
      if (!['latin', 'latin-ext', 'text'].includes(subset)) continue;
      const body = m[2];
      const prop = (n) => (new RegExp(`${n}:\\s*([^;]+);`).exec(body) || [])[1];
      const family = prop('font-family').replace(/'/g, '');
      const style = prop('font-style');
      const weight = Number(prop('font-weight'));
      const src = /url\(([^)]+)\)/.exec(prop('src'))[1];
      const range = prop('unicode-range');
      const key = `${src}|${style}|${subset}`;
      const face = faces.get(key) || { family, style, subset, src, range, lo: weight, hi: weight };
      face.lo = Math.min(face.lo, weight);
      face.hi = Math.max(face.hi, weight);
      faces.set(key, face);
    }
    licences.push(f.dir);
  }
  const rules = [];
  for (const face of faces.values()) {
    const file = `${slug(face.family)}-${face.style}-${face.subset}.woff2`;
    fs.writeFileSync(path.join(outDir, file), await get(face.src, 'buf'));
    const weight = face.lo === face.hi ? face.lo : `${face.lo} ${face.hi}`;
    rules.push(`@font-face{font-family:'${face.family}';font-style:${face.style};font-weight:${weight};font-display:swap;src:url(fonts/${file}) format('woff2')${face.range ? `;unicode-range:${face.range}` : ''}}`);
  }
  fs.writeFileSync(path.join(root, 'src', sheet), `/* Self-hosted fonts, made by tools/fetch-fonts.mjs. SIL Open Font License 1.1, see fonts/OFL.txt. */\n${rules.join('\n')}\n`);
  console.log(`${sheet}: ${faces.size} files`);
}

const texts = [];
for (const dir of licences) {
  const t = await get(`https://raw.githubusercontent.com/google/fonts/main/ofl/${dir}/OFL.txt`);
  texts.push(`==== ${dir} ====\n${t.trim()}\n`);
}
fs.writeFileSync(path.join(outDir, 'OFL.txt'), texts.join('\n'));
console.log('Licences written to src/fonts/OFL.txt');
