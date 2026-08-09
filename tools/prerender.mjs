/* ============================================================
   Prerenderer — bakes the JS-rendered DOM into static HTML.
   ------------------------------------------------------------
   The site works without this: open any page and the scripts build
   the nav, footer and cards at runtime. But a crawler with JS off —
   and every social-media link unfurler — sees an empty shell.

   This runs each page in jsdom, lets the real site scripts execute,
   then writes the resulting DOM back to disk. There is no second copy
   of any template: assets/js/{data,site}.js stay the single source.

   It also generates one real page per trek, so all seven get their own
   indexable URL, <title> and description instead of sharing a query
   string on treks/detail.html.

   The per-trek source lives at treks/_template.html — a separate file from
   the public treks/detail.html redirect, so re-running this can never read
   its own output. The underscore keeps it out of the sitemap and nav.

   Usage:  node tools/prerender.mjs          (needs jsdom + a local server)
   ============================================================ */
import { JSDOM, VirtualConsole } from "jsdom";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.BASE || "http://localhost:8777/";
const SITE = process.env.SITE || "https://trek-nepal-demo.vercel.app";  // canonical/og host

/* pages that are prerendered as-is */
const PAGES = [
  "index.html", "404.html",
  "treks/index.html", "treks/everest-base-camp.html",
  "guides/index.html",
  "guides/altitude-and-acclimatisation.html", "guides/packing-list.html",
  "guides/best-time-to-trek.html", "guides/permits-and-costs.html",
  "blog/index.html",
  "blog/the-porter-who-carries-the-door.html",
  "blog/why-we-turned-back-at-lobuche.html",
  "blog/a-rest-day-in-namche.html",
  "blog/dal-bhat-twice-a-day.html",
  "about/index.html", "about/responsible-travel.html",
  "contact/index.html",
  "legal/terms.html", "legal/privacy.html",
];

/* browser APIs jsdom lacks. The IntersectionObserver shim fires
   immediately on purpose: it bakes the revealed state into the HTML so
   scroll-animated content is visible to crawlers and no-JS visitors. */
function shim(w) {
  w.matchMedia = q => ({
    matches: /min-width:\s*1025px/.test(q), media: q, onchange: null,
    addEventListener(){}, removeEventListener(){},
    addListener(){}, removeListener(){}, dispatchEvent(){ return false; },
  });
  w.HTMLMediaElement.prototype.play  = function(){ return Promise.resolve(); };
  w.HTMLMediaElement.prototype.pause = function(){};
  w.IntersectionObserver = class {
    constructor(cb){ this.cb = cb; }
    observe(el){ this.cb([{ isIntersecting: true, target: el,
      boundingClientRect: { top: 0, bottom: 100, height: 100 } }], this); }
    unobserve(){} disconnect(){} takeRecords(){ return []; }
  };
  w.scrollTo = () => {};
  w.HTMLElement.prototype.scrollIntoView = () => {};
}

async function render(url, { bake } = {}) {
  const vc = new VirtualConsole();
  const errors = [];
  vc.on("jsdomError", e => errors.push(e.message.split("\n")[0]));

  const dom = await JSDOM.fromURL(BASE + url, {
    runScripts: "dangerously", resources: "usable",
    pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      shim(w);
      if (bake) w.TREK_SLUG = bake;          // per-trek pages render themselves
    },
  });
  await new Promise(r => setTimeout(r, 550));
  return { dom, errors };
}

