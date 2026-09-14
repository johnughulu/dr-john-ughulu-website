import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const out = path.join(root, "dist");
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
await cp(path.join(root, "public"), out, { recursive: true });

const template = await readFile(path.join(root, "src", "template.html"), "utf8");
const pages = ["home", "about", "books", "articles", "speaking", "ministry", "organizations", "contact", "privacy"];

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

await writeFile(path.join(out, "404.html"), template.replaceAll("{{BASE}}", "./").replaceAll("{{PAGE}}", "home"));
console.log(`Built ${pages.length} pages in dist/`);
