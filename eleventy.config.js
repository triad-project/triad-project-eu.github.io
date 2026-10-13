import fs from "node:fs";
import { EleventyHtmlBasePlugin } from "@11ty/eleventy";

const site = JSON.parse(fs.readFileSync("content/site.json", "utf8"));

export default function (cfg) {
  cfg.addPlugin(EleventyHtmlBasePlugin);
  // Images uploaded through Pages CMS.
  cfg.addPassthroughCopy({ assets: "assets" });
  // Stylesheet, logos and anything else that is copied to the site as it is.
  cfg.addPassthroughCopy({ static: "/" });
  // Typefaces are served from the site itself, so no visitor data goes to a font service.
  // Montserrat stays only because the wordmark inside the TRIAD logo is set in it.
  const fonts = {
    "@fontsource-variable/montserrat/files/montserrat-latin-wght-normal.woff2": "montserrat-latin.woff2",
    "@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff2": "serif.woff2",
    "@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2": "serif-italic.woff2",
    "@fontsource/instrument-serif/files/instrument-serif-latin-ext-400-normal.woff2": "serif-ext.woff2",
    "@fontsource-variable/instrument-sans/files/instrument-sans-latin-wght-normal.woff2": "sans.woff2",
    "@fontsource-variable/instrument-sans/files/instrument-sans-latin-ext-wght-normal.woff2": "sans-ext.woff2",
    "@fontsource-variable/instrument-sans/files/instrument-sans-latin-wght-italic.woff2": "sans-italic.woff2",
    "@fontsource/dm-mono/files/dm-mono-latin-400-normal.woff2": "mono.woff2",
    "@fontsource/dm-mono/files/dm-mono-latin-500-normal.woff2": "mono-500.woff2",
    "@fontsource-variable/caveat/files/caveat-latin-wght-normal.woff2": "hand.woff2",
  };
  for (const [from, to] of Object.entries(fonts)) cfg.addPassthroughCopy({ [`node_modules/${from}`]: `fonts/${to}` });
  cfg.addWatchTarget("./content/");

  // Wraps one word of a headline so it can be circled in pen.
  cfg.addFilter("circle", (s, word) => {
    const safe = String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;");
    return word ? safe.replace(new RegExp(`\\b${word}\\b`), `<span class="circled">${word}<svg viewBox="0 0 120 60" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M14 34 C8 14 40 4 68 5 C98 6 116 18 112 34 C108 52 70 57 44 55 C20 53 6 44 12 26 C16 14 34 8 52 7"/></svg></span>`) : safe;
  });
  cfg.addFilter("stamp", (d) =>
    d ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(d)).toUpperCase() : ""
  );
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