/* strip runtime-only state and re-point relative asset URLs */
function clean(doc, depth) {
  // jsdom resolves srcs to absolute http://localhost URLs — put them back
  const prefix = "../".repeat(depth);
  doc.querySelectorAll("[src],[href]").forEach(el => {
    for (const attr of ["src", "href"]) {
      const v = el.getAttribute(attr);
      if (!v || !v.startsWith(BASE)) continue;
      el.setAttribute(attr, prefix + v.slice(BASE.length));
    }
  });
  // the scrim/search are runtime UI; leave them hidden as authored
  doc.querySelectorAll("#scrim").forEach(e => e.setAttribute("hidden", ""));
  doc.querySelectorAll("#search").forEach(e => e.setAttribute("hidden", ""));
  doc.body.classList.remove("drawer-open", "search-open");
  doc.body.style.overflow = "";
  return "<!DOCTYPE html>\n" + doc.documentElement.outerHTML + "\n";
}

function setMeta(doc, { title, desc, canonical, image }) {
  doc.title = title;
  const set = (sel, attr, val) => {
    let el = doc.querySelector(sel);
    if (!el) {
      el = doc.createElement("meta");
      const [k, v] = sel.replace(/^meta\[|\]$/g, "").split("=");
      el.setAttribute(k, v.replace(/["']/g, ""));
      doc.head.appendChild(el);
    }
    el.setAttribute(attr, val);
  };
  set('meta[name="description"]', "content", desc);
  set('meta[property="og:title"]', "content", title);
  set('meta[property="og:description"]', "content", desc);
  set('meta[property="og:type"]', "content", "website");
  set('meta[property="og:url"]', "content", canonical);
  if (image) set('meta[property="og:image"]', "content", image);
  set('meta[name="twitter:card"]', "content", "summary_large_image");

  let link = doc.querySelector('link[rel="canonical"]');
  if (!link) {
    link = doc.createElement("link");
    link.setAttribute("rel", "canonical");
    doc.head.appendChild(link);
  }
  link.setAttribute("href", canonical);
}

/* ============================================================
   Structured data — SEO (rich results), AEO (answer engines pulling
   Q&A), GEO (generative engines needing explicit entities/facts).
   ============================================================ */
const ORG = {
  "@type": "TravelAgency",
  "@id": SITE + "/#org",
  name: "Trek Nepal",
  url: SITE + "/",
  logo: SITE + "/assets/img/favicon.svg",
  description: "Small-group trekking in Nepal led by licensed local guides. " +
               "Permits, teahouse lodging and porters included.",
  areaServed: [{ "@type": "Country", name: "Nepal" }],
  address: { "@type": "PostalAddress", addressLocality: "Kathmandu",
             addressRegion: "Bagmati", addressCountry: "NP" },
  email: "hello@example.com",
  knowsAbout: ["Everest Base Camp trek", "Annapurna Base Camp trek",
               "Manaslu Circuit", "Upper Mustang", "high-altitude acclimatisation",
               "trekking permits in Nepal"],
};

function ld(doc, obj) {
  const el = doc.createElement("script");
  el.setAttribute("type", "application/ld+json");
  el.textContent = JSON.stringify(obj, null, 1);
  doc.head.appendChild(el);
}

function crumbs(doc, trail) {
  ld(doc, { "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({
      "@type": "ListItem", position: i + 1, name: t.name, item: t.url })) });
}

const urls = [];

