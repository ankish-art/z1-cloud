/* Case studies.
   - Filter the six examples by sector
   - "Read the full example" opens a reader: six parts, one at a time (steps, Previous / Next)
   - The headline figures count up the first time they scroll into view
   - A link such as case-studies/#kyc-refresh opens that example
   Reduced motion: figures show at once, parts change without animation. */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const cases = $$('.cs');
  if (!cases.length) return;

  /* ---- open / close ------------------------------------------------------- */
  const setOpen = (cs, open) => {
    cs.classList.toggle('is-open', open);
    cs.querySelector('.cs__btn').setAttribute('aria-expanded', open);
    cs.querySelector('.cs__btn-t').textContent = open ? 'Close example' : 'Read the full example';
    const body = cs.querySelector('.cs__body');
    if ('inert' in body) body.inert = !open;
  };

  cases.forEach((cs) => {
    const steps = $$('.cs-step', cs);
    const parts = $$('.cs-part', cs);
    const prev = cs.querySelector('.cs__prev');
    const next = cs.querySelector('.cs__next');
    let cur = 0;

    const show = (i) => {
      cur = Math.max(0, Math.min(parts.length - 1, i));
      parts.forEach((p, k) => p.classList.toggle('is-on', k === cur));
      steps.forEach((s, k) => { s.classList.toggle('is-on', k === cur); s.classList.toggle('is-done', k < cur); });
      prev.disabled = cur === 0;
      next.textContent = cur === parts.length - 1 ? 'Back to the start' : 'Next part';
    };
    steps.forEach((s, i) => s.addEventListener('click', () => show(i)));
    prev.addEventListener('click', () => show(cur - 1));
    next.addEventListener('click', () => show(cur === parts.length - 1 ? 0 : cur + 1));
    show(0);
    setOpen(cs, false);

    cs.querySelector('.cs__btn').addEventListener('click', () => {
      const open = !cs.classList.contains('is-open');
      setOpen(cs, open);
      if (open) show(0);
    });
  });

  const openCase = (id, scroll) => {
    const cs = document.getElementById(id);
    if (!cs || !cs.classList.contains('cs')) return false;
    if (cs.hidden) { setFilter('all'); }
    setOpen(cs, true);
    if (scroll) cs.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    return true;
  };
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-open]');
    if (!a) return;
    e.preventDefault();
    history.replaceState(null, '', '#' + a.dataset.open);
    openCase(a.dataset.open, true);
  });
  window.addEventListener('hashchange', () => openCase(location.hash.slice(1), true));

  /* ---- filter ------------------------------------------------------------- */
  const chips = $$('.cs-chip');
  const shown = document.querySelector('[data-shown]');
  function setFilter(key) {
    chips.forEach((c) => { const on = c.dataset.filter === key; c.classList.toggle('is-on', on); c.setAttribute('aria-pressed', on); });
    let n = 0;
    cases.forEach((cs) => {
      const match = key === 'all' || cs.dataset.sector === key;
      if (match) n++;
      if (match && cs.hidden) { cs.hidden = false; void cs.offsetWidth; cs.classList.remove('is-out'); }
      if (!match && !cs.hidden) {
        cs.classList.add('is-out');
        const done = () => { if (cs.classList.contains('is-out')) cs.hidden = true; };
        reduce ? done() : setTimeout(done, 350);
      }
    });
    if (shown) shown.textContent = n;
  }
  chips.forEach((c) => c.addEventListener('click', () => setFilter(c.dataset.filter)));

  /* ---- figures count up ----------------------------------------------------- */
  const figs = $$('.cs-m__v');
  const animate = (el) => {
    const raw = el.dataset.v;
    const m = raw.match(/^(\d+)(.*)$/);
    if (!m || reduce) return;
    const end = parseInt(m[1], 10), tail = m[2];
    if (end < 2) return;
    const t0 = performance.now(), dur = 1100;
    const step = (t) => {
      const k = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(end * e) + tail;
      if (k < 1) requestAnimationFrame(step); else el.textContent = raw;
    };
    el.textContent = '0' + tail;
    requestAnimationFrame(step);
  };
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { animate(e.target); io.unobserve(e.target); } }), { threshold: 0.6 });
    figs.forEach((f) => io.observe(f));
  }

  /* deep link */
  if (location.hash) openCase(location.hash.slice(1), true);
})();
