// Usage: node shoot.mjs "<t1,t2,...>" [w] [h] [scheme] [extraJS]
import puppeteer from "/home/natnael-tadele/Desktop/kilet/my-projects/ntz/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";
const [ts = "0", w = "1440", h = "900", scheme = "light", extra = ""] = process.argv.slice(2);
const out = process.env.OUT || "/tmp/duo-shots";
const browser = await puppeteer.launch({ executablePath: "/usr/bin/google-chrome", headless: "new", args: ["--use-gl=angle", "--enable-gpu-rasterization", "--hide-scrollbars"] });
const page = await browser.newPage();
await page.setViewport({ width: +w, height: +h, deviceScaleFactor: 1 });
await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: scheme }]);
const logs = [];
page.on("console", (m) => (m.type() === "error" || m.type() === "warning") && logs.push(m.text()));
page.on("pageerror", (e) => logs.push("PAGEERROR " + e.message));
await page.goto(process.env.URL || "http://localhost:3300", { waitUntil: "networkidle0", timeout: 60000 });
await new Promise((r) => setTimeout(r, 800));
for (const t of ts.split(",")) {
  await page.evaluate((t) => {
    const tr = document.querySelector("[aria-label='ntz duo']");
    const L = window.__LENGTH || 9.6;
    window.scrollTo(0, tr.offsetTop + (+t / L) * (tr.offsetHeight - innerHeight));
  }, t);
  await new Promise((r) => setTimeout(r, 1400));
  if (extra) { await page.evaluate(extra); await new Promise((r) => setTimeout(r, 1200)); }
  await page.screenshot({ path: `${out}/t${t}-${w}x${h}-${scheme}.png` });
}
if (logs.length) console.log(logs.slice(0, 15).join("\n"));
await browser.close();
