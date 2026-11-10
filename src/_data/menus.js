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
  { id: "ayce", label: "All You Can Eat" },
  { id: "combo-alacarte", label: "À La Carte & Combos" },
  { id: "apps-entrees", label: "Apps & Entrées" },
  { id: "bento-lunch", label: "Lunch & Bento" },
  { id: "drinks", label: "Drinks" },
  { id: "happy-hour", label: "Happy Hour" },
];

const NOT_FOR_GUESTS = [/^\[transcriber note\]/i, /logo/i, /^do si korean bbq$/i, /per person/i];
const LEGEND = [/=\s*spicy/i, /=\s*vegetarian/i, /best seller/i, /icon\)/i];

const TAGS = { "best seller": "best", spicy: "spicy", "spicy x2": "spicy2", vegetarian: "veg", new: "new" };

/* menu item photos: src/assets/img/menu/<dish-name>.webp (see the README there) */
const PHOTO_DIR = path.join(__dirname, "..", "assets", "img", "menu");
const slugOf = (name) => String(name || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\*+/g, "").replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
/* A dish can look different on different menus: "Beef Bulgogi" is raw for the grill on the AYCE
   menus and cooked on the entrée menu. So AYCE looks for ayce-<dish> first, bento boxes for
   bento-<dish>, then everyone falls back to plain <dish>. */
const photoFor = (name, prefixes = []) => {
  const slug = slugOf(name);
  for (const p of [...prefixes, ""]) {
    for (const ext of ["webp", "jpg", "png"]) {
      const f = `${p}${slug}.${ext}`;
      if (fs.existsSync(path.join(PHOTO_DIR, f))) return `/assets/img/menu/${f}`;
    }
  }
  return null;
};
/* which sections get photo slots: food and cocktails, not beer, soju or wine lists */
const AYCE = new Set(["ayce"]);
const photoSlots = (tabId, i, s) =>
  tabId === "drinks" ? /cocktail/i.test(s.name || "") : !(tabId === "happy-hour" && i > 1);

/* Menus read as text lists, like the printed ones, with a few photos beside each section
   (the printed AYCE menu shows L1, L24, S30, S32 that way). FEATURE picks them by item number;
   any other section shows its best sellers that have photos, then other dishes with photos. */
const FEATURE = {
  "ayce/signature ayce": ["L1", "L9", "L24"],
  "ayce/premium ayce": ["P25", "P28"],
  "ayce/supreme ayce": ["S32", "S30"],
  "ayce/ayce appetizers": ["A10", "A3", "A11"],
  "ayce/supreme ayce appetizers": ["A14", "A18", "A15"],
};
function featured(tabId, s) {
  const items = (s.items || []).filter((i) => i.photo);
  if (!items.length) return [];
  const howMany = s.items.length <= 5 ? 2 : 3;
  const code = (i) => String(i.number || "").replace(".", "").toUpperCase();
  const wanted = FEATURE[`${tabId}/${String(s.name || "").toLowerCase()}`];
  let pick = wanted ? wanted.map((c) => items.find((i) => code(i) === c)).filter(Boolean) : [];
  if (!pick.length) pick = [...items.filter((i) => i.tagKeys.includes("best")), ...items.filter((i) => !i.tagKeys.includes("best"))];
  return pick.slice(0, howMany).map((i) => ({ photo: i.photo, name: i.name.replace(/\*+$/, ""), number: code(i) }));
}

/* the tier picker: each tier's price and what it includes, counting every lower tier too */
function tiersOf(sections) {
  return [1, 2, 3].map((level) => {
    const own = sections.find((s) => s.tier === level && s.price);
    const upTo = sections.filter((s) => s.tier <= level);
    const count = (re) => upTo.filter((s) => re.test(s.name || "")).reduce((n, s) => n + s.items.length, 0);
    const tidy = (n) => String(n).replace(/\*+$/, "").toLowerCase().replace(/\b([a-z])/g, (c) => c.toUpperCase()).replace(/\bLa\b/, "LA");
    const ownMeats = sections.filter((s) => s.tier === level && !/appetizer/i.test(s.name || "")).flatMap((s) => s.items.map((i) => tidy(i.name)));
    const ownApps = sections.filter((s) => s.tier === level && /appetizer/i.test(s.name || "")).flatMap((s) => s.items.map((i) => tidy(i.name)));
    const list = (a) => (a.length > 1 ? a.slice(0, -1).join(", ") + " and " + a[a.length - 1] : a[0] || "");
    let adds;
    if (level === 1) adds = `${count(/^(?!.*appetizer)/i)} meats and ${count(/appetizer/i)} appetizers & stews, with banchan`;
    else adds = `Everything in ${["Signature", "Premium"][level - 2]}, plus ${list(ownMeats)}${ownApps.length ? `, and ${ownApps.length} more appetizers: ${list(ownApps)}` : ""}`;
    return {
      level,
      adds,
      key: ["signature", "premium", "supreme"][level - 1],
      name: ["Signature", "Premium", "Supreme"][level - 1],
      price: own ? own.price : null,
      meats: count(/^(?!.*appetizer)/i),
      apps: count(/appetizer/i),
    };
  });
}

