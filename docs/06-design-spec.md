# 06 · Design Specification

**Status:** current · **Last updated:** 9 Oct 2026 · **Reference screens:** `design/mockups/` (see its README)

The look is a cool, light **"instrument panel"**: high-contrast data on calm surfaces, condensed numerals for glanceable readings, and one warm action colour.

## 1. Colour tokens

Define as CSS variables and Tailwind theme colours. Names are binding; values may be tuned for contrast but must keep the relationships.

| Token | Hex | Use |
|---|---|---|
| `ground` | `#EEF2F5` | Page background |
| `surface` | `#FFFFFF` | Cards, top bar, tab bar |
| `border` | `#D5DDE4` | Card borders |
| `border-strong` | `#C9D3DC` | Input and secondary button borders |
| `ink` | `#0F1B26` | Primary text, dark buttons, dark footer |
| `muted` | `#4B5A68` | Secondary text (≥ 4.5:1 on white) |
| `muted-strong` | `#3A4754` | Text on tinted panels |
| `link` / `link-hover` | `#1A3F94` / `#0F2A66` | Links, secondary actions, "Managed by" border |
| `action` | `#B8460B` | Primary actions, active nav, counters |
| `action-tint` | `#FBEDE3` | Active nav background |
| `info-tint` | `#E3ECFA` | Status "Open", info panels, club logo placeholder |
| `in-range` | `#1F4FBF` | Outlook: within published range (white text) |
| `marginal` | `#F0A04B` | Outlook: within 22.5° (ink text) |
| `outside` | `#DCE2E8` | Outlook: outside (muted-strong text) |
| `light-wind` | `#F3F6F8` with `border` | Outlook: light wind |
| `notice-tint` / `notice-text` | `#FCEBD9` / `#8A3A06` | Notices and warnings |
| `prototype-tint` / `prototype-text` | `#FBE7C6` / `#5B3A00` | Prototype banner and chips |
| `footer-link` | `#9CC0FF` | Links on the dark footer |

Outlook colours differ in **lightness** as well as hue (blue / orange / grey) so they remain distinguishable for colour-blind users, and every cell also carries text.

## 2. Typography

- **Barlow** (400, 500, 600, 700) for interface and body text.
- **Barlow Condensed** (500, 600, 700) for page titles, numerals (wind speeds, dates) and the wordmark.
- Self-hosted via `next/font`. Fallback: `system-ui, sans-serif`.
- Scale (rem): 0.75 caption (minimum), 0.8125, 0.875, 0.9375, 1, 1.125, 1.25, 1.375, 2, 3, 4 (desktop site title). Minimum body text 14 px on phone.

## 3. Shape and spacing

- Radius: 6–8 px outlook cells, 10 px buttons and inputs, 12–14 px cards (phone), 16 px cards (desktop), pill (999 px) for chips.
- Spacing on a 4 px grid; card padding 16 px (phone), 20 px (desktop); gaps 12–24 px.
- **Touch targets ≥ 44 × 44 px.** Phone tab bar items ≥ 56 px tall.
- Desktop content max width 80 rem with 24 px side padding. Desktop pages use a main column and a 320 px side column that stacks below on narrow screens.

## 4. Icons

Lucide icons (stroke 2, rounded joins) or equivalent inline stroke SVG. No emoji. Icon-only buttons need `aria-label`.

## 5. Navigation

- **Desktop top bar:** wordmark, then My Sites · Sites & map · Clubs · What's on · Gear · New to flying, then search and (later) Sign in. Active item uses `action` text on `action-tint`.
- **Phone tab bar (bottom):** My Sites · Map · Clubs · What's on · Gear, icons above labels, active item in `action`.
- **Phone top bar:** wordmark, a visible **"New to flying"** pill button, and a menu button (Country, About, Sources, Status, Feedback, Settings).
- **Country switcher:** a compact button showing the current country ("Australia") at the right of the desktop top bar; in the phone menu. Sample countries are labelled "(sample)".
- **Wordmark:** the HouseThermal logo lockup (§9) at the left of every top bar; desktop shows the descriptor beneath the name, phone shows the name only.
- **Prototype banner:** full-width strip above the top bar in `prototype-tint`, one line, dismissible for the session, with a Feedback link.

## 6. Components

