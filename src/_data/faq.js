/* FAQ answers, built from the menus' own fine print so prices and rules never drift from the menus.
   Used by /faq/ (with FAQPage structured data) and the location pages. */
module.exports = function () {
  const menus = require("./menus.js")();
  const a = menus.ayce;
  return [
    {
      q: "Do I need a reservation?",
      a: `Walk-ins are always welcome. For groups and weekend nights we recommend booking ahead online: <a href="/locations/#reserve">reserve at Alki Beach or Kent</a>, or call Alki at (206) 806-8422 or Kent at (253) 981-4277.`,
    },
    {
      q: "How much is all-you-can-eat?",
      a: `At Alki Beach: AYCE Lunch ${a.alki.lunch}, Premium ${a.alki.premium} and Supreme ${a.alki.supreme} per person. In Kent: AYCE Lunch ${a.kent.lunch}, Premium ${a.kent.premium} and Supreme ${a.kent.supreme} per person. Kids 4–10 are half price.`,
    },
    {
      q: "When is AYCE lunch?",
      a: `At Alki Beach, ${a.alki.lunchDays}. In Kent, ${a.kent.lunchDays}. AYCE lunch is not offered on holidays.`,
    },
    {
      q: "What’s the difference between Premium and Supreme?",
      a: "Premium includes 28 meats, from thin-sliced brisket and pork belly to marinated galbi, plus appetizers, stews and banchan. Supreme includes everything in Premium plus four supreme cuts, including Angus ribeye (limit 1 per person) and Angus boneless short rib (limit 2 per person).",
    },
    {
      q: "How does all-you-can-eat work?",
      a: "Your whole table orders from the same AYCE menu, with a 2-guest minimum. You can order up to 4 types of meat and 2 appetizers per round, and dining time is 90 minutes. Our staff will help first-timers with the grill.",
    },
    {
      q: "Can I take leftovers home?",
      a: "Leftovers and takeout are not allowed with all-you-can-eat, and there is a $15 charge for leftovers, so order in rounds and only what your table will finish.",
    },
    {
      q: "Is gratuity included for large groups?",
      a: "An 18% gratuity is added for parties of 5 or more.",
    },
    {
      q: "Do you have happy hour?",
      a: "Yes, at our Alki Beach location: 2–5pm and 8pm to close, with happy hour bites like corn cheese, wings and dumplings, house cocktails, $1 off beer and $2 off wine and liquor (excluding wells). See the <a href=\"/alki-menu/#happy-hour\">happy hour menu</a>.",
    },
    {
      q: "Do you have vegetarian options?",
      a: "Yes. Vegetarian dishes such as corn cheese and garlic fries are marked on our menus. Let your server know about any dietary needs.",
    },
    {
      q: "Can I order à la carte instead of AYCE?",
      a: "Yes. Both locations offer KBBQ combos for 2 or 4 guests, à la carte meats, appetizers, entrées and stews, plus bento boxes and weekday lunch specials.",
    },
    {
      q: "Can you host birthdays and group dinners?",
      a: `Absolutely. Do Si is built for celebrations. Reserve ahead, or <a href="/contact/#groups">tell us about your group</a> and we’ll help plan it.`,
    },
  ];
};
