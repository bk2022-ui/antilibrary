#!/usr/bin/env tsx
/**
 * build-covergrid — standalone Pradarshan cover-display study (Founders-Notes style).
 *
 * Grid: covers at a single uniform slight tilt, soft shadow, title+author below.
 * Hover: a blue rounded outline appears around the card — nothing else changes.
 * Designed colour fallbacks for missing covers. Grid/list toggle; list shows
 * atomic-unit count. Re-runnable, read-only.
 *   npx tsx scripts/build-covergrid.ts
 */

import fs from "fs";
import path from "path";

const repoRoot = path.resolve(__dirname, "..");
const inv = JSON.parse(
  fs.readFileSync(path.join(repoRoot, "src/libraries/bk/inventory.json"), "utf-8"),
) as Array<Record<string, string | undefined>>;

const ideasPath = path.join(repoRoot, "src/libraries/bk/ideas.json");
const ideas = fs.existsSync(ideasPath)
  ? (JSON.parse(fs.readFileSync(ideasPath, "utf-8")) as Record<string, { units?: unknown[] }>)
  : {};
function unitCount(title = ""): number {
  const e = ideas[title];
  return e && Array.isArray(e.units) ? e.units.length : 0;
}

const REGISTER_COLOR: Record<string, string> = {
  humanist: "#a85f47",
  empirical: "#456585",
  philosophical: "#6a4763",
  contemplative: "#557a64",
  systems: "#565667",
  analytical: "#33333f",
};
const DEFAULT_COLOR = "#6a6258";

function esc(s = ""): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function regColor(reg?: string): string {
  return REGISTER_COLOR[reg ?? ""] ?? DEFAULT_COLOR;
}

let realCount = 0;
let fallbackCount = 0;

function gridCard(book: Record<string, string | undefined>): string {
  const title = esc(book.title);
  const author = esc(book.author);
  const color = regColor(book.register);
  const cover = book.coverUrl ? book.coverUrl.replace("-M.jpg", "-L.jpg") : "";

  let face: string;
  if (cover) {
    realCount++;
    face = `<img class="cover-img" loading="lazy" src="${esc(cover)}" alt="${title}">`;
  } else {
    fallbackCount++;
    face = `<div class="cover-fallback" style="--reg:${color}">
        <div class="fb-rule"></div>
        <div class="fb-title">${title}</div>
        <div class="fb-author">${author}</div>
      </div>`;
  }

  return `<div class="card">
    <div class="cover">${face}</div>
    <div class="meta">
      <div class="m-title">${title}</div>
      <div class="m-author">${author}</div>
    </div>
  </div>`;
}

function listRow(book: Record<string, string | undefined>): string {
  const title = esc(book.title);
  const author = esc(book.author);
  const reg = book.register ?? "—";
  const color = regColor(book.register);
  const cover = book.coverUrl ? book.coverUrl.replace("-M.jpg", "-L.jpg") : "";
  const thumb = cover
    ? `<img class="row-thumb" loading="lazy" src="${esc(cover)}" alt="">`
    : `<span class="row-thumb row-fallback" style="background:${color}"></span>`;
  return `<div class="row">
    ${thumb}
    <div class="row-title">${title}</div>
    <div class="row-author">${author}</div>
    <div class="row-reg"><span class="reg-dot" style="background:${color}"></span>${esc(reg)}</div>
    <div class="row-units">${unitCount(book.title)}</div>
  </div>`;
}

