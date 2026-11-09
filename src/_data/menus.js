/**
 * The menus, as text (they were images on the old site). One JSON file per printed menu in
 * src/menus/, named <location>-<menu>.json. Tab order and labels are set here. A missing file
 * is skipped, so a location can have fewer menus than another (only Alki has happy hour).
 *
 * The JSON keeps the printed menu's wording; the clean-up below only drops what a web page
 * shows another way (the icon legend, the logo, the per-person price already on the heading).
 */
const fs = require("fs");
const path = require("path");

const DIR = path.join(__dirname, "..", "menus");
const TABS = [
  { id: "ayce-dinner", label: "AYCE Dinner" },
  { id: "ayce-lunch", label: "AYCE Lunch" },
  { id: "combo-alacarte", label: "KBBQ Combos" },
  { id: "apps-entrees", label: "Apps & Entrées" },
  { id: "bento-lunch", label: "Lunch & Bento" },
  { id: "drinks", label: "Drinks" },
  { id: "happy-hour", label: "Happy Hour" },
];

const NOT_FOR_GUESTS = [/^\[transcriber note\]/i, /logo/i, /^do si korean bbq$/i, /per person/i];
const LEGEND = [/=\s*spicy/i, /=\s*vegetarian/i, /best seller/i, /icon\)/i];

const TAGS = { "best seller": "best", spicy: "spicy", "spicy x2": "spicy2", vegetarian: "veg", new: "new" };

function clean(data) {
  data.intro = (data.intro || []).filter((l) => !NOT_FOR_GUESTS.some((r) => r.test(l)));
  data.fineprint = (data.fineprint || []).filter((l) => !LEGEND.some((r) => r.test(l)));
  for (const s of data.sections || []) {
    s.note = s.note ? s.note.replace(/^\s*per person\.?\s*/i, "").trim() || null : null;
    for (const i of s.items || []) {
      const t = new Set((i.tags || []).map((x) => TAGS[String(x).toLowerCase()]).filter(Boolean));
      if (t.has("spicy2")) t.delete("spicy");
      i.tagKeys = [...t];
    }
  }
  return data;
}

function load(loc) {
  return TABS.map((t) => {
    const file = path.join(DIR, `${loc}-${t.id}.json`);
    if (!fs.existsSync(file)) return null;
    const data = clean(JSON.parse(fs.readFileSync(file, "utf8")));
    return { ...data, id: t.id, label: t.label };
  }).filter(Boolean);
}

/* AYCE prices for the home page and FAQ, read from the menus so they can never disagree */
function ayce(menus) {
  const price = (tab, re) => {
    const s = tab && tab.sections.find((x) => re.test(x.name || ""));
    return s ? s.price : null;
  };
  const days = (tab) => {
    const l = tab && tab.intro.find((x) => /monday|tuesday|weekday/i.test(x));
    return l ? l.replace(/^all you can eat\s*\|\s*/i, "") : null;
  };
  const out = {};
  for (const [loc, tabs] of Object.entries(menus)) {
    const lunch = tabs.find((t) => t.id === "ayce-lunch");
    const dinner = tabs.find((t) => t.id === "ayce-dinner");
    out[loc] = {
      lunch: price(lunch, /lunch/i),
      lunchDays: days(lunch),
      premium: price(dinner, /premium/i),
      supreme: price(dinner, /supreme/i),
    };
  }
  return out;
}

/* the grill items the printed AYCE dinner menu marks BEST SELLER (same at both locations) */
function grillBest(tabs) {
  const dinner = tabs.find((t) => t.id === "ayce-dinner");
  if (!dinner) return [];
  const out = [];
  for (const s of dinner.sections) {
    if (!/premium|supreme/i.test(s.name || "")) continue;
    for (const i of s.items) {
      if (i.tagKeys.includes("best")) out.push({ number: (i.number || "").replace(".", ""), name: i.name.replace(/\*+$/, ""), korean: i.korean, tier: /supreme/i.test(s.name) ? "Supreme" : "Premium", spicy: i.tagKeys.some((k) => k.startsWith("spicy")) });
    }
  }
  return out;
}

module.exports = function () {
  const menus = { alki: load("alki"), kent: load("kent") };
  menus.ayce = ayce(menus);
  menus.grillBest = grillBest(menus.alki);
  const hh = menus.alki.find((t) => t.id === "happy-hour");
  menus.happyHour = hh ? { hours: hh.intro[0] || null, sections: hh.sections } : null;
  return menus;
};
