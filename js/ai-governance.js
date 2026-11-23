/* AI governance: effects that follow you.
   1. Hero: a spotlight that follows the pointer and lights "Governance is hard." (drifts by itself on touch)
   2. Parallax: layers and big faint words move at different speeds as you scroll
   3. Manifesto: words light up as you scroll
   4. Plan: a line runs across three phases and the nine items tick off as you scroll
   5. Loop: vertical scroll drives a horizontal track; the step in the middle lights up
   6. Tiers: cards stack as they arrive; the output squares ripple in
   7. Traceability: seven fields fly in from different depths and snap into one record
   Reduced motion: the finished state, no movement. */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(pointer: fine)').matches;
  const wide = window.matchMedia('(min-width: 961px)');
  const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const vh = () => window.innerHeight;
  if (reduce) document.documentElement.classList.add('aig-static');

  /* ---- 1. Hero spotlight ------------------------------------------------ */
  const hero = document.querySelector('[data-hero]');
  const spot = document.querySelector('[data-spot]');
  if (hero && spot && !reduce) {
    hero.classList.add('is-spot');
    let lastMove = 0;
    const place = (cx, cy) => {
      const hr = hero.getBoundingClientRect(), sr = spot.getBoundingClientRect();
      hero.style.setProperty('--hx', (cx - hr.left) + 'px');
      hero.style.setProperty('--hy', (cy - hr.top) + 'px');
      spot.style.setProperty('--sx', (cx - sr.left) + 'px');
      spot.style.setProperty('--sy', (cy - sr.top) + 'px');
    };
    if (fine) hero.addEventListener('pointermove', (e) => { lastMove = performance.now(); place(e.clientX, e.clientY); });
    const drift = (t) => {
      requestAnimationFrame(drift);
      if (document.hidden) return;
      if (fine && performance.now() - lastMove < 3500) return;       // the pointer is in charge
      const sr = spot.getBoundingClientRect();
      const x = sr.left + (0.5 + 0.5 * Math.sin(t / 1700)) * sr.width;
      const y = sr.top + sr.height * (0.5 + 0.18 * Math.sin(t / 900));
      place(x, y);
    };
    requestAnimationFrame(drift);
  }

  /* ---- 3. Manifesto words ----------------------------------------------- */
  const scrub = document.querySelector('[data-scrub]');
  let words = [];
  if (scrub) {
    const text = scrub.textContent.trim();
    scrub.setAttribute('aria-label', text);
    scrub.innerHTML = text.split(/\s+/).map((w) => `<span class="w" aria-hidden="true">${w}</span>`).join(' ');
    words = $$('.w', scrub);
  }

  /* ---- 2, 5, 6, 7: scroll-driven ---------------------------------------- */
  const plx = $$('[data-plx]');
  const loop = document.querySelector('[data-hscroll]');
  const track = loop && loop.querySelector('.aig-loop__track');
  const view = loop && loop.querySelector('.aig-loop__view');
  const rail = loop && loop.querySelector('.aig-loop__rail');
  const stepEls = loop ? $$('.aig-step', loop) : [];
  const tiers = $$('.aig-tier');
  const plan = document.querySelector('[data-plan]');
  const phases = plan ? $$('.aig-phase', plan) : [];
  const planItems = plan ? $$('.aig-item', plan) : [];
  const trace = document.querySelector('[data-trace]');
  const chips = trace ? $$('.aig-chip', trace) : [];
  const countEl = trace && trace.querySelector('[data-count]');
  const SCATTER = [[-420, -180, -9], [-300, -250, 7], [360, -200, -6], [-250, -300, 10], [400, -240, 8], [-360, -210, -11], [320, -280, 5]];

  let ticking = false;
  function frame() {
    ticking = false;
    const H = vh();

    if (!reduce) {
      /* parallax */
      plx.forEach((el) => {
        const ref = el.closest('section') || el.parentElement;
        const r = ref.getBoundingClientRect();
        if (r.bottom < -200 || r.top > H + 200) return;
        const d = (r.top + r.height / 2) - H / 2;
        el.style.transform = `translate3d(0, ${(-d * parseFloat(el.dataset.plx) * 0.12).toFixed(1)}px, 0)`;
      });
    }

    /* manifesto */
    if (scrub && words.length) {
      const r = scrub.getBoundingClientRect();
      const p = reduce ? 1 : clamp((H * 0.85 - r.top) / (H * 0.5), 0, 1);
      const n = Math.round(p * words.length);
      words.forEach((w, i) => w.classList.toggle('is-lit', i < n));
    }

    /* plan: the line draws across, items tick off */
    if (plan) {
      const r = plan.getBoundingClientRect();
      const p = reduce ? 1 : clamp((H * 0.78 - r.top) / (H * 0.5), 0, 1);
      plan.style.setProperty('--p', p.toFixed(3));
      const done = Math.round(p * planItems.length);
      planItems.forEach((it, i) => it.classList.toggle('is-done', i < done));
      phases.forEach((ph, i) => {
        const full = done >= (i + 1) * 3;
        ph.classList.toggle('is-done', full);
        ph.classList.toggle('is-on', !full && done > i * 3 - 1 && p > 0);
      });
    }

    /* loop: horizontal track */
    if (loop && track && view && wide.matches && !reduce) {
      const pin = loop.querySelector('.aig-loop__pin');
      const hdr = parseFloat(getComputedStyle(pin).top) || 0;
      const r = loop.getBoundingClientRect();
      const total = r.height - pin.getBoundingClientRect().height;
      const p = clamp((hdr - r.top) / Math.max(total, 1), 0, 1);
      const max = Math.max(track.scrollWidth - window.innerWidth + 80, 0);
      track.style.transform = `translate3d(${(-p * max).toFixed(1)}px,0,0)`;
      if (rail) rail.style.setProperty('--p', p.toFixed(3));
      const mid = window.innerWidth * 0.42;
      let best = 0, bd = 1e9;
      stepEls.forEach((s, i) => { const sr = s.getBoundingClientRect(); const d = Math.abs(sr.left + sr.width / 2 - mid); if (d < bd) { bd = d; best = i; } });
      stepEls.forEach((s, i) => { s.classList.toggle('is-on', i === best); s.classList.toggle('is-past', i < best); });
    } else if (loop && track) {
      track.style.transform = '';
      stepEls.forEach((s) => { s.classList.remove('is-on', 'is-past'); });
    }

    /* tiers: stacked cards recede */
    if (tiers.length && wide.matches && !reduce) {
      tiers.forEach((t, i) => {
        const next = tiers[i + 1];
        let under = false, s = 1;
        if (next) {
          const a = t.getBoundingClientRect(), b = next.getBoundingClientRect();
          under = b.top < a.top + a.height * 0.55;
          s = 1 - Math.min(tiers.length - 1 - i, 2) * 0.035;
        }
        t.classList.toggle('is-under', under);
        t.style.setProperty('--s', s.toFixed(3));
      });
    }

    /* traceability: assemble */
    if (trace && chips.length) {
      const r = trace.getBoundingClientRect();
      const p = reduce ? 1 : clamp(1 - (r.top - H * 0.05) / (H * 0.75), 0, 1);
      const k = Math.min(1, window.innerWidth / 1000);
      let linked = 0;
      chips.forEach((c, i) => {
        const q = clamp(p * 1.55 - i * 0.12, 0, 1);
        const e = 1 - Math.pow(1 - q, 3);
        const [dx, dy, rot] = SCATTER[i % SCATTER.length];
        c.style.transform = reduce ? '' : `translate3d(${(dx * (1 - e) * k).toFixed(1)}px, ${(dy * (1 - e)).toFixed(1)}px, 0) rotate(${(rot * (1 - e)).toFixed(1)}deg)`;
        c.style.opacity = reduce ? 1 : (0.2 + 0.8 * e).toFixed(2);
        const on = q >= 0.985;
        c.classList.toggle('is-linked', on);
        if (on) linked++;
      });
      if (countEl) countEl.textContent = linked;
    }
  }
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  frame();

  /* tier squares ripple in once */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { threshold: 0.35 });
    tiers.forEach((t) => io.observe(t));
  } else tiers.forEach((t) => t.classList.add('is-in'));
})();
