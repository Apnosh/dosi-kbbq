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
  function setDrawer(open) {
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    drawer.hidden = !open;
    nav.classList.toggle("is-open", open);
    document.documentElement.style.overflow = open ? "hidden" : "";
    onScroll();
  }
  if (burger && drawer) {
    burger.addEventListener("click", function () { setDrawer(burger.getAttribute("aria-expanded") !== "true"); });
    drawer.addEventListener("click", function (e) { if (e.target.closest("a") && !e.target.closest("[data-reserve]")) setDrawer(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !drawer.hidden) { setDrawer(false); burger.focus(); } });
    window.addEventListener("resize", function () { if (window.innerWidth > 1060 && !drawer.hidden) setDrawer(false); });
  }

  /* "Reserve" asks which location first */
  var dialog = document.getElementById("reserve-dialog");
  if (dialog && typeof dialog.showModal === "function") {
    document.addEventListener("click", function (e) {
      var t = e.target.closest("[data-reserve]");
      if (!t) return;
      e.preventDefault();
      if (burger && drawer && !drawer.hidden) setDrawer(false);
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

  /* hero video: starts right away (autoplay, muted). Reduced motion or data saver keeps the still frame. */
  var v = document.querySelector(".hero__video");
  var saver = navigator.connection && navigator.connection.saveData;
  if (v) {
    if (reduce || saver) {
      v.pause(); v.removeAttribute("autoplay"); v.preload = "none";
    } else {
      var shown = function () { v.classList.add("is-playing"); };
      if (v.readyState >= 3) shown(); else v.addEventListener("playing", shown, { once: true });
      var p = v.play(); if (p && p.catch) p.catch(function () {});
    }
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

  /* switching location keeps you on the same section (Alki dinner -> Kent dinner) */
  document.querySelectorAll(".menu-switch a:not([aria-current])").forEach(function (a) {
    a.addEventListener("click", function () { if (location.hash) a.href = a.getAttribute("href").split("#")[0] + location.hash; });
  });

  /* menu tabs: tap to jump, and the strip follows the section you're reading.
     The strip is moved with scrollLeft only. (scrollIntoView also nudged the page itself on
     phones, which is what made the menus bounce while you scrolled.) */
  var strip = document.querySelector(".menu-tabs__inner");
  var tabs = document.querySelectorAll(".menu-tabs a");
  var blocks = document.querySelectorAll(".menu-block");
  if (strip && tabs.length && blocks.length) {
    var current = null, jumping = false, jumpTimer;
    /* the page-wide smooth scrolling would turn every "auto" jump into a slow glide */
    doc.style.scrollBehavior = "auto";
    var offset = function () { var t = document.querySelector(".menu-tabs"); return (t ? t.getBoundingClientRect().bottom : 0) + 12; };
    var setActive = function (id) {
      if (id === current) return;
      current = id;
      tabs.forEach(function (a) {
        var on = a.getAttribute("href") === "#" + id;
        a.classList.toggle("is-active", on);
        if (on) { a.setAttribute("aria-current", "true"); strip.scrollTo({ left: a.offsetLeft - (strip.clientWidth - a.offsetWidth) / 2, behavior: reduce ? "auto" : "smooth" }); }
        else a.removeAttribute("aria-current");
      });
    };
    var spyTick = false;
    var spyRun = function () {
      spyTick = false;
      if (jumping) return;
      var line = offset() + 40, id = blocks[0].id;
      blocks.forEach(function (b) { if (b.getBoundingClientRect().top <= line) id = b.id; });
      setActive(id);
    };
    window.addEventListener("scroll", function () { if (!spyTick) { spyTick = true; requestAnimationFrame(spyRun); } }, { passive: true });
    spyRun();
    tabs.forEach(function (a) {
      a.addEventListener("click", function (e) {
        var target = document.getElementById(a.getAttribute("href").slice(1));
        if (!target) return;
        e.preventDefault();
        setActive(target.id);
        jumping = true;
        var y = window.scrollY + target.getBoundingClientRect().top - offset() + 1;
        /* a long jump would take seconds to animate, so only short hops glide */
        var far = Math.abs(y - window.scrollY) > window.innerHeight * 2.5;
        window.scrollTo({ top: y, behavior: reduce || far ? "auto" : "smooth" });
        history.replaceState(null, "", "#" + target.id);
        /* hand control back to the scroll spy once the page has stopped moving */
        var last = -1;
        clearInterval(jumpTimer);
        jumpTimer = setInterval(function () {
          if (window.scrollY === last) { clearInterval(jumpTimer); jumping = false; spyRun(); }
          last = window.scrollY;
        }, 120);
      });
    });
  }
})();
