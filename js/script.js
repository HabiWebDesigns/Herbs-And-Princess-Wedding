/* ==========================================================
   HERBIE & PRINCESS — Wedding Invitation
   1) EDIT THE CONFIG BELOW — it controls the whole site.
   ========================================================== */
const weddingConfig = {
  coupleNames: "Herbie & Princess",
  weddingDate: "2027-04-10",          // YYYY-MM-DD
  ceremonyTime: "[Time]",
  receptionTime: "[Time]",
  venueName: "[VENUE NAME]",
  venueAddress: "[VENUE ADDRESS]",
  googleMapsUrl: "",                  // paste your Google Maps link here
  couplePhoto: "images/couple.jpg",   // no leading "/" so it works on GitHub Pages
  weddingSong: "audio/wedding-song.mp3",
  rsvpEndpoint: "",                   // later: URL of your RSVP backend (e.g. Formspree). Empty = demo mode
  story: [                            // text shown in the timeline (click an event to expand)
    { when: "2007", title: "We first met.", more: "Write a little memory about how it all started." },
    { when: "Grade 7", title: "Our paths crossed again.", more: "Write a few words about this moment." },
    { when: "Grade 8", title: "We started talking.", more: "Write a few words about this moment." },
    { when: "College", title: "Friendship slowly became something more.", more: "Write a few words about this moment." },
    { when: "November 6, 2018", title: "Our story officially began.", more: "The day everything changed.", big: true },
    { when: "April 10, 2027", title: "And now, we're getting married.", more: "And we'd love for you to be there.", big: true }
  ]
};

/* ==========================================================
   2) THE CODE (you shouldn't need to change anything below)
   ========================================================== */