| Component | Spec |
|---|---|
| `SiteCard` (My Sites) | Name (link), region · club (link), status chip, wind arrow placeholder or station button, `WindRose` (48 px) with range label, `OutlookStrip`, station buttons. See `Main.dc.html` |
| `WindRose` | Circle with the published range shaded in `in-range`; N tick; 48 px (cards) or 150–170 px (site page) with N/E/S/W labels. "All" fills the circle |
| `OutlookStrip` | 3 day labels; 6 cells (AM/PM): compass point above speed in Barlow Condensed; colours per classification; legend nearby |
| `OutlookGrid` | Day label column plus 8 time columns (06:00–20:00, 2-hourly); horizontally scrollable inside its own box on narrow screens |
| `StewardPanel` | 2 px `link` border; label by role: club → "Managed by", national_body → "Managed by", flight_park / operator → "Operated by", site_holder → "Site holder", landowner / municipality → "Access managed by", none → "Open site: no managing body listed", unknown → "Steward not listed yet" (with "Know who manages this site? Tell us"). Logo placeholder, name (link), Contact and Website buttons, facts (safety officers, duty pilot, site access, notices), optional secondary body line, first-flight line, national-body line. Appears **directly after the site header** on phone and as a full-width band under the hero on desktop. Same prominence for every role |
| `CountrySwitcher` | Button with current country name and a menu of enabled countries |
| `CoverageNotice` | `prototype-tint` strip at the top of pages in sample countries (`docs/07` §10) |
| `StationRow` | Provider and station name, ownership label (e.g. "club station"), distance if not on site, and an "Open live wind" button (external). Live values are Iteration 2 |
| `StatusChip` | Open (`info-tint`/`link`), Notice/Restricted (`notice-tint`/`notice-text`), Closed (ink on `outside`), Unknown (muted) |
| `FactList` | Label/value pairs; label in `muted` 13 px |
| `SourcesLine` / `SourcesFooter` | "Facts from … · synced N days ago" with provider links |
| `EventRow` | Date block (month, day) in `info-tint`, title, place, organiser |
| `DirectoryCard` | Name, kind, disciplines, locality, published price-from if any, link |
| `CompareTable` | Up to 3 schools; rows for disciplines, location, accommodation, price-from, link; "Not published" when unknown |
| `Disclaimer` | `muted-strong` text on a tinted panel, wording from `docs/07` |
| `PartnerPreviewCard` | Only when `showPartnerPreviews` is true; `#FFF7EE` background, `#F0CFA8` border, label "Example: where a local school could appear" |

Empty, loading and error states are required for: My Sites (no sites), outlook (loading, unavailable), search (no results), map (failed tiles, list still works), events (none upcoming).

## 7. Screens

| Screen | Reference | Iteration 1 differences from the mockup |
|---|---|---|
| My Sites (phone) | `Main.dc.html` | Live wind numbers become "Open live wind" station buttons. "Since your last visit" shows new events and notices only (no listings yet). The top bar adds the visible "New to flying" button (not drawn in the mockup); the prototype banner replaces the "Sample data" chip |
| Site page (phone) | `SitePage.dc.html` | Top bar as for My Sites. No live numbers; no "I'm planning to fly"; Sponsored card only via partner previews; gear section omitted; "New to flying here?" section added (tandems and schools nearby) |
| Site page (desktop) | `SitePageDesktop.dc.html` | Same as phone, plus "Pilot reports" omitted (Iteration 3); "Sign in" omitted |
| Club page (desktop) | `ClubPage.dc.html` | "Follow club" adds all club sites to My Sites (device only); "Claim this club page" shows as coming soon with the feedback link; contacts only as published |
| Share image | `SharePreview.dc.html` | No live wind or forecast; shows site, region, club and wind-range rose |

Design the other pages (Sites & map, Clubs directory, What's on, Gear, New to flying, Directory profiles, policy pages) in the same system. Keep them simple and consistent; propose layouts at the start of the relevant milestone.

## 8. Accessibility checklist

Real `button`, `a` and `label` elements; visible focus rings; text contrast ≥ 4.5:1 (3:1 for ≥ 24 px); outlook cells include text; maps have an equivalent list; motion reduced when `prefers-reduced-motion` is set; all images have alt text (decorative ones empty).

## 9. Wordmark and logo

- **Wordmark:** "HouseThermal" in Barlow Condensed 700, `ink` on light backgrounds, white on dark. One word, capital H and T.
- **Mark:** a roofline chevron in `ink` (white on dark) with two stacked open arcs and a small dot above it in `action` (use `marginal` orange on dark): a glider climbing in a thermal above a house. Drawn as a 28 × 28 stroke icon; see the headers in `design/mockups/` for the reference SVG.
- **Lockups:** mark + name (phone top bar, minimum 20 px mark); mark + name + descriptor stacked (desktop top bar, share images, About page).
- **Favicon and app icon:** the mark alone on `surface` (light) with 2 px padding; provide 32, 180, 192 and 512 px PNGs and an SVG.
- The mark is a concept for the prototype; a designer may refine it later without changing the name or colours.
