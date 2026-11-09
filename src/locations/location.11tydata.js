/* breadcrumbs per location page (a function, so each paginated page gets its own) */
module.exports = {
  eleventyComputed: {
    breadcrumbs: (data) => [
      { name: "Locations", url: "/locations/" },
      { name: data.loc.name, url: data.loc.page },
    ],
  },
};