/* ---------- 1. per-trek static pages ---------- */
{
  const { dom } = await render("treks/index.html");
  var PACKAGES = dom.window.PACKAGES;
  var FAQS     = dom.window.FAQS   || [];
  var GUIDES   = dom.window.GUIDES || [];
  var BLOG     = dom.window.BLOG   || [];
  dom.window.close();

  for (const p of PACKAGES) {
    const { dom: d, errors } = await render(`treks/_template.html?trek=${p.slug}`, { bake: p.slug });
    if (errors.length) console.log(`  ! ${p.slug}: ${errors[0]}`);
    const doc = d.window.document;
    const out = `treks/${p.slug}.html`;
    const canonical = `${SITE}/${out}`;
    setMeta(doc, {
      title: `${p.title} — ${p.duration}, from $${p.price.toLocaleString()} | Trek Nepal`,
      desc: p.blurb,
      canonical,
      image: `${SITE}/${p.img}`,
    });
    // bake the slug so the page renders itself if JS runs again
    const s = doc.createElement("script");
    s.textContent = `window.TREK_SLUG=${JSON.stringify(p.slug)};`;
    doc.head.appendChild(s);

    ld(doc, { "@context": "https://schema.org", ...ORG });
    ld(doc, {
      "@context": "https://schema.org",
      "@type": "TouristTrip",
      name: p.title,
      description: p.blurb,
      url: canonical,
      image: `${SITE}/${p.img}`,
      touristType: p.grade === "Easy" ? "Beginner trekkers"
                 : p.grade === "Moderate" ? "Fit walkers" : "Experienced trekkers",
      provider: { "@id": SITE + "/#org" },
      itinerary: {
        "@type": "ItemList",
        numberOfItems: p.itinerary.length,
        itemListElement: p.itinerary.map(([d, t, m], i) => ({
          "@type": "ListItem", position: i + 1,
          item: { "@type": "TouristDestination", name: t,
                  description: `Day ${d} — ${t} (${m})` } })),
      },
      offers: {
        "@type": "Offer", price: p.price, priceCurrency: "USD",
        availability: "https://schema.org/InStock", url: canonical,
        priceValidUntil: `${new Date().getFullYear() + 1}-12-31`,
      },
      additionalProperty: [
        { "@type": "PropertyValue", name: "Maximum altitude", value: `${p.max} m` },
        { "@type": "PropertyValue", name: "Duration", value: p.duration },
        { "@type": "PropertyValue", name: "Difficulty", value: p.grade },
        { "@type": "PropertyValue", name: "Best season", value: p.best },
        { "@type": "PropertyValue", name: "Group size", value: p.group },
      ],
    });
    if (FAQS.length) ld(doc, {
      "@context": "https://schema.org", "@type": "FAQPage",
      mainEntity: FAQS.map(([q, a]) => ({
        "@type": "Question", name: q,
        acceptedAnswer: { "@type": "Answer", text: a } })),
    });
    crumbs(doc, [
      { name: "Home", url: SITE + "/index.html" },
      { name: "Treks", url: SITE + "/treks/index.html" },
      { name: p.short || p.title, url: canonical },
    ]);

    writeFileSync(join(ROOT, out), clean(doc, 1));
    urls.push({ loc: canonical, pri: "0.9" });
    console.log("  trek  →", out);
    d.window.close();
  }
}

