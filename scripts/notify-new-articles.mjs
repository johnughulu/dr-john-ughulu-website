import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const endpoint = process.env.ARTICLE_ALERT_ENDPOINT;
const secret = process.env.ARTICLE_ALERT_SECRET;
if (!endpoint || !secret) {
  console.log("Subscriber alerts are not active: configure ARTICLE_ALERT_ENDPOINT and ARTICLE_ALERT_SECRET in GitHub Actions secrets.");
  process.exit(0);
}
const current = JSON.parse(readFileSync("public/articles.json", "utf8"));
const before = process.env.BEFORE_SHA || "";
if (process.env.EVENT_NAME === "workflow_dispatch") {
  console.log("Manual runs do not automatically resend past articles.");
  process.exit(0);
}
if (!/^[0-9a-f]{40}$/i.test(before) || /^0+$/.test(before)) {
  console.log("No valid previous revision to compare; skipping to avoid bulk sending.");
  process.exit(0);
}
let previous;
try {
  previous = JSON.parse(execFileSync("git", ["show", before + ":public/articles.json"], { encoding: "utf8" }));
} catch {
  console.log("Previous article list unavailable; skipping to avoid bulk sending.");
  process.exit(0);
}
const seen = new Set(previous.map(x => x.id));
const added = current.filter(x => x.id && !seen.has(x.id));
for (const article of added) {
  const url = "https://johnughulu.com/articles/?article=" + encodeURIComponent(article.id);
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + secret },
    body: JSON.stringify({ id: article.id, title: article.title, excerpt: article.excerpt || "", url, sender: "info@johnughulu.com" })
  });
  if (!response.ok) throw new Error("Notification service failed: HTTP " + response.status);
  console.log("Alert request accepted for " + article.id);
}
if (!added.length) console.log("No newly published articles found.");
