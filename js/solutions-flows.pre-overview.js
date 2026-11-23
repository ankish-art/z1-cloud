/* Solutions: workflow diagrams.
   Each area is explained by a small workflow. A teal token walks it step by step, nodes light as it
   passes, and a caption under the diagram says what happens at that step. Click a node to jump to it.
   The last area ("Together") joins all four into one case, end to end.
   - Runs only while its area is on screen (solutions-stage.js sets .is-active)
   - Reduced motion: no auto-play; the finished diagram is shown and nodes are still clickable */
(() => {
  const NS = 'http://www.w3.org/2000/svg';
  const W = 720;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DWELL = 2300;

  /* ------------------------------------------------------------------ specs
     node: { id, t (label), x, y, w, h, k: 'out' | 'bar' | 'gate', lane }
     edge: [from, to, route, dashed, label]   route: h, v, vh, hvh, vhv
     d: caption per node id */
  const row = (ids, labels, x0, step, y, w, h, extra = {}) => ids.map((id, i) => ({ id, t: labels[i], x: x0 + i * step, y, w, h, ...extra }));

  const SPECS = {
    'financial-crime': {
      h: 180,
      nodes: [
        ...row(['alert', 'triage', 'invest', 'decide', 'qa', 'close'], ['Alert or referral', 'Triage and risk rating', 'Investigation', 'Analyst decision', 'Second-line QA', 'Disposition or SAR'], 0, 124, 18, 100, 48),
        { id: 'rec', t: 'One case record, kept as the work happens', x: 0, y: 128, w: 720, h: 40, k: 'bar out' },
      ],
      edges: [['alert', 'triage', 'h'], ['triage', 'invest', 'h'], ['invest', 'decide', 'h'], ['decide', 'qa', 'h'], ['qa', 'close', 'h']],
      ticks: { to: 'rec', from: ['alert', 'triage', 'invest', 'decide', 'qa', 'close'] },
      seq: ['alert', 'triage', 'invest', 'decide', 'qa', 'close', 'rec'],
      d: {
        alert: 'A system alert or a referral opens the case. Nothing is handled by email.',
        triage: 'Risk rating decides the route and the clock, not who saw it first.',
        invest: 'Notes, documents and checks are attached to the one case record.',
        decide: 'A named analyst decides, and the reason is captured with the decision.',
        qa: 'Second line checks quality while the case runs, not after the fact.',
        close: 'The case is closed or a SAR is filed, and the evidence is retained.',
        rec: 'Every step above was logged as it happened, so the evidence already exists when a supervisor asks.',
      },
    },

    compliance: {
      h: 190,
      nodes: [
        ...row(['obl', 'ctl', 'own', 'evi'], ['Obligation mapped', 'Control designed', 'Owner assigned', 'Evidence captured'], 50, 128, 12, 108, 48),
        { id: 'tst', t: 'Control tested', x: 434, y: 130, w: 108, h: 48 },
        { id: 'att', t: 'Attestation recorded', x: 286, y: 130, w: 108, h: 48, k: 'out' },
        { id: 'rem', t: 'Issues remediated', x: 582, y: 130, w: 108, h: 48 },
      ],
      edges: [['obl', 'ctl', 'h'], ['ctl', 'own', 'h'], ['own', 'evi', 'h'], ['evi', 'tst', 'v'], ['tst', 'att', 'h', false, 'pass'], ['tst', 'rem', 'h', true, 'issue'], ['rem', 'evi', 'vh', true]],
      seq: ['obl', 'ctl', 'own', 'evi', 'tst', 'rem', 'evi', 'tst', 'att'],
      d: {
        obl: 'Each regulatory obligation is mapped to the control that meets it.',
        ctl: 'The control is written so it can be tested, not just read.',
        own: 'One named owner, so continuity never depends on who is available.',
        evi: 'Evidence is captured as the control runs, in a single record.',
        tst: 'Second line tests the control against that evidence.',
        rem: 'A failed test sends the issue to remediation, with its age and root cause visible. Then the evidence is captured again.',
        att: 'Once the test passes, attestation is recorded and overdue responses are escalated.',
      },
    },

    airtable: {
      h: 190,
      nodes: [
        ...row(['exp', 'wf', 'orch', 'ai', 'sor'], ['Experience', 'Workflow and control', 'Orchestration', 'AI services', 'Systems of record'], 0, 152, 38, 112, 48),
        { id: 'gate', t: 'Approval gate', x: 446, y: 4, w: 132, h: 22, k: 'gate' },
        { id: 'aud', t: 'Audit and assurance', x: 0, y: 138, w: 720, h: 40, k: 'bar out' },
      ],
      edges: [['exp', 'wf', 'h'], ['wf', 'orch', 'h'], ['orch', 'ai', 'h'], ['ai', 'sor', 'h']],
      ticks: { to: 'aud', from: ['exp', 'wf', 'orch', 'ai', 'sor'] },
      seq: ['exp', 'wf', 'orch', 'ai', 'sor', 'aud'],
      d: {
        exp: 'People work in role-specific views and forms, with controlled data capture.',
        wf: 'Airtable holds the schema, the permissions and the approval gates for the work.',
        orch: 'A tool such as Make, n8n, Zapier or Workato moves data, with retries and run monitoring.',
        ai: 'Model calls sit behind an approval gate, and every output is logged with the reviewer.',
        sor: 'Core banking, KYC and screening systems stay the system of record.',
        aud: 'Activity logs and a control evidence index stay open to independent testing.',
      },
    },

    together: {
      h: 244,
      lanes: ['Industries', 'Compliance', 'Financial crime', 'Airtable'],
      nodes: [
        { id: 'ind', t: 'Sector context', x: 122, y: 6, w: 98, h: 44, lane: 0 },
        { id: 'obl', t: 'Obligation mapped', x: 220, y: 66, w: 98, h: 44, lane: 1 },
        { id: 'alert', t: 'Case opened', x: 318, y: 126, w: 98, h: 44, lane: 2 },
        { id: 'case', t: 'Runs on one platform', x: 416, y: 186, w: 98, h: 44, lane: 3 },
        { id: 'decide', t: 'Analyst decides', x: 514, y: 126, w: 98, h: 44, lane: 2 },
        { id: 'evid', t: 'Evidence retained', x: 612, y: 66, w: 98, h: 44, lane: 1, k: 'out' },
      ],
      edges: [['ind', 'obl', 'vhv'], ['obl', 'alert', 'vhv'], ['alert', 'case', 'vhv'], ['case', 'decide', 'vhv'], ['decide', 'evid', 'vhv']],
      seq: ['ind', 'obl', 'alert', 'case', 'decide', 'evid'],
      d: {
        ind: 'Start with the sector. Its regulator and its risks set the rules for everything after.',
        obl: 'Compliance turns each obligation into a control with an owner and a test.',
        alert: 'Financial crime operations open a case when an alert fires, and triage sets the route.',
        case: 'The case runs on one platform: forms, approvals, automation, and AI behind a gate.',
        decide: 'A named person decides, and the reason is recorded with the decision.',
        evid: 'Evidence is kept as a by-product, ready for audit or the regulator.',
      },
    },
  };

  /* industries are data-driven from the panels already in the page */
  function sectorSpec(i) {
    const tabs = [...document.querySelectorAll('.ind-tab')];
    const panels = [...document.querySelectorAll('.ind')];
    const name = tabs[i] ? tabs[i].textContent.trim() : '';
    const p = panels[i];
    const lead = p ? p.querySelector('.sol-lead').textContent.trim() : '';
    const wfs = p ? [...p.querySelectorAll('.ind__list li')].map((li) => li.textContent.trim()).slice(0, 3) : [];
    const nodes = [{ id: 'hub', t: 'Shared control layer', x: 0, y: 55, w: 190, h: 90 }];
    const edges = [];
    const d = { hub: lead };
    wfs.forEach((t, k) => {
      nodes.push({ id: 'w' + k, t, x: 310, y: 4 + k * 66, w: 410, h: 48, k: k === wfs.length - 1 ? '' : '' });
      edges.push(['hub', 'w' + k, 'hvh']);
      d['w' + k] = `Runs on the same controls, set up for ${name.toLowerCase()}.`;
    });
    return { h: 200, nodes, edges, seq: ['hub', ...wfs.map((_, k) => 'w' + k)], d };
  }

  /* ----------------------------------------------------------------- engine */
  function el(tag, attrs = {}, cls) {
    const e = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
    if (cls) e.setAttribute('class', cls);
    return e;
  }

  function Diagram(root, getSpec) {
    let spec, byId, nodeEls, edgeEls, tokenEl, capT, capD, capN, canvas, svg, wrap, laneEls;
    let step = -1, timer = 0, auto = true, active = false;

    function build() {
      stop();
      spec = getSpec();
      root.innerHTML = '';
      wrap = document.createElement('div'); wrap.className = 'wf__wrap';
      canvas = document.createElement('div'); canvas.className = 'wf__canvas'; canvas.style.width = W + 'px'; canvas.style.height = spec.h + 'px';
      svg = el('svg', { viewBox: `0 0 ${W} ${spec.h}`, width: W, height: spec.h, 'aria-hidden': 'true' }, 'wf__edges');
      svg.innerHTML = '<defs><marker id="wf-a" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L8 4L0 8z" class="wf__arrow"/></marker><marker id="wf-a-on" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L8 4L0 8z" class="wf__arrow wf__arrow--on"/></marker></defs>';
      canvas.appendChild(svg);

      byId = {};
      spec.nodes.forEach((n) => { byId[n.id] = { ...n, cx: n.x + n.w / 2, cy: n.y + n.h / 2, r: n.x + n.w, b: n.y + n.h }; });

      /* lanes (Together) */
      laneEls = [];
      if (spec.lanes) {
        spec.lanes.forEach((name, i) => {
          const y = i * 60;
          svg.appendChild(el('line', { x1: 0, x2: W, y1: y + 58, y2: y + 58 }, 'wf__laneline'));
          const lab = document.createElement('span'); lab.className = 'wf__lane'; lab.textContent = name; lab.style.top = y + 'px';
          canvas.appendChild(lab); laneEls.push(lab);
        });
      }

      /* ticks from steps down to a record bar */
      if (spec.ticks) {
        const bar = byId[spec.ticks.to];
        spec.ticks.from.forEach((id) => { const n = byId[id]; svg.appendChild(el('line', { x1: n.cx, x2: n.cx, y1: n.b, y2: bar.y }, 'wf__tick')); });
      }

      /* edges */
      edgeEls = spec.edges.map(([a, b, route, dashed, label]) => {
        const A = byId[a], B = byId[b];
        let d;
        if (route === 'h') { d = A.cx < B.cx ? `M${A.r} ${A.cy}H${B.x}` : `M${A.x} ${A.cy}H${B.r}`; }
        else if (route === 'v') { d = A.cy < B.cy ? `M${A.cx} ${A.b}V${B.y}` : `M${A.cx} ${A.y}V${B.b}`; }
        else if (route === 'vh') { d = `M${A.cx} ${A.cy > B.cy ? A.y : A.b}V${B.cy}H${A.cx < B.cx ? B.x : B.r}`; }
        else if (route === 'hvh') { const mx = (A.r + B.x) / 2; d = `M${A.r} ${A.cy}H${mx}V${B.cy}H${B.x}`; }
        else { const down = B.cy > A.cy; const y1 = down ? A.b : A.y, y2 = down ? B.y : B.b; const my = (y1 + y2) / 2; d = `M${A.cx} ${y1}V${my}H${B.cx}V${y2}`; }
        const p = el('path', { d, 'marker-end': 'url(#wf-a)' }, 'wf__edge' + (dashed ? ' is-dash' : ''));
        svg.appendChild(p);
        if (label) { const t = document.createElement('span'); t.className = 'wf__elabel'; t.textContent = label; t.style.left = ((A.cx + B.cx) / 2) + 'px'; t.style.top = ((A.cy + B.cy) / 2 - 20) + 'px'; canvas.appendChild(t); }
        return { a, b, p };
      });

      /* nodes */
      nodeEls = {};
      spec.nodes.forEach((n) => {
        const kinds = (n.k || '').split(' ');
        const isBar = kinds.includes('bar'), isGate = kinds.includes('gate');
        const b = document.createElement(isGate ? 'span' : 'button');
        if (!isGate) b.type = 'button';
        b.className = 'wf__n' + kinds.filter(Boolean).map((k) => ' wf__n--' + k).join('');
        b.style.cssText = `left:${n.x}px;top:${n.y}px;width:${n.w}px;height:${n.h}px`;
        b.innerHTML = (isBar ? '<i class="wf__fill"></i>' : '') + `<span class="wf__nt">${n.t}</span>`;
        if (!isGate) b.addEventListener('click', () => { const k = spec.seq.indexOf(n.id); if (k >= 0) { stop(); auto = false; go(k); } });
        canvas.appendChild(b);
        nodeEls[n.id] = b;
      });

      tokenEl = document.createElement('span'); tokenEl.className = 'wf__token'; tokenEl.setAttribute('aria-hidden', 'true');
      canvas.appendChild(tokenEl);
      wrap.appendChild(canvas);

      const cap = document.createElement('div'); cap.className = 'wf__cap'; cap.setAttribute('aria-live', 'polite');
      cap.innerHTML = '<p class="wf__n0"></p><p class="wf__t"></p><p class="wf__d"></p>';
      capN = cap.querySelector('.wf__n0'); capT = cap.querySelector('.wf__t'); capD = cap.querySelector('.wf__d');
      root.append(wrap, cap);
      scale();
      step = -1;
      go(reduce ? spec.seq.length - 1 : 0, true);
    }

    function scale() {
      if (!wrap) return;
      const w = root.clientWidth || W;
      const s = Math.min(Math.max(w / W, 0.78), 1.15);
      canvas.style.transform = `scale(${s})`;
      wrap.style.height = spec.h * s + 'px';
      wrap.style.overflowX = w / W < 0.78 ? 'auto' : 'visible';
    }

    function go(k, silent) {
      step = k;
      const id = spec.seq[k];
      const seen = new Set(spec.seq.slice(0, k + 1));
      Object.entries(nodeEls).forEach(([nid, e]) => { e.classList.toggle('is-on', nid === id); e.classList.toggle('is-done', nid !== id && seen.has(nid)); });
      edgeEls.forEach(({ a, b, p }) => { const lit = seen.has(a) && seen.has(b); p.classList.toggle('is-lit', lit); p.setAttribute('marker-end', lit ? 'url(#wf-a-on)' : 'url(#wf-a)'); });
      const N = byId[id];
      tokenEl.style.transform = `translate(${N.x - 6}px, ${N.y - 6}px)`;
      tokenEl.style.opacity = reduce ? 0 : 1;
      if (laneEls.length) laneEls.forEach((l, i) => l.classList.toggle('is-on', N.lane === i));
      const bars = Object.values(nodeEls).filter((e) => e.classList.contains('wf__n--bar'));
      bars.forEach((b) => b.style.setProperty('--p', ((k + 1) / spec.seq.length).toFixed(3)));
      capN.textContent = `Step ${k + 1} of ${spec.seq.length}`;
      capT.textContent = N.t;
      capD.textContent = spec.d[id] || '';
      if (!silent) { capT.style.animation = 'none'; capD.style.animation = 'none'; void capT.offsetWidth; capT.style.animation = ''; capD.style.animation = ''; }
    }

    function tick() {
      timer = setTimeout(() => {
        if (step >= spec.seq.length - 1) { timer = setTimeout(() => { go(0); tick(); }, 3200); return; }
        go(step + 1); tick();
      }, DWELL);
    }
    function stop() { clearTimeout(timer); timer = 0; }
    function start() { if (reduce || !auto || timer) return; go(0); tick(); }

    return {
      rebuild: build,
      setActive(on) { active = on; if (on) { auto = true; if (!spec) build(); start(); } else { stop(); } },
      scale,
    };
  }

  /* --------------------------------------------------------------- wiring */
  const diagrams = [];
  document.querySelectorAll('.sol-stage[data-wf]').forEach((stage) => {
    const key = stage.dataset.wf;
    const root = stage.querySelector('[data-wf-root]');
    if (!root) return;
    const isInd = key === 'industries';
    const d = Diagram(root, () => (isInd ? sectorSpec(Math.max(0, [...document.querySelectorAll('.ind-tab')].findIndex((t) => t.classList.contains('is-on')))) : SPECS[key]));
    if (isInd) stage.classList.add('wf-ind');
    diagrams.push({ stage, d });
    d.rebuild();
    let was = null;
    const sync = () => { const on = stage.classList.contains('is-active'); if (on !== was) { was = on; d.setActive(on); } };
    new MutationObserver(sync).observe(stage, { attributes: true, attributeFilter: ['class'] });
    sync();
  });
  document.addEventListener('sectorchange', () => {
    const f = diagrams.find((x) => x.stage.dataset.wf === 'industries');
    if (f) { f.d.rebuild(); f.d.setActive(f.stage.classList.contains('is-active')); }
  });
  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(() => diagrams.forEach((x) => x.d.scale()));
    diagrams.forEach((x) => ro.observe(x.stage));
  }
  /* diagrams are drawn: hide the plain industry panels */
  document.documentElement.classList.add('wf-ready');
})();