function clean(data, tabId) {
  data.intro = (data.intro || []).filter((l) => !NOT_FOR_GUESTS.some((r) => r.test(l)));
  data.fineprint = (data.fineprint || []).filter((l) => !LEGEND.some((r) => r.test(l)));
  (data.sections || []).forEach((s, si) => {
    s.photos = photoSlots(tabId, si, s);
    s.cards = s.photos && AYCE.has(tabId);
    s.note = s.note ? s.note.replace(/^\s*per person\.?\s*/i, "").trim() || null : null;
    /* notes written for whoever typed up the menu, not for guests */
    if (s.note && /printed|heading|front side|column/i.test(s.note)) s.note = null;
    if (s.note) s.note = s.note.replace(/\s*\|\|\s*/g, " · ").replace(/\s*\|\s*/g, " · ").replace(/ : /g, ": ").replace(/\s*~\s*/g, " to ").replace(/(day)\s+-\s+(\w+day)/gi, "$1 to $2");
    for (const i of s.items || []) {
      const t = new Set((i.tags || []).map((x) => TAGS[String(x).toLowerCase()]).filter(Boolean));
      if (t.has("spicy2")) t.delete("spicy");
      i.tagKeys = [...t];
      /* combo prices "S - $99.95 / L - $159.95" stack as two short lines */
      if (/^\s*S\s*-.*\/\s*L\s*-/i.test(i.price || "")) {
        i.priceLines = i.price.split("/").map((p) => p.trim().replace(/^S\s*-\s*/i, "Small ").replace(/^L\s*-\s*/i, "Large "));
      }
      i.slug = slugOf(i.name);
      const prefixes = AYCE.has(tabId) ? ["ayce-"] : tabId === "happy-hour" ? ["hh-"] : /bento/i.test(s.name || "") ? ["bento-"] : [];
      i.photo = s.photos ? photoFor(i.name, prefixes) : null;
      /* the studio shots are transparent cut-outs (.webp); the happy hour ones are round crops (.jpg) */
      i.cutout = !!(i.photo && i.photo.endsWith(".webp"));
    }
    s.hasPhotos = (s.items || []).some((i) => i.photo);
    s.featured = featured(tabId, s);
    /* AYCE tiers: 1 Signature, 2 Premium, 3 Supreme. A section belongs to the lowest tier that gets it. */
    if (AYCE.has(tabId)) {
      const n = String(s.name || "").toLowerCase();
      s.tier = /supreme/.test(n) ? 3 : /premium/.test(n) ? 2 : 1;
      s.tierHead = /appetizer/.test(n)
        ? (s.tier === 3 ? "+ Supreme appetizers" : "Appetizers & stews")
        : (s.tier === 1 ? "Meats" : s.tier === 2 ? "+ Premium meats" : "+ Supreme meats");
    }
  });
  return data;
}

function load(loc) {
  return TABS.map((t) => {
    const file = path.join(DIR, `${loc}-${t.id}.json`);
    if (!fs.existsSync(file)) return null;
    const data = clean(JSON.parse(fs.readFileSync(file, "utf8")), t.id);
    if (AYCE.has(t.id)) data.tiers = tiersOf(data.sections);
    return { ...data, id: t.id, label: t.label };
  }).filter(Boolean);
}

/* AYCE prices for the home page and FAQ, read from the menus so they can never disagree */
function ayce(menus) {
  const price = (tab, re) => {
    const s = tab && tab.sections.find((x) => re.test(x.name || ""));
    return s ? s.price : null;
  };
  /* one AYCE menu, three tiers: Signature (24 meats), Premium (+4), Supreme (+4 and extra appetizers) */
  const out = {};
  for (const [loc, tabs] of Object.entries(menus)) {
    const t = tabs.find((x) => x.id === "ayce");
    out[loc] = {
      signature: price(t, /signature/i),
      premium: price(t, /premium/i),
      supreme: price(t, /^supreme ayce$/i),
    };
  }
  return out;
}

/* the grill items the printed AYCE menu marks BEST SELLER (same at both locations) */
function grillBest(tabs) {
  const t = tabs.find((x) => x.id === "ayce");
  if (!t) return [];
  const out = [];
  for (const s of t.sections) {
    const tier = (/^(signature|premium|supreme) ayce$/i.exec(s.name || "") || [])[1];
    if (!tier) continue;
    for (const i of s.items) {
      if (i.tagKeys.includes("best")) out.push({ number: (i.number || "").replace(".", ""), name: i.name.replace(/\*+$/, ""), korean: i.korean, tier: tier[0].toUpperCase() + tier.slice(1).toLowerCase(), spicy: i.tagKeys.some((k) => k.startsWith("spicy")) });
    }
  }
  return out;
}

/* "from" prices for ordering à la carte, the lowest at either location, read from the menus */
function alacarte(menus) {
  const money = (p) => { const m = String(p || "").match(/\$\s*([\d.]+)/); return m ? parseFloat(m[1]) : null; };
  const from = (tabId, sectionRe) => {
    let low = null;
    for (const tabs of Object.values(menus)) {
      const tab = tabs.find((t) => t.id === tabId);
      if (!tab) continue;
      for (const s of tab.sections) {
        if (sectionRe && !sectionRe.test(s.name || "")) continue;
        for (const i of s.items) { const v = money(i.price); if (v != null && (low == null || v < low)) low = v; }
      }
    }
    return low == null ? null : `$${low.toFixed(2)}`;
  };
  return {
    combo: from("combo-alacarte", /combo/i),
    plates: from("combo-alacarte", /carte/i),
    apps: from("apps-entrees", /appetizer/i),
    entrees: from("apps-entrees", /entree/i),
    bento: from("bento-lunch"),
  };
}

module.exports = function () {
  const menus = { alki: load("alki"), kent: load("kent") };
  menus.ayce = ayce(menus);
  menus.alacarte = alacarte({ alki: menus.alki, kent: menus.kent });
  menus.grillBest = grillBest(menus.alki);
  const hh = menus.alki.find((t) => t.id === "happy-hour");
  menus.happyHour = hh ? { hours: hh.intro[0] || null, sections: hh.sections } : null;
  return menus;
};
