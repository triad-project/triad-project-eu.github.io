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
    "@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-standard-normal.woff2": "display.woff2",
    "@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-ext-standard-normal.woff2": "display-ext.woff2",
    "@fontsource/dm-mono/files/dm-mono-latin-400-normal.woff2": "mono.woff2",
    "@fontsource/dm-mono/files/dm-mono-latin-500-normal.woff2": "mono-500.woff2",
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
