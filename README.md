# Do Si Korean BBQ — dosikbbq.com

The website for Do Si Korean BBQ (Alki Beach, West Seattle and Kent, WA). Static site built with
[Eleventy](https://www.11ty.dev/), hosted on Vercel, connected to the Apnosh portal.

```bash
npm install
npm run dev     # http://localhost:4321
npm run build   # writes _site/
```

## Where things live

| What | File |
|---|---|
| Name, email, social links, About stats | `src/_data/site.json` |
| Each location: address, phone, hours, reservation link, copy | `src/_data/locations.json` |
| Menus (one JSON per printed menu) | `src/menus/<location>-<menu>.json` |
| Menu tab order and labels | `src/_data/menus.js` |
| FAQ (prices are read from the menus) | `src/_data/faq.js` |
| Guest reviews shown on the site (real Google reviews, chosen by hand) | `src/_data/reviews.json` |
| Styles / scripts | `src/assets/css/site.css`, `src/assets/js/` |
| Photos (pre-sized WebP + JPG) | `src/assets/img/<name>-800.webp`, `-1600.webp`, `-1600.jpg` |

### Menu item photos

Drop a photo in `src/assets/img/menu/`, named after the dish's English name in lowercase with dashes,
as WebP: `thinly-sliced-beef-brisket.webp`, `egg-souffle.webp`, `hot-stone-bibimbap.webp`. One file
covers the dish at both locations and on every menu it appears on. To show a different photo on one menu, prefix the file: `ayce-` (all you can eat, e.g. raw bulgogi for the grill), `hh-` (happy hour) or `bento-` (bento boxes).
Square, at least 400×400, dish centered; cut-outs on dark look best, like the printed menus.

The menu pages list dishes as text, like the printed menus, with two or three photos beside each
section (above it on phones). `FEATURE` in `src/_data/menus.js` picks them by item number for the AYCE
sections (L1, L9, L24 for Signature, and so on); other sections show their best sellers that have
photos. Set `menuPhotos` in
`src/_data/site.json` to `none` to hide menu photos entirely.

### Offer popup (30% off Wednesdays)

The popup is a graphic plus a Reserve button, set in `promoPopup` in `src/_data/site.json`: `image`
(the graphic, e.g. `src/assets/img/promo-wednesday.webp`), `alt` (the graphic's words, for screen
readers and Google) and `button`. It shows once per visit, a couple of seconds after the page loads,
and never on the menu pages (guests there are ordering at the table). Set `enabled` to `false` to
turn it off. When the offer changes, swap the image and change `id` so people who closed the old one
see the new one.

### AYCE tiers

The All You Can Eat menu has a Signature / Premium / Supreme bar that stays pinned under the menu tabs
while you scroll it. Picking a tier shows only the meats and appetizers it includes, says what it adds
over the tier below, and briefly highlights the sections that just appeared. Link straight to a tier with `/alki-menu/#ayce-supreme` (or
`#ayce-signature`, `#ayce-premium`); the home page price board does this.

To change a price, edit the item in `src/menus/…json`. The home page tiers, location pages and
FAQ read AYCE prices from the menus, so they update together.

## Design

The design follows Do Si's printed menus, so the site, the menus on the table and the signage feel
like one brand. All of it is in `src/assets/css/site.css`, with the rules at the top:

- Charcoal board (`--bg`), white Anton caps, menu gold (`--gold`) and the logo red (`--red`)
- Headings between double rules (`.rule-head`), Korean in gold above (`.kr-label`); the drink and
  happy hour menus use the red-to-violet rule (`.rule-head--drinks`)
- One word gold, one white, as on the menus ("DINNER AYCE"): wrap the gold word in `.accent`
- Light italic Poppins for descriptions and notes
- Red BEST SELLER starburst (`.seal`) and 🌶 / 🌱 marks only where the printed menus have them
- The lion mascot (`lion-tongs`, `lion-steak` in `src/assets/img/`, cut from the menu art)
- Happy hour in the neon style of the Alki happy hour menu (`.neon`)

## Apnosh portal integration

Set these in the Vercel project (Settings → Environment Variables):

- `APNOSH_SLUG` = `do-si-kbbq-mtao6mpm`
- `APNOSH_API_KEY` only if the portal has a key set for this site

With the slug set, at build time `src/_data/apnosh.js` fetches
`https://portal.apnosh.com/api/public/sites/do-si-kbbq-mtao6mpm` and:

- **Hours / holiday hours / phone**: laid over the location whose name matches the portal's
  listing (`withPortal` in `.eleventy.js`). Today the portal has the Alki listing, so Alki's hours
  come from the portal and Kent's from `locations.json`. If the portal is down, the site builds
  with `locations.json`.
- **Copy**: `hero.headline` and `hero.lede` (the script line under it) on the home page, declared in
  `src/apnosh-content.json`.
- **Promotions and events**: a running promotion shows as a red bar under the home hero, and
  upcoming events as a "Coming up" section. Both disappear when the portal has none.
- **Analytics**: every page loads the Apnosh tag (`/t/<slug>.js`): Google Analytics for the
  property connected in the portal, plus call, directions and reservation taps.
- **Forms**: the contact form posts to `/api/forms/submit/<slug>` and lands in the portal inbox.
  The topic picker sets the kind (contact, reservation for groups, feedback, job_inquiry).
  Without the slug, the form falls back to opening an email to dosikbbq@outlook.com.

In the portal, under the client's site settings: site type `external_repo`, live URL
`https://dosikbbq.com`, and this Vercel project's deploy hook, so portal edits trigger a rebuild.

## SEO

- Per-page titles, descriptions, canonical URLs, Open Graph / Twitter cards
- Structured data: Organization, Restaurant per location (address, hours, menu, reservations),
  full Menu with priced items, FAQPage, BreadcrumbList
- `sitemap.xml`, `robots.txt`
- Old WordPress URLs kept (`/menu/`, `/alki-menu/`, `/about/`, `/contact/`, `/locations/`) and
  stray ones redirected in `vercel.json`
- Menus are real text now (they were images), so Google can read every dish and price

## Launch checklist

1. Import this repo into Vercel (framework preset: Other; build/output are in `vercel.json`).
2. Add `APNOSH_SLUG`, deploy, and check the preview URL.
3. Create a Vercel deploy hook and paste it into the portal's site settings.
4. In Cloudflare (where dosikbbq.com's DNS lives), point the domain at Vercel and add the
   domain in Vercel. Keep WordPress running until the new site is live, then retire it.
5. In Google Search Console, submit `https://dosikbbq.com/sitemap.xml`.
