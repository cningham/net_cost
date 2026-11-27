# Immigrants by country of origin: fiscal contribution and crime

A small static site that harmonises published estimates from Denmark, Sweden, the Netherlands and Finland onto one scale. A UK HMRC partial measure is used as an external check.

- `index.html`, `style.css`, `app.js` (Fiscal tab), `crime.js` (Crime tab): the site. It has no build step and no external libraries. Open `index.html` or serve the folder with GitHub Pages.
- `data/site-data.js`: the combined model output and a world map outline (Natural Earth, Equal Earth projection) used by the page.
- `data/results.json`: the full model output.
- `data/net_fiscal_contribution_by_origin_harmonised.xlsx`: the raw figures, the standardised figures, the model output, the sensitivity runs and the sources.
- `data/crime-data.js`, `data/crime_results.json`: Crime tab model output (rate ratios vs natives by origin and crime type, nine official sources) and the separate UK arrests-by-ethnicity view.
- `data/crime_by_origin_harmonised.xlsx`: crime sources, harmonised observations, model output, sensitivities, caveats and UK ethnicity tables.