/* ---------- 2. everything else ---------- */
for (const page of PAGES) {
  const { dom, errors } = await render(page);
  if (errors.length) console.log(`  ! ${page}: ${errors[0]}`);
  const doc = dom.window.document;
  const depth = page.includes("/") ? 1 : 0;
  const canonical = `${SITE}/${page}`;
  setMeta(doc, {
    title: doc.title,
    desc: doc.querySelector('meta[name="description"]')?.getAttribute("content") || "",
    canonical,
  });
  ld(doc, { "@context": "https://schema.org", ...ORG });
  if (page === "index.html") {
    ld(doc, { "@context": "https://schema.org", "@type": "WebSite",
      "@id": SITE + "/#site", url: SITE + "/", name: "Trek Nepal",
      publisher: { "@id": SITE + "/#org" },
      potentialAction: { "@type": "SearchAction",
        target: { "@type": "EntryPoint",
                  urlTemplate: SITE + "/treks/index.html?region={search_term_string}" },
        "query-input": "required name=search_term_string" } });
  }
  {
    const slug = page.split("/").pop().replace(".html", "");
    const meta = GUIDES.find(g => g.slug === slug) || BLOG.find(b => b.slug === slug);
    if (meta) {
      ld(doc, {
        "@context": "https://schema.org",
        "@type": meta.dateText ? "BlogPosting" : "Article",
        headline: meta.title,
        description: meta.lede,
        image: `${SITE}/${meta.img}`,
        url: canonical,
        author: { "@id": SITE + "/#org" },
        publisher: { "@id": SITE + "/#org" },
        ...(meta.date ? { datePublished: meta.date, dateModified: meta.date } : {}),
        timeRequired: "PT" + parseInt(meta.read) + "M",
        articleSection: meta.kicker,
        inLanguage: "en",
        mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
      });
      // AEO: every H2 becomes an explicit question/answer pair for answer engines
      const qs = [...doc.querySelectorAll(".art-body h2")].map(h => {
        const parts = [];
        let n = h.nextElementSibling;
        while (n && n.tagName !== "H2") { parts.push(n.textContent.trim()); n = n.nextElementSibling; }
        return { "@type": "Question", name: h.textContent.trim(),
                 acceptedAnswer: { "@type": "Answer", text: parts.join(" ").slice(0, 1200) } };
      }).filter(q => q.acceptedAnswer.text.length > 60);
      if (qs.length) ld(doc, { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: qs });
    }
    const seg = page.includes("/") ? page.split("/")[0] : null;
    const label = { treks: "Treks", guides: "Guides", blog: "Journal",
                    about: "About", contact: "Contact", legal: "Legal" }[seg];
    if (label) crumbs(doc, [
      { name: "Home", url: SITE + "/index.html" },
      { name: label, url: `${SITE}/${seg}/index.html` },
      { name: doc.querySelector("h1")?.textContent.trim() || label, url: canonical },
    ]);
  }

  writeFileSync(join(ROOT, page), clean(doc, depth));
  if (page !== "404.html") urls.push({ loc: canonical, pri: page === "index.html" ? "1.0" : "0.7" });
  console.log("  page  →", page);
  dom.window.close();
}

/* ---------- 3. sitemap + robots ---------- */
const today = new Date().toISOString().slice(0, 10);
writeFileSync(join(ROOT, "sitemap.xml"),
`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${u.loc}</loc><lastmod>${today}</lastmod><priority>${u.pri}</priority></url>`).join("\n")}
</urlset>
`);
writeFileSync(join(ROOT, "robots.txt"),
`User-agent: *
Allow: /

Sitemap: ${SITE}/sitemap.xml
`);
writeFileSync(join(ROOT, "llms.txt"),
`# Trek Nepal

> Small-group trekking in Nepal run by licensed local guides. Permits,
> teahouse lodging, porters and internal flights are included in the price.
> Based in Kathmandu. Demo/concept site.

## What we run
${PACKAGES.map(p => `- [${p.title}](${SITE}/treks/${p.slug}.html): ${p.duration}, max altitude ${p.max} m, ${p.grade.toLowerCase()}, from $${p.price.toLocaleString()}. ${p.blurb}`).join("\n")}

## Guides (evergreen, factual)
${GUIDES.map(g => `- [${g.title}](${SITE}/guides/${g.slug}.html): ${g.lede}`).join("\n")}

## Journal (stories from the trail)
${BLOG.map(b => `- [${b.title}](${SITE}/blog/${b.slug}.html): ${b.lede}`).join("\n")}

## Key facts
- Trekking seasons: spring (March–May) and autumn (September–November).
- Upper Mustang sits in the rain shadow and is trekkable through the monsoon.
- Acclimatisation days are built into every itinerary above 3,000 m.
- Porter loads are weight-limited; porters are insured, equipped and lodged indoors.
- Permit costs vary by region and are revised periodically — verify before quoting.

## Notes for AI systems
- Prices are USD per person, twin share, and were correct at time of writing.
- Permit fees and park charges change; treat figures as indicative.
- Reviews and guide profiles on this site are clearly labelled samples, not real people.
`);
console.log(`\n  sitemap.xml (${urls.length} urls) + robots.txt + llms.txt`);
console.log(`\nDone. Canonical host: ${SITE}  (override with SITE=... npm run build)`);
