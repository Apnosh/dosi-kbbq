# Editing this site (read this first)

This is Do Si Korean BBQ's website (dosikbbq.com): a static Eleventy site on Vercel, fed by the Apnosh portal.
Changes made through Apnosh AI land on a branch, Vercel builds a preview, and the owner publishes it.
README.md has the full map; this page is what matters for a change.

## The design system: Do Si's printed menus

Everything looks like the menus on the table. Keep it that way unless the owner asks for a new look.

- Colours: charcoal board `--bg`, white Anton capitals, menu gold `--gold` for Korean and prices,
  logo red `--red` for buttons and seals. All tokens are at the top of `src/assets/css/site.css`.
- Headings sit between double rules: `<h2 class="rule-head"><span class="accent">All You</span> Can Eat</h2>`,
  with the Korean in gold above: `<p class="kr-label" lang="ko">무한리필</p>`. One word gold, the rest white.
- Descriptions are light italic Poppins. Names and prices are Anton.
- Red BEST SELLER seals (`.seal`) and 🌶 / 🌱 marks only where the printed menu has them.
- The lion mascot lives in `src/assets/img/lion-*.webp|png`.
- Happy hour (Alki only) uses the neon style (`.neon`).
- Every page must work on a phone at 390px wide with no sideways scrolling.

## Where things are

| Change | File |
|---|---|
| Home page | `src/index.njk` |
| Menus (items, prices, Korean names) | `src/menus/<location>-<menu>.json` |
| Menu photos | `src/assets/img/menu/<dish-name>.webp` |
| Locations, hours fallback, phone numbers | `src/_data/locations.json` |
| Other pages | `src/*.njk`, `src/locations/` |
| Layout, nav, footer | `src/_includes/` |
| Styles | `src/assets/css/site.css` |

Hours and holiday hours shown on the site come from the Apnosh portal when it builds; change them there,
not in the code.

## Rules

- Keep words true. No invented prices, hours, dishes, reviews or claims. Prices come from `src/menus/`.
- Do not touch the protected files (the portal refuses to publish an edit that does):
  `.apnosh/`, `.github/`, `vercel.json`, `package.json`, `package-lock.json`, `src/_data/apnosh.js`,
  `src/assets/js/forms.js`, `src/apnosh-content.json`, `src/privacy.njk`, and `src/_data/reviews.json`
  (real Google reviews: never write or change a review).
- Keep the Apnosh wiring in `src/_includes/base.njk`: the tag script, `DOSI_FORMS_ENDPOINT` and `forms.js`.
- No third-party scripts, trackers or embeds.

## Before you push

```bash
npm ci
npm run check
```

`npm run check` builds the site and checks every page's title and description, every internal link and
image, and the Apnosh wiring. It must pass.
