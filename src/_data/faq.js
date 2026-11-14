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
      a: `There are three tiers. At Alki Beach: Signature ${a.alki.signature}, Premium ${a.alki.premium} and Supreme ${a.alki.supreme} per person. In Kent: Signature ${a.kent.signature}, Premium ${a.kent.premium} and Supreme ${a.kent.supreme} per person. Kids 4–10 are half price.`,
    },
    {
      q: "What’s the difference between Signature, Premium and Supreme?",
      a: "Signature has 20 meats: sliced beef belly and pork belly in six marinades each, pork bulgogi, pork collar and four kinds of chicken, plus 12 appetizers and unlimited banchan. Premium adds USDA Choice brisket, beef bulgogi and LA galbi, beef tongue, shrimp, Cajun shrimp, baby octopus and spicy marinated squid. Supreme adds USDA Choice Angus ribeye and boneless short rib (limit 2 per person), pork jowl and beef intestine, plus seven Supreme-only appetizers and stews: bulgogi quesadilla, sotteok sotteok, sweet potato fries, calamari, egg soufflé (1 per table), kimchi stew and soybean stew.",
    },
    {
      q: "How does all-you-can-eat work?",
      a: "Your whole table orders from the same AYCE menu, with a 2-guest minimum. You can order up to 4 types of meat per round, plus 4 appetizers at Alki Beach or 2 in Kent, and dining time is 90 minutes. Our staff will help first-timers with the grill.",
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
    {
      q: "Can I rent out the Alki Beach restaurant?",
      a: `Yes. Our Alki Beach location takes full buyouts and large group bookings for birthdays, company parties, rehearsal dinners and more. <a href="/private-events/">Request a date</a> and we’ll follow up with availability and pricing.`,
    },
  ];
};
