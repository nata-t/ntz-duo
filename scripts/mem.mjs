// Memory, captures and frame pacing of the page, headless.
// Usage: node scripts/mem.mjs <locked|unlocked|fold> [seconds=120]
//   locked    the phone as it loads, left alone
//   unlocked  opened flat on the Home Screen, unlocked, left alone
//   fold      unlocked and left alone, then scrolled out of flat: frame times,
//             how the folding display was drawn, and the picture's age
// Memory: resident size of the renderer and GPU processes, and Chrome's
// memory-infra dumps of the renderer's allocators, taken after a forced GC,
// so what's left is what's held. Captures are the display pictures
// lib/raster.ts takes (one SVG decode each).
// Env: URL (http://localhost:3300), W/H (1440×900), DPR (2).
import { execSync } from "node:child_process";
import puppeteer from "/home/natnael-tadele/Desktop/kilet/my-projects/ntz/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";

const [mode = "locked", secs = "120"] = process.argv.slice(2);
const browser = await puppeteer.launch({
  executablePath: "/usr/bin/google-chrome",
  headless: "new",
  args: ["--use-gl=angle", "--enable-gpu-rasterization", "--hide-scrollbars", "--js-flags=--expose-gc"],
});
const page = await browser.newPage();
await page.setViewport({ width: +(process.env.W || 1440), height: +(process.env.H || 900), deviceScaleFactor: +(process.env.DPR || 2) });
const logs = [];
page.on("pageerror", (e) => logs.push("PAGEERROR " + e.message));
page.on("console", (m) => m.type() === "error" && logs.push(m.text()));
await page.evaluateOnNewDocument(() => {
  const w = window;
  w.__mem = { captures: [] };
  const decode = HTMLImageElement.prototype.decode;
  HTMLImageElement.prototype.decode = function () {
    if (this.src.startsWith("data:image/svg+xml")) w.__mem.captures.push(performance.now());
    return decode.call(this);
  };
});
const cdp = await page.createCDPSession();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MB = (hex) => Math.round(parseInt(hex || "0", 16) / 1048576);

/** The renderer's allocators, after a forced GC. */
async function memory() {
  await page.evaluate(() => {
    gc();
    gc();
  });
  await sleep(1500);
  const events = [];
  const collect = (e) => events.push(...e.value);
  cdp.on("Tracing.dataCollected", collect);
  const done = new Promise((r) => cdp.once("Tracing.tracingComplete", r));
  await cdp.send("Tracing.start", { traceConfig: { includedCategories: ["disabled-by-default-memory-infra"], memoryDumpConfig: { triggers: [] } }, transferMode: "ReportEvents" });
  await cdp.send("Tracing.requestMemoryDump", { levelOfDetail: "detailed" });
  await cdp.send("Tracing.end");
  await done;
  cdp.off("Tracing.dataCollected", collect);
  const names = {};
  for (const e of events) if (e.name === "process_name") names[e.pid] = e.args.name;
  let best = null;
  for (const e of events) {
    const a = e.args?.dumps?.allocators;
    if (e.ph !== "v" || !a || !/Renderer/.test(names[e.pid] ?? "")) continue;
    const size = (k) => MB(a[k]?.attrs?.size?.value);
    const row = {
      webgl: size("webgl"),
      canvas: size("canvas"),
      images: size("cc/image_memory"),
      discardable: size("discardable"),
      strings: size("partition_alloc/partitions/buffer"),
      v8: size("v8"),
      blink: size("blink_gc"),
    };
    if (!best || row.webgl + row.canvas > best.webgl + best.canvas) best = row;
  }
  return { ...rss(), ...best };
}

/** Resident memory of the renderer and GPU processes, MB. */
function rss() {
  const rows = execSync("ps -eo pid=,ppid=,rss=,args=").toString().trim().split("\n").map((l) => l.trim().match(/^(\d+)\s+(\d+)\s+(\d+)\s+(.*)$/)).filter(Boolean);
  const tree = new Set([String(browser.process().pid)]);
  for (let grew = true; grew; ) {
    grew = false;
    for (const r of rows) if (tree.has(r[2]) && !tree.has(r[1])) tree.add(r[1]), (grew = true);
  }
  const out = { renderer: 0, gpu: 0 };
  for (const r of rows) {
    if (!tree.has(r[1])) continue;
    const type = r[4].match(/--type=([\w-]+)/)?.[1];
    if (type === "renderer" && !r[4].includes("--extension-process")) out.renderer += Math.round(+r[3] / 1024);
    if (type === "gpu-process") out.gpu += Math.round(+r[3] / 1024);
  }
  return out;
}

