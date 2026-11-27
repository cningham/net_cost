# Immigrants by country of origin: fiscal contribution and crime

A small static site that harmonises published estimates from Denmark, Sweden, the Netherlands and Finland onto one scale. A UK HMRC partial measure is used as an external check.

- `index.html`, `style.css`, `app.js` (Fiscal tab), `crime.js` (Crime tab), `palette.js` (colour scale): the site. It has no build step and no external libraries. Open `index.html` or serve the folder with GitHub Pages.
- `data/site-data.js`: the combined model output and a world map outline (Natural Earth, Equal Earth projection) used by the page.
- `data/crime-data.js`: Crime tab model output and the separate UK arrests-by-ethnicity view.
