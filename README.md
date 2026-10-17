# Calmaker

A browser-only app for making continuous, printable calendars. Address: **https://calmaker.rollett.org**.

Choose a title, inclusive date range, title/year/calendar fonts, paper dimensions, orientation, first weekday, and alternating week shading. The default reproduces the HOLIDAYS 2026 reference layout: October 18, 2026–January 2, 2027, Sunday first, 18 × 24 inches.

## Run locally

Requires Python 3. No build or package installation is needed.

```sh
python3 -m http.server 4173
```

Open http://localhost:4173. Run date, size, and PDF structure checks with `node --test tests/*.test.js` (Node 18+).

## Printing

**Download PDF** makes a single exact-size page at 300 dpi for the default poster. Very large custom sizes use a lower resolution to stay within a 40-million-pixel memory budget. PDFs contain high-resolution raster artwork. **Print calendar** uses SVG artwork and browser printing, preserving vector lines and text where the browser supports it. Select the requested paper size, actual size / 100% scale, no extra margins, and no headers or footers. PDF is the most reliable way to send exact dimensions to a print shop.

Canela Text and Noteworthy are the document's original fonts. They are used when installed and accessible to the browser. They are proprietary and are not distributed in this repository. Bundled SIL Open Font License alternatives, Cormorant Garamond and Handlee, make the app work offline without font services. Other system fonts fall back to the corresponding serif or sans-serif family. Font availability depends on the device and browser.

Settings persist in browser local storage. No calendar data leaves the browser. Reset restores the reference settings. Each calendar supports an inclusive range of up to 732 days and paper dimensions from 4–48 inches per side; long ranges result in smaller writing spaces.

## Hosting

GitHub Pages publishes the root of `main` from this public repository. `CNAME` declares `calmaker.rollett.org`. In Cloudflare DNS, `calmaker` is a DNS-only CNAME to `acrollet.github.io`. GitHub manages the HTTPS certificate. Push to `main` to publish updates. No build step or secret is required.

## Fonts

See `assets/fonts/OFL-cormorant.txt` and `assets/fonts/OFL-handlee.txt` for bundled font licenses. No original document or proprietary font files are included.
