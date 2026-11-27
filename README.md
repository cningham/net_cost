# Net fiscal contribution of immigrants by country of origin

A small static site that harmonises published estimates from Denmark, Sweden, the Netherlands and Finland onto one scale. A UK HMRC partial measure is used as an external check.

- `index.html`, `style.css`, `app.js`: the site. It has no build step and no external libraries. Open `index.html` or serve the folder with GitHub Pages.
- `data/site-data.js`: the combined model output and a world map outline (Natural Earth, Equal Earth projection) used by the page.
- `data/results.json`: the full model output.
- `data/net_fiscal_contribution_by_origin_harmonised.xlsx`: the raw figures, the standardised figures, the model output, the sensitivity runs and the sources.
