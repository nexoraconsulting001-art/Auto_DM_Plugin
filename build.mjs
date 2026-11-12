// Builds Bhava's company website. No dependencies.
//   node build.mjs             -> dist     a working site; missing details show as highlighted gaps
//   node build.mjs --preview   -> preview  the same pages with relative links, for private previews
//   node build.mjs --release   -> dist     refuses to build while anything is unconfirmed
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const preview = process.argv.includes('--preview');
const release = process.argv.includes('--release');
const out = path.join(root, preview ? 'preview' : 'dist');
// SITE_CONFIG points at another config, for example to try the form against a local test endpoint.
const cfg = JSON.parse(fs.readFileSync(path.resolve(root, process.env.SITE_CONFIG || 'site.config.json'), 'utf8'));
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// A config value that is empty or still starts with "TODO" counts as not set.
const val = (v) => (typeof v === 'string' && v.trim() && !/^TODO\b/i.test(v.trim()) ? v.trim() : '');
const gaps = new Set();
const todo = (label) => {
  gaps.add(label);
  return `<mark class="todo">[${esc(label)}]</mark>`;
};
const fill = (value, label) => (val(value) ? esc(val(value)) : todo(label));

const c = cfg.company;
const ea = cfg.earlyAccess || {};
const siteUrl = cfg.siteUrl.replace(/\/$/, '');

// Early access: post to Bhava's own lead capture when it is set; otherwise open WhatsApp or email
// with the details filled in. The WhatsApp number or email is also shown as a fallback.
const endpoint = val(ea.endpoint);
const wa = val(ea.whatsappNumber).replace(/\D/g, '');
const eaEmail = val(ea.email) || val(c.supportEmail);
const mode = endpoint ? 'post' : wa ? 'whatsapp' : eaEmail ? 'email' : 'none';
const consentText = `I agree that ${c.name} may contact me about early access to Bhava by WhatsApp, phone or email.`;
const consentVersion = crypto.createHash('sha256').update(consentText).digest('hex').slice(0, 8);
const fallbackLinks = [
  wa && `<a href="https://wa.me/${wa}">WhatsApp us</a>`,
  eaEmail && `<a href="mailto:${esc(eaEmail)}">email ${esc(eaEmail)}</a>`,
].filter(Boolean);
const eaFallback = fallbackLinks.length
  ? `Prefer to message us yourself? ${fallbackLinks.join(' or ')}.`
  : todo('early access WhatsApp number or email');
const eaHow = {
  post: 'We use these details only to contact you about early access.',
  whatsapp: 'Sending opens WhatsApp with your details filled in. Press send there to reach us. Nothing is stored on this website.',
  email: 'Sending opens your email app with your details filled in. Press send there to reach us. Nothing is stored on this website.',
  none: todo('early access endpoint, WhatsApp number or email'),
}[mode];

const values = {
  'company.name': esc(c.name),
  'company.legalName': fill(c.legalName, 'registered company name'),
  'company.address': fill(c.address, 'registered address'),
  'company.supportEmail': fill(c.supportEmail, 'support email'),
  'company.phone': fill(c.phone, 'phone number'),
  'company.grievanceOfficer': fill(c.grievanceOfficer, 'grievance officer name'),
  'company.courtsCity': fill(c.courtsCity, 'city for courts'),
  policyDate: fill(cfg.policyDate, 'effective date'),
  earlyHref: '/early-access',
  'ea.mode': mode,
  'ea.action': esc(endpoint),
  'ea.endpoint': esc(endpoint),
  'ea.wa': wa,
  'ea.email': esc(eaEmail),
  'ea.consentText': esc(consentText),
  'ea.consentVersion': consentVersion,
  'ea.thanksUrl': esc(`${siteUrl}/thanks`),
  'ea.submit': { post: 'Send', whatsapp: 'Send on WhatsApp', email: 'Send by email', none: 'Send' }[mode],
  'ea.how': eaHow,
  'ea.fallback': eaFallback,
};

