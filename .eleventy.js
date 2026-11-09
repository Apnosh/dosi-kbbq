/**
 * Do Si Korean BBQ: Eleventy config.
 *
 * Hours and phone numbers live in src/_data/locations.json. When the site is built with
 * APNOSH_SLUG set, src/_data/apnosh.js pulls the owner's latest hours, holiday hours and
 * notes from the Apnosh portal, and the `withPortal` filter below lays them over the
 * matching location, so a portal edit reaches the site on the next deploy.
 */
const DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const SHORT = { sun: "Sun", mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat" };
const LONG = { sun: "Sunday", mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday", sat: "Saturday" };
const SCHEMA_DAY = { sun: "Sunday", mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday", sat: "Saturday" };

/* "21:00" -> "9 PM", "11:30" -> "11:30 AM", "24:00" -> "12 AM" */
function time12(hhmm) {
  if (!hhmm || typeof hhmm !== "string") return hhmm;
  const [hStr, mStr] = hhmm.split(":");
  let h = parseInt(hStr, 10) % 24;
  const m = (mStr || "00").padStart(2, "0");
  if (Number.isNaN(h)) return hhmm;
  const period = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return m === "00" ? `${h} ${period}` : `${h}:${m} ${period}`;
}

const span = (periods) =>
  periods && periods.length ? periods.map((p) => `${time12(p.open)} – ${time12(p.close)}`).join(", ") : "Closed";

/* the week as rows of days that share hours: [{ days: "Sun – Thu", time: "11 AM – 9 PM" }] */
function hoursRows(hours) {
  if (!hours) return [];
  const rows = [];
  for (const d of DAYS) {
    const time = span(hours[d]);
    const last = rows[rows.length - 1];
    if (last && last.time === time) last.to = d;
    else rows.push({ from: d, to: d, time });
  }
  return rows.map((r) => ({ days: r.from === r.to ? LONG[r.from] : `${SHORT[r.from]} – ${SHORT[r.to]}`, time: r.time }));
}

/* schema.org OpeningHoursSpecification, one entry per run of days that share hours */
function openingHoursSpec(hours) {
  if (!hours) return [];
  const out = [];
  for (const d of DAYS) {
    for (const p of hours[d] || []) {
      const close = p.close === "24:00" ? "23:59" : p.close;
      const hit = out.find((o) => o.opens === p.open && o.closes === close);
      if (hit) hit.dayOfWeek.push(SCHEMA_DAY[d]);
      else out.push({ "@type": "OpeningHoursSpecification", dayOfWeek: [SCHEMA_DAY[d]], opens: p.open, closes: close });
    }
  }
  return out;
}

/* Lay what the owner set in the Apnosh portal over a location. The portal serves ONE listing
   (its primary); we only use it for the location whose name it matches, so Kent's hours never
   land on Alki or the other way round. Anything the portal lacks keeps the site's own value. */
function withPortal(loc, apnosh) {
  const p = apnosh && apnosh.location;
  if (!p || !p.location_name) return loc;
  const portalName = String(p.location_name).toLowerCase();
  if (!portalName.includes(loc.key)) return loc;
  const hasHours = apnosh.hours && DAYS.some((d) => apnosh.hours[d] && apnosh.hours[d].length);
  return {
    ...loc,
    hours: hasHours ? apnosh.hours : loc.hours,
    phone: p.phone || loc.phone,
    specialHours: Array.isArray(apnosh.specialHours) ? apnosh.specialHours : [],
    fromPortal: true,
  };
}

/* holiday / one-off hours from today (Seattle time) through the next 60 days */
function upcomingSpecial(list) {
  const tz = "America/Los_Angeles";
  const today = new Date().toLocaleDateString("en-CA", { timeZone: tz });
  const until = new Date(Date.now() + 60 * 86400000).toLocaleDateString("en-CA", { timeZone: tz });
  return (list || [])
    .filter((s) => s && s.date >= today && s.date <= until)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((s) => {
      const ranges = s.ranges || (s.open ? [{ open: s.open, close: s.close }] : []);
      return {
        date: new Date(`${s.date}T12:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
        time: s.closed ? "Closed" : span(ranges),
        reason: s.reason || null,
      };
    });
}

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy({ "src/assets/icons/favicon.ico": "favicon.ico" });
  eleventyConfig.addPassthroughCopy({ "src/apnosh-content.json": "apnosh-content.json" });

  eleventyConfig.addGlobalData("buildHash", String(Date.now()).slice(-8));
  eleventyConfig.addGlobalData("year", new Date().getFullYear());

  eleventyConfig.addFilter("time12", time12);
  eleventyConfig.addFilter("hoursRows", hoursRows);
  eleventyConfig.addFilter("openingHoursSpec", openingHoursSpec);
  eleventyConfig.addFilter("withPortal", withPortal);
  eleventyConfig.addFilter("upcomingSpecial", upcomingSpecial);
  eleventyConfig.addFilter("json", (v) => JSON.stringify(v));
  /* "2026-12-13T18:00:00Z" -> "Sat, Dec 13 · 10 AM" in Seattle time; a bare date has no time */
  eleventyConfig.addFilter("niceDate", (v) => {
    if (!v) return "";
    const s = String(v), d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(s) ? `${s}T12:00:00` : s);
    if (Number.isNaN(d.getTime())) return s;
    const tz = "America/Los_Angeles";
    const day = d.toLocaleDateString("en-US", { timeZone: tz, weekday: "short", month: "short", day: "numeric" });
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return day;
    return `${day} · ${d.toLocaleTimeString("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit" }).replace(":00", "")}`;
  });
  eleventyConfig.addFilter("telHref", (phone) => "tel:+1" + String(phone || "").replace(/\D/g, "").replace(/^1/, ""));
  eleventyConfig.addFilter("mapsUrl", (a) =>
    "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(`Do Si Korean BBQ, ${a.street}, ${a.city}, ${a.state} ${a.zip}`));
  eleventyConfig.addFilter("mapsEmbed", (a) =>
    "https://www.google.com/maps?output=embed&q=" + encodeURIComponent(`Do Si Korean BBQ, ${a.street}, ${a.city}, ${a.state} ${a.zip}`));
  eleventyConfig.addFilter("slug", (s) => String(s || "").toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
  eleventyConfig.addFilter("byKey", (list, key) => (list || []).find((x) => x.key === key));

  /* <picture> for a photo in src/assets/img: <name>-800.webp, <name>-1600.webp, <name>-1600.jpg */
  eleventyConfig.addShortcode("img", function (name, alt, opts = {}) {
    const sizes = opts.sizes || "100vw";
    const cls = opts.class ? ` class="${opts.class}"` : "";
    const eager = opts.eager;
    const w = opts.w || 1600, h = opts.h || 1067;
    const base = `/assets/img/${name}`;
    return `<picture><source type="image/webp" srcset="${base}-800.webp 800w, ${base}-1600.webp 1600w" sizes="${sizes}"><img src="${base}-1600.jpg" alt="${alt}" width="${w}" height="${h}"${cls} ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"></picture>`;
  });

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    templateFormats: ["njk", "md"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
};