const report = async (label) => {
  const m = await memory();
  const caps = await page.evaluate(() => window.__mem.captures.length);
  console.log(label.padEnd(16), JSON.stringify({ ...m, captures: caps }));
};

/** Scroll the page to story time t (no smoothing). */
const goTo = (t) =>
  page.evaluate((t) => {
    const tr = document.querySelector("[aria-label='ntz duo']");
    const L = window.__LENGTH || 9.6;
    window.scrollTo(0, tr.offsetTop + (t / L) * (tr.offsetHeight - innerHeight));
  }, t);

await page.goto(process.env.URL || "http://localhost:3300", { waitUntil: "load", timeout: 90000 });
await sleep(8000);

if (mode !== "locked") {
  await goTo(4.3);
  await sleep(3000);
  // The Lock Screen's home-indicator zone opens on a keyboard click.
  await page.evaluate(() => document.querySelector("[data-os-root='live'] button[aria-label='Swipe up to open']")?.click());
  await sleep(3000);
  const locked = await page.evaluate(() => document.querySelector("[data-os-root='live'] [aria-label='Lock Screen']") !== null);
  if (locked) console.log("WARNING: still locked");
}

const total = +secs;
await report("start");
for (const at of [15, 60, 120, 240].filter((s) => s <= total)) {
  await sleep((at - (at === 15 ? 0 : at === 60 ? 15 : at === 120 ? 60 : 120)) * 1000);
  await report(`idle ${at}s`);
}

if (mode === "fold") {
  // Out of flat, smoothly, the way a wheel would: story 4.3 → 5.6 in 2.4 s.
  const r = await page.evaluate(async () => {
    const tr = document.querySelector("[aria-label='ntz duo']");
    const L = window.__LENGTH || 9.6;
    const y = (t) => tr.offsetTop + (t / L) * (tr.offsetHeight - innerHeight);
    // The display layers DeviceGL positions: the live display, the outer
    // one and the two folding halves.
    const layers = [...document.querySelectorAll("div")].filter((d) => d.style.willChange === "transform, opacity" && d.style.backfaceVisibility === "hidden");
    const liveLayer = layers.find((d) => d.querySelector("[data-os-root='live']"));
    const Lh = layers.find((d) => d.querySelector("[data-os-root='mirror']"));
    const frames = [];
    const start = performance.now(), D = 2400;
    let leftAt = null;
    await new Promise((done) => {
      const step = (now) => {
        const k = Math.min(1, (now - start) / D);
        window.scrollTo(0, y(4.3 + (5.6 - 4.3) * (k * k * (3 - 2 * k))));
        const halves = Lh?.style.opacity === "1";
        const live = liveLayer?.style.opacity === "1";
        if (!live && leftAt === null) leftAt = now;
        frames.push({ now, halves, live });
        if (k < 1) requestAnimationFrame(step);
        else setTimeout(done, 600);
      };
      requestAnimationFrame(step);
    });
    const dts = frames.slice(1).map((f, i) => f.now - frames[i].now).sort((a, b) => a - b);
    const pick = (q) => Math.round(dts[Math.min(dts.length - 1, Math.floor(q * dts.length))]);
    const caps = window.__mem.captures;
    const before = caps.filter((c) => leftAt !== null && c <= leftAt);
    const folding = frames.filter((f) => !f.live);
    return {
      frames: frames.length,
      p50: pick(0.5),
      p95: pick(0.95),
      long: dts.filter((d) => d > 50).length,
      foldingFrames: folding.length,
      // Frames drawn with the DOM halves standing in for the GPU picture.
      halvesFrames: folding.filter((f) => f.halves).length,
      pictureAgeAtLeave: before.length ? Math.round(leftAt - before[before.length - 1]) : null,
      capturesDuringScroll: caps.filter((c) => c >= start).length,
    };
  });
  console.log("fold".padEnd(16), JSON.stringify(r));
}

if (logs.length) console.log(logs.slice(0, 10).join("\n"));
await browser.close();
