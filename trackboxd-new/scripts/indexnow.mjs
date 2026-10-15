#!/usr/bin/env node
// Submit URLs to IndexNow (Bing, Yandex, Seznam, Naver — and via Bing's index: ChatGPT Search + Copilot).
// Usage:
//   npm run indexnow                 # submit all URLs from sitemap.xml
//   npm run indexnow -- /a /b /c     # submit only these paths

const HOST = "www.trackboxd.com";
const KEY = "2b0bb76cd08c495a919e331d82d2dcf7";
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const ENDPOINT = "https://api.indexnow.org/IndexNow";
const SITEMAP = `https://${HOST}/sitemap.xml`;

async function urlsFromSitemap() {
  const res = await fetch(SITEMAP);
  if (!res.ok) throw new Error(`sitemap fetch ${res.status}`);
  const xml = await res.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}

function urlsFromArgs(args) {
  return args.map((p) => (p.startsWith("http") ? p : `https://${HOST}${p.startsWith("/") ? p : "/" + p}`));
}

async function submit(urlList) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList }),
  });
  const text = await res.text();
  console.log(`${res.status} ${res.statusText}${text ? ` — ${text}` : ""}`);
  return res.ok;
}

const args = process.argv.slice(2);
const urls = args.length ? urlsFromArgs(args) : await urlsFromSitemap();
console.log(`submitting ${urls.length} URL(s) to IndexNow`);
for (let i = 0; i < urls.length; i += 10000) {
  const chunk = urls.slice(i, i + 10000);
  const ok = await submit(chunk);
  if (!ok) process.exit(1);
}
