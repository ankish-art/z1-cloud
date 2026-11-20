/* AI governance: you run the control yourself.
   1. Hero: "Run an output" sends an output through Propose, Gate and Review
   2. Loop: choose what the reviewer does, then run the five steps
   3. Tiers: a control changes how much a person reviews (illustrative)
   4. Trace: link the seven record fields to rebuild a decision
   5. Topic tiles tilt toward the pointer */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(pointer: fine)').matches;
  const wait = (ms) => new Promise((r) => setTimeout(r, reduce ? 0 : ms));

  /* ---- 1. Hero mini loop ----------------------------------------------- */
  const mini = document.querySelector('[data-mini]');
  if (mini) {
    const steps = [...mini.querySelectorAll('.mini__step')];
    const ticks = [...mini.querySelectorAll('.mini__checks li')];
    const btn = mini.querySelector('[data-run]');
    let running = false;
    const at = (i) => {
      mini.style.setProperty('--a', i);
      steps.forEach((s, k) => { s.classList.toggle('is-on', k === i); s.classList.toggle('is-done', k < i); });
    };
    async function run() {
      if (running) return;
      running = true; btn.disabled = true;
      ticks.forEach((t) => t.classList.remove('is-ticked'));
      at(0); await wait(900);
      at(1); await wait(700);
      for (const t of ticks) { t.classList.add('is-ticked'); await wait(450); }
      await wait(400);
      at(2); await wait(600);
      running = false; btn.disabled = false;
    }
    btn.addEventListener('click', run);
    at(0);
    if (!reduce) setTimeout(run, 1600);               // once on arrival; after that, it is yours to run
    else { at(2); ticks.forEach((t) => t.classList.add('is-ticked')); }
  }

  /* ---- 2. The loop ------------------------------------------------------ */
  const loop = document.querySelector('[data-loop]');
  if (loop) {
    const nodes = [...loop.querySelectorAll('.loop__node')];
    const token = loop.querySelector('.loop__token');
    const status = loop.querySelector('.loop__status');
    const track = loop.querySelector('.loop__track');
    const choices = [...loop.querySelectorAll('[data-choice]')];
    const btn = loop.querySelector('[data-run]');
    let choice = 'accept', running = false;

    const place = (i) => {
      const n = nodes[i], t = track.getBoundingClientRect(), r = n.getBoundingClientRect();
      token.style.setProperty('--x', `${r.left - t.left}px`);
      token.style.setProperty('--y', `${r.top - t.top - (n.classList.contains('loop__node--low') ? 0 : 0)}px`);
    };
    const reset = () => { nodes.forEach((n) => n.classList.remove('is-on', 'is-done', 'is-skipped')); };
    const desc = (i) => nodes[i].querySelector('.loop__d').textContent;

    choices.forEach((c) => c.addEventListener('click', () => {
      choice = c.dataset.choice;
      choices.forEach((o) => { o.classList.toggle('is-on', o === c); o.setAttribute('aria-pressed', String(o === c)); });
    }));

    async function run() {
      if (running) return;
      running = true; btn.disabled = true;
      reset();
      const path = choice === 'reject' ? [0, 1, 2, 3, 4] : [0, 1, 2, 4];
      if (choice === 'accept') nodes[3].classList.add('is-skipped');
      for (let k = 0; k < path.length; k++) {
        const i = path[k];
        nodes.forEach((n, j) => { n.classList.toggle('is-on', j === i); if (path.indexOf(j) !== -1 && path.indexOf(j) < k) n.classList.add('is-done'); });
        place(i);
        let line = `${nodes[i].querySelector('.loop__t').textContent}. ${desc(i)}`;
        if (i === 2) line = choice === 'reject' ? 'Review. The reviewer rejects the output.' : 'Review. The reviewer accepts the output.';
        status.textContent = line;
        await wait(1500);
      }
      nodes[path[path.length - 1]].classList.add('is-done');
      status.textContent = choice === 'reject'
        ? 'The rejection was escalated to the accountable owner, and input, output, decision and rationale are recorded.'
        : 'The output was accepted by a named person, and input, output, decision and rationale are recorded.';
      running = false; btn.disabled = false;
    }
    btn.addEventListener('click', run);
    place(0);
    nodes[0].classList.add('is-on');
    window.addEventListener('resize', () => { if (!running) place(Math.max(0, nodes.findIndex((n) => n.classList.contains('is-on')))); });
  }

  /* ---- 3. Tiers --------------------------------------------------------- */
  const tiers = document.querySelector('[data-tiers]');
  if (tiers) {
    const data = [...tiers.querySelectorAll('.tiers__table tbody tr')].map((tr) => [tr.cells[1].textContent, tr.cells[2].textContent]);
    const dots = [...tiers.querySelectorAll('.dot')];
    const pills = [...tiers.querySelectorAll('[data-tier]')];
    const range = tiers.querySelector('.tiers__range');
    const o = tiers.querySelector('[data-o]'), e = tiers.querySelector('[data-e]');
    dots.forEach((d, i) => d.style.setProperty('--k', i));
    // which squares a person reviews at each tier (illustration only)
    const reviewed = [
      () => true,
      (i) => i < 8 || i % 7 === 0,                 // the least confident outputs, plus a sample
      () => false,
    ];
    function set(t) {
      pills.forEach((p, k) => { p.classList.toggle('is-on', k === t); p.setAttribute('aria-checked', String(k === t)); });
      range.value = String(t + 1);
      dots.forEach((d, i) => {
        d.classList.toggle('is-on', reviewed[t](i));
        d.classList.toggle('is-halt', t === 2 && i === 23);          // an automatic halt condition
      });
      tiers.classList.add('is-swapping');
      setTimeout(() => { o.textContent = data[t][0]; e.textContent = data[t][1]; tiers.classList.remove('is-swapping'); }, reduce ? 0 : 220);
    }
    pills.forEach((p, k) => p.addEventListener('click', () => set(k)));
    range.addEventListener('input', () => set(Number(range.value) - 1));
    set(0);
  }

  /* ---- 4. Traceability -------------------------------------------------- */
  const trace = document.querySelector('[data-trace]');
  if (trace) {
    const fields = [...trace.querySelectorAll('.field')];
    const slots = [...trace.querySelectorAll('.slot')];
    const status = trace.querySelector('[data-status]');
    const total = fields.length;
    const render = () => {
      const on = fields.filter((f) => f.getAttribute('aria-pressed') === 'true').length;
      fields.forEach((f, i) => slots[i].classList.toggle('is-linked', f.getAttribute('aria-pressed') === 'true'));
      status.textContent = on === total ? 'Decision rebuilt from one record: all seven fields are linked.' : `${on} of ${total} fields linked.`;
      status.classList.toggle('is-done', on === total);
    };
    fields.forEach((f) => f.addEventListener('click', () => { f.setAttribute('aria-pressed', String(f.getAttribute('aria-pressed') !== 'true')); render(); }));
    trace.querySelector('[data-reset]').addEventListener('click', () => { fields.forEach((f) => f.setAttribute('aria-pressed', 'false')); render(); });
    trace.querySelector('[data-rebuild]').addEventListener('click', async () => {
      fields.forEach((f) => f.setAttribute('aria-pressed', 'false')); render();
      for (const f of fields) { f.setAttribute('aria-pressed', 'true'); render(); await wait(380); }
    });
    render();
  }

  /* ---- 5. Tilt ---------------------------------------------------------- */
  if (fine && !reduce) {
    document.querySelectorAll('.topic__in').forEach((el) => {
      el.addEventListener('pointermove', (ev) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--ry', `${(((ev.clientX - r.left) / r.width) - 0.5) * 10}deg`);
        el.style.setProperty('--rx', `${(((ev.clientY - r.top) / r.height) - 0.5) * -10}deg`);
      });
      el.addEventListener('pointerleave', () => { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); });
    });
  }
})();
