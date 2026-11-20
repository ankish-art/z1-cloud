/* ==========================================================================
   Home page scripts
   1. Hero dot field: pixels light up around the pointer (teal + white)
   2. Controlled workflow model: six-stage ring, pinned and scroll-driven
      on large screens, click/arrow-key driven elsewhere
   3. How we work: active stage marker follows scroll
   No looping motion: the marquee (CSS) is the only loop on the page.
   ========================================================================== */

(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const css = getComputedStyle(document.documentElement);
  const HEADER = parseFloat(css.getPropertyValue('--header-h')) || 80;

  const hexToRgb = (hex) => {
    const h = hex.trim().replace('#', '');
    const n = parseInt(h.length === 3 ? [...h].map((c) => c + c).join('') : h, 16);
    return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
  };

  /* ------------------------------------------------------------------------
     1. Hero dot field
     ------------------------------------------------------------------------ */
  const hero = document.querySelector('.home-hero');
  const cv = hero && hero.querySelector('.home-hero__dots');

  if (cv && cv.getContext && !reduce) {
    const ctx = cv.getContext('2d');
    const G = 14;
    const TINTS = [hexToRgb(css.getPropertyValue('--c-text') || '#FFFFFF'), hexToRgb(css.getPropertyValue('--c-signal') || '#2EE6D6')];
    let cols = 0, rows = 0, lit, tint, raf = 0, wave = 0, visible = true;

    const resize = () => {
      const { width, height } = cv.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = width * dpr;
      cv.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(width / G);
      rows = Math.ceil(height / G);
      lit = new Float32Array(cols * rows);
      tint = new Uint8Array(cols * rows);
    };

    const light = (c, r, v, t) => {
      if (c < 0 || r < 0 || c >= cols || r >= rows) return;
      const k = r * cols + c;
      if (v > lit[k]) { lit[k] = v; tint[k] = t; }
    };

    const start = () => { if (!raf && visible) raf = requestAnimationFrame(frame); };

    // Random bursts: a small group of pixels lights up somewhere in the
    // background every ~0.9s, then fades (as in the base design).
    // NOTE: client request (20 Nov 2026); a looping background effect.
    let lastBurst = 0;
    const burst = () => {
      const c = Math.floor(cols * (0.3 + Math.random() * 0.7));
      const r = Math.floor(rows * (0.08 + Math.random() * 0.7));
      const t = Math.random() < 0.35 ? 1 : 0;
      for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) if (Math.random() < 0.5) light(c + x, r + y, 0.9, t);
      }
    };

    // Pointer lights a small cluster of cells (fine pointers only)
    if (window.matchMedia('(pointer: fine)').matches) {
      hero.addEventListener('pointermove', (e) => {
        const b = cv.getBoundingClientRect();
        const c = Math.floor((e.clientX - b.left) / G);
        const r = Math.floor((e.clientY - b.top) / G);
        for (let y = -2; y <= 2; y++) {
          for (let x = -2; x <= 2; x++) {
            if (Math.random() < 0.3 - (Math.abs(x) + Math.abs(y)) * 0.05) light(c + x, r + y, 0.85, Math.random() < 0.35 ? 1 : 0);
          }
        }
        start();
      });
    }

    function frame(now) {
      raf = 0;
      if (now - lastBurst > 900) { burst(); lastBurst = now; }
      const { width, height } = cv.getBoundingClientRect();
      ctx.clearRect(0, 0, width, height);

      // One diagonal sweep on load, then only the pointer lights cells
      if (wave < cols + rows) {
        const d = Math.floor(wave);
        for (let r = 0; r < rows; r++) if (Math.random() < 0.3) light(d - r, rows - 1 - r, 0.6, Math.random() < 0.15 ? 1 : 0);
        wave += 0.9;
      }

      let active = true; // keep running while the hero is on screen (bursts)
      for (let k = 0; k < lit.length; k++) {
        if (lit[k] < 0.02) continue;
        active = true;
        ctx.fillStyle = `rgba(${TINTS[tint[k]]},${lit[k].toFixed(2)})`;
        ctx.fillRect((k % cols) * G + 5, Math.floor(k / cols) * G + 5, 4, 4);
        lit[k] *= 0.965;
      }
      if (active) start(); // stop the loop when nothing is lit
    }

    resize();
    window.addEventListener('resize', resize);
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; start(); }).observe(hero);
  }

  /* ------------------------------------------------------------------------
     2. Controlled workflow model (blueprint)
        - pinned and scroll-driven on large screens
        - auto-advances while in view on smaller screens (stops on touch/focus)
        - every lap adds records to the ledger and a block to the stack
     ------------------------------------------------------------------------ */
  const section = document.querySelector('.model');
  const ring = section && section.querySelector('.ring');

  if (ring) {
    const stages = [...section.querySelectorAll('.model-list li')].map((li) => ({
      name: li.querySelector('b').textContent,
      desc: li.querySelector('b').nextSibling.textContent.trim(),
      owner: li.dataset.owner,
      control: li.dataset.control,
      evidence: li.dataset.evidence,
    }));
    const nodes = [...ring.querySelectorAll('.ring__node')];
    const progress = ring.querySelector('.ring__progress');
    const $ = (k) => section.querySelector(`[data-${k}]`);
    const head = $('head');
    const marksGroup = $('marks');
    const ledger = $('ledger');
    const laps = $('laps');
    const total = stages.length;
    const pad = (n) => String(n).padStart(2, '0');
    let current = -1;
    let lap = 3;

    // Stage markers on the ring, with direction chevrons between them
    const NS = 'http://www.w3.org/2000/svg';
    const at = (deg, r = 30) => [50 + r * Math.cos((deg * Math.PI) / 180), 50 + r * Math.sin((deg * Math.PI) / 180)];
    const marks = stages.map((_, i) => {
      const [x, y] = at(i * 60 - 90);
      const m = document.createElementNS(NS, 'rect');
      m.setAttribute('class', 'ring__mark');
      Object.entries({ x: x - 1.3, y: y - 1.3, width: 2.6, height: 2.6 }).forEach(([k, v]) => m.setAttribute(k, v));
      marksGroup.append(m);

      const a = i * 60 - 60;
      const [cx, cy] = at(a);
      const rad = (a * Math.PI) / 180;
      const tx = -Math.sin(rad), ty = Math.cos(rad), nx = Math.cos(rad), ny = Math.sin(rad);
      const chev = document.createElementNS(NS, 'polygon');
      chev.setAttribute('class', 'ring__chev');
      chev.setAttribute('points', [
        [cx + tx, cy + ty],
        [cx - tx * 0.6 + nx * 0.7, cy - ty * 0.6 + ny * 0.7],
        [cx - tx * 0.6 - nx * 0.7, cy - ty * 0.6 - ny * 0.7],
      ].map((p) => p.map((n) => n.toFixed(2)).join(',')).join(' '));
      marksGroup.append(chev);
      return m;
    });

    // Lap stack: the live lap on top, earlier laps beneath
    function lapItem(n, live) {
      const li = document.createElement('li');
      li.className = live ? 'lap is-live' : 'lap';
      const icon = typeof sprite === 'function' ? sprite(SPRITES.z, 4) : '';
      li.innerHTML = `<span class="lap-block">${icon}</span><span class="lap-text"><b>Lap ${n}</b><small>${live ? `1 of ${total} records` : `${total} records`}</small></span>`;
      return li;
    }
    laps.append(lapItem(3, true), lapItem(2), lapItem(1));

    function advanceLap() {
      lap++;
      const done = laps.querySelector('.is-live');
      done.classList.remove('is-live');
      done.querySelector('small').textContent = `${total} records`;
      const next = lapItem(lap, true);
      next.classList.add('is-new');
      laps.prepend(next);
      while (laps.children.length > 3) laps.lastElementChild.remove();
    }

    // The ledger lists what this lap has left on the record so far, newest first.
    // Times are illustrative.
    const stamp = (k) => {
      const m = 9 * 60 + 12 + (lap - 3) * 47 + k * 6 + ((k * 7) % 5);
      return `${pad(Math.floor(m / 60) % 24)}:${pad(m % 60)}`;
    };
    function renderLedger(i) {
      ledger.replaceChildren(...stages.slice(0, i + 1).map((s, k) => {
        const li = document.createElement('li');
        if (k === i) li.className = 'is-new';
        const time = document.createElement('time');
        time.textContent = stamp(k);
        const text = document.createElement('span');
        text.textContent = s.evidence;
        li.append(time, text);
        return li;
      }).reverse());
    }

    const detail = section.querySelector('.bp-detail');
    let swapTimer = 0;
    function fill(i) {
      const s = stages[i];
      laps.querySelector('.is-live small').textContent = `${i + 1} of ${total} records`;
      $('step').textContent = `Stage ${pad(i + 1)} of ${pad(total)}`;
      $('name').textContent = s.name;
      $('desc').textContent = s.desc;
      $('owner').textContent = s.owner;
      $('control').textContent = s.control;
      $('evidence').textContent = s.evidence;
      renderLedger(i);
    }

    function show(i) {
      if (i === current) return;
      const first = current === -1;
      current = i;
      nodes.forEach((n, k) => {
        n.classList.toggle('is-on', k === i);
        n.setAttribute('aria-pressed', String(k === i));
        marks[k].classList.toggle('is-on', k === i);
        marks[k].classList.toggle('is-done', k < i);
      });
      progress.style.strokeDasharray = `${i * 100} 600`;
      head.style.transform = `rotate(${(lap - 3) * 360 + i * 60}deg)`;
      // Detail text fades out, swaps, then fades back in (soft, not a cut)
      if (first || reduce) { fill(i); return; }
      detail.classList.add('is-swapping');
      clearTimeout(swapTimer);
      swapTimer = setTimeout(() => { fill(current); detail.classList.remove('is-swapping'); }, 320);
    }
    function select(i) {
      if (i === 0 && current === total - 1) advanceLap();
      show(i);
    }

    // Large screens: pinned, scroll position picks the stage and it stays on
    // the last stage once the scroll is through
    const track = section.querySelector('.model-scroll');
    const pinQuery = window.matchMedia('(min-width: 1081px) and (min-height: 700px)');
    let pinned = false;
    let timer = null;
    const stopAuto = () => { clearInterval(timer); timer = null; };

    const span = () => track.getBoundingClientRect().height - (window.innerHeight - HEADER);
    function onScroll() {
      const p = Math.min(Math.max((HEADER - track.getBoundingClientRect().top) / span(), 0), 0.9999);
      show(Math.floor(p * total));
    }
    function scrollToStage(step) {
      const top = window.scrollY + track.getBoundingClientRect().top - HEADER + (span() * (step + 0.5)) / total;
      window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
    }
    function go(i) {
      if (pinned) scrollToStage(i);
      else { stopAuto(); select(i); }
    }

    nodes.forEach((n, i) => n.addEventListener('click', () => go(i)));
    ring.addEventListener('keydown', (e) => {
      if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(e.key)) return;
      e.preventDefault();
      const fwd = e.key === 'ArrowRight' || e.key === 'ArrowDown';
      const step = pinned ? Math.min(Math.max(current + (fwd ? 1 : -1), 0), total - 1) : (current + (fwd ? 1 : total - 1)) % total;
      go(step);
      nodes[step].focus({ preventScroll: true });
    });

    function setMode() {
      pinned = pinQuery.matches && !reduce;
      section.classList.toggle('is-pinned', pinned);
      if (pinned) { stopAuto(); onScroll(); }
    }
    show(0);
    setMode();
    pinQuery.addEventListener('change', setMode);
    window.addEventListener('scroll', () => { if (pinned) requestAnimationFrame(onScroll); }, { passive: true });

    // Smaller screens: run the loop while it is in view, until the visitor takes over
    if (!reduce) {
      new IntersectionObserver(([e]) => {
        if (e.isIntersecting && !pinned && timer === null && !ring.dataset.touched) {
          timer = setInterval(() => select((current + 1) % total), 4500);
        } else if (!e.isIntersecting) stopAuto();
      }, { threshold: 0.4 }).observe(ring);
      const takeOver = () => { ring.dataset.touched = '1'; stopAuto(); };
      ring.addEventListener('pointerdown', takeOver);
      ring.addEventListener('focusin', takeOver);
    }
  }

  /* ------------------------------------------------------------------------
     2b. The cost of operational friction: a 3D dice (seven-sided drum).
     On large screens the section pins and scroll turns it, one item per face.
     Pointer movement tilts it a little. Elsewhere (phones, short screens,
     reduced motion) the cards stay a plain grid.
     ------------------------------------------------------------------------ */
  const fr = document.getElementById('friction');
  const frTrack = fr && fr.querySelector('.fr-scroll');
  const drum = fr && fr.querySelector('.friction-drum');

  if (drum && frTrack) {
    const faces = [...drum.querySelectorAll(':scope > li.card')];
    const N = faces.length;
    const STEP = 360 / N;
    const rail = fr.querySelector('.fr-rail');
    const stage = fr.querySelector('.fr-stage');
    const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
    const smooth = (t) => t * t * (3 - 2 * t);

    const railBtns = faces.map((li, i) => {
      const item = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      const n = document.createElement('span');
      n.className = 'fr-rail__n';
      n.textContent = String(i + 1).padStart(2, '0');
      const t = document.createElement('span');
      t.textContent = li.querySelector('.friction__title').textContent;
      b.append(n, t);
      b.addEventListener('click', () => scrollToFace(i));
      item.append(b);
      rail.append(item);
      return b;
    });

    let active = false, ang = 0, tgt = 0, px = 0, py = 0, tpx = 0, tpy = 0, raf = 0, front = -1;

    const span = () => frTrack.getBoundingClientRect().height - (window.innerHeight - HEADER);
    function targetAngle() {
      const p = clamp((HEADER - frTrack.getBoundingClientRect().top) / span(), 0, 0.9999);
      const s = p * N, k = Math.floor(s), f = s - k;
      // hold each face for a quarter of its step, turn through the middle half
      const t = clamp((f - 0.25) / 0.5, 0, 1);
      return -STEP * Math.min(k + smooth(t), N - 1);
    }
    function scrollToFace(i) {
      // land inside this face's holding zone (the first quarter of its step), not mid-turn
      const top = window.scrollY + frTrack.getBoundingClientRect().top - HEADER + (span() * (i + 0.1)) / N;
      window.scrollTo({ top, behavior: 'smooth' });
    }

    function paint() {
      drum.style.setProperty('--ry', `${(ang + px).toFixed(2)}deg`);
      drum.style.setProperty('--rx', `${(-6 + py).toFixed(2)}deg`);
      faces.forEach((li, i) => {
        const rel = ((((i * STEP + ang) % 360) + 540) % 360) - 180;      // 0 = facing the viewer
        li.style.setProperty('--shade', (clamp(Math.abs(rel) / 110, 0, 1) * 0.65).toFixed(2));
      });
      const f = clamp(Math.round(-ang / STEP), 0, N - 1);
      if (f !== front) {
        front = f;
        railBtns.forEach((b, i) => b.classList.toggle('is-on', i === f));
        faces.forEach((li, i) => li.classList.toggle('is-front', active && i === f));
      }
    }
    function frame() {
      raf = 0;
      tgt = targetAngle();
      ang += (tgt - ang) * 0.12;
      px += (tpx - px) * 0.1;
      py += (tpy - py) * 0.1;
      paint();
      if (Math.abs(tgt - ang) > 0.05 || Math.abs(tpx - px) > 0.05 || Math.abs(tpy - py) > 0.05) raf = requestAnimationFrame(frame);
    }
    const kick = () => { if (active && !raf) raf = requestAnimationFrame(frame); };

    window.addEventListener('scroll', kick, { passive: true });
    window.addEventListener('resize', kick);
    if (window.matchMedia('(pointer: fine)').matches) {
      stage.addEventListener('pointermove', (e) => {
        const r = stage.getBoundingClientRect();
        tpx = ((e.clientX - r.left) / r.width - 0.5) * 8;
        tpy = ((e.clientY - r.top) / r.height - 0.5) * -5;
        kick();
      });
      stage.addEventListener('pointerleave', () => { tpx = 0; tpy = 0; kick(); });
    }

    // needs room for the heading and the drum together
    const mode = window.matchMedia('(min-width: 1081px) and (min-height: 640px)');
    function setDrum() {
      const on = mode.matches && !reduce;
      if (on === active) return;
      active = on;
      fr.classList.toggle('is-drum', on);
      if (on) { front = -1; ang = targetAngle(); paint(); kick(); }
      else {
        drum.style.removeProperty('--rx');
        drum.style.removeProperty('--ry');
        faces.forEach((li) => { li.style.removeProperty('--shade'); li.classList.remove('is-front'); });
      }
    }
    setDrum();
    mode.addEventListener('change', setDrum);

    // Plain-grid fallback: each card tilts toward the pointer (fine pointers only)
    if (!reduce && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      faces.forEach((li) => {
        li.addEventListener('pointermove', (e) => {
          if (active) return;
          const r = li.getBoundingClientRect();
          li.style.setProperty('--ty', (((e.clientX - r.left) / r.width - 0.5) * 12).toFixed(2) + 'deg');
          li.style.setProperty('--tx', (((e.clientY - r.top) / r.height - 0.5) * -10).toFixed(2) + 'deg');
        });
        li.addEventListener('pointerleave', () => { li.style.removeProperty('--tx'); li.style.removeProperty('--ty'); });
      });
    }
  }

  /* ------------------------------------------------------------------------
     3. How we work: active step + progress marker
     ------------------------------------------------------------------------ */
  const steps = [...document.querySelectorAll('[data-approach-step]')];
  if (steps.length) {
    const update = () => {
      const mid = window.innerHeight * 0.5;
      let active = 0;
      steps.forEach((s, i) => { if (s.getBoundingClientRect().top < mid) active = i; });
      steps.forEach((s, i) => s.classList.toggle('is-active', i === active));
    };
    window.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
    update();
  }
})();