const pages = [
  { file: 'index.html', url: '/', title: 'Bhava: turn Instagram comments into sales', description: 'Bhava replies to comments in DM with your link, gives you a free page for your bio, shows you what sold, and is designed to reduce the risk to your account.', home: true },
  { file: 'safety.html', url: '/safety', title: 'Account safety | Bhava', description: 'How Bhava is designed to reduce the risk of bans and shadowbans, and what no tool can promise.' },
  { file: 'pricing.html', url: '/pricing', title: 'Pricing | Bhava', description: 'Start free with a creator page for your bio, and climb from automation to catalog, store and your own apps. No commission on your sales.', draft: cfg.pricesConfirmed ? '' : 'Early prices. They may change before launch.' },
  { file: 'about.html', url: '/about', title: 'About | Bhava', description: 'What the name Bhava means, who makes it and how to reach us.' },
  { file: 'early-access.html', url: '/early-access', title: 'Get early access | Bhava', description: 'Tell us about your shop and we will contact you when early access to Bhava opens.', noDock: true },
  { file: 'thanks.html', url: '/thanks', title: 'Thank you | Bhava', description: 'We have your details.', noindex: true, noDock: true },
  { file: 'privacy.html', url: '/privacy', title: 'Privacy policy | Bhava', description: 'What data Bhava collects, why, how long it is kept and your rights.', legal: true },
  { file: 'terms.html', url: '/terms', title: 'Terms of use | Bhava', description: 'The terms for using Bhava.', legal: true },
  { file: 'refunds.html', url: '/refunds', title: 'Refunds and cancellation | Bhava', description: 'How cancelling a Bhava plan and getting a refund works.', legal: true },
  { file: 'data-deletion.html', url: '/data-deletion', title: 'Delete your data | Bhava', description: 'How to delete your data from Bhava.', legal: true },
  { file: '404.html', url: '/404', title: 'Page not found | Bhava', description: 'This page does not exist.', noindex: true },
];

const nameSvg = read('brand/logo/bhava-name.svg');
const NAME = `<svg class="name" viewBox="${/viewBox="([^"]+)"/.exec(nameSvg)[1]}" aria-hidden="true"><path fill="currentColor" d="${/ d="([^"]+)"/.exec(nameSvg)[1]}"/></svg>`;

const LOGO = `<svg class="logo" viewBox="0 0 64 64" aria-hidden="true"><path fill="#fff" d="M8 12a4 4 0 0 1 4-4h22.3a4 4 0 0 1 2.9 1.2l19.6 19.6a4 4 0 0 1 0 5.7L34.5 56.8a4 4 0 0 1-5.7 0L9.2 37.2A4 4 0 0 1 8 34.3z"/><path fill="#F5B83D" d="M18.5 13.5h8.5a5 5 0 0 1 5 5v4.5a5 5 0 0 1-5 5h-5.5l-5 5v-5.1a5 5 0 0 1-3-4.9v-4.5a5 5 0 0 1 5-5z"/></svg>`;

const header = (p) => `<header class="top">
  <div class="wrap">
    <a class="wordmark" href="/" aria-label="Bhava home">${LOGO}${NAME}</a>
    ${p.home ? '<p class="tagline">Where feeling finds its price, safely.</p>' : '<nav class="nav-sm" aria-label="Main"><a href="/safety">Safety</a><a href="/pricing">Pricing</a><a href="/about">About</a></nav>'}
    <nav class="nav" aria-label="Main">
      <a href="/safety">Account safety</a>
      <a href="/pricing">Pricing</a>
      <a href="/about">About</a>
      <a class="btn" href="{{earlyHref}}">Get early access</a>
    </nav>
  </div>
</header>`;

const footer = (p) => `<footer>
  <div class="wrap">
    <div class="f-links"><a href="/safety">Account safety</a><a href="/pricing">Pricing</a><a href="/about">About</a><a href="/early-access">Early access</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/refunds">Refunds</a><a href="/data-deletion">Data deletion</a></div>
    <p>Bhava is a product of {{company.name}}.</p>
    <p class="fine">Instagram and Facebook are trademarks of Meta Platforms, Inc. Bhava is not affiliated with or endorsed by Meta.</p>
  </div>
</footer>${p.noDock ? '' : '\n<div class="dock" id="dock"><a class="btn" href="{{earlyHref}}">Get early access</a></div>'}`;

// Fonts are self-hosted: fonts.css is put in front of the site's stylesheet, and the two faces every page
// needs first are preloaded. The five sample looks load their own fonts only when that section is near.
const fontsCss = read('src/fonts.css');
const css = fontsCss + read('src/site.css');
const looksCss = read('src/looks-fonts.css');
const js = read('src/site.js');
const fontFiles = fs.readdirSync(path.join(root, 'src/fonts'));
const version = crypto.createHash('sha256').update(css + looksCss + js).digest('hex').slice(0, 8);
const PRELOAD = ['figtree-normal-latin.woff2', 'instrument-serif-normal-latin.woff2']
  .map((f) => `<link rel="preload" href="/assets/fonts/${f}" as="font" type="font/woff2" crossorigin>`).join('');

// Everything comes from this site, except the early access endpoint when one is set.
const endpointOrigin = endpoint ? new URL(endpoint, siteUrl).origin : '';
const extra = endpointOrigin && endpointOrigin !== new URL(siteUrl).origin ? ` ${endpointOrigin}` : '';
const CSP = `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'${extra}; form-action 'self'${extra}; base-uri 'self'; object-src 'none'`;

