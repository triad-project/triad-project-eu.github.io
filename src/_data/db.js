import fs from "node:fs";

const read = (f) => JSON.parse(fs.readFileSync(`content/${f}.json`, "utf8"));

export default function () {
  const news = fs
    .readdirSync("content/news")
    .filter((f) => f.endsWith(".json"))
    .map((f) => ({ slug: f.replace(/^\d{4}-\d{2}-\d{2}-/, "").replace(/\.json$/, ""), ...read(`news/${f.slice(0, -5)}`) }))
    // Posts marked as drafts show in the local preview only. They are left out when the site is published.
    .filter((x) => !(x.draft && process.env.GITHUB_ACTIONS))
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  return {
    site: read("site"),
    home: read("home"),
    about: read("about"),
    workplan: read("workplan").items,
    partners: read("partners"),
    outputs: read("outputs"),
    news,
  };
}
