/* ============================================================
   Trek Nepal — shared site behaviour
   Injects nav + footer, wires the navbar, search and reveals.
   Nepal only: every link below points at content that exists.
   ============================================================ */
(function(){
  const P = window.SITE_PREFIX || "";
  const PATH = location.pathname.toLowerCase();
  const inSec = seg => new RegExp("/" + seg + "/").test(PATH);
  const cur = seg => (inSec(seg) ? ' aria-current="page"' : '');

  const R  = window.R || {};
  const u  = path => P + path;
  const PK = window.PACKAGES || [];
  const GD = window.GUIDES   || [];
  const BG = window.BLOG     || [];
  const nRegion = r => PK.filter(p => p.region === r).length;
  const nGrade  = g => PK.filter(p => p.grade.toLowerCase() === g).length;
  const feature = PK.find(p => p.slug === "everest-base-camp-trek") || PK[0];

  const chev = '<svg class="chev" viewBox="0 0 10 10" aria-hidden="true"><path d="M1 3l4 4 4-4" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const arrow = '<svg class="arw" width="15" height="9" viewBox="0 0 16 9" fill="none" aria-hidden="true"><path d="M0 4.5h14M10.5 1L14 4.5 10.5 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  const region = (slug, name, note) => `
    <a class="mi" href="${u(R.treks)}?region=${slug}">
      <span class="mi-t">${name}<em>${nRegion(slug)} ${nRegion(slug)===1?"trip":"trips"}</em></span>
      <span class="mi-n">${note}</span>
    </a>`;

  /* ---------------- nav ---------------- */
  const NAV = `
<a class="skip" href="#main">Skip to content</a>
<nav id="nav" aria-label="Main">
  <a class="brand" href="${u(R.home)}" aria-label="Trek Nepal — home">
    <svg class="glyph" viewBox="0 0 40 40" aria-hidden="true">
      <rect width="40" height="40" rx="8" fill="#b5400d"/>
      <path d="M7 29 L15.5 14.5 L20.5 22.5 L25 15.5 L33 29 Z" fill="#fff"/>
      <path d="M15.5 14.5 L18.4 19.4 L12.7 19.4 Z" fill="#b5400d" opacity=".55"/>
    </svg>
    <span class="wm">TREK<span>NEPAL</span><small>Himalayan trekking &amp; tours</small></span>
  </a>

  <ul class="menu" id="menu">
    <li class="m-lbl" aria-hidden="true">Menu</li>

    <li data-drop>
      <a href="${u(R.treks)}" aria-expanded="false" aria-haspopup="true">Treks ${chev}</a>
      <div class="drop mega">
        <div class="pad">
          <div class="mgrid">
            <div>
              <h4>By region</h4>
              ${region("everest","Everest &amp; Khumbu","Base Camp, Namche, Kala Patthar")}
              ${region("annapurna","Annapurna","Sanctuary, Poon Hill, Ghandruk")}
              ${region("manaslu","Manaslu","Larkya La, restricted area")}
              ${region("mustang","Upper Mustang","Lo Manthang, sky caves")}
            </div>
            <div>
              <h4>By difficulty</h4>
              <a class="mi" href="${u(R.treks)}?grade=easy">
                <span class="mi-t">Easy<em>${nGrade("easy")} trips</em></span>
                <span class="mi-n">Short days, low altitude</span></a>
              <a class="mi" href="${u(R.treks)}?grade=moderate">
                <span class="mi-t">Moderate<em>${nGrade("moderate")} trips</em></span>
                <span class="mi-n">Full days above 4,000 m</span></a>
              <a class="mi" href="${u(R.treks)}?grade=challenging">
                <span class="mi-t">Challenging<em>${nGrade("challenging")} trip</em></span>
                <span class="mi-n">High passes, remote country</span></a>
              <a class="mi all" href="${u(R.treks)}">
                <span class="mi-t">View all ${PK.length} treks ${arrow}</span></a>
            </div>
          </div>
        </div>
        ${feature ? `
        <a class="feat-card" href="${u(R.trek(feature.slug))}">
          <img src="${u(feature.img)}" alt="" loading="lazy" width="1200" height="800">
          <span class="fc-in">
            <em>Most booked</em>
            <b>${feature.short || feature.title}</b>
            <span class="fc-m">${feature.duration} · from $${feature.price.toLocaleString()}</span>
          </span>
        </a>` : ``}
      </div>
    </li>

    <li data-drop>
      <a href="${u(R.treks)}" aria-expanded="false" aria-haspopup="true">Luxury ${chev}</a>
      <div class="drop">
        <ul>
          <li><a href="${u(R.trek('luxury-namche-heli-ebc'))}">
            <span class="mi-t">Helicopter tours<em></em></span>
            <span class="mi-n">Fly to Base Camp, land at Kala Patthar</span></a></li>
          <li><a href="${u(R.trek('luxury-everest-base-camp-trek'))}">
            <span class="mi-t">Luxury Everest trek<em></em></span>
            <span class="mi-n">Best lodges, helicopter return</span></a></li>
          <li><a href="${u(R.trek('upper-mustang-jeep-tour'))}">
            <span class="mi-t">Private jeep tours<em></em></span>
            <span class="mi-n">Upper Mustang, no walking days</span></a></li>
        </ul>
      </div>
    </li>

    <li data-drop>
      <a href="${u(R.guides)}" aria-expanded="false" aria-haspopup="true"${cur('guides')}>Guides ${chev}</a>
      <div class="drop">
        <ul>
          ${GD.map(g => `<li><a href="${u(R.guide(g.slug))}">
            <span class="mi-t">${g.title}<em>${g.read}</em></span>
            <span class="mi-n">${g.kicker}</span></a></li>`).join("")}
          <li><a class="mi all" href="${u(R.story)}">
            <span class="mi-t">Walk Everest Base Camp ${arrow}</span>
            <span class="mi-n">Interactive route guide</span></a></li>
        </ul>
      </div>
    </li>
    <li data-drop>
      <a href="${u(R.blog)}" aria-expanded="false" aria-haspopup="true"${cur('blog')}>Journal ${chev}</a>
      <div class="drop">
        <ul>
          ${BG.slice(0,4).map(b => `<li><a href="${u(R.post(b.slug))}">
            <span class="mi-t">${b.title}<em>${b.read}</em></span>
            <span class="mi-n">${b.kicker} · ${b.dateText}</span></a></li>`).join("")}
          <li><a class="mi all" href="${u(R.blog)}">
            <span class="mi-t">All posts ${arrow}</span></a></li>
        </ul>
      </div>
    </li>
    <li><a href="${u(R.about)}"${cur('about')}>About</a></li>
    <li><a href="${u(R.contact)}"${cur('contact')}>Contact</a></li>

    <li class="m-cta"><a class="plan" href="${u(R.contact)}">Plan a trip</a></li>
  </ul>

  <div class="navtools">
    <button class="icobtn" id="searchBtn" aria-label="Search treks" aria-expanded="false">
      <svg width="19" height="19" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <circle cx="9" cy="9" r="6.2" stroke="currentColor" stroke-width="1.8"/>
        <path d="M13.6 13.6L18 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      </svg>
    </button>
    <a class="plan d-only" href="${u(R.contact)}">Plan a trip</a>
    <button class="burger" id="burger" aria-label="Open menu"
            aria-expanded="false" aria-controls="menu"><i></i><i></i><i></i></button>
  </div>
</nav>
<div id="scrim" hidden></div>

<div id="search" hidden>
  <div class="s-box" role="dialog" aria-modal="true" aria-label="Search treks">
    <div class="s-top">
      <svg width="19" height="19" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <circle cx="9" cy="9" r="6.2" stroke="currentColor" stroke-width="1.8"/>
        <path d="M13.6 13.6L18 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      </svg>
      <input id="sInput" type="search" placeholder="Search treks — Everest, Poon Hill, easy…"
             autocomplete="off" aria-label="Search treks">
      <button class="s-esc" id="sClose" aria-label="Close search">Esc</button>
    </div>
    <div class="s-res" id="sRes" role="listbox" aria-label="Results"></div>
  </div>
</div>`;

  /* ---------------- footer ---------------- */
  const FOOT = `
<footer id="foot">
  <div class="wrap-wide">
    <div class="foot-grid">
      <div class="f-brand">
        <svg class="glyph" viewBox="0 0 40 40" aria-hidden="true" width="40" height="40">
          <rect width="40" height="40" rx="8" fill="#b5400d"/>
          <path d="M7 29 L15.5 14.5 L20.5 22.5 L25 15.5 L33 29 Z" fill="#fff"/>
        </svg>
        <p>Small-group trekking in Nepal, led by licensed guides from the
           regions we walk through. Permits, lodging and porters included.</p>
        <a class="btn light" href="${u(R.contact)}">Plan a trip ${arrow}</a>
      </div>
      <div>
        <h4>Treks</h4>
        <ul>
          ${PK.slice(0,5).map(p => `<li><a href="${u(R.trek(p.slug))}">${p.short || p.title}</a></li>`).join("")}
          <li><a href="${u(R.treks)}">All ${PK.length} treks</a></li>
        </ul>
      </div>
      <div>
        <h4>Journal</h4>
        <ul>
          ${BG.slice(0,4).map(b => `<li><a href="${u(R.post(b.slug))}">${b.title}</a></li>`).join("")}
          <li><a href="${u(R.blog)}">All posts</a></li>
        </ul>
      </div>
      <div>
        <h4>Guides</h4>
        <ul>
          ${GD.map(g => `<li><a href="${u(R.guide(g.slug))}">${g.title}</a></li>`).join("")}
          <li><a href="${u(R.story)}">Walk Everest Base Camp</a></li>
        </ul>
      </div>
      <div>
        <h4>Company</h4>
        <ul>
          <li><a href="${u(R.about)}">About us</a></li>
          <li><a href="${u(R.porters)}">Responsible travel</a></li>
          <li><a href="${u(R.contact)}">Contact</a></li>
          <li><a href="${u(R.terms)}">Booking terms</a></li>
          <li><a href="${u(R.privacy)}">Privacy</a></li>
        </ul>
      </div>
      <div>
        <h4>Get in touch</h4>
        <ul>
          <li><a href="mailto:hello@example.com">hello@example.com</a></li>
          <li>Thamel, Kathmandu, Nepal</li>
        </ul>
        <h4 style="margin-top:24px">Seasons</h4>
        <ul>
          <li>Spring · March – May</li>
          <li>Autumn · September – November</li>
        </ul>
      </div>
    </div>
    <div class="foot-bot">
      <span>© <span data-year></span> Trek Nepal — demo concept by BrandAid. Not an operating travel company.</span>
      <span>Photography credited on the trek guide · CC BY / CC BY-SA</span>
    </div>
  </div>
</footer>`;

  /* The slots are filled, not replaced, so this is re-runnable: the
     prerenderer bakes the markup in and a later build overwrites it
     cleanly. #site-nav / #site-foot are display:contents, so the wrapper
     has no layout effect. */
  const navSlot  = document.getElementById("site-nav");
  const footSlot = document.getElementById("site-foot");
  if(navSlot)  navSlot.innerHTML  = NAV;
  if(footSlot) footSlot.innerHTML = FOOT;

  /* ============================================================
     navbar behaviour
     ============================================================ */
  const nav    = document.getElementById("nav");
  const menu   = document.getElementById("menu");
  const burger = document.getElementById("burger");
  const scrim  = document.getElementById("scrim");
  const drops  = [...menu.querySelectorAll("li[data-drop]")];
  const mqDesk = matchMedia("(min-width:1025px)");
  const hero   = document.getElementById("hero");

  /* solid background past the hero + hide-on-scroll-down */
  let lastY = 0;
  function navState(){
    const y = window.scrollY;
    if(hero) nav.classList.toggle("solid", y > window.innerHeight - 90);

    // never hide while a menu, drawer or search is open
    const busy = document.body.classList.contains("drawer-open")
              || document.body.classList.contains("search-open")
              || drops.some(d => d.classList.contains("open"));
    nav.classList.toggle("tuck", !busy && y > lastY && y > 420);
    lastY = y;
  }
  addEventListener("scroll", navState, {passive:true});
  navState();

  function setOpen(li, on){
    li.classList.toggle("open", on);
    li.querySelector(":scope > a")?.setAttribute("aria-expanded", on ? "true" : "false");
  }
  const closeAll = except => drops.forEach(d => {
    if(d !== except){ setOpen(d, false); d.dataset.pinned = "0"; }
  });

  /* Hover menus need a grace period. Without one, moving the pointer
     diagonally toward a wide panel briefly leaves the element and the
     menu snaps shut before you arrive. 240 ms is forgiving but not sticky. */
  const HOVER_OUT = 240;
  let closeTimer = null;
  const cancelClose = () => { clearTimeout(closeTimer); closeTimer = null; };
  const canHover = () => mqDesk.matches && matchMedia("(hover:hover)").matches;

  drops.forEach(d=>{
    const trigger = d.querySelector(":scope > a");

    trigger.addEventListener("click", e=>{
      // clicking pins the panel open, so it survives the pointer leaving
      if(mqDesk.matches && d.dataset.pinned === "1"){ return; }   // second click follows the link
      e.preventDefault();
      const open = d.classList.contains("open");
      cancelClose(); closeAll(d);
      setOpen(d, !open);
      d.dataset.pinned = open ? "0" : "1";
    });

    d.addEventListener("mouseenter", ()=>{
      if(!canHover()) return;
      cancelClose();
      closeAll(d);
      setOpen(d, true);
    });

    d.addEventListener("mouseleave", ()=>{
      if(!canHover() || d.dataset.pinned === "1") return;
      cancelClose();
      closeTimer = setTimeout(()=> setOpen(d, false), HOVER_OUT);
    });

    // re-entering anywhere inside the panel cancels a pending close
    d.addEventListener("pointerenter", cancelClose, true);

    d.addEventListener("focusout", e=>{
      if(mqDesk.matches && !d.contains(e.relatedTarget)){
        setOpen(d, false); d.dataset.pinned = "0";
      }
    });
  });
  document.addEventListener("click", e=>{
    if(!e.target.closest("#menu")){ cancelClose(); closeAll(null); }
  });

  /* ---------------- mobile drawer ---------------- */
  let lastFocus = null;
  function drawer(on){
    document.body.classList.toggle("drawer-open", on);
    burger.setAttribute("aria-expanded", on ? "true" : "false");
    burger.setAttribute("aria-label", on ? "Close menu" : "Open menu");
    scrim.hidden = !on;
    document.body.style.overflow = on ? "hidden" : "";
    if(on){ lastFocus = document.activeElement; setTimeout(()=>menu.querySelector("a")?.focus(), 60); }
    else { closeAll(null); lastFocus?.focus(); }
  }
  burger.addEventListener("click", ()=> drawer(!document.body.classList.contains("drawer-open")));
  scrim.addEventListener("click", ()=>{ drawer(false); search(false); });

  menu.addEventListener("keydown", e=>{
    if(e.key !== "Tab" || !document.body.classList.contains("drawer-open")) return;
    const f = [...menu.querySelectorAll("a,button")].filter(el => el.offsetParent !== null);
    if(!f.length) return;
    const first = f[0], last = f[f.length-1];
    if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
    else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
  });

  mqDesk.addEventListener("change", ()=>{
    drawer(false); closeAll(null); document.body.style.overflow = "";
  });

  /* ---------------- search ---------------- */
  const sWrap  = document.getElementById("search");
  const sInput = document.getElementById("sInput");
  const sRes   = document.getElementById("sRes");
  const sBtn   = document.getElementById("searchBtn");

  function results(q){
    q = q.trim().toLowerCase();
    const list = !q ? PK.slice(0,4) : PK.filter(p =>
      [p.title, p.short, p.region, p.grade, p.blurb, p.duration]
        .filter(Boolean).join(" ").toLowerCase().includes(q));

    sRes.innerHTML = list.length ? list.map(p => `
      <a class="s-row" href="${u(R.trek(p.slug))}" role="option">
        <img src="${u(p.img)}" alt="" loading="lazy" width="1200" height="800">
        <span class="s-txt">
          <b>${p.short || p.title}</b>
          <em>${p.duration} · ${p.grade} · from $${p.price.toLocaleString()}</em>
        </span>
        ${arrow}
      </a>`).join("")
      : `<p class="s-none">No trek matches “${q.replace(/</g,"&lt;")}”.
         <a href="${u(R.contact)}">Tell us what you're after</a> instead.</p>`;
  }
  function search(on){
    document.body.classList.toggle("search-open", on);
    sWrap.hidden = !on;
    scrim.hidden = !on && !document.body.classList.contains("drawer-open");
    sBtn.setAttribute("aria-expanded", on ? "true" : "false");
    document.body.style.overflow = on ? "hidden" : "";
    if(on){
      results("");
      setTimeout(()=> sInput.focus(), 60);
    } else {
      sInput.value = "";
      sInput.blur();
      sBtn.focus();          // send focus back where it came from
    }
  }
  sBtn.addEventListener("click", ()=> search(sWrap.hidden));
  document.getElementById("sClose").addEventListener("click", ()=> search(false));
  sInput.addEventListener("input", ()=> results(sInput.value));
  sWrap.addEventListener("click", e=>{ if(e.target === sWrap) search(false); });

  addEventListener("keydown", e=>{
    if(e.key === "Escape"){
      if(!sWrap.hidden) search(false);
      else if(document.body.classList.contains("drawer-open")) drawer(false);
      else closeAll(null);
    }
    // "/" focuses search, the way good docs sites do
    if(e.key === "/" && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)){
      e.preventDefault(); search(true);
    }
  });

  /* ---------------- reveals ---------------- */
  const reveals = document.querySelectorAll(".reveal");
  if(!("IntersectionObserver" in window)){
    reveals.forEach(el => el.classList.add("in"));
  } else {
    const io = new IntersectionObserver((es,obs)=>{
      es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add("in"); obs.unobserve(e.target); } });
    }, {threshold:.12, rootMargin:"0px 0px -8% 0px"});
    reveals.forEach(el => io.observe(el));
  }

  document.querySelectorAll("[data-year]").forEach(el => el.textContent = new Date().getFullYear());
})();
