import fs from "node:fs";
import { EleventyHtmlBasePlugin } from "@11ty/eleventy";
import { feature } from "topojson-client";
import { geoConicConformal, geoPath } from "d3-geo";

const site = JSON.parse(fs.readFileSync("content/site.json", "utf8"));

export default function (cfg) {
  cfg.addPlugin(EleventyHtmlBasePlugin);
  // Images uploaded through Pages CMS.
  cfg.addPassthroughCopy({ assets: "assets" });
  // Stylesheet, logos and anything else that is copied to the site as it is.
  cfg.addPassthroughCopy({ static: "/" });
  // The site is set in Montserrat only, as in the brand book. It is served from the site itself,
  // so no visitor data goes to a font service.
  const fonts = {
    "@fontsource-variable/montserrat/files/montserrat-latin-wght-normal.woff2": "montserrat-latin.woff2",
    "@fontsource-variable/montserrat/files/montserrat-latin-ext-wght-normal.woff2": "montserrat-latin-ext.woff2",
  };
  for (const [from, to] of Object.entries(fonts)) cfg.addPassthroughCopy({ [`node_modules/${from}`]: `fonts/${to}` });
  cfg.addWatchTarget("./content/");

  // Wraps one phrase of a headline so it can sit on a block of colour.
  cfg.addFilter("mark", (s, phrase) => {
    const safe = String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;");
    return phrase && safe.includes(phrase) ? safe.replace(phrase, `<mark>${phrase}</mark>`) : safe;
  });
  cfg.addFilter("stamp", (d) =>
    d ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(d)).toUpperCase() : ""
  );
  // The three waves. Each is a sine line drawn wide enough to slide sideways by one wavelength for ever.
  const wave = (wl, amp, y, width) => {
    let d = `M0 ${y}`;
    for (let x = 0; x < width; x += wl) d += ` q${wl / 4} ${-amp * 2} ${wl / 2} 0 t${wl / 2} 0`;
    return d;
  };
  cfg.addShortcode("waves", (cls) =>
    `<svg class="${typeof cls === "string" ? cls : "waves"}" viewBox="0 0 3600 330" preserveAspectRatio="none" aria-hidden="true"><path class="w1" d="${wave(400, 34, 150, 3600)}"/><path class="w2" d="${wave(300, 24, 170, 3600)}"/><path class="w3" d="${wave(600, 46, 190, 3600)}"/></svg>`
  );
  // A drawn cover for news items that have no picture: the same three waves, varied by the item's address.
  cfg.addShortcode("cover", (slug = "") => {
    let h = 0;
    for (const c of String(slug)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const grounds = [["#013A47", "d"], ["#00667E", "d"], ["#CCEBE6", "l"], ["#FCEAD2", "l"], ["#E3EFD7", "l"], ["#CCE0E5", "l"]];
    const [bg, tone] = grounds[h % grounds.length];
    const ink = tone === "d" ? ["#33B09D", "#8EBE5E", "#F0961E"] : ["#00667E", "#009C84", "#F0961E"];
    const v = (n, lo, hi) => lo + ((h >>> n) % (hi - lo));
    const lines = [0, 1, 2].map((i) => `<path d="${wave(v(i * 5, 120, 300), v(i * 3 + 2, 10, 34), 110 + i * 22 + v(i * 7, 0, 30), 900)}" stroke="${ink[(i + h) % 3]}"/>`).join("");
    return `<svg class="cover" viewBox="0 0 640 360" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="640" height="360" fill="${bg}"/><g transform="translate(-${v(4, 0, 120)} 40)">${lines}</g></svg>`;
  });
  // The map on the Consortium page, drawn when the site is built. Countries are coloured by their part in
  // the pilots; a dot marks each partner's home city. Country numbers are ISO 3166-1 codes.
  cfg.addShortcode("europeMap", (partners) => {
    const W = 760, H = 720;
    const both = { 191: "Croatia", 276: "Germany", 300: "Greece" };      // pre-test and EU-wide pilots
    const euWide = { 440: "Lithuania", 246: "Finland", 380: "Italy" };   // EU-wide pilots
    const partnerOnly = { "056": "Belgium" };                            // partner, no pilot
    const world = JSON.parse(fs.readFileSync("node_modules/world-atlas/countries-50m.json", "utf8"));
    const countries = feature(world, world.objects.countries).features;
    const frame = { type: "MultiPoint", coordinates: [[-10, 34.3], [31, 34.3], [-10, 70], [31, 70]] };
    const projection = geoConicConformal().parallels([40, 62]).rotate([-12, 0]).fitSize([W, H], frame).clipExtent([[0, 0], [W, H]]);
    const path = geoPath(projection).digits(1);
    const cls = (id) => (both[id] ? "c-both" : euWide[id] ? "c-eu" : partnerOnly[id] ? "c-partner" : "c-none");
    const order = { "c-none": 0, "c-partner": 1, "c-eu": 2, "c-both": 3 };
    const shapes = countries
      .map((c) => ({ d: path(c), k: cls(String(c.id).padStart(3, "0")) }))
      .filter((c) => c.d)
      .sort((a, b) => order[a.k] - order[b.k])
      .map((c) => `<path class="${c.k}" d="${c.d}"/>`)
      .join("");
    // Label positions: partners that sit close together get their label pushed to a free side.
    const nudge = { RPTU: [-10, 16, "end"], HRW: [-10, -2, "end"], ZEUS: [9, -8, "start"], BBZ: [10, 8, "start"], UGent: [-9, 14, "end"], QUANTIA: [-10, 4, "end"], "UNIZG FOI": [10, 4, "start"], EA: [10, 4, "start"], JYU: [10, 4, "start"], VIL: [10, -3, "start"], VESK: [10, 11, "start"] };
    const dots = (partners || [])
      .map((p) => {
        const [x, y] = projection([p.lon, p.lat]);
        const [dx, dy, anchor] = nudge[p.acronym] || [10, 4, "start"];
        if (p.acronym === "VESK") return "";   // shares its dot and city label with the other Vilnius partner
        return `<g><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5.5"/><text x="${(x + dx).toFixed(1)}" y="${(y + dy).toFixed(1)}" text-anchor="${anchor}">${p.city}</text></g>`;
      })
      .join("");
    return `<svg class="map" viewBox="0 0 ${W} ${H}" role="img" aria-label="Map of Europe showing the countries where TRIAD runs classroom pilots and the home cities of the partners">${shapes}<g class="map-dots">${dots}</g></svg>`;
  });
  // "M5" to "Jan 2027": project months shown as calendar months, since M-codes mean nothing to a visitor.
  const cal = (m) => {
    const d = new Date(site.start);
    d.setUTCMonth(d.getUTCMonth() + Number(m) - 1);
    return new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric", timeZone: "UTC" }).format(d);
  };
  cfg.addFilter("span", (a, b) => `${cal(a)} - ${cal(b)}`);
  // A partner's short name to its full name, from the consortium list.
  const partnerNames = Object.fromEntries(JSON.parse(fs.readFileSync("content/partners.json", "utf8")).items.map((p) => [p.acronym, p.name]));
  cfg.addFilter("fullName", (s) => partnerNames[s] || s);
  cfg.addFilter("take", (arr, n) => (arr || []).slice(0, n));
  cfg.addFilter("niceDate", (d) =>
    d ? new Intl.DateTimeFormat("en-GB", { dateStyle: "long", timeZone: "UTC" }).format(new Date(d)) : ""
  );
  // Project month to calendar month: month 1 is the month the project started in.
  cfg.addFilter("projectMonth", (m) => {
    const d = new Date(site.start);
    d.setUTCMonth(d.getUTCMonth() + Number(m) - 1);
    return new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(d);
  });
  // Position of a project month on the 36-month timeline, as a percentage.
  cfg.addFilter("pct", (m) => ((Number(m) / site.months) * 100).toFixed(3));
  // Plain text with blank lines between paragraphs becomes paragraphs.
  const esc = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  cfg.addFilter("paras", (s) =>
    String(s || "").split(/\n\s*\n/).filter((p) => p.trim()).map((p) => `<p>${esc(p.trim())}</p>`).join("\n")
  );
  cfg.addFilter("withUrl", (arr) => (arr || []).filter((x) => x.url));
  cfg.addFilter("withoutUrl", (arr) => (arr || []).filter((x) => !x.url));

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    pathPrefix: process.env.PATH_PREFIX || "/",
    htmlTemplateEngine: "njk",
  };
}
