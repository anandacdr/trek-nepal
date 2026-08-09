# Trek Nepal — trekking site demo

A static, multi-page demo site for a Nepali trekking operator. No build step, no
dependencies, no framework. Open `index.html` and it runs.

Built as a pitch piece: the headline feature is `treks/everest-base-camp.html`,
an interactive scroll-driven climb from Lukla (2,860 m) to Base Camp (5,364 m).

---

## Folder structure

```
Trekking Website/
├── index.html                      Home
├── 404.html
│
├── treks/
│   ├── index.html                  Listing + filters + comparison table
│   ├── <slug>.html   × 7           GENERATED — one real page per trek
│   ├── _template.html              Source for the generated pages (noindex)
│   ├── detail.html                 Redirect for legacy ?trek= links
│   └── everest-base-camp.html      Interactive scroll climb
│
├── blog/                           Field journal
│   ├── index.html
│   └── <slug>.html   × 4
│
├── guides/
│   ├── index.html
│   ├── altitude-and-acclimatisation.html
│   ├── packing-list.html
│   ├── best-time-to-trek.html
│   └── permits-and-costs.html
│
├── about/
│   ├── index.html
│   └── responsible-travel.html
│
├── contact/index.html              Enquiry form
├── legal/{terms,privacy}.html
│
├── assets/
│   ├── css/site.css                Tokens, nav, cards, articles, responsive
│   ├── js/
│   │   ├── data.js                 ← ALL content + the route map
│   │   └── site.js                 Nav/footer injection, drawer, search
│   ├── img/
│   │   ├── treks/                  Location photos (Wikimedia, CC)
│   │   ├── stills/                 Frames + parallax bands from the video
│   │   ├── people/                 Real human photography (CC, credited)
│   │   ├── posters/                Video poster frames
│   │   └── favicon.svg
│   └── video/
│       ├── hero-loop.mp4           16 s silent loop, 3 MB
│       └── everest-ascent.mp4      Full 4:01 film, 58 MB, click-to-play
│
├── tools/prerender.mjs             Build step (see below)
├── sitemap.xml · robots.txt        GENERATED
├── llms.txt                        GENERATED — for AI/answer engines
├── _source/media/                  NOT FOR UPLOAD — 105 MB master
├── package.json                    devDependency: jsdom (build only)
├── .gitignore
└── README.md
```

## The build step

The site runs with no build — open any page and the scripts assemble the nav,
footer and cards. But a crawler with JS off, and every social link unfurler,
would see an empty shell. So there is one optional build:

```bash
npm install          # jsdom, build-time only
npm run serve        # in one terminal
npm run prerender    # in another
```

It loads each page in jsdom, lets **the real site scripts** run, then writes the
resulting DOM back to disk. There is no second copy of any template —
`assets/js/{data,site}.js` remain the single source of truth.

It also generates one page per trek, so all seven get their own indexable URL,
title and description. Before this, every trek shared `detail.html?trek=<slug>`
and the raw HTML showed *"That trek doesn't exist."* to anything without JS.

**Re-runnable.** Nav/footer slots are filled rather than consumed, and the
render scripts rebuild rather than append, so running it repeatedly is a no-op.
The per-trek source is `treks/_template.html`, deliberately separate from the
public `detail.html` redirect, so a build can never read its own output.

Set your real domain before deploying, or canonical/og tags point at example.com:

```bash
SITE=https://yourdomain.com npm run prerender
```

**After editing `data.js`, `site.js` or any page, re-run the prerender** —
otherwise the baked HTML and the live scripts drift apart.

Sixteen pages. Every section is a folder with its own `index.html`, so new pages
drop in beside their siblings without touching anything else.

### `_source/` is excluded on purpose

It holds the 105 MB camera master. Everything the site serves is a compressed
derivative in `assets/`. `.gitignore` excludes it; deploying it would add 105 MB
of dead weight for no benefit.

---

## Two rules that keep this maintainable

**1. Paths are never hard-coded.** `assets/js/data.js` defines `window.R`:

```js
window.R = {
  home:   "index.html",
  treks:  "treks/index.html",
  trek:   slug => "treks/detail.html?trek=" + slug,
  guides: "guides/index.html",
  guide:  slug => "guides/" + slug + ".html",
  ...
};
```

Everything links through `url(R.something)`. Move a page, change one line here,
and the whole site follows — nav, footer, cards, search results.

**2. Pages in a subfolder declare their depth**, before loading the scripts:

```html
<script>window.SITE_PREFIX = "../";</script>
<script src="../assets/js/data.js"></script>
<script src="../assets/js/site.js"></script>
```

Omit it and every nav link on that page resolves one level too high. This is the
one real gotcha in the codebase.

## Editing content

**All seven packages live in one place: `assets/js/data.js`.**

Change a price, duration or itinerary there and it updates everywhere at once —
home page cards, the packages listing, the detail page, and the contact form's
trek dropdown. Nothing is hand-synced.

```js
{
  slug:"annapurna-base-camp-trek",   // becomes package.html?trek=<slug>
  title:"Annapurna Base Camp Trek",
  short:"…",                          // optional shorter card/heading title
  region:"annapurna",                 // drives the region filter
  grade:"Moderate",                   // Easy | Moderate | Challenging
  duration:"11 Days",
  price:830,
  img:"assets/img/treks/annapurna.jpg",
  story:"treks/everest-base-camp.html", // optional interactive page
  highlights:[…],
  itinerary:[ ["01","Kathmandu → Pokhara","820 m"], … ]
}
```

To add a trek: add an object to that array. It appears everywhere automatically.

