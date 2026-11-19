/* Pumbloo Interactive site script.
   EDIT HERE: the only settings you normally change. */
const PUMBLOO = {
  // Google Analytics 4 id, e.g. "G-XXXXXXX". Leave empty = no analytics at all.
  // Even when filled, it only loads after the visitor clicks "Accept" on the cookie banner.
  analyticsId: "G-TBQXG5L19V",
  contactEmail: "hello@pumbloo.com",
  snow: false
};

{
  const KEY = "pumbloo-consent";
  const VERSION = 1;
  const store = {
    get(){ try { const v = JSON.parse(localStorage.getItem(KEY)); return v && v.v === VERSION ? v : null; } catch(e){ return null; } },
    set(c){ try { localStorage.setItem(KEY, JSON.stringify({ v: VERSION, ...c, date: new Date().toISOString() })); } catch(e){} },
    clear(){ try { localStorage.removeItem(KEY); localStorage.removeItem("pumbloo-motion"); } catch(e){} }
  };

  /* ---------- analytics, only after consent ---------- */
  let analyticsLoaded = false;
  function loadAnalytics(){
    if (analyticsLoaded || !PUMBLOO.analyticsId) return;
    analyticsLoaded = true;
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(PUMBLOO.analyticsId);
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function(){ dataLayer.push(arguments); };
    gtag("js", new Date());
    gtag("config", PUMBLOO.analyticsId, { anonymize_ip: true, allow_google_signals: false, allow_ad_personalization_signals: false });
  }

  /* ---------- third-party embeds, only after a click or consent ---------- */
  function loadEmbed(box){
    const id = box.dataset.youtube;
    if (!id || box.querySelector("iframe")) return;
    const f = document.createElement("iframe");
    f.src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(id) + "?rel=0";
    f.title = box.dataset.title || "YouTube video";
    f.allow = "accelerometer; encrypted-media; gyroscope; picture-in-picture";
    f.allowFullscreen = true;
    f.loading = "lazy";
    box.innerHTML = "";
    box.appendChild(f);
  }
  function applyConsent(c){
    if (!c) return;
    if (c.analytics) loadAnalytics();
    if (c.embeds) document.querySelectorAll(".embed[data-youtube]").forEach(loadEmbed);
  }
  document.querySelectorAll(".embed[data-youtube] .load").forEach(b => b.addEventListener("click", () => loadEmbed(b.closest(".embed"))));

  /* ---------- cookie banner ---------- */
  const banner = document.getElementById("cookie");
  function openBanner(){
    if (!banner) return;
    const c = store.get() || {};
    banner.querySelector("#c-analytics").checked = !!c.analytics;
    banner.querySelector("#c-embeds").checked = !!c.embeds;
    banner.hidden = false;
    banner.querySelector(".opts").hidden = false; banner.querySelector("[data-save]").hidden = false; banner.querySelector("[data-choose]").hidden = true;
    banner.querySelector("h2").focus();
  }
  function closeBanner(c){
    store.set(c); applyConsent(c);
    banner.hidden = true;
    const s = document.getElementById("consent-status");
    if (s) s.textContent = describe(c);
  }
  function describe(c){
    if (!c) return "You haven't made a choice yet.";
    return "Analytics: " + (c.analytics ? "allowed" : "off") + ". Video embeds: " + (c.embeds ? "allowed" : "off") + ". Saved " + new Date(c.date || Date.now()).toLocaleDateString() + ".";
  }
  if (banner){
    banner.querySelector("[data-accept]").addEventListener("click", () => closeBanner({ analytics: true, embeds: true }));
    banner.querySelector("[data-reject]").addEventListener("click", () => closeBanner({ analytics: false, embeds: false }));
    banner.querySelector("[data-choose]").addEventListener("click", e => {
      banner.querySelector(".opts").hidden = false; banner.querySelector("[data-save]").hidden = false;
      e.currentTarget.hidden = true; banner.querySelector("#c-analytics").focus(); });
    banner.querySelector("[data-save]").addEventListener("click", () => closeBanner({
      analytics: banner.querySelector("#c-analytics").checked,
      embeds: banner.querySelector("#c-embeds").checked }));
    banner.addEventListener("keydown", e => { if (e.key === "Escape" && store.get()) banner.hidden = true; });
    const c = store.get();
    if (c) applyConsent(c); else banner.hidden = false;
  }
  document.querySelectorAll("[data-cookie-settings]").forEach(b => b.addEventListener("click", openBanner));
  const cs = document.getElementById("consent-status");
  if (cs) cs.textContent = describe(store.get());
  const wipe = document.getElementById("wipe-local");
  if (wipe) wipe.addEventListener("click", () => {
    store.clear();
    document.getElementById("wipe-status").textContent = "Done. Everything this site saved in your browser has been deleted. Reload the page to see the cookie banner again.";
    if (cs) cs.textContent = describe(null);
  });

  /* ---------- mobile menu ---------- */
  const menu = document.querySelector(".menu"), nav = document.getElementById("nav");
  if (menu && nav) menu.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    menu.setAttribute("aria-expanded", open);
  });

  /* ---------- footer year ---------- */
  document.querySelectorAll(".yr").forEach(e => e.textContent = new Date().getFullYear());

  /* ---------- eyes follow the pointer ---------- */
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const eyes = [...document.querySelectorAll(".eye")];
  if (eyes.length && !reduce){
    const look = (x, y) => { for (const e of eyes){
      const r = e.getBoundingClientRect(), cx = r.left + r.width/2, cy = r.top + r.height/2;
      const a = Math.atan2(y - cy, x - cx), d = Math.min(1, Math.hypot(x - cx, y - cy)/300) * 44;
      e.querySelector(".pupil").style.transform = `translate(${Math.cos(a)*d}px,${Math.sin(a)*d}px)`; } };
    addEventListener("pointermove", ev => look(ev.clientX, ev.clientY), { passive: true });
  }

  /* ---------- snowfall with depth ---------- */
  const cv = document.getElementById("snow");
  const vid = document.getElementById("bgvid");
  const toggle = document.getElementById("motion");
  let paused = reduce;

  if (cv && PUMBLOO.snow){
    const ctx = cv.getContext("2d");
    let W = 0, H = 0, dpr = 1, flakes = [], raf = 0, last = 0, t = 0;
    const sprite = (r, warm) => {
      const s = document.createElement("canvas"), n = Math.ceil(r*2 + 4);
      s.width = s.height = n; const g = s.getContext("2d");
      const grd = g.createRadialGradient(n/2, n/2, 0, n/2, n/2, n/2);
      const col = warm ? "255,228,190" : "245,250,255";
      grd.addColorStop(0, `rgba(${col},1)`); grd.addColorStop(.45, `rgba(${col},.85)`); grd.addColorStop(1, `rgba(${col},0)`);
      g.fillStyle = grd; g.fillRect(0, 0, n, n); return s;
    };
    const cold = sprite(16, false), warm = sprite(16, true);
    function make(randomY){
      const z = Math.random() ** 1.6;            // most flakes far away, a few close
      return {
        x: Math.random() * W, y: randomY ? Math.random() * H : -20 - Math.random()*80,
        z, r: 0.6 + z*z*5.5,                       // far = tiny, near = big
        vy: 18 + z*95, sway: 6 + z*28, ph: Math.random()*6.28, fr: .4 + Math.random()*.8,
        a: .35 + z*.6
      };
    }
    function size(){
      dpr = Math.min(devicePixelRatio || 1, 2);
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = W*dpr; cv.height = H*dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const target = Math.round(Math.min(420, W*H/4200));
      while (flakes.length < target) flakes.push(make(true));
      flakes.length = target;
      flakes.sort((a, b) => a.z - b.z);
      if (paused) draw(0);
    }
    function draw(dt){
      t += dt;
      const wind = 14 + Math.sin(t*.23)*18 + Math.sin(t*.07)*10;
      const fx = W*.7, fy = H*.75, fr2 = (Math.min(W, H)*.45)**2;
      ctx.clearRect(0, 0, W, H);
      for (const f of flakes){
        f.y += f.vy*dt; f.x += (wind*(.3 + f.z) + Math.sin(t*f.fr + f.ph)*f.sway)*dt;
        if (f.y > H + 20){ Object.assign(f, make(false)); }
        if (f.x > W + 20) f.x -= W + 40; else if (f.x < -20) f.x += W + 40;
        const d2 = (f.x - fx)**2 + (f.y - fy)**2;
        const img = d2 < fr2 ? warm : cold;
        const blur = f.z > .75 ? 1.8 : 1;          // near flakes are softer and bigger
        const s = f.r*2*blur;
        ctx.globalAlpha = f.z > .75 ? f.a*.55 : f.a;
        ctx.drawImage(img, f.x - s/2, f.y - s/2, s, s);
      }
      ctx.globalAlpha = 1;
    }
    function loop(now){
      const dt = Math.min(.05, (now - (last || now))/1000); last = now;
      draw(dt); raf = requestAnimationFrame(loop);
    }
    function play(){ if (!raf && !paused && !document.hidden){ last = 0; raf = requestAnimationFrame(loop); } }
    function stop(){ cancelAnimationFrame(raf); raf = 0; }
    new ResizeObserver(size).observe(cv);
    document.addEventListener("visibilitychange", () => document.hidden ? stop() : play());
    function setPaused(p){
      paused = p;
      document.documentElement.classList.toggle("paused", p);
      if (vid){ if (p) vid.pause(); else vid.play().catch(()=>{}); }
      if (toggle){ toggle.setAttribute("aria-pressed", p); toggle.querySelector("span").textContent = p ? "Play animation" : "Pause animation"; }
      p ? stop() : play();
      if (p) draw(0);
    }
    if (toggle) toggle.addEventListener("click", () => {
      setPaused(!paused);
      try { localStorage.setItem("pumbloo-motion", paused ? "off" : "on"); } catch(e){}
    });
    size(); setPaused(paused);
  }

  /* ---------- accessible form validation ---------- */
  function validate(form){
    let first = null;
    form.querySelectorAll("[required]").forEach(el => {
      const err = document.getElementById(el.id + "-err");
      let msg = "";
      if (el.type === "checkbox" && !el.checked) msg = "Please tick this box to continue.";
      else if (el.type !== "checkbox" && !el.value.trim()) msg = "This field is required.";
      else if (el.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim())) msg = "Please enter an email like name@example.com.";
      else if (el.minLength > 0 && el.value.length < el.minLength) msg = `Please use at least ${el.minLength} characters.`;
      el.setAttribute("aria-invalid", msg ? "true" : "false");
      if (err) err.textContent = msg;
      if (msg && !first) first = el;
    });
    if (first) first.focus();
    return !first;
  }

  /* support form: opens the visitor's email app. Nothing is sent to or stored by this website. */
  const sf = document.getElementById("support-form");
  if (sf) sf.addEventListener("submit", e => {
    e.preventDefault();
    if (!validate(sf)) return;
    const v = id => sf.querySelector("#" + id).value.trim();
    const subject = `[${v("topic")}] ${v("name")}`;
    const body = `${v("message")}\n\n---\nName: ${v("name")}\nReply to: ${v("email")}\nTopic: ${v("topic")}`;
    location.href = `mailto:${PUMBLOO.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    document.getElementById("support-status").textContent = `Your email app should open with the message ready. Press Send there. If nothing opened, email us at ${PUMBLOO.contactEmail}.`;
  });

  /* account page: accounts are not open yet, so nothing is sent or saved */
  const tabs = [...document.querySelectorAll('[role=tab]')];
  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => select(i));
    tab.addEventListener("keydown", e => {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft"){
        const n = (i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length; select(n); tabs[n].focus();
      }
    });
  });
  function select(i){
    tabs.forEach((t, k) => {
      t.setAttribute("aria-selected", k === i); t.tabIndex = k === i ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = k !== i;
    });
  }
  document.querySelectorAll("form[data-preview]").forEach(f => f.addEventListener("submit", e => {
    e.preventDefault();
    if (!validate(f)) return;
    f.reset();
    const s = f.querySelector(".status");
    s.textContent = "Thanks! Pumbloo accounts open together with our first game. Nothing you typed was sent or saved. Follow us on Discord or YouTube to hear when sign-ups open.";
    s.focus();
  }));
}
