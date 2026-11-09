/**
 * Apnosh portal integration: fetches Do Si's live data at build time.
 *
 * Round-trip:
 *   1. The owner (or Apnosh AI) changes hours, holiday hours or a note in portal.apnosh.com
 *   2. The portal calls this site's Vercel deploy hook
 *   3. Vercel rebuilds; this file re-fetches; the pages render the new data (~30s)
 *
 * Env vars (Vercel project settings):
 *   APNOSH_SLUG     Do Si's slug on the portal (do-si-kbbq-mtao6mpm). Also turns on the Apnosh
 *                   tag (analytics + tap tracking) and sends the forms to the portal inbox.
 *   APNOSH_API_KEY  only if the portal has a key configured for this site
 *
 * If the portal is unreachable the site still builds with its own data (locations.json),
 * so an outage never blanks hours off the site.
 */
const PORTAL_BASE = process.env.APNOSH_PORTAL_BASE || "https://portal.apnosh.com";
const SLUG = process.env.APNOSH_SLUG;
const API_KEY = process.env.APNOSH_API_KEY;

const EMPTY = {
  client: null,
  location: null,
  hours: null,
  specialHours: null,
  activePromo: null,
  upcomingEvents: [],
  social: {},
  content: {},
  meta: { siteType: "unknown", generatedAt: null, error: null },
};

/* the slug and portal address reach every template even when the fetch fails, so the tag and
   the forms keep working while the portal's data is unavailable */
const WIRING = { slug: SLUG || null, portalBase: PORTAL_BASE };

module.exports = async function () {
  if (!SLUG) {
    console.warn("[apnosh] APNOSH_SLUG not set, building with the site's own data");
    return { ...EMPTY, ...WIRING, meta: { ...EMPTY.meta, error: "APNOSH_SLUG not set" } };
  }
  const url = `${PORTAL_BASE}/api/public/sites/${SLUG}`;
  try {
    const res = await fetch(url, { headers: API_KEY ? { "X-Apnosh-Key": API_KEY } : {} });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.warn(`[apnosh] ${res.status}: ${body.slice(0, 200)}`);
      return { ...EMPTY, ...WIRING, meta: { ...EMPTY.meta, error: `${res.status}` } };
    }
    const data = await res.json();
    data.content = data.content || {};
    data.upcomingEvents = data.upcomingEvents || [];
    console.log(`[apnosh] ok: location=${data.location && data.location.location_name}, promo=${!!data.activePromo}, events=${data.upcomingEvents.length}`);
    return { ...EMPTY, ...data, ...WIRING };
  } catch (e) {
    console.warn("[apnosh] fetch failed:", e.message);
    return { ...EMPTY, ...WIRING, meta: { ...EMPTY.meta, error: e.message } };
  }
};
