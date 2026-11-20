/* Solutions: a case moves through the stages.
   1. Stage flows run with scroll (or click a stage to take over)
   2. Challenge / outcome rows pair up on hover or focus
   3. The Airtable stack separates as you scroll; hover a layer name to find it
   4. Industry tabs */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

  /* ---- 1. Stage flows -------------------------------------------------- */
  document.querySelectorAll('[data-flow]').forEach((flow) => {
    const steps = [...flow.querySelectorAll('.flow__step')];
    const n = steps.length;
    let manual = false, active = -1, timers = [];

    function set(i) {
      if (i === active) return;
      active = i;
      flow.style.setProperty('--a', i);
      steps.forEach((s, k) => { s.classList.toggle('is-on', k === i); s.classList.toggle('is-done', k < i); });
    }
    const takeOver = () => { manual = true; timers.forEach(clearTimeout); timers = []; };
    steps.forEach((s, i) => s.querySelector('button').addEventListener('click', () => { takeOver(); set(i); }));

    if (reduce) { set(n - 1); manual = true; return; }

    if (flow.dataset.flow === 'auto') {            // hero: runs once, then waits for you
      set(0);
      for (let i = 1; i < n; i++) timers.push(setTimeout(() => { if (!manual) set(i); }, 900 + i * 1100));
      return;
    }
    // the case moves as the flow moves up the screen
    set(0);
    const onScroll = () => {
      if (manual) return;
      const r = flow.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = clamp((vh * 0.85 - r.top) / (vh * 0.5), 0, 1);
      set(Math.min(n - 1, Math.floor(p * n)));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  });

  /* ---- 2. Challenge / outcome pairs ------------------------------------ */
  document.querySelectorAll('[data-pairs]').forEach((box) => {
    const rows = [...box.querySelectorAll('.pair')];
    const focus = (row) => { box.classList.add('has-focus'); rows.forEach((r) => r.classList.toggle('is-focus', r === row)); };
    const blur = () => { box.classList.remove('has-focus'); rows.forEach((r) => r.classList.remove('is-focus')); };
    rows.forEach((r) => {
      r.addEventListener('pointerenter', () => focus(r));
      r.addEventListener('focus', () => focus(r));
      r.addEventListener('blur', blur);
    });
    box.addEventListener('pointerleave', blur);
  });

  /* ---- 3. Airtable stack ----------------------------------------------- */
  const stack = document.querySelector('[data-astack]');
  if (stack) {
    const layers = [...stack.querySelectorAll('.astack__layer')];
    const items = [...stack.querySelectorAll('.astack__item')];
    const light = (i) => layers.forEach((l, k) => l.classList.toggle('is-on', k === i));

    items.forEach((it, i) => {
      const btn = it.querySelector('.astack__btn');
      const more = it.querySelector('.astack__more');
      btn.addEventListener('pointerenter', () => light(i));
      btn.addEventListener('focus', () => light(i));
      btn.addEventListener('click', () => {
        const open = btn.getAttribute('aria-expanded') === 'true';
        items.forEach((o) => { o.classList.remove('is-on'); o.querySelector('.astack__btn').setAttribute('aria-expanded', 'false'); o.querySelector('.astack__more').hidden = true; });
        if (!open) { btn.setAttribute('aria-expanded', 'true'); more.hidden = false; it.classList.add('is-on'); }
        light(open ? -1 : i);
      });
    });
    stack.querySelector('.astack__list').addEventListener('pointerleave', () => {
      const open = items.findIndex((o) => o.classList.contains('is-on'));
      light(open);
    });

    if (!reduce) {                                  // layers separate as the stack comes into view
      const scene = stack.querySelector('.astack__scene');
      const on = () => {
        const r = scene.getBoundingClientRect();
        const vh = window.innerHeight;
        stack.style.setProperty('--explode', clamp((vh * 0.9 - r.top) / (vh * 0.6), 0, 1).toFixed(3));
      };
      window.addEventListener('scroll', on, { passive: true });
      on();
    }
  }

  /* ---- 4. Industry tabs ------------------------------------------------ */
  const tabs = [...document.querySelectorAll('.ind-tab')];
  const panels = [...document.querySelectorAll('.ind')];
  if (tabs.length) {
    const show = (i, focusTab) => {
      tabs.forEach((t, k) => {
        t.classList.toggle('is-on', k === i);
        t.setAttribute('aria-selected', String(k === i));
        t.tabIndex = k === i ? 0 : -1;
      });
      panels.forEach((p, k) => p.classList.toggle('is-active', k === i));
      if (focusTab) tabs[i].focus();
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => show(i));
      t.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') { e.preventDefault(); show((i + 1) % tabs.length, true); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); show((i + tabs.length - 1) % tabs.length, true); }
      });
    });
    // a link such as solutions/#industries is already in view; nothing else to do
  }
})();
