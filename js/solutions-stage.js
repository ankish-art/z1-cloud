/* Solutions: a pinned stage.
   Wide screens: scrolling steps through four areas, one on screen at a time (fade in / fade out).
   Narrow screens: a normal page. Links to an area (#financial-crime ...) scroll to the right step.
   Also drives the industry tabs. */
(() => {
  const stages = [...document.querySelectorAll('.sol-stage')];
  const layout = document.querySelector('.sol-layout');
  const stagesEl = document.querySelector('.sol-stages');
  const nav = document.querySelector('.sol-nav');
  const links = [...document.querySelectorAll('.sol-nav__link')];
  if (!stages.length || !layout || !stagesEl) return;

  const wide = window.matchMedia('(min-width: 961px)');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
  const stickyTop = () => parseFloat(getComputedStyle(stagesEl).top) || 0;
  const stepH = () => stagesEl.getBoundingClientRect().height || window.innerHeight;
  const ids = stages.map((s) => s.id);

  let ticking = false;
  function update() {
    ticking = false;
    const r = layout.getBoundingClientRect();
    let active = 0, p = 0;
    if (wide.matches) {
      const scrolled = stickyTop() - r.top;
      active = clamp(Math.round(scrolled / stepH()), 0, stages.length - 1);
      p = clamp(scrolled / (stepH() * (stages.length - 1)), 0, 1);
    }
    if (nav) nav.style.setProperty('--p', p.toFixed(4));
    stages.forEach((s, i) => s.classList.toggle('is-active', wide.matches ? i === active : true));
    links.forEach((l, i) => l.classList.toggle('is-on', i === active));
  }
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();

  function scrollToStage(i, smooth = true) {
    i = clamp(i, 0, stages.length - 1);
    const behavior = smooth && !reduce ? 'smooth' : 'auto';
    if (wide.matches) {
      const y0 = window.scrollY + layout.getBoundingClientRect().top - stickyTop();
      window.scrollTo({ top: y0 + i * stepH() + 2, behavior });
    } else {
      stages[i].scrollIntoView({ block: 'start', behavior });
    }
  }
  const go = (hash, smooth) => { const i = ids.indexOf(hash.replace('#', '')); if (i >= 0) { scrollToStage(i, smooth); return true; } return false; };
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    if (go(a.getAttribute('href'), true)) { e.preventDefault(); history.replaceState(null, '', a.getAttribute('href')); }
  });
  window.addEventListener('hashchange', () => go(location.hash, true));
  go(location.hash, false);

  /* Industry tabs */
  const tabs = [...document.querySelectorAll('.ind-tab')];
  const panels = [...document.querySelectorAll('.ind')];
  function pick(i, focus) {
    tabs.forEach((t, k) => { const on = k === i; t.classList.toggle('is-on', on); t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; if (on && focus) t.focus(); });
    panels.forEach((p, k) => { p.hidden = k !== i; p.classList.toggle('is-active', k === i); });
    document.dispatchEvent(new CustomEvent('sectorchange', { detail: i }));
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => pick(i));
    t.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); pick((i + 1) % tabs.length, true); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); pick((i - 1 + tabs.length) % tabs.length, true); }
    });
  });
})();
