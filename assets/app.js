(() => {
  "use strict";
  const D = window.DATA;
  const $ = (s, el = document) => el.querySelector(s);
  const view = $("#view");
  const byId = Object.fromEntries(D.videos.map(v => [v.id, v]));
  const seriesOf = Object.fromEntries(D.series.map(s => [s.k, s]));
  const listOf = k => D.videos.filter(v => v.s === k);
  const MAIN = D.series.filter(s => s.k !== "tarjama");

  /* ---------- أدوات ---------- */
  const nf = new Intl.NumberFormat("ar-SA");
  const n = x => nf.format(x);
  const ar = s => String(s).replace(/\d/g, d => "٠١٢٣٤٥٦٧٨٩"[d]);
  const esc = s => ar(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const clock = sec => { sec = Math.round(sec); const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60; return `<bdi dir="ltr">${ar((h ? h + ":" + String(m).padStart(2, "0") : m) + ":" + String(s).padStart(2, "0"))}</bdi>`; };
  const mins = sec => { const m = Math.max(1, Math.round(sec / 60)); return m >= 60 ? `${n(Math.floor(m / 60))} س ${m % 60 ? n(m % 60) + " د" : ""}` : `${n(m)} دقيقة`; };
  const thumb = (id, q = "mqdefault") => `https://i.ytimg.com/vi/${id}/${q}.jpg`;
  const norm = s => s.replace(/[ً-ٰٟـ]/g, "").replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/ؤ/g, "و").replace(/ئ/g, "ي").toLowerCase();
  const parts = v => { const len = v.d / v.n; return Array.from({ length: v.n }, (_, i) => ({ i, start: Math.floor(i * len), end: i === v.n - 1 ? v.d : Math.floor((i + 1) * len) })); };

  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem("rh:" + k)) ?? d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem("rh:" + k, JSON.stringify(v)); } catch { } }
  };
  const favs = () => store.get("fav", []);
  const isFav = id => favs().includes(id);
  const toggleFav = id => { const f = favs(); const i = f.indexOf(id); i < 0 ? f.unshift(id) : f.splice(i, 1); store.set("fav", f); return i < 0; };
  const seen = () => store.get("seen", {});           // {id: [partIndexes]}
  const markSeen = (id, p) => { const s = seen(); s[id] = [...new Set([...(s[id] || []), p])]; store.set("seen", s); };
  const history = () => store.get("hist", []);         // [{id,p,t}]
  const pushHist = (id, p) => { const h = history().filter(x => x.id !== id); h.unshift({ id, p, t: Date.now() }); store.set("hist", h.slice(0, 20)); };

  /* ---------- مكوّنات ---------- */
  const card = v => {
    const s = seen()[v.id]; const pct = s ? Math.round(s.length / v.n * 100) : 0;
    return `<a class="card fade" href="#/watch/${v.id}">
      <div class="thumb"><img loading="lazy" src="${thumb(v.id)}" alt="">
        <span class="dur">${clock(v.d)}</span>${v.n > 1 ? `<span class="parts">${n(v.n)} أجزاء</span>` : ""}
        ${pct ? `<i class="done" style="width:${pct}%"></i>` : ""}</div>
      <div class="card-body"><h3>${esc(v.t)}</h3><div class="meta">${esc(seriesOf[v.s].name)} · ${mins(v.d)}</div></div></a>`;
  };
  const row = (v, i) => `<a class="row fade" href="#/watch/${v.id}">
      <div class="thumb"><img loading="lazy" src="${thumb(v.id)}" alt=""><span class="dur">${clock(v.d)}</span></div>
      <div><h3>${esc(v.t)}</h3><div class="meta">${mins(v.d)}${v.n > 1 ? ` · مقسّم إلى ${n(v.n)} أجزاء` : ""}${seen()[v.id] ? " · ✓ شوهد" : ""}</div></div>
      <span class="num">${n(i + 1)}</span></a>`;
  const seriesCard = s => { const f = listOf(s.k)[0]; return `<a class="series-card fade" href="#/series/${s.k}" style="background-image:url('${thumb(f.id, "hqdefault")}')">
      <span class="count">${n(s.count)} مقطع</span><h3>${esc(s.name)}</h3><p>${esc(s.desc)}</p></a>`; };
  const footer = `<footer class="site"><svg class="emblem" viewBox="0 0 64 64"><use href="#star"/></svg>
      جميع المقاطع من <a href="${D.channel}" target="_blank" rel="noopener" style="color:var(--gold)">القناة الرسمية للشيخ د. راشد بن محمد بن فطيس الهاجري</a><br>«الدال على الخير كفاعله»<br><span style="display:inline-block;margin-top:10px;font-size:12.5px;opacity:.85">© جميع الحقوق محفوظة · إعداد: طلال سعود المهلهل</span></footer>`;
  const ICON = {
    play: '<svg viewBox="0 0 24 24"><path d="M7 4.5v15l12-7.5z" fill="currentColor" stroke="none"/></svg>',
    heart: '<svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-9.5-9.3C1.2 8.4 3.3 5 6.8 5c2 0 3.5 1.1 5.2 3 1.7-1.9 3.2-3 5.2-3 3.5 0 5.6 3.4 4.3 6.7C19.5 16.4 12 21 12 21z"/></svg>',
    heartOn: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 21s-7.5-4.6-9.5-9.3C1.2 8.4 3.3 5 6.8 5c2 0 3.5 1.1 5.2 3 1.7-1.9 3.2-3 5.2-3 3.5 0 5.6 3.4 4.3 6.7C19.5 16.4 12 21 12 21z"/></svg>',
    share: '<svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4"/></svg>',
    yt: '<svg viewBox="0 0 24 24"><rect x="2.5" y="5.5" width="19" height="13" rx="4"/><path d="m10 9.2 5 2.8-5 2.8z" fill="currentColor"/></svg>',
    next: '<svg viewBox="0 0 24 24"><path d="M15 6 9 12l6 6"/></svg>',
    share2: '<svg viewBox="0 0 24 24"><path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></svg>',
    dots: '<svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="19" r="1.4" fill="currentColor"/></svg>'
  };

  /* مقطع اليوم: ثابت لكل يوم */
  const pool = D.videos.filter(v => v.s !== "tarjama" && v.d >= 240);
  const today = pool[Math.floor(Date.now() / 864e5) * 7919 % pool.length];

  /* ---------- الصفحات ---------- */
  function home() {
    const h = history().filter(x => byId[x.id]);
    const picks = ["waqafat", "manabir", "majalis", "wasaya"].map(k => listOf(k)[0]);
    view.innerHTML = `
    <section class="hero fade">
      <span class="kicker">فضيلة الشيخ د. راشد بن محمد بن فطيس الهاجري</span>
      <h1>مواعظُ تُحيي القلوب،<br><span>وعِبَرٌ تبقى.</span></h1>
      <p>مكتبة مرئية تجمع دروسه ومحاضراته ووقفاته وخطبه في مكان واحد، وقسّمنا المحاضرات الطويلة إلى أجزاء قصيرة تُسمع في دقائق.</p>
      <div class="hero-actions">
        <a class="btn gold" href="#/watch/${today.id}">${ICON.play} ابدأ بمقطع اليوم</a>
        <a class="btn ghost" href="#/series">تصفّح السلاسل</a>
      </div>
      <div class="stats">
        <div class="stat"><b>${n(D.videos.length)}</b><span>مقطعاً مرئياً</span></div>
        <div class="stat"><b>${n(D.total_hours)}</b><span>ساعة من العلم</span></div>
        <div class="stat"><b>${n(D.parts)}</b><span>جزءاً قصيراً</span></div>
        <div class="stat"><b>${n(D.series.length)}</b><span>سلسلة وبرنامجاً</span></div>
      </div>
    </section>
    ${h.length ? `<section class="section"><div class="section-head"><h2>أكمل من حيث توقفت</h2></div>
      <div class="continue">${h.slice(0, 10).map(x => card(byId[x.id])).join("")}</div></section>` : ""}
    <section class="section">
      <div class="section-head"><div><span class="kicker">يتجدد كل يوم</span><h2>مقطع اليوم</h2></div></div>
      <a class="today fade" href="#/watch/${today.id}">
        <div class="thumb"><img src="${thumb(today.id, "hqdefault")}" alt=""><span class="dur">${clock(today.d)}</span>${today.n > 1 ? `<span class="parts">${n(today.n)} أجزاء</span>` : ""}</div>
        <div class="today-body"><span class="kicker">${esc(seriesOf[today.s].name)}</span><h3>${esc(today.t)}</h3>
          <div class="meta">${mins(today.d)}${today.n > 1 ? ` · ${n(today.n)} أجزاء، كل جزء نحو ${mins(today.d / today.n)}` : ""}</div>
          <span class="btn gold sm" style="align-self:flex-start;margin-top:6px">${ICON.play} شاهد الآن</span></div>
      </a>
    </section>
    <section class="section"><div class="section-head"><h2>السلاسل والبرامج</h2><a href="#/series">عرض الكل</a></div>
      <div class="grid">${MAIN.slice(0, 6).map(seriesCard).join("")}</div></section>
    <section class="section"><div class="section-head"><h2>مختارات</h2></div>
      <div class="grid">${picks.map(card).join("")}</div></section>
    ${footer}`;
  }

  function seriesIndex() {
    view.innerHTML = `<div class="page-head fade"><span class="kicker">المكتبة</span><h1>السلاسل والبرامج</h1>
      <p>${n(D.series.length)} سلسلة تضم ${n(D.videos.length)} مقطعاً</p></div>
      <div class="grid section">${D.series.map(seriesCard).join("")}</div>${footer}`;
  }

  function seriesPage(k) {
    const s = seriesOf[k]; if (!s) return home();
    const list = listOf(k);
    const total = list.reduce((a, v) => a + v.d, 0);
    view.innerHTML = `<div class="page-head fade"><a class="kicker" href="#/series">السلاسل</a><h1>${esc(s.name)}</h1>
      <p>${esc(s.desc)} · ${n(list.length)} مقطعاً · ${mins(total)}</p>
      <div class="actions"><a class="btn gold" href="#/watch/${list[0].id}">${ICON.play} ابدأ السلسلة</a></div></div>
      <div class="list section">${list.map(row).join("")}</div>${footer}`;
  }

  function searchPage(q = "") {
    view.innerHTML = `<div class="page-head search-page fade"><span class="kicker">بحث</span><h1>عن ماذا تبحث؟</h1>
      <input id="q2" type="search" placeholder="مثال: الصبر، رمضان، اللسان، الوالدين…" value="${esc(q)}" autocomplete="off">
      <div class="chips" style="margin-top:14px">${["الصبر", "رمضان", "اللسان", "الدعاء", "الأسرة", "التوبة", "الموت", "الحج"].map(t => `<button class="chip" data-q="${t}">${t}</button>`).join("")}</div></div>
      <div id="results" class="section"></div>${footer}`;
    const inp = $("#q2"), res = $("#results");
    const run = () => {
      const t = norm(inp.value.trim());
      if (!t) { res.innerHTML = ""; return; }
      const words = t.split(/\s+/);
      const hits = D.videos.filter(v => { const h = norm(v.t + " " + v.raw + " " + seriesOf[v.s].name); return words.every(w => h.includes(w)); });
      res.innerHTML = hits.length ? `<p class="meta" style="color:var(--muted)">${n(hits.length)} نتيجة</p><div class="grid">${hits.slice(0, 60).map(card).join("")}</div>`
        : `<div class="empty"><svg class="emblem" viewBox="0 0 64 64"><use href="#star"/></svg>لا توجد نتائج، جرّب كلمة أخرى.</div>`;
    };
    inp.addEventListener("input", run);
    view.querySelectorAll("[data-q]").forEach(b => b.onclick = () => { inp.value = b.dataset.q; run(); });
    run(); if (!q) inp.focus();
  }

  function favPage() {
    const f = favs().map(id => byId[id]).filter(Boolean);
    view.innerHTML = `<div class="page-head fade"><span class="kicker">مكتبتك</span><h1>المحفوظات</h1><p>المقاطع التي حفظتها تبقى هنا على جهازك.</p></div>
      ${f.length ? `<div class="grid section">${f.map(card).join("")}</div>` : `<div class="empty"><svg class="emblem" viewBox="0 0 64 64"><use href="#star"/></svg>لم تحفظ شيئاً بعد.<br>اضغط «حفظ» تحت أي مقطع ليظهر هنا.</div>`}
      ${footer}`;
  }

  function installPage() {
    view.innerHTML = `<div class="page-head fade"><span class="kicker">تطبيق على جوالك</span><h1>ثبّت التطبيق في ثوانٍ</h1><p>بدون متجر تطبيقات، ويفتح من الشاشة الرئيسية مثل أي تطبيق.</p></div>
      <div class="guide section">
        <div class="panel"><h2>آيفون (Safari)</h2><ol>
          <li>افتح الموقع من متصفح <b>Safari</b>.</li>
          <li>اضغط زر المشاركة <span class="key">${ICON.share2}</span> أسفل الشاشة.</li>
          <li>اختر <b>«إضافة إلى الشاشة الرئيسية»</b>.</li>
          <li>اضغط <b>«إضافة»</b>، وتجد الأيقونة على شاشتك.</li></ol></div>
        <div class="panel"><h2>أندرويد (Chrome)</h2><ol>
          <li>افتح الموقع من متصفح <b>Chrome</b>.</li>
          <li>اضغط القائمة <span class="key">${ICON.dots}</span> أعلى الشاشة.</li>
          <li>اختر <b>«تثبيت التطبيق»</b> أو «إضافة إلى الشاشة الرئيسية».</li>
          <li>اضغط <b>«تثبيت»</b>.</li></ol>
          ${deferred ? `<button class="btn gold" id="inst2" style="margin-top:10px">تثبيت الآن</button>` : ""}</div>
      </div>${footer}`;
    const b = $("#inst2"); if (b) b.onclick = doInstall;
  }

  /* ---------- المشغّل ---------- */
  let yt = null, ytReady = null;
  const loadYT = () => ytReady || (ytReady = new Promise(res => {
    window.onYouTubeIframeAPIReady = () => res(true);
    const s = document.createElement("script"); s.src = "https://www.youtube.com/iframe_api"; s.onerror = () => res(false);
    document.head.appendChild(s); setTimeout(() => res(!!window.YT?.Player), 6000);
  }));

  function watch(id, p = 0) {
    const v = byId[id]; if (!v) return home();
    const P = parts(v); p = Math.min(Math.max(0, p | 0), P.length - 1);
    const part = P[p], s = seriesOf[v.s], list = listOf(v.s), idx = list.indexOf(v), nextV = list[idx + 1];
    const done = seen()[id] || [];
    pushHist(id, p);
    view.innerHTML = `
      <div class="player-wrap fade"><div class="player"><div id="yt"></div></div></div>
      <div class="watch-info">
        <div>
          <a class="kicker" href="#/series/${v.s}">${esc(s.name)}</a>
          <h1>${esc(v.t)}</h1>
          <div class="meta" style="color:var(--muted)">${v.n > 1 ? `الجزء ${n(p + 1)} من ${n(v.n)} · ${clock(part.start)} – ${clock(part.end)} · ` : ""}المدة الكاملة ${mins(v.d)}</div>
          ${v.n > 1 ? `<div class="progress"><i style="width:${Math.round(done.length / v.n * 100)}%"></i></div>
            <div class="chips" style="margin-top:12px">${P.map(x => `<a class="chip${x.i === p ? " on" : ""}${done.includes(x.i) ? " seen" : ""}" href="#/watch/${id}/${x.i}">الجزء ${n(x.i + 1)}</a>`).join("")}</div>` : ""}
          <div class="actions">
            ${p < P.length - 1 ? `<a class="btn gold" href="#/watch/${id}/${p + 1}">الجزء التالي ${ICON.next}</a>` : nextV ? `<a class="btn gold" href="#/watch/${nextV.id}">المقطع التالي ${ICON.next}</a>` : ""}
            <button class="btn" id="favBtn">${isFav(id) ? ICON.heartOn + " محفوظ" : ICON.heart + " حفظ"}</button>
            <button class="btn" id="shareBtn">${ICON.share} مشاركة</button>
            <a class="btn" href="https://www.youtube.com/watch?v=${id}&t=${part.start}s" target="_blank" rel="noopener">${ICON.yt} يوتيوب</a>
          </div>
        </div>
        <aside class="panel"><h2>من ${esc(s.name)}</h2><div class="scroll" id="side">
          ${list.map(x => `<a class="mini${x.id === id ? " on" : ""}" href="#/watch/${x.id}"><div class="thumb"><img loading="lazy" src="${thumb(x.id, "default")}" alt=""></div>
            <div><b>${esc(x.t)}</b><small>${mins(x.d)}${x.n > 1 ? ` · ${n(x.n)} أجزاء` : ""}</small></div></a>`).join("")}</div></aside>
      </div>${footer}`;
    const on = $("#side .mini.on"); if (on) on.parentNode.scrollTop = on.offsetTop - 80;
    $("#favBtn").onclick = e => { const f = toggleFav(id); e.currentTarget.innerHTML = f ? ICON.heartOn + " محفوظ" : ICON.heart + " حفظ"; };
    $("#shareBtn").onclick = async () => {
      const url = location.href, text = `${v.t} — الشيخ د. راشد الهاجري`;
      try { if (navigator.share) await navigator.share({ title: text, text, url }); else { await navigator.clipboard.writeText(url); $("#shareBtn").textContent = "تم نسخ الرابط ✓"; } } catch { }
    };
    const nextHref = p < P.length - 1 ? `#/watch/${id}/${p + 1}` : nextV ? `#/watch/${nextV.id}` : null;
    mountPlayer(id, part, () => {
      markSeen(id, p);
      if (!nextHref) return;
      const box = document.createElement("div"); box.className = "next-overlay";
      box.innerHTML = `<div><span class="kicker" style="color:var(--gold-2)">انتهى ${v.n > 1 ? "الجزء" : "المقطع"}</span><h4>${p < P.length - 1 ? `الجزء ${n(p + 2)} يبدأ بعد <span id="cd">٥</span>` : "المقطع التالي بعد <span id='cd'>٥</span>"}</h4>
        <a class="btn gold" href="${nextHref}">تابع الآن</a> <button class="btn ghost" id="stay">إلغاء</button></div>`;
      $(".player").appendChild(box);
      let c = 5; const t = setInterval(() => { c--; const cd = $("#cd"); if (cd) cd.textContent = n(c); if (c <= 0) { clearInterval(t); if ($(".next-overlay")) location.hash = nextHref; } }, 1000);
      $("#stay").onclick = () => { clearInterval(t); box.remove(); };
    });
  }

  async function mountPlayer(id, part, onEnd) {
    const host = $("#yt");
    const ok = await loadYT();
    if (!$("#yt") || $("#yt") !== host) return;
    if (ok && window.YT?.Player) {
      yt = new YT.Player(host, {
        host: "https://www.youtube-nocookie.com", videoId: id,
        playerVars: { start: part.start, end: part.end, rel: 0, playsinline: 1, modestbranding: 1, hl: "ar", autoplay: 1 },
        events: { onStateChange: e => { if (e.data === 0) onEnd(); } }
      });
    } else {
      host.outerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${id}?start=${part.start}&end=${part.end}&rel=0&playsinline=1&autoplay=1" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen title="مشغّل"></iframe>`;
    }
  }

  /* ---------- التوجيه ---------- */
  function route() {
    if (location.hash.startsWith("#/watch")) bar.hidden = true;
    if (yt?.destroy) { try { yt.destroy(); } catch { } yt = null; }
    const [, a = "", b = "", c = ""] = decodeURIComponent(location.hash.slice(1)).split("/");
    const tab = { "": "home", series: "series", search: "search", fav: "fav" }[a] || (a === "watch" ? "" : "");
    document.querySelectorAll(".tabbar a").forEach(x => x.classList.toggle("on", x.dataset.tab === (a === "watch" ? "" : tab)));
    if (a === "series" && b) seriesPage(b);
    else if (a === "series") seriesIndex();
    else if (a === "watch") watch(b, +c || 0);
    else if (a === "search") searchPage(b);
    else if (a === "fav") favPage();
    else if (a === "install") installPage();
    else home();
    window.scrollTo(0, 0);
  }
  addEventListener("hashchange", route);
  $("#searchForm").onsubmit = e => { e.preventDefault(); location.hash = "#/search/" + encodeURIComponent($("#q").value.trim()); };

  /* ---------- الوضع الليلي ---------- */
  const root = document.documentElement;
  const theme = store.get("theme", null); if (theme) root.dataset.theme = theme;
  $("#themeBtn").onclick = () => {
    const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = dark ? "light" : "dark"; store.set("theme", root.dataset.theme);
  };

  /* ---------- التثبيت كتطبيق ---------- */
  let deferred = null;
  const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone;
  const bar = $("#installBar");
  const showBar = () => { if (!location.hash.startsWith("#/watch") && !standalone && !store.get("hideInstall", false)) bar.hidden = false; };
  addEventListener("beforeinstallprompt", e => { e.preventDefault(); deferred = e; showBar(); });
  const doInstall = async () => { if (deferred) { deferred.prompt(); await deferred.userChoice; deferred = null; bar.hidden = true; } else location.hash = "#/install"; };
  $("#installBtn").onclick = doInstall;
  $("#installClose").onclick = () => { bar.hidden = true; store.set("hideInstall", true); };
  if (/iphone|ipad|ipod/i.test(navigator.userAgent)) setTimeout(showBar, 2500);
  if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => { });

  route();
})();