const fileFor = (url) => (url === '/' ? 'index.html' : `${url.slice(1)}.html`);
const relative = (html) =>
  html.replace(/(href|src)="\/(#[\w-]*)?"/g, (_, a, h) => `${a}="index.html${h || ''}"`)
    .replace(/(href|src)="\/assets\//g, '$1="assets/')
    .replace(/(href|src)="\/([a-z-]+)(#[\w-]*)?"/g, (_, a, u, h) => `${a}="${u}.html${h || ''}"`);

function render(p) {
  let body = read(`pages/${p.file}`);
  const note = p.legal && !cfg.legalReviewed ? 'Draft. A lawyer has not reviewed this page yet.' : p.draft;
  body = body.replace('{{draftNote}}', note ? `<p class="draftnote">${esc(note)}</p>` : '');
  const html = `<div class="liquid" aria-hidden="true"><div class="pool"><i class="w mist"></i><i class="w neel"></i><i class="w ink"></i></div></div>\n${header(p)}\n<main>\n${body}\n</main>\n${footer(p)}`;
  const filled = html.replace(/\{\{([\w.]+)\}\}/g, (m, k) => {
    if (!(k in values)) throw new Error(`${p.file}: unknown value ${m}`);
    return values[k];
  });
  const canonical = `${siteUrl}${p.url === '/' ? '/' : p.url}`;
  const title = preview && p.home ? 'Bhava Liquid Website' : p.title;
  const head = [
    `<title>${esc(title)}</title>`,
    preview && p.home ? '<meta name="claude:viewport-fit-sides" content="cover">' : '',
    preview ? '' : `<meta http-equiv="Content-Security-Policy" content="${CSP}">`,
    `<meta name="description" content="${esc(p.description)}">`,
    p.noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${esc(canonical)}">`,
    `<meta property="og:title" content="${esc(p.title)}"><meta property="og:description" content="${esc(p.description)}"><meta property="og:type" content="website"><meta property="og:url" content="${esc(canonical)}">`,
    '<meta name="theme-color" content="#3B2FC9">',
    `<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">`,
    PRELOAD,
    `<link rel="stylesheet" href="/assets/site.css?v=${version}">`,
  ].filter(Boolean).join('\n');
  const script = `<script src="/assets/site.js?v=${version}" defer></script>`;
  const docHead = '<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">';
  // The preview host wraps its main page in a document itself; every other page needs its own.
  const doc = preview && p.home
    ? `${head}\n${filled}\n${script}\n`
    : `<!doctype html>\n<html lang="en">\n<head>\n${docHead}\n${head}\n</head>\n<body>\n${filled}\n${script}\n</body>\n</html>\n`;
  return preview ? relative(doc).replace(/\?v=[0-9a-f]{8}/g, '') : doc;
}

const rendered = pages.map((p) => [p, render(p)]);

if (release) {
  const problems = [];
  for (const g of gaps) problems.push(`missing: ${g}`);
  if (mode === 'none') problems.push('missing: early access endpoint, WhatsApp number or email');
  if (!cfg.pricesConfirmed) problems.push('prices are not confirmed (pricesConfirmed)');
  if (!cfg.legalReviewed) problems.push('legal pages are not reviewed (legalReviewed)');
  if (problems.length) {
    console.error(`Not building a release:\n- ${[...new Set(problems)].join('\n- ')}`);
    process.exit(1);
  }
}

// Only touch the output once the build is sure to succeed.
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(out, 'assets/fonts'), { recursive: true });
fs.writeFileSync(path.join(out, 'assets/site.css'), css);
fs.writeFileSync(path.join(out, 'assets/looks-fonts.css'), looksCss);
fs.writeFileSync(path.join(out, 'assets/site.js'), js);
for (const f of fontFiles) fs.copyFileSync(path.join(root, 'src/fonts', f), path.join(out, 'assets/fonts', f));
for (const f of ['bhava-mark.svg', 'favicon.svg']) fs.copyFileSync(path.join(root, 'brand', f), path.join(out, 'assets', f));

for (const [p, html] of rendered) {
  let target;
  if (preview) target = fileFor(p.url);
  else if (p.url === '/') target = 'index.html';
  else if (p.url === '/404') target = '404.html';
  else target = `${p.url.slice(1)}/index.html`;
  fs.mkdirSync(path.dirname(path.join(out, target)), { recursive: true });
  fs.writeFileSync(path.join(out, target), html);
}
if (!preview) {
  const urls = pages.filter((p) => !p.noindex).map((p) => `  <url><loc>${siteUrl}${p.url === '/' ? '/' : p.url}</loc></url>`).join('\n');
  fs.writeFileSync(path.join(out, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
  fs.writeFileSync(path.join(out, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`);
}
console.log(`Built ${pages.length} pages in ${path.relative(process.cwd(), out) || out} (early access: ${mode})${gaps.size ? `\nStill to fill in: ${[...gaps].join(', ')}` : ''}`);
