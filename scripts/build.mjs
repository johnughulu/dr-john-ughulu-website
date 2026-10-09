import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const out = path.join(root, "dist");
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
await cp(path.join(root, "public"), out, { recursive: true });

const template = await readFile(path.join(root, "src", "template.html"), "utf8");
const articles = JSON.parse(await readFile(path.join(root, "public", "articles.json"), "utf8"));
const escapeMeta = value => String(value ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const articleMeta = article => {
  const title = escapeMeta(article.title);
  const description = escapeMeta(article.excerpt || "Read an original article by Dr. John Ughulu.");
  const url = "https://johnughulu.com/articles/" + encodeURIComponent(article.id) + "/";
  return `<title>${title} | Dr. John Ughulu</title>
<meta name="description" content="${description}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Dr. John Ughulu">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="https://johnughulu.com/assets/dr-john-ughulu-headshot.png">
<meta property="og:image:alt" content="Portrait of Dr. John Ughulu">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="https://johnughulu.com/assets/dr-john-ughulu-headshot.png">`;
};

const pages = ["home", "about", "books", "articles", "speaking", "ministry", "organizations", "contact", "privacy", "accessibility"];

for (const page of pages) {
  const depth = page === "home" ? "" : "../";
  const html = template.replaceAll("{{BASE}}", depth).replaceAll("{{PAGE}}", page);
  if (page === "home") {
    await writeFile(path.join(out, "index.html"), html);
  } else {
    await mkdir(path.join(out, page), { recursive: true });
    await writeFile(path.join(out, page, "index.html"), html);
  }
}

// Static article pages expose per-article metadata to social preview crawlers.
for (const article of articles) {
  if (!article.id || !/^[a-z0-9-]+$/.test(article.id)) continue;
  const directory = path.join(out, "articles", article.id);
  await mkdir(directory, { recursive: true });
  const page = template
    .replaceAll("{{BASE}}", "../../")
    .replaceAll("{{PAGE}}", "articles")
    .replace(/<title>[^<]*<\\/title>/, "")
    .replace(/<meta name="description"[^>]*>/, "")
    .replace(/<meta property="og:[^>]*>/g, "")
    .replace(/<meta name="twitter:[^>]*>/g, "")
    .replace("</head>", articleMeta(article) + "\\n</head>")
    .replace('window.PAGE_ID = "articles";', 'window.PAGE_ID = "articles"; window.ARTICLE_ID = ' + JSON.stringify(article.id) + ';');
  await writeFile(path.join(directory, "index.html"), page);
}
await writeFile(path.join(out, "404.html"), template.replaceAll("{{BASE}}", "./").replaceAll("{{PAGE}}", "home"));
console.log(`Built ${pages.length} pages in dist/`);
