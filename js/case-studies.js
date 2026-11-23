/* Case studies: scroll-driven examples.
   Pattern borrowed from long-form scrollytelling pages: a tall track holds a
   pinned stage, and the scroll position inside the track drives the motion.
   For each example, scroll progress (0 to 1) sets:
     - which of the six parts is showing (each rises in, holds, rises out)
     - how far the teal line has filled down the rail
     - how much of the workflow drawing is traced, and where its marker sits
   Progress is eased toward its target each frame so it feels smoothed, not jumpy.
   Also: sector filter, index links that scroll to an example, deep links.
   Reduced motion (or no JavaScript): nothing is pinned, the parts read in order. */
(() => {
  const root = document.documentElement;
  const reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const cases = $$('.cs');
  if (!cases.length) return;

  /* ---- per-example state ---------------------------------------------------- */
  const SVGNS = 'http://www.w3.org/2000/svg';
  const items = cases.map((el) => {
    const draw = el.querySelector('.cs-path--draw');
    const len = draw && draw.getTotalLength ? draw.getTotalLength() : 0;
    if (draw && len) { draw.style.strokeDasharray = len; draw.style.strokeDashoffset = len; }

    /* part titles: wrap each word so it can rise on its own (full text kept for screen readers) */
    $$('.cs-part__k', el).forEach((k) => {
      const text = k.textContent.trim().replace(/\s+/g, ' ');
      k.setAttribute('aria-label', text);
      k.innerHTML = text.split(' ').map((w, i) => `<span class="cs-w" aria-hidden="true"><span style="--i:${i}">${w}</span></span>`).join(' ');
    });

    /* a large outlined case number sits behind the stage content for depth */
    const ghost = document.createElement('span');
    ghost.className = 'cs__ghost'; ghost.setAttribute('aria-hidden', 'true');
    const num = el.querySelector('.cs__n'); ghost.textContent = num ? num.textContent.trim() : '';
    el.querySelector('.cs__stage').prepend(ghost);

    /* drawing: add a stage label and a pulse ring to every node */
    const names = $$('.cs-step__t', el).map((t) => t.textContent.trim());
    $$('.cs-node', el).forEach((g, i) => {
      const r = g.querySelector('rect');
      const cx = +r.getAttribute('x') + 16, cy = +r.getAttribute('y') + 16;
      const ring = document.createElementNS(SVGNS, 'circle');
      ring.setAttribute('class', 'cs-ring'); ring.setAttribute('cx', cx); ring.setAttribute('cy', cy); ring.setAttribute('r', 18);
      g.prepend(ring);
      const left = cx > 160;
      const label = document.createElementNS(SVGNS, 'text');
      label.setAttribute('class', 'cs-node__label');
      label.setAttribute('data-side', left ? 'l' : 'r');
      label.setAttribute('x', left ? cx - 28 : cx + 28);
      label.setAttribute('y', cy + 4);
      if (left) label.setAttribute('text-anchor', 'end');
      label.textContent = names[i] || '';
      g.append(label);
    });

    return {
      lastActive: -1,
      el,
      track: el.querySelector('.cs__track'),
      stage: el.querySelector('.cs__stage'),
      rail: el.querySelector('.cs__rail'),
      parts: $$('.cs-part', el),
      steps: $$('.cs-step', el),
      nodes: $$('.cs-node', el),
      draw, len,
      marker: el.querySelector('.cs-marker'),
      target: 0, cur: 0,
    };
  });

  const render = (it, p) => {
    const n = it.parts.length;
    const active = Math.min(n - 1, Math.floor(p * n));
    const f = clamp((p * n - 0.5) / (n - 1));           // 0 at part 1, 1 at part n

    it.parts.forEach((part, i) => {
      const local = p * n - i;                           // 0..1 while part i is current
      const enter = i === 0 ? 1 : easeOut(clamp(local / 0.22));
      const exit = i === n - 1 ? 0 : clamp((local - 0.78) / 0.22);
      const e2 = i === 0 ? 1 : easeOut(clamp((local - 0.1) / 0.24));   // lags the title: index and paragraph follow
      part.style.opacity = (enter * (1 - exit)).toFixed(3);
      part.style.transform = `translateY(${((1 - enter) * 24 - exit * 48).toFixed(1)}px)`;
      part.style.setProperty('--e', enter.toFixed(3));
      part.style.setProperty('--e2', e2.toFixed(3));
      part.classList.toggle('is-on', i === active);
    });
    it.stage.style.setProperty('--p', p.toFixed(4));

    if (active !== it.lastActive) {                       // one-shot ring on the node that just became current
      const nd = it.nodes[active];
      if (nd && it.lastActive !== -1) { nd.classList.remove('pulse'); void nd.getBoundingClientRect(); nd.classList.add('pulse'); }
      it.lastActive = active;
    }

    it.rail.style.setProperty('--f', f.toFixed(4));
    it.steps.forEach((s, i) => {
      s.classList.toggle('is-on', i === active);
      s.classList.toggle('is-done', i < active);
      if (i === active) s.setAttribute('aria-current', 'step'); else s.removeAttribute('aria-current');
    });

    if (it.draw && it.len) {
      it.draw.style.strokeDashoffset = (it.len * (1 - f)).toFixed(2);
      if (it.marker) {
        const pt = it.draw.getPointAtLength(it.len * f);
        it.marker.setAttribute('transform', `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})`);
      }
      it.nodes.forEach((nd, i) => {
        nd.classList.toggle('is-lit', f * (n - 1) >= i - 0.02);
        nd.classList.toggle('is-on', i === active);
      });
    }
  };

  const clearInline = (it) => {
    it.parts.forEach((p) => { p.style.opacity = ''; p.style.transform = ''; p.classList.remove('is-on'); });
    it.steps.forEach((s) => { s.classList.remove('is-on', 'is-done'); s.removeAttribute('aria-current'); });
    it.nodes.forEach((nd) => nd.classList.remove('is-lit', 'is-on'));
    if (it.draw && it.len) it.draw.style.strokeDashoffset = it.len;
  };

  /* ---- scroll to progress, with smoothing -------------------------------------- */
  const stickyTop = (it) => parseFloat(getComputedStyle(it.stage).top) || 0;
  const scrollable = (it) => Math.max(1, it.track.offsetHeight - it.stage.offsetHeight);
  const progressOf = (it) => clamp((stickyTop(it) - it.track.getBoundingClientRect().top) / scrollable(it));

  let raf = 0;
  const frame = () => {
    raf = 0;
    let moving = false;
    items.forEach((it) => {
      if (it.el.hidden) return;
      const d = it.target - it.cur;
      it.cur = Math.abs(d) < 0.0005 ? it.target : it.cur + d * 0.14;
      if (it.cur !== it.target) moving = true;
      render(it, it.cur);
    });
    if (moving) raf = requestAnimationFrame(frame);
  };
  const onScroll = () => {
    if (!root.classList.contains('cs-pinned')) return;
    items.forEach((it) => { if (!it.el.hidden) it.target = progressOf(it); });
    if (!raf) raf = requestAnimationFrame(frame);
  };

  /* ---- parallax: header and hero layers move at different speeds ---------------- */
  const hero = document.querySelector('.cs-hero');
  const heads = cases.map((c) => c.querySelector('.cs__head'));
  let parRaf = 0;
  const parallax = () => {
    parRaf = 0;
    if (!root.classList.contains('cs-pinned')) return;
    const vh = window.innerHeight;
    if (hero) hero.style.setProperty('--hy', clamp(window.scrollY, 0, vh * 1.2).toFixed(1));
    heads.forEach((h, i) => {
      if (cases[i].hidden) return;
      const r = h.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      h.style.setProperty('--hp', clamp(((r.top + r.height / 2) - vh / 2) / vh, -1, 1).toFixed(3));
    });
  };
  const queueParallax = () => { if (!parRaf) parRaf = requestAnimationFrame(parallax); };
  window.addEventListener('scroll', queueParallax, { passive: true });

  const setPinned = () => {
    const on = !reduceMQ.matches;
    root.classList.toggle('cs-pinned', on);
    if (on) { items.forEach((it) => { it.cur = it.target = it.el.hidden ? 0 : progressOf(it); render(it, it.cur); }); }
    else items.forEach(clearInline);
    queueParallax();
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => { setPinned(); });
  if (reduceMQ.addEventListener) reduceMQ.addEventListener('change', setPinned);
  setPinned();

  /* ---- jump to a part from the rail ---------------------------------------------- */
  const goTo = (it, i) => {
    const n = it.parts.length;
    const y = window.scrollY + it.track.getBoundingClientRect().top - stickyTop(it) + scrollable(it) * ((i + 0.5) / n);
    window.scrollTo({ top: y, behavior: reduceMQ.matches ? 'auto' : 'smooth' });
  };
  items.forEach((it) => {
    it.steps.forEach((s, i) => s.addEventListener('click', () => goTo(it, i)));
    it.nodes.forEach((nd, i) => nd.addEventListener('click', () => { if (root.classList.contains('cs-pinned')) goTo(it, i); }));

    /* cursor parallax: the drawing drifts a few pixels toward the pointer */
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      it.stage.addEventListener('pointermove', (e) => {
        if (reduceMQ.matches) return;
        const r = it.stage.getBoundingClientRect();
        it.stage.style.setProperty('--px', (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
        it.stage.style.setProperty('--py', (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
      });
      it.stage.addEventListener('pointerleave', () => { it.stage.style.setProperty('--px', 0); it.stage.style.setProperty('--py', 0); });
    }
  });

  /* ---- index links and deep links ------------------------------------------------- */
  const showCase = (id) => {
    const cs = document.getElementById(id);
    if (!cs || !cs.classList.contains('cs')) return false;
    if (cs.hidden) setFilter('all');
    cs.scrollIntoView({ behavior: reduceMQ.matches ? 'auto' : 'smooth', block: 'start' });
    return true;
  };
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-open]');
    if (!a) return;
    e.preventDefault();
    history.replaceState(null, '', '#' + a.dataset.open);
    showCase(a.dataset.open);
  });
  window.addEventListener('hashchange', () => showCase(location.hash.slice(1)));

  /* ---- filter ---------------------------------------------------------------------- */
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
        const done = () => { if (cs.classList.contains('is-out')) { cs.hidden = true; onScroll(); } };
        reduceMQ.matches ? done() : setTimeout(done, 350);
      }
    });
    if (shown) shown.textContent = n;
    onScroll();
  }
  chips.forEach((c) => c.addEventListener('click', () => setFilter(c.dataset.filter)));

  if (location.hash) requestAnimationFrame(() => showCase(location.hash.slice(1)));
})();
