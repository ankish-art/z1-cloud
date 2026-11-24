/* Insights.
   - The hero category panel filters the grid (cards fade out, the rest arrive in turn)
   - "Key point" opens one short paragraph in a card (one open at a time)
   - A link such as insights/#ai-use-case-register opens that card
   - Parallax: the hero background drifts, and each card moves a few pixels
     at its own rate as it crosses the window
   Reduced motion: no drift, key points open without animation. */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const cards = $$('.ic');
  if (!cards.length) return;
  const grid = document.querySelector('[data-grid]');
  const live = document.querySelector('[data-live]');

  /* ---- open / close ---------------------------------------------------------- */
  const setOpen = (c, open) => {
    c.classList.toggle('is-open', open);
    c.querySelector('.ic__btn').setAttribute('aria-expanded', open);
    c.querySelector('.ic__btn-t').textContent = open ? 'Close' : 'Key point';
    const body = c.querySelector('.ic__body');
    if ('inert' in body) body.inert = !open;
  };
  cards.forEach((c) => {
    setOpen(c, false);
    c.querySelector('.ic__btn').addEventListener('click', () => {
      const open = !c.classList.contains('is-open');
      if (open) cards.forEach((o) => { if (o !== c) setOpen(o, false); });
      setOpen(c, open);
    });
  });

  /* ---- filter ---------------------------------------------------------------- */
  const cats = $$('.icat');
  const setFilter = (key) => {
    cats.forEach((b) => { const on = b.dataset.filter === key; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on); });
    const matching = cards.filter((c) => key === 'all' || c.dataset.cat === key);
    grid.classList.toggle('is-filtered', key !== 'all');
    grid.dataset.n = matching.length;
    let k = 0;
    cards.forEach((c) => {
      const match = matching.includes(c);
      if (match) {
        c.classList.remove('is-out');
        if (c.hidden) {
          c.hidden = false;
          c.classList.remove('is-in'); void c.offsetWidth;
          if (!reduce.matches) { c.style.setProperty('--k', k % 3); c.classList.add('is-in'); }
        }
        k++;
      } else if (!c.hidden) {
        setOpen(c, false);
        c.classList.add('is-out');
        const done = () => { if (c.classList.contains('is-out')) c.hidden = true; };
        reduce.matches ? done() : setTimeout(done, 350);
      }
    });
    if (live) live.textContent = `${matching.length} of ${cards.length} pieces shown`;
  };
  cats.forEach((b) => b.addEventListener('click', () => setFilter(b.dataset.filter)));
  cards.forEach((c) => c.addEventListener('animationend', () => c.classList.remove('is-in')));

  /* ---- deep link ------------------------------------------------------------- */
  const openFromHash = () => {
    const c = document.getElementById(location.hash.slice(1));
    if (!c || !c.classList.contains('ic')) return;
    if (c.hidden) setFilter('all');
    cards.forEach((o) => setOpen(o, o === c));
    c.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth', block: 'center' });
  };
  window.addEventListener('hashchange', openFromHash);
  if (location.hash) requestAnimationFrame(openFromHash);

  /* ---- parallax -------------------------------------------------------------- */
  const hero = document.querySelector('.in-hero');
  let raf = 0;
  const tick = () => {
    raf = 0;
    if (reduce.matches) return;
    const vh = window.innerHeight;
    if (hero) hero.style.setProperty('--hy', Math.min(window.scrollY, vh * 1.2).toFixed(1));
    if (window.innerWidth <= 960) return;
    cards.forEach((c) => {
      if (c.hidden) return;
      const r = c.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      c.style.setProperty('--cp', ((r.top + r.height / 2) - vh / 2).toFixed(0));
    });
  };
  window.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(tick); }, { passive: true });
  window.addEventListener('resize', () => { if (!raf) raf = requestAnimationFrame(tick); });
  tick();
})();
