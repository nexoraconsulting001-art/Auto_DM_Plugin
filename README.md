# Bhava company website

The public website for Bhava, a product of Nexora Consulting. It's a static site with no dependencies: Node 20 or newer builds it from `pages/`, `src/` and `site.config.json`.

The old Plant Store Auto DM demo app that used to live here is kept on the branch `legacy/plant-store-demo`.

## Build and preview

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
| `site.config.json` | Site address, company details, early access settings and the two release switches. |
| `deploy/` | Container, Caddy and Compose files for the Oracle server. See `DEPLOY.md`. |

## site.config.json

A value that is empty or starts with `TODO` counts as not set. Not-set values show on the page as highlighted gaps, and `--release` refuses to build until they are filled in.

| Key | Needed for |
| --- | --- |
| `siteUrl` | Canonical links, sitemap and the form's thank-you address. |
| `company.*` | About, privacy, terms and refunds pages. `supportEmail` is also the early access fallback when `earlyAccess.email` is not set. |
| `earlyAccess.endpoint` | Where the early access form posts. Bhava's own lead capture on the QA server. |
| `earlyAccess.whatsappNumber`, `earlyAccess.email` | The fallback shown under the form, and how the form sends when there is no endpoint. |
| `policyDate` | "Effective from" on the legal pages. |
| `pricesConfirmed`, `legalReviewed` | Remove the draft notes on pricing and legal pages. Both must be `true` for a release. |

## Early access form

`/early-access` asks for a name, a phone number or email (at least one), the Instagram handle, optionally what they sell, and an unticked consent box. "Get early access" on every page leads there.

How it sends depends on the config:

1. **`earlyAccess.endpoint` set:** the browser posts JSON to it and shows a thank-you message. If that fails, it offers the WhatsApp or email fallback with the details filled in.
2. **No endpoint, WhatsApp number set:** it opens WhatsApp with the details filled in. Nothing is stored by the website.
3. **No endpoint, only an email:** the same, through the visitor's email app.

### What the endpoint must accept

`POST` with `Content-Type: application/json`:

```json
{
  "name": "Asha", "phone": "+919876543210", "email": "", "instagram": "asha.crafts", "sells": "Sarees",
  "consent": true, "consentText": "I agree that Nexora Consulting may contact me about early access to Bhava by WhatsApp, phone or email.",
  "consentVersion": "6f6a92f0", "source": "website", "page": "/early-access", "website": ""
}
```

- Answer `2xx` when the request is stored. Any other answer shows an error with the fallback.
- Phones arrive in international format, and the handle without the `@`. Check every field on the server too.
- `website` is a hidden trap field. If it is not empty, answer `200` and store nothing.
- `consentVersion` changes whenever the consent text changes. Store it with the time of consent, as PRD 8.15 and 9.18 require.
- Allow the site's origin with CORS (`Access-Control-Allow-Origin: <siteUrl>`, `Access-Control-Allow-Headers: content-type`, answer `OPTIONS`) unless the endpoint is on the same address as the site.
- Without JavaScript the form posts the same fields as `application/x-www-form-urlencoded` (`consent=yes`), plus `redirect`: send a `303` to that address (it is always `<siteUrl>/thanks`) after storing.
- Rate-limit by IP address. There is no CAPTCHA.

Each built page carries a Content-Security-Policy that allows only this site, plus the endpoint's origin when one is set.

To try the form locally, copy `site.config.json`, set `earlyAccess.endpoint` to `http://127.0.0.1:8080/__test/early-access`, build with `SITE_CONFIG=<that copy> node build.mjs`, and run `node tools/serve.mjs`. The test server prints each request it receives.

## Content rules

Claims follow PRD 5.21: no promise that an account will never be restricted, no "Meta-approved" until App Review and Tech Provider are done, no customer names, testimonials or invented numbers, and every demo screen labelled as an example.
