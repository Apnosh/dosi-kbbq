/* Do Si: small enhancements. Everything works without this file; it only adds polish. */
(function () {
  var doc = document.documentElement;
  doc.classList.add("js");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* nav goes solid once you scroll off the hero */
  var nav = document.getElementById("nav");
  /* the phone action bar shows once the hero's own buttons have scrolled away */
  var bar = document.querySelector(".actionbar");
  function onScroll() {
    if (nav) nav.classList.toggle("is-solid", window.scrollY > 24 || !document.querySelector(".hero"));
    if (bar) bar.classList.toggle("is-on", window.scrollY > window.innerHeight * 0.6);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* mobile drawer */
  var burger = document.querySelector(".nav__burger");
  var drawer = document.getElementById("drawer");
  if (burger && drawer) {
    burger.addEventListener("click", function () {
      var open = burger.getAttribute("aria-expanded") === "true";
      burger.setAttribute("aria-expanded", String(!open));
      drawer.hidden = open;
      document.body.style.overflow = open ? "" : "hidden";
      nav.classList.add("is-solid");
    });
    drawer.addEventListener("click", function (e) { if (e.target.closest("a")) { burger.click(); } });
  }

  /* "Reserve" asks which location first */
  var dialog = document.getElementById("reserve-dialog");
  if (dialog && typeof dialog.showModal === "function") {
    document.addEventListener("click", function (e) {
      var t = e.target.closest("[data-reserve]");
      if (!t) return;
      e.preventDefault();
      if (burger && burger.getAttribute("aria-expanded") === "true") burger.click();
      dialog.showModal();
      /* the start of a booking; the Apnosh tag logs tap_book when they pick a location */
      if (typeof window.gtag === "function") window.gtag("event", "reserve_start", { page_path: window.location.pathname });
    });
    dialog.addEventListener("click", function (e) { if (e.target === dialog) dialog.close(); });
  }

  /* reveal on scroll */
  var items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* hero video: loads after the page, never on reduced motion or data saver */
  var v = document.querySelector(".hero__video");
  var saver = navigator.connection && navigator.connection.saveData;
  if (v && !reduce && !saver) {
    var start = function () {
      v.src = v.getAttribute("data-src");
      v.addEventListener("canplay", function () { v.classList.add("is-playing"); }, { once: true });
      var p = v.play(); if (p && p.catch) p.catch(function () {});
    };
    if (document.readyState === "complete") start(); else window.addEventListener("load", start);
  }

  /* open now / closed, in Seattle time */
  var KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  function seattleNow() {
    var parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
    var get = function (t) { return (parts.find(function (p) { return p.type === t; }) || {}).value; };
    var day = KEYS.indexOf(String(get("weekday")).slice(0, 3).toLowerCase());
    return { day: day, mins: (parseInt(get("hour"), 10) % 24) * 60 + parseInt(get("minute"), 10) };
  }
  function toMins(t) { var a = String(t).split(":"); return parseInt(a[0], 10) * 60 + parseInt(a[1] || "0", 10); }
  function fmt(t) { var m = toMins(t), h = Math.floor(m / 60) % 24, mm = m % 60, ap = h >= 12 ? "PM" : "AM"; h = h % 12 || 12; return h + (mm ? ":" + String(mm).padStart(2, "0") : "") + " " + ap; }
  function status(hours) {
    var n = seattleNow(), today = hours[KEYS[n.day]] || [];
    for (var i = 0; i < today.length; i++) {
      var o = toMins(today[i].open), c = toMins(today[i].close); if (c <= o) c += 1440;
      if (n.mins >= o && n.mins < c) return { open: true, text: "Open now · until " + fmt(today[i].close) };
      if (n.mins < o) return { open: false, text: "Opens today at " + fmt(today[i].open) };
    }
    for (var d = 1; d <= 7; d++) {
      var k = KEYS[(n.day + d) % 7], h = hours[k] || [];
      if (h.length) return { open: false, text: "Closed now · opens " + (d === 1 ? "tomorrow" : k.charAt(0).toUpperCase() + k.slice(1)) + " " + fmt(h[0].open) };
    }
    return null;
  }
  document.querySelectorAll(".status-chip[data-hours], .status-line[data-hours]").forEach(function (el) {
    try {
      var s = status(JSON.parse(el.getAttribute("data-hours")));
      if (!s) return;
      el.classList.add(s.open ? "is-open" : "is-closed");
      el.querySelector("[data-status]").textContent = s.text;
    } catch (e) {}
  });

  /* highlight today's row in hour lists */
  var todayShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][seattleNow().day];
  var todayLong = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][seattleNow().day];
  document.querySelectorAll(".hours[data-hours] li").forEach(function (li) {
    var label = li.firstElementChild ? li.firstElementChild.textContent : "";
    if (label === todayLong) { li.classList.add("is-today"); return; }
    var m = label.split(" – ");
    if (m.length === 2) {
      var order = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], a = order.indexOf(m[0]), b = order.indexOf(m[1]), t = order.indexOf(todayShort);
      if (a > -1 && b > -1 && t >= a && t <= b) li.classList.add("is-today");
    }
  });

  /* menu tabs follow the section in view */
  var tabs = document.querySelectorAll(".menu-tabs a");
  if (tabs.length && "IntersectionObserver" in window) {
    var byId = {};
    tabs.forEach(function (a) { byId[a.getAttribute("href").slice(1)] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        tabs.forEach(function (a) { a.classList.remove("is-active"); });
        var a = byId[en.target.id];
        if (a) { a.classList.add("is-active"); a.scrollIntoView({ block: "nearest", inline: "center", behavior: reduce ? "auto" : "smooth" }); }
      });
    }, { rootMargin: "-30% 0px -60% 0px" });
    document.querySelectorAll(".menu-block").forEach(function (s) { spy.observe(s); });
  }
})();
