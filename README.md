# Calmaker

A browser-only app for making continuous, printable calendars. Address: **https://calmaker.rollett.org**.

Choose a title, inclusive date range, title and calendar fonts, paper dimensions, orientation, first weekday, and alternating week shading. The entire title, including any year, uses one font. The default range starts today and ends on the last day of next month, using the visitor's local date. The layout follows the HOLIDAYS 2026 reference: Sunday first, 18 × 24 inches.

## Run locally

Requires Python 3. No build or package installation is needed.

```sh
python3 -m http.server 4173
```

Open http://localhost:4173. Run date, size, and PDF structure checks with `node --test tests/*.test.js` (Node 18+).

## Printing

**Download PDF** makes a single exact-size page at 300 dpi for the default poster. Very large custom sizes use a lower resolution to stay within a 40-million-pixel memory budget. PDFs contain high-resolution raster artwork. **Print calendar** uses SVG artwork and browser printing, preserving vector lines and text where the browser supports it. Select the requested paper size, actual size / 100% scale, no extra margins, and no headers or footers. PDF is the most reliable way to send exact dimensions to a print shop.

Canela Text is the default for both the title and calendar. Noteworthy is also available in the font menus. These fonts are used when installed and accessible to the browser. They are proprietary and are not distributed in this repository. Bundled SIL Open Font License alternatives, Cormorant Garamond and Handlee, make the app work offline without font services. Other system fonts fall back to the corresponding serif or sans-serif family. Font availability depends on the device and browser.

Settings persist in browser local storage. The default dates advance on each visit; manually selected date ranges stay saved. Reset restores the default settings with today's date range. No calendar data leaves the browser. Each calendar supports an inclusive range of up to 732 days and paper dimensions from 4–48 inches per side; long ranges result in smaller writing spaces.

## Hosting

GitHub Pages publishes the root of `main` from this public repository. `CNAME` declares `calmaker.rollett.org`. In Cloudflare DNS, `calmaker` is a DNS-only CNAME to `acrollet.github.io`. GitHub manages the HTTPS certificate. Push to `main` to publish updates. No build step or secret is required.

## Fonts

See `assets/fonts/OFL-cormorant.txt` and `assets/fonts/OFL-handlee.txt` for bundled font licenses. No original document or proprietary font files are included.

## Icons and sharing previews

The HTML includes Open Graph metadata for Messages and other link previews, a 1200 × 630 PNG illustration, SVG/PNG/ICO favicons, and a 180 × 180 Apple touch icon. Metadata is available in the initial HTML, without JavaScript. The sharing URLs use the site's currently available HTTP address while GitHub provisions the custom-domain HTTPS certificate; update the canonical and metadata URLs to HTTPS when it is ready.

Generated artwork is checked in, so deployment needs no additional tooling. To regenerate the artwork with Python and Pillow, run `python3 scripts/generate-brand-assets.py`.