**Guide articles** are listed in the same file under `window.GUIDES`, and the
article pages themselves live in `guides/`. Adding an entry puts it in the nav
dropdown, the guides index, the footer and the home-page teaser at once.

**Nav and footer** are injected by `assets/js/site.js` so they stay identical
across pages — edit them once in the `NAV` / `FOOT` templates.

---

## Adding a page

1. Copy `about/responsible-travel.html` as a starting point.
2. Keep `<div id="site-nav"></div>` and `<div id="site-foot"></div>`.
3. Load `assets/js/data.js` then `assets/js/site.js`.
4. **If the page is in a subfolder**, set the prefix *before* those scripts:

```html
<script>window.SITE_PREFIX = "../";</script>
```

Without it, every nav link and asset path on that page will point to the wrong
place. This is the one gotcha in the codebase.

---

## Before this goes live

- [ ] **Replace the video.** The current footage is DJI promotional material —
      fine for a demo, not licensed for a client's public site. Everything in
      `assets/img/stills/`, `assets/img/posters/` and `assets/video/` derives
      from it.
- [ ] **Keep the image credits.** Location photos are Wikimedia Commons under
      CC BY / CC BY-SA. Attribution is required and lives at the bottom of
      `treks/everest-base-camp.html`. Removing it breaks the licence.
- [ ] **Wire up the contact form.** It validates and confirms but sends nothing.
      Point it at Formspree, Netlify Forms or your own endpoint.
- [ ] **Swap the brand.** Placeholder wordmark "TREK NEPAL" — not a real company.
- [ ] Replace the three **sample guide profiles** on `about/index.html` with real
      names, photographs and NMA licence numbers. They use monogram avatars and
      carry a visible "Sample profile" chip so nothing reads as a real person.
- [ ] Replace the **sample reviews** on the home page. They are illustrative copy
      labelled "Sample" in the UI — publishing invented reviews as genuine is
      both dishonest and, in many markets, illegal.
- [ ] Check the home-page stats (years guiding, trekkers hosted) against reality.
- [ ] Add real `og:image` / social meta tags.
- [ ] **Rewrite `legal/privacy.html` and `legal/terms.html`.** Both are clearly
      marked demonstration text. Once a form endpoint or analytics is added the
      privacy page is no longer accurate, and booking terms need a real lawyer.
- [ ] Verify the permit fees in `guides/permits-and-costs.html` — they change,
      and the page says so, but a live site should carry current numbers.

---

## Deploying

Static — drop the folder on Netlify, Vercel, Cloudflare Pages or any host.
Exclude `_source/`.

Initial page weight is roughly **3.8 MB**, mostly the hero loop. The 58 MB
film uses `preload="none"`, so it only downloads if a visitor presses play.

## Search, answer engines and AI (SEO / AEO / GEO)

The prerender emits structured data from the same `data.js` content, so the
markup can never drift from what's on the page. **81 JSON-LD blocks, all valid:**

| Schema | Where | Why |
|---|---|---|
| `TravelAgency` | every page | entity identity for search + AI |
| `WebSite` + `SearchAction` | home | sitelinks search box |
| `TouristTrip` + `Offer` | each trek | price, duration, altitude, itinerary as rich results |
| `FAQPage` | treks, guides, blog | **AEO** — answer engines lift Q&A directly |
| `Article` / `BlogPosting` | guides, journal | authorship, dates, reading time |
| `BreadcrumbList` | all sections | hierarchy in results |

Also: canonical URLs, Open Graph + Twitter cards, sitemap.xml, robots.txt.

**AEO** — every `<h2>` in a guide or post is converted into an explicit
question/answer pair in `FAQPage` schema, because answer engines quote
Q&A structures far more readily than prose.

**GEO** — `llms.txt` gives generative engines a clean, factual summary: every
trek with duration, altitude, grade and price; what the guides cover; key facts
about seasons and permits. It also states plainly that reviews and guide
profiles are samples, and that permit fees change — so an AI quoting this site
doesn't present placeholder content or stale figures as fact.

## Testing

Three suites live in the scratchpad, run against a local server
(`python3 -m http.server 8777` from this folder):

| Suite | What it checks |
|---|---|
| `render-test.js` | All 16 pages load, nav/footer inject, no JS errors |
| `interact-test.js` | 53 checks — drawer, dropdowns, search, filters, form, guides |
| `responsive-audit.js` | Real Chrome at **11 widths (320px–2560px)**: overflow, tap targets, text size, broken images, layout shift |
| `contrast-audit.js` | WCAG AA contrast for every text node against its painted background |

Plus a manual check worth repeating after any build: load a page with
JavaScript disabled. Nav, footer and cards should all still be there.

The contrast audit exists because a white-on-white footer button shipped past
every other check — structural tests can't see colour. It computes the real
painted background for each text node and fails anything under AA (4.5:1, or
3:1 for large text), skipping elements that sit over photos or video.

The responsive audit is the useful one. It drives headless Chrome across
375/390/768/1024/1280/1600 px and fails on horizontal overflow, tap targets
under 36 px, text under 10 px, and images without intrinsic dimensions.

### Colour tokens are contrast-checked

`--muted`, `--ember` and `--gold` are set to the *lightest* values that still
pass AA on every paper background. If you adjust them, re-run the contrast
audit — several were originally a shade too light and failed against
`--paper-2`.

## Browser support

Modern evergreen browsers. Degrades safely: without `IntersectionObserver`
all content reveals immediately rather than staying hidden, and
`prefers-reduced-motion` disables animation throughout.