(() => {
  const C = weddingConfig;
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const body = document.body;

  /* ---------- Fill the page from the config ---------- */
  const [Y, M, D] = C.weddingDate.split('-').map(Number);
  const target = new Date(Y, M - 1, D, 0, 0, 0);     // local midnight of the wedding day
  const niceDate = target.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const [nameA, nameB] = C.coupleNames.split('&').map(s => s.trim());
  document.title = `${C.coupleNames} — ${niceDate}`;
  document.documentElement.style.setProperty('--photo', `url("${new URL(C.couplePhoto, location.href).href}")`);
  $$('[data-names]').forEach(el => el.innerHTML = `<span>${nameA}</span><span class="amp">&amp;</span><span>${nameB}</span>`);
  $$('[data-names-plain]').forEach(el => el.textContent = C.coupleNames);
  $$('[data-date]').forEach(el => el.textContent = niceDate);
  $$('[data-cfg]').forEach(el => el.textContent = C[el.dataset.cfg]);

  const toastEl = $('#toast');
  function toast(msg) { toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => toastEl.classList.remove('show'), 3200); }

  /* ---------- Our Story timeline ---------- */
  const tl = $('#timeline'), tlFill = $('#tlFill');
  C.story.forEach(s => {
    const a = document.createElement('article');
    a.className = 'ev rv' + (s.big ? ' big' : '');
    a.innerHTML = `<span class="dot"></span><button class="ev-btn" aria-expanded="false"><time>${s.when}</time><h3>${s.title}</h3><p class="more">${s.more || ''}</p></button>`;
    a.querySelector('button').onclick = e => { const o = a.classList.toggle('open'); e.currentTarget.setAttribute('aria-expanded', o); };
    tl.appendChild(a);
  });

  /* ---------- Countdown (calendar-aware months) ---------- */
  const cells = $$('#cd .cell b');
  const daysIn = (y, m) => new Date(y, m + 1, 0).getDate();
  function addMonths(d, n) {                         // add n real calendar months
    const r = new Date(d.getFullYear(), d.getMonth() + n, 1, d.getHours(), d.getMinutes(), d.getSeconds());
    r.setDate(Math.min(d.getDate(), daysIn(r.getFullYear(), r.getMonth())));
    return r;
  }
  function remaining(now) {
    let m = (target.getFullYear() - now.getFullYear()) * 12 + target.getMonth() - now.getMonth();
    while (m > 0 && addMonths(now, m) > target) m--;
    const s = Math.floor((target - addMonths(now, m)) / 1000);
    return [m, Math.floor(s / 86400), Math.floor(s % 86400 / 3600), Math.floor(s % 3600 / 60), s % 60];
  }
  function updateCountdown() {
    const now = new Date();
    if (now >= target) { $('#cd').hidden = true; $('#cdDone').hidden = false; return; }
    remaining(now).forEach((v, i) => {
      const t = String(v).padStart(2, '0');
      if (cells[i].textContent !== t) { cells[i].textContent = t; cells[i].classList.remove('tick'); void cells[i].offsetWidth; cells[i].classList.add('tick'); }
    });
  }
  updateCountdown(); setInterval(updateCountdown, 1000);

  /* ---------- Gold particles (canvas) ---------- */
  const cv = $('#dust'), cx = cv.getContext('2d');
  let W, H, ps = [], mouse = { x: -999, y: -999 };
  function resize() { const d = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight; cv.width = W * d; cv.height = H * d; cx.setTransform(d, 0, 0, d, 0, 0); }
  resize(); addEventListener('resize', resize);
  const mk = () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.8 + .6, vy: Math.random() * .35 + .08, ph: Math.random() * 6.28, sp: Math.random() * .02 + .008 });
  if (!reduce) for (let i = 0; i < (innerWidth < 700 ? 26 : 55); i++) ps.push(mk());
  let bursts = [];
  function burst() {                                  // gold explosion from the center (envelope opening)
    if (reduce) return;
    for (let i = 0; i < 90; i++) { const a = Math.random() * 6.28, v = Math.random() * 5 + 1; bursts.push({ x: W / 2, y: H / 2, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1, r: Math.random() * 2.4 + .8, life: 1 }); }
  }
  function loop() {
    cx.clearRect(0, 0, W, H);
    for (const p of ps) {
      p.y -= p.vy; p.ph += p.sp; p.x += Math.sin(p.ph) * .35;
      const dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.hypot(dx, dy);
      if (d < 110) { p.x += dx / d * 1.6; p.y += dy / d * 1.6; }   // gentle cursor push
      if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
      const a = .35 + Math.sin(p.ph * 3) * .3;
      cx.fillStyle = `rgba(212,175,85,${a * .25})`; cx.beginPath(); cx.arc(p.x, p.y, p.r * 3, 0, 6.28); cx.fill();
      cx.fillStyle = `rgba(212,175,85,${a})`; cx.beginPath(); cx.arc(p.x, p.y, p.r, 0, 6.28); cx.fill();
    }
    bursts = bursts.filter(b => b.life > 0);
    for (const b of bursts) {
      b.x += b.vx; b.y += b.vy; b.vx *= .96; b.vy = b.vy * .96 + .03; b.life -= .012;
      cx.fillStyle = `rgba(232,197,100,${Math.max(b.life, 0)})`; cx.beginPath(); cx.arc(b.x, b.y, b.r, 0, 6.28); cx.fill();
    }
    requestAnimationFrame(loop);
  }
  if (!reduce) loop();

  /* ---------- Envelope opening (the big moment) ---------- */
  const intro = $('#intro'), env = $('#env');
  let opened = false;
  function openEnvelope() {
    if (opened) return; opened = true;
    intro.classList.add('open');                                 // seal breaks, flap opens, card rises
    if (reduce) return finish();
    setTimeout(burst, 2100);                                      // gold particles
    setTimeout(() => intro.classList.add('lit'), 2700);           // light expands
    setTimeout(finish, 4100);                                     // fade into the website
  }
  function finish() {
    intro.classList.add('done'); body.classList.remove('locked'); body.classList.add('ready');
    scrollTo(0, 0); startReveals(); setTimeout(() => intro.remove(), 2500);
  }
  env.addEventListener('click', openEnvelope);
  env.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openEnvelope(); } });

  /* ---------- Scroll reveals ---------- */
  function startReveals() {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .15, rootMargin: '0px 0px -6% 0px' });
    $$('.rv').forEach(el => io.observe(el));
  }

  /* ---------- Navigation ---------- */
  const links = $$('.nav a');
  const navIO = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  ['home', 'story', 'wedding', 'rsvp'].forEach(id => navIO.observe($('#' + id)));
  const burger = $('.burger');
  burger.onclick = () => { const o = body.classList.toggle('menu-open'); burger.setAttribute('aria-expanded', o); };
  links.forEach(a => a.addEventListener('click', () => { body.classList.remove('menu-open'); burger.setAttribute('aria-expanded', false); }));

  /* ---------- Scroll: parallax + timeline line ---------- */
  let queued = false;
  function onScroll() {
    if (queued) return; queued = true;
    requestAnimationFrame(() => {
      queued = false; const vh = innerHeight;
      if (!reduce) $$('[data-par]').forEach(el => {
        const r = el.parentElement.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        el.style.transform = `translate3d(0,${(r.top + r.height / 2 - vh / 2) * -el.dataset.par}px,0)`;
      });
      const r = tl.getBoundingClientRect();
      tlFill.style.height = Math.max(0, Math.min(1, (vh * .65 - r.top) / r.height)) * 100 + '%';
    });
  }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- Mouse effects (desktop only) ---------- */
  if (fine && !reduce) {
    const tilt = $('#heroTilt');
    addEventListener('mousemove', e => {
      mouse.x = e.clientX; mouse.y = e.clientY;
      const x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5;
      tilt.style.transform = `rotateY(${x * 14}deg) rotateX(${-y * 14}deg)`;
    });
    $$('.c3d').forEach(c => {
      c.addEventListener('mousemove', e => { const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; c.style.transform = `perspective(800px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateY(-8px)`; });
      c.addEventListener('mouseleave', () => c.style.transform = '');
    });
  }

  /* ---------- Map button ---------- */
  const mapBtn = $('#mapBtn');
  if (C.googleMapsUrl) { mapBtn.href = C.googleMapsUrl; mapBtn.target = '_blank'; mapBtn.rel = 'noopener'; }
  else mapBtn.addEventListener('click', e => { e.preventDefault(); toast('Map link coming soon'); });

  /* ---------- RSVP ---------- */
  // To add a real backend later, fill in rsvpEndpoint in the config (e.g. a Formspree URL).
  async function sendRSVP(data) {
    if (!C.rsvpEndpoint) { console.log('RSVP (demo mode):', data); return true; }
    try { const r = await fetch(C.rsvpEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) }); return r.ok; }
    catch (err) { return false; }
  }
  const modal = $('#modal'), mMsg = $('#mMsg');
  const closeModal = () => modal.classList.remove('show');
  $$('[data-answer]').forEach(b => b.addEventListener('click', async () => {
    const yes = b.dataset.answer === 'yes';
    const ok = await sendRSVP({ name: $('#guestName').value.trim(), attending: yes, sentAt: new Date().toISOString() });
    mMsg.textContent = !ok ? 'Something went wrong. Please try again.' : yes ? "Wonderful! We can't wait to celebrate with you." : "We'll miss you. Thank you for letting us know.";
    modal.classList.add('show');
    if (ok && yes) burst();
  }));
  $('#mClose').onclick = closeModal;
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  /* ---------- Music (never autoplays) ---------- */
  const audio = new Audio(C.weddingSong); audio.loop = true; audio.preload = 'none';
  const mb = $('#music');
  mb.addEventListener('click', () => {
    if (audio.paused) audio.play().then(() => setMusic(true)).catch(() => toast('Add your song at audio/wedding-song.mp3'));
    else { audio.pause(); setMusic(false); }
  });
  function setMusic(on) { mb.classList.toggle('on', on); $('#musicTxt').textContent = on ? 'Music ON' : 'Music OFF'; }
})();
