/* Services: a pinned stage.
   - On wide screens the guide (left) and the stage content (right) are pinned while you scroll;
     scrolling steps through the five stages and each one fades in as the last fades out
   - Links to a stage or a service (#grp-*, #svc-*) scroll to the right step and open the panel
   - On narrow screens everything is a normal page: all stages shown, no pinning */
(() => {
  const groups = [...document.querySelectorAll('.svc-group')];
  const layout = document.querySelector('.svc-layout');
  const pinnedEl = document.querySelector('.svc-groups');
  const story = document.querySelector('.story');
  const dots = [...document.querySelectorAll('.story__dot')];
  if (!groups.length || !layout || !story || !pinnedEl) return;

  const wide = window.matchMedia('(min-width: 961px)');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
  const stickyTop = () => parseFloat(getComputedStyle(pinnedEl).top) || 0;
  const stepH = () => pinnedEl.getBoundingClientRect().height || window.innerHeight;

  let ticking = false, last = -1;
  function update() {
    ticking = false;
    const r = layout.getBoundingClientRect();
    let active = 0, p;
    if (wide.matches) {
      const scrolled = stickyTop() - r.top;               // how far into the pinned run we are
      active = clamp(Math.round(scrolled / stepH()), 0, groups.length - 1);
      p = clamp(scrolled / (stepH() * (groups.length - 1)), 0, 1);
    } else {
      const vh = window.innerHeight;
      groups.forEach((g, i) => { if (g.getBoundingClientRect().top < vh * 0.5) active = i; });
      p = clamp((vh * 0.5 - r.top) / Math.max(r.height, 1), 0, 1);
    }
    story.style.setProperty('--p', p.toFixed(4));
    groups.forEach((g, i) => g.classList.toggle('is-active', i === active));
    dots.forEach((d, i) => { d.classList.toggle('is-on', i === active); d.classList.toggle('is-done', i < active); });
    if (active !== last) { last = active; story.dispatchEvent(new CustomEvent('stagechange', { detail: active })); }
  }
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();

  /* Scroll so that stage i is the one on screen */
  function scrollToStage(i, smooth = true) {
    i = clamp(i, 0, groups.length - 1);
    const behavior = smooth && !reduce ? 'smooth' : 'auto';
    if (wide.matches) {
      const y0 = window.scrollY + layout.getBoundingClientRect().top - stickyTop();
      window.scrollTo({ top: y0 + i * stepH() + 2, behavior });
    } else {
      groups[i].scrollIntoView({ block: 'start', behavior });
    }
  }
  window.zcScrollToStage = scrollToStage;

  const openPanel = (id, smooth) => {
    const el = id && document.getElementById(id);
    if (!el || el.tagName !== 'DETAILS') return;
    const i = groups.indexOf(el.closest('.svc-group'));
    if (i >= 0) scrollToStage(i, smooth);
    el.open = true;
  };
  openPanel(location.hash.replace('#', ''), false);
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#svc-"]');
    if (!a) return;
    e.preventDefault();
    const id = a.getAttribute('href').slice(1);
    history.replaceState(null, '', '#' + id);
    openPanel(id, true);
  });
  window.addEventListener('hashchange', () => openPanel(location.hash.slice(1), true));
})();

// The staged reveal inside a panel plays once it is opened
(() => {
  document.querySelectorAll('details.svc').forEach((d) => d.classList.add('is-in'));
})();
