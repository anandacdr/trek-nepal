/* ============================================================
   Restore the #site-nav / #site-foot injection slots.

   Early versions of the prerenderer replaced the placeholders with
   outerHTML, which consumed them. Once consumed, site.js has nothing to
   fill on a later build, so those pages froze with whatever nav they had
   at that moment — new menu items never reached them.

   The prerenderer now fills the slots (innerHTML) instead of replacing
   them, but files clobbered before that fix need the slots put back.
   This strips the baked nav/footer markup and reinstates the wrappers.

   Usage:  node tools/restore-slots.mjs   then re-run the prerender.
   ============================================================ */
import { JSDOM } from "jsdom";
import { readFileSync, writeFileSync } from "node:fs";
import { globSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const files = globSync("**/*.html", { cwd: ROOT })
  .filter(f => !f.startsWith("node_modules") && !f.startsWith("_source"));

let fixed = 0, already = 0;

for (const rel of files) {
  const path = join(ROOT, rel);
  const html = readFileSync(path, "utf8");
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  const hasNavSlot  = doc.getElementById("site-nav");
  const hasFootSlot = doc.getElementById("site-foot");
  if (hasNavSlot && hasFootSlot) { already++; continue; }

  let changed = false;

  if (!hasNavSlot) {
    const skip  = doc.querySelector("a.skip");
    const nav   = doc.getElementById("nav");
    const scrim = doc.getElementById("scrim");
    const search = doc.getElementById("search");
    const anchor = skip || nav;
    if (anchor) {
      const slot = doc.createElement("div");
      slot.id = "site-nav";
      anchor.parentNode.insertBefore(slot, anchor);
      [skip, nav, scrim, search].forEach(el => el && el.remove());
      changed = true;
    }
  }

  if (!hasFootSlot) {
    const foot = doc.getElementById("foot");
    if (foot) {
      const slot = doc.createElement("div");
      slot.id = "site-foot";
      foot.parentNode.insertBefore(slot, foot);
      foot.remove();
      changed = true;
    }
  }

  if (changed) {
    writeFileSync(path, "<!DOCTYPE html>\n" + doc.documentElement.outerHTML + "\n");
    console.log("  restored", rel);
    fixed++;
  }
}

console.log(`\n  ${fixed} file(s) restored, ${already} already had slots.`);
console.log("  Now run: npm run prerender");
