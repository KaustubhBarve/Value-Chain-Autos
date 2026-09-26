# Value Chain Atlas: Automotive, India

An animated, four-level map of India's automotive value chain: the whole lifecycle loop, a web of 29 industries with 95 listed companies, an x-ray of a petrol and an electric car, and working cross-sections of an engine and a traction motor.

Made by [Kaustubh Barve](https://www.linkedin.com/in/kaustubh-barve/).

## Project structure

```
value-chain-atlas/
├── index.html                  Page markup (no inline scripts)
├── 404.html                    Not-found page for GitHub Pages
├── robots.txt
├── .nojekyll                   Serve files as-is (no Jekyll processing)
├── .github/workflows/pages.yml Optional GitHub Actions deploy
└── assets/
    ├── css/styles.css          All styles, light and dark themes
    ├── js/data.js              All content: stops, companies, industries, links, parts
    ├── js/app.js               All behaviour; needs data.js loaded first
    └── img/favicon.svg
```

No build step, no npm packages, no frameworks. The only external request is Google Fonts; if it is blocked the page falls back to system fonts.

## Run locally

Open `index.html` directly, or serve the folder (recommended, so the security policy behaves as it will online):

```
python3 -m http.server 8000
```

Then visit http://localhost:8000.

## Deploy on GitHub Pages

Option A, branch deploy (simplest):
1. Create a public repository and push these files to the `main` branch, keeping the folder structure.
2. Settings → Pages → Build and deployment → Source: **Deploy from a branch** → Branch: `main`, folder `/ (root)` → Save.
3. The site appears at `https://<username>.github.io/<repository>/` after a minute or two.

Option B, GitHub Actions:
1. Push the files to `main`.
2. Settings → Pages → Source: **GitHub Actions**. The included workflow deploys on every push to `main`.

Use one option, not both. All paths are relative, so the site works from a repository sub-path or a custom domain.

## Updating the data

Everything shown on the page comes from `assets/js/data.js`:
- `CO_RAW`: company name, Screener path, market cap (₹ crore), P/E, latest-quarter sales, sales YoY %, ROCE %, Screener industry, role, and an optional `1` flag for "to verify".
- `NODES` and `EDGES`: the 29 industries and 68 supply links.
- `LINKS`: supplier to customer links (`d` disclosed, `r` reported).
- `DATA.stations`, `DATA.parts`, `PW`: the 11 loop stops, 18 car parts and 14 engine and motor parts.

Screener figures were fetched on 25 September 2026 and product lines were checked against filings the same day. Prices move daily; refresh before publishing.

## Security

- Content Security Policy in `index.html` allows scripts only from this site, fonts only from Google Fonts, and no network calls.
- All data written into the page is HTML-escaped; there is no `eval` and there are no inline event handlers.
- External links open in a new tab with `rel="noopener noreferrer"`.

## Disclaimer

For education only. Company names show where businesses sit in the chain. They are not recommendations and not a complete list. Check figures against the original filings before relying on them.
