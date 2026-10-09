import fs from "node:fs";
import { EleventyHtmlBasePlugin } from "@11ty/eleventy";

const site = JSON.parse(fs.readFileSync("content/site.json", "utf8"));

export default function (cfg) {
  cfg.addPlugin(EleventyHtmlBasePlugin);
  // Images uploaded through Pages CMS.
  cfg.addPassthroughCopy({ assets: "assets" });
  // Stylesheet, logos and anything else that is copied to the site as it is.
  cfg.addPassthroughCopy({ static: "/" });
  // Montserrat is served from the site itself, so no visitor data goes to a font service.
  for (const s of ["latin", "latin-ext"]) {
    cfg.addPassthroughCopy({
      [`node_modules/@fontsource-variable/montserrat/files/montserrat-${s}-wght-normal.woff2`]: `fonts/montserrat-${s}.woff2`,
    });
  }
  cfg.addWatchTarget("./content/");

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
