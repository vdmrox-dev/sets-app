# Sets — logo kit (Progress S)

**Idea:** one continuous S. The last stretch breaks off in teal: it's the set you're on now.
The mark uses the same visual language as the app: solid means done and teal means in progress (week bar, set checks).

## Files

| Folder | What's inside |
|---|---|
| `master/` | Vector masters. All are solid shapes, with no strokes or live text. Includes the symbol, reversed symbol, small-size symbol, horizontal and stacked lockups (light and reversed), the wordmark, app-icon tiles (dark, light, teal) and the Android adaptive foreground and monochrome layers |
| `one-colour/` | Black, white, slate and teal one-colour versions of the symbol and horizontal lockup |
| `png/` | 1200 px transparent PNGs of the masters |
| `app-icon/` | Full-bleed square icon PNGs (1024/512/180) in dark, light and teal, plus the Android adaptive layers. iOS and Android apply their own corner mask |
| `web/` | `favicon.ico` (16/32/48), `favicon.svg`, `apple-touch-icon.png`, `icon-192/512.png`, `maskable-512.png`, `site.webmanifest` and `head-snippet.html` |
| `board/` | Presentation board (`sets-board.html`) and slide PNGs with mockups |

**Primary app icon:** `app-icon/sets-app-icon-dark-1024.png` (Night background, Mist S, teal current set).

## Construction

- 256-unit grid. The skeleton is two semicircles of radius 40 joined by straight runs.
- One stroke weight (34 units) with round ends throughout.
- The gap before the teal stretch is 16 units, roughly half a stroke.
- The reversed (light-on-dark) symbol is thinned to 32 units so it doesn't look heavier on dark backgrounds.
- **Small-size cut** (`sets-symbol-small.svg`): 44-unit stroke and 24-unit gap. Use it below 32 px (favicons, notification-sized icons).

## Colour

| Token | HEX | RGB | CMYK (approx.) | Use |
|---|---|---|---|---|
| Slate | `#1F3038` | 31 48 56 | 45 14 0 78 | Mark and wordmark on light backgrounds |
| Teal | `#0D7480` | 13 116 128 | 90 9 0 50 | Current set on light backgrounds (5.2:1 on Paper) |
| Night | `#0F171B` | 15 23 27 | 44 15 0 89 | Dark background and app-icon tile |
| Mist | `#E4ECEE` | 228 236 238 | 4 1 0 7 | Mark and wordmark on dark backgrounds |
| Teal Bright | `#2FB3BE` | 47 179 190 | 75 6 0 25 | Current set on dark backgrounds (7.2:1 on Night) |
| Paper | `#F7F9FA` | 247 249 250 | 1 0 0 2 | Light background |

These are the same tokens as the app's Slate & Teal theme. CMYK values are converted, not proofed; check them against a print proof (or match a Pantone) before printing.

## Type

The wordmark is Instrument Sans SemiBold, converted to outlines, with −2.5 % tracking. Instrument Sans is licensed under the SIL Open Font License, so it's fine to use in a logo.
Supporting type in the product: Instrument Sans for reading text, DM Mono for sets, reps and times.

## Usage

- **Clear space:** keep at least one stroke height (the height of the teal bar) clear on every side of the symbol or lockup.
- **Minimum size:** symbol 16 px (use the small cut below 32 px). Horizontal lockup 96 px wide on screen, 20 mm in print.
- **Backgrounds:** Paper, white or light greys get Slate with Teal. Night, Slate or dark photos get Mist with Teal Bright. Busy backgrounds get a one-colour white or black version.
- **One colour:** when only one colour is possible, the teal stretch takes the same colour as the rest. The gap alone still carries the idea.

**Don't:**
- close the gap
- move the teal stretch somewhere else
- recolour the main track teal
- add gradients, shadows or outlines
- stretch or rotate the mark
- re-type the wordmark in another font
- put the two-colour mark on mid-tone teal (use the `sets-app-icon-teal` treatment instead)

## Tests run

- Rendered and checked at 16, 24, 32, 64 and 512 px.
- Checked on light and dark backgrounds, in one colour, and as a favicon pixel test.
- Checked the app icon on a home screen and as a maskable icon.
- Audited the masters for strokes, live text and rasters: none present.

## Still to do

- Trademark: no clearance search has been done. Run a professional search (USPTO/EUIPO and app stores) before launch.
- Not yet wired into `gym-app` (`public/` and the Next.js metadata) or `sets-app` (flutter_launcher_icons sources). The previous gold "S" icon is still live in both.
