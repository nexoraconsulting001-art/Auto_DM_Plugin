# Bhava company website

The public website for Bhava, a product of Nexora Consulting. It showcases the product and goes live together with the Bhava app. It's a static site with no dependencies: Node 20 or newer builds it from `pages/`, `src/` and `site.config.json`.

It lives in `site/` next to the old Plant Store Auto DM demo app at the repo root. The old app stays on `main` until the end of the Bhava build, and is also kept on the branch `legacy/plant-store-demo`.

## Build and preview

Run these from the `site/` folder:

```bash
node build.mjs                 # dist/: the working site; missing details show as highlighted [gaps]
node tools/serve.mjs dist      # http://127.0.0.1:8080 with the same clean addresses as the server
node build.mjs --preview       # preview/: the same pages with relative links, for private previews
node build.mjs --release       # dist/: refuses to build while any detail below is still open
```

`npm run build`, `npm run serve`, `npm run preview` and `npm run release` do the same. `dist/` and `preview/` are not kept in git.

## What's where

| Path | What it is |
| --- | --- |
| `pages/*.html` | The body of each page. `{{name}}` values come from `site.config.json`. |
| `src/site.css`, `src/site.js` | The one stylesheet and the one script. |
| `src/fonts/`, `src/fonts.css`, `src/looks-fonts.css` | Self-hosted fonts (SIL Open Font License, see `src/fonts/OFL.txt`). Nothing loads from Google or any other site. `node tools/fetch-fonts.mjs` downloads them again if they ever need updating. |
| `brand/` | Logo, mark and favicon. |
| `build.mjs` | Builds `dist/` or `preview/`. |
| `site.config.json` | Site address, the app link, company details and the two release switches. |
| `deploy/` | Container, Caddy and Compose files for the Oracle server. See `DEPLOY.md`. |

## site.config.json

A value that is empty or starts with `TODO` counts as not set. Not-set values show on the page as highlighted gaps, and `--release` refuses to build until they are filled in.

| Key | Needed for |
| --- | --- |
| `siteUrl` | Canonical links and the sitemap. |
| `app.signupUrl` | Where every main button goes (header, hero, the floating phone button and the closing section): the Bhava app's sign-up page. Until it is set, the buttons point at `/pricing`. |
| `app.ctaLabel` | The text on those buttons. `Start free` by default. |
| `company.*` | About, privacy, terms and refunds pages. |
| `policyDate` | "Effective from" on the legal pages. |
| `pricesConfirmed`, `legalReviewed` | Remove the draft notes on pricing and legal pages. Both must be `true` for a release. |

The site has no forms and no cookies, and each page carries a Content-Security-Policy that allows only files from the site itself.

## Content rules

Claims follow PRD 5.21: no promise that an account will never be restricted, no "Meta-approved" until App Review and Tech Provider are done, no customer names, testimonials or invented numbers, and every demo screen labelled as an example.