const gridCards = inv.map(gridCard).join("\n");
const listRows = inv.map(listRow).join("\n");

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Pradarshan — Cover Display Study</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #ffffff; color: #2a2a2a; padding: 40px 40px 90px;
  }
  .wrap { max-width: 1240px; margin: 0 auto; }
  .topbar { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 30px; }
  .head { font-family: Georgia, serif; font-size: 26px; font-weight: normal; }
  .sub { color: #999; font-size: 13px; margin-top: 4px; }
  .sub b { color: #777; font-weight: 600; }

  .toggle { display: flex; gap: 4px; border: 1px solid #e2ded7; border-radius: 7px; padding: 3px; background: #fff; }
  .toggle button { border: none; background: none; padding: 6px 9px; border-radius: 5px; cursor: pointer; color: #bbb; display: flex; }
  .toggle button.active { background: #2a2a2a; color: #fff; }
  .toggle svg { width: 16px; height: 16px; display: block; }

  /* GRID */
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(157px, 1fr)); gap: 24px; }
  .card {
    display: flex; flex-direction: column;
    padding: 14px 14px 16px;
    border: 2px solid #efedea; border-radius: 0;
    transition: border-color 0.12s ease;
  }
  .card:hover { border-color: #4a90e2; }

  .cover {
    position: relative; width: 100%; aspect-ratio: 2/3; border-radius: 0; overflow: hidden;
    background: #ece8e2;
    transform: rotate(-7.5deg);
    box-shadow: 0 5px 14px rgba(0,0,0,0.16), 0 2px 4px rgba(0,0,0,0.10);
  }
  .cover-img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .cover-fallback {
    width: 100%; height: 100%;
    background: linear-gradient(155deg, rgba(255,255,255,0.10) 0%, rgba(0,0,0,0.18) 100%), var(--reg);
    display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 16px 12px; text-align: center;
  }
  .fb-rule { width: 24px; height: 2px; background: rgba(243,236,224,0.7); margin-bottom: 12px; }
  .fb-title {
    font-family: 'Cormorant Garamond', Georgia, serif; font-size: 1rem; font-weight: 600; line-height: 1.26;
    color: #f4ede1; display: -webkit-box; -webkit-line-clamp: 6; -webkit-box-orient: vertical; overflow: hidden;
  }
  .fb-author { font-size: 0.64rem; color: rgba(244,237,225,0.72); margin-top: 9px; }

  .meta { padding: 14px 2px 0; }
  .m-title { font-family: Georgia, 'Times New Roman', serif; font-size: 0.96rem; font-weight: 500; color: #3a352f; line-height: 1.34; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
  .m-author { font-size: 0.74rem; color: #888; margin-top: 3px; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }

  /* LIST */
  .list { display: none; }
  .list.show { display: block; }
  .grid.hide { display: none; }
  .row-head, .row {
    display: grid; grid-template-columns: 44px 1fr 1fr 150px 80px; align-items: center; gap: 16px;
    padding: 10px 6px; border-bottom: 1px solid #ece8e2;
  }
  .row-head { color: #aaa; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; border-bottom: 1px solid #ddd8d0; }
  .row:hover { background: #f7f5f1; }
  .row-thumb { width: 32px; height: 46px; object-fit: cover; border-radius: 2px; box-shadow: 0 1px 3px rgba(0,0,0,0.15); display: block; }
  .row-fallback { display: inline-block; }
  .row-title { font-size: 0.86rem; font-weight: 600; color: #1a1a1a; }
  .row-author { font-size: 0.82rem; color: #777; }
  .row-reg { font-size: 0.78rem; color: #888; display: flex; align-items: center; gap: 7px; }
  .reg-dot { width: 9px; height: 9px; border-radius: 50%; display: inline-block; }
  .row-units { font-size: 0.82rem; color: #555; text-align: right; }
</style>
</head>
<body>
<div class="wrap">
  <div class="topbar">
    <div>
      <div class="head">Pradarshan — cover display study</div>
      <div class="sub"><b>${realCount}</b> real covers · <b>${fallbackCount}</b> designed fallbacks · <b>${inv.length}</b> books</div>
    </div>
    <div class="toggle">
      <button id="btn-grid" class="active" title="Grid" onclick="setView('grid')"><svg viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg></button>
      <button id="btn-list" title="List" onclick="setView('list')"><svg viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="2" width="14" height="2.4" rx="1"/><rect x="1" y="6.8" width="14" height="2.4" rx="1"/><rect x="1" y="11.6" width="14" height="2.4" rx="1"/></svg></button>
    </div>
  </div>

  <div id="grid" class="grid">
${gridCards}
  </div>

  <div id="list" class="list">
    <div class="row-head"><span></span><span>Title</span><span>Author</span><span>Register</span><span style="text-align:right">Units</span></div>
${listRows}
  </div>
</div>
<script>
  function setView(v){
    var grid=document.getElementById('grid'), list=document.getElementById('list');
    var bg=document.getElementById('btn-grid'), bl=document.getElementById('btn-list');
    if(v==='list'){ grid.classList.add('hide'); list.classList.add('show'); bl.classList.add('active'); bg.classList.remove('active'); }
    else { grid.classList.remove('hide'); list.classList.remove('show'); bg.classList.add('active'); bl.classList.remove('active'); }
  }
</script>
</body>
</html>`;

fs.writeFileSync(path.join(repoRoot, "covergrid.html"), html);
console.log(`covergrid.html written — ${realCount} real covers, ${fallbackCount} fallbacks, ${inv.length} books. Uniform tilt, blue hover outline.`);
