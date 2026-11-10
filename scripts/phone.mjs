// Screenshots of the live phone, full screen.
// Usage: node scripts/phone.mjs <light|dark> "<name>=<js>" ["<name>=<js>" ...]
// Opens the page, scrolls to the live phone, presses F (full screen), then for
// each step runs the JS (if any), waits WAIT ms (1500) and saves
// $OUT/<name>-<scheme>.png (OUT defaults to /tmp/duo-shots).
// Env: URL (http://localhost:3300), W/H (1440×900), DPR (1), NOFULL=1 keeps the device view.
// Example: node scripts/phone.mjs dark "home=" "photos=document.querySelector('[data-os-root=live] [data-app=photos]').click()" 
import puppeteer from "/home/natnael-tadele/Desktop/kilet/my-projects/ntz/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";
const [scheme = "light", ...steps] = process.argv.slice(2);
const out = process.env.OUT || "/tmp/duo-shots";
await import("node:fs").then((fs) => fs.mkdirSync(out, { recursive: true }));
const W = +(process.env.W || 1440), H = +(process.env.H || 900);
const browser = await puppeteer.launch({ executablePath: "/usr/bin/google-chrome", headless: "new", args: ["--use-gl=angle", "--enable-gpu-rasterization", "--hide-scrollbars"] });
const page = await browser.newPage();
await page.setViewport({ width: W, height: H, deviceScaleFactor: +(process.env.DPR || 1) });
await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: scheme }]);
const logs = [];
page.on("console", (m) => (m.type() === "error" || m.type() === "warning") && logs.push(m.text()));
page.on("pageerror", (e) => logs.push("PAGEERROR " + e.message));
await page.goto(process.env.URL || "http://localhost:3300", { waitUntil: "networkidle0", timeout: 90000 });
await new Promise((r) => setTimeout(r, 800));
await page.evaluate(() => { const tr = document.querySelector("[aria-label='ntz duo']"); const L = window.__LENGTH || 9.6; window.scrollTo(0, tr.offsetTop + (4.3 / L) * (tr.offsetHeight - innerHeight)); });
await new Promise((r) => setTimeout(r, 1800));
if (process.env.NOFULL !== "1") { await page.keyboard.press("f"); await new Promise((r) => setTimeout(r, 1800)); }
for (const st of steps) {
  const i = st.indexOf("=");
  const name = st.slice(0, i), js = st.slice(i + 1);
  if (js) { try { await page.evaluate(js); } catch (e) { logs.push(name + ": " + e.message); } await new Promise((r) => setTimeout(r, +(process.env.WAIT || 1500))); }
  await page.screenshot({ path: `${out}/${name}-${scheme}.png` });
}
if (logs.length) console.log(logs.slice(0, 15).join("\n"));
await browser.close();
