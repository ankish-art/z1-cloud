/* Services guide: Zi, a 3D robot assistant that lives in the sticky left column.
   - Walks to each stage's station as you scroll, waves, and explains the stage
   - Click a stage (dots, hero map, a station in the 3D scene) and Zi runs there while the page scrolls
   - Open a service and Zi reacts with a one-line summary of it
   - Model: embedded in js/vendor/robot-data.js so it works even from file://.
     If it fails to parse, a simple box robot stands in. No WebGL: the bubble works on its own. */
(() => {
  const guide = document.querySelector('.guide');
  if (!guide) return;
  const canvas = guide.querySelector('.guide__canvas');
  const stageEl = guide.querySelector('.guide__stage');
  const elTitle = guide.querySelector('.guide__t');
  const elSay = guide.querySelector('.guide__say');
  const elLinks = guide.querySelector('.guide__links');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const HEAD = ['discover', 'design', 'build', 'govern', 'assure'];

  const STAGES = [
    { name: 'Discover', say: 'I start by watching the real work, not by reading the procedure. That is how we find the workarounds nobody wrote down.', links: [['svc-05', 'Workflow Discovery'], ['svc-06', 'Workflow Teardown']],
      time: 'Discovery runs four to six weeks and closes with a validation workshop. A teardown of one workflow takes two to three weeks.',
      get: 'Validated maps of what really happens, a register of workarounds, and a prioritised list of where to act first.' },
    { name: 'Design', say: 'Next we agree one target that technology, risk and operations can all sign, before anything gets built.', links: [['svc-07', 'Automation Architecture'], ['svc-03', 'Operational Transformation']],
      time: 'Architecture is a review, a reference design and a governance pack. Transformation runs as a phased programme alongside your own team.',
      get: 'A reference architecture, an access and change control model, and a target operating model with controls mapped.' },
    { name: 'Build', say: 'Now I automate the rules-driven steps. The controls travel with them, not after them.', links: [['svc-01', 'Regulatory Workflow Automation'], ['svc-04', 'System Integration']],
      time: 'Automation starts with a fixed-scope design sprint, then staged releases. Integration goes assess, design, then build and test.',
      get: 'Automated steps documented to a standard second line can test, and reconciliation controls with exception queues.' },
    { name: 'Govern', say: 'AI joins the workflow here. It proposes, a named person decides, and the decision is recorded.', links: [['svc-02', 'Controlled AI Workflows'], ['svc-08', 'AI Governance Design']],
      time: 'AI workflows go assessment, controlled pilot, production design, with a go or no-go at each step. Governance design is four to six weeks plus rollout support.',
      get: 'AI use cases approved with risk tiering, a use-case register, and approval, escalation and monitoring procedures.' },
    { name: 'Assure', say: 'Last, every change is tested and logged, so the evidence is ready before anyone asks for it.', links: [['svc-10', 'Delivery Assurance'], ['svc-09', 'Process Optimisation']],
      time: 'Optimisation starts with a baseline, then targeted redesign, and ends with a measurement framework your team keeps running.',
      get: 'Evidence of testing and sign-off for audit, baseline and target metrics, and less rework and queue time.' },
  ];

  /* ------------------------------------------------------------- speech bubble */
  let typeTimer = 0, spoken = false;
  function speak(title, text, links) {
    spoken = true;
    clearInterval(typeTimer);
    elTitle.textContent = title;
    elLinks.classList.remove('is-shown');
    elLinks.innerHTML = (links || []).map(([id, n]) => `<a href="#${id}">${n}</a>`).join('');
    if (reduce) { elSay.textContent = text; elSay.classList.remove('is-typing'); elLinks.classList.add('is-shown'); return; }
    let n = 0;
    elSay.textContent = '';
    elSay.classList.add('is-typing');
    typeTimer = setInterval(() => {
      n += 2;
      elSay.textContent = text.slice(0, n);
      if (n >= text.length) { clearInterval(typeTimer); elSay.classList.remove('is-typing'); elLinks.classList.add('is-shown'); }
    }, 22);
  }
  const sayStage = (i) => speak(`Stage ${i + 1}: ${STAGES[i].name}`, STAGES[i].say, STAGES[i].links);
  function thinking(i, label) {
    clearInterval(typeTimer);
    elTitle.textContent = label || `Stage ${i + 1}: ${STAGES[i].name}`;
    elSay.textContent = '';
    elSay.classList.remove('is-typing');
    elLinks.classList.remove('is-shown');
  }

  /* ----------------------------------------------------------------- 3D robot */
  let api = null;
  function init3d() {
    const THREE = window.THREE;
    if (!THREE) return false;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch (e) { return false; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const token = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
    const cText = new THREE.Color(token('--c-text') || 'white');
    const cAccent = new THREE.Color(token('--c-accent') || 'orange');
    const cSignal = new THREE.Color(token('--c-signal') || 'cyan');
    const cBase = new THREE.Color(token('--c-primary') || 'black');
    const cSlate = new THREE.Color(token('--c-secondary') || '#1B2129');

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1.25, 0.1, 100);
    /* studio lighting: a soft reflective environment, a warm key with shadows, a teal rim from behind */
    const studio = new THREE.Scene();
    studio.background = new THREE.Color(0x0b0f14);
    const panelAt = (w, h, x, y, z, lum) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(lum, lum, lum), side: THREE.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); studio.add(m); };
    panelAt(14, 6, 0, 10, 4, 6); panelAt(6, 10, -10, 3, 2, 3); panelAt(6, 10, 10, 3, 2, 2.2); panelAt(10, 4, 0, 2, -9, 1.6);
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(studio, 0.04).texture;
    scene.add(new THREE.HemisphereLight(0xffffff, 0x1b2129, 0.55));
    const sun = new THREE.DirectionalLight(0xfff3e0, 2.2);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 1, far: 20 });
    sun.shadow.camera.updateProjectionMatrix();
    sun.shadow.bias = -0.0005;
    sun.shadow.radius = 5;
    scene.add(sun, sun.target);
    const rim = new THREE.DirectionalLight(cSignal, 1.6);
    rim.position.set(-3, 4, -6);
    scene.add(rim);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 6), new THREE.ShadowMaterial({ opacity: 0.55 }));
    floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0.003, 1.3); floor.receiveShadow = true;
    scene.add(floor);
    const grid = new THREE.GridHelper(80, 80, cText, cText);
    grid.material.transparent = true; grid.material.opacity = 0.12;
    scene.add(grid);

    const GAP = 4.4;
    const sx = (i) => i * GAP;
    const standX = (i) => sx(i) - 1.9;
    const edges = (geo, color) => new THREE.LineSegments(new THREE.EdgesGeometry(geo, 20), new THREE.LineBasicMaterial({ color }));
    const solid = (geo) => new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: cBase }));

    const pathLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-8, 0.01, 1.3), new THREE.Vector3(sx(4) + 8, 0.01, 1.3)]),
      new THREE.LineDashedMaterial({ color: cSignal, dashSize: 0.25, gapSize: 0.2, transparent: true, opacity: 0.5 }));
    pathLine.computeLineDistances();
    scene.add(pathLine);

    /* stations */
    const stations = STAGES.map((st, i) => {
      const g = new THREE.Group();
      g.position.set(sx(i), 0, -1.1);
      g.userData.stage = i;
      const ped = new THREE.CylinderGeometry(1.0, 1.2, 0.3, 6);
      g.add(solid(ped), edges(ped, cText));
      const top = new THREE.Group();
      top.position.y = 1.1;
      const add = (geo, x = 0, y = 0, z = 0) => { [solid(geo), edges(geo, cText)].forEach((o) => { o.position.set(x, y, z); top.add(o); }); };
      if (i === 0) { add(new THREE.TorusGeometry(0.5, 0.07, 8, 24), -0.15, 0.2, 0); add(new THREE.CylinderGeometry(0.06, 0.06, 0.6, 6), 0.3, -0.25, 0); top.children.slice(-2).forEach((o) => { o.rotation.z = Math.PI / 4; }); }
      if (i === 1) { add(new THREE.BoxGeometry(0.5, 0.5, 0.5), -0.6, 0, 0); add(new THREE.BoxGeometry(0.5, 0.5, 0.5), 0, 0.35, 0); add(new THREE.BoxGeometry(0.5, 0.5, 0.5), 0.6, 0, 0); }
      if (i === 2) { add(new THREE.BoxGeometry(0.5, 0.5, 0.5), -0.75, 0, 0); add(new THREE.BoxGeometry(0.5, 0.5, 0.5), 0.75, 0, 0); add(new THREE.BoxGeometry(0.9, 0.12, 0.12), 0, 0, 0); add(new THREE.OctahedronGeometry(0.22), 0, 0.3, 0); }
      if (i === 3) { const sh = new THREE.Shape(); sh.moveTo(-0.5, 0.5); sh.lineTo(0.5, 0.5); sh.lineTo(0.5, 0); sh.lineTo(0, -0.6); sh.lineTo(-0.5, 0); sh.closePath(); add(new THREE.ExtrudeGeometry(sh, { depth: 0.15, bevelEnabled: false }), 0, 0.1, -0.07); }
      if (i === 4) { add(new THREE.CylinderGeometry(0.04, 0.04, 1.3, 6), -0.3, 0, 0); add(new THREE.BoxGeometry(0.8, 0.45, 0.05), 0.1, 0.4, 0); }
      g.add(top);
      const ring = new THREE.Mesh(new THREE.RingGeometry(1.3, 1.42, 48), new THREE.MeshBasicMaterial({ color: cAccent, transparent: true, opacity: 0, side: THREE.DoubleSide }));
      ring.rotation.x = -Math.PI / 2; ring.position.y = 0.02;
      g.add(ring);
      /* a generous invisible hit area for clicks */
      const hit = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 3, 8), new THREE.MeshBasicMaterial({ visible: false }));
      hit.position.y = 1.5; hit.userData.stage = i;
      g.add(hit);
      /* name tag */
      const c = document.createElement('canvas'); c.width = 512; c.height = 128;
      const tag = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true }));
      tag.scale.set(2.4, 0.6, 1); tag.position.y = 2.7;
      g.add(tag);
      const drawTag = () => {
        const x = c.getContext('2d'); x.clearRect(0, 0, 512, 128);
        x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle';
        x.font = '600 56px "Clash Display", "IBM Plex Mono", sans-serif';
        x.fillText(`${i + 1}  ${st.name}`, 256, 64);
        tag.material.map.needsUpdate = true;
      };
      drawTag();
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawTag);
      scene.add(g);
      const lines = g.children.filter((o) => o.isLineSegments).concat(top.children.filter((o) => o.isLineSegments));
      return { g, top, ring, lines, pulse: 0, hit };
    });

    /* soft teal pool of light under the robot: it reads as hovering lit ground, and anchors the model */
    const glowCanvas = document.createElement('canvas'); glowCanvas.width = glowCanvas.height = 128;
    { const x = glowCanvas.getContext('2d'); const gr = x.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.25)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 128, 128); }
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 3.2), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(glowCanvas), color: cSignal, transparent: true, opacity: 0.45, depthWrite: false, blending: THREE.AdditiveBlending }));
    pool.rotation.x = -Math.PI / 2; pool.position.y = 0.006;
    scene.add(pool);

    /* robot: the real model if it parses, otherwise a simple box robot */
    const robot = new THREE.Group();
    robot.position.set(standX(0), 0, 1.3);
    scene.add(robot);
    const rig = { mixer: null, actions: {}, current: null, legs: null, body: null };

    function play(name, once) {
      const next = rig.actions[name];
      if (!rig.mixer || !next || (rig.current === next && !once)) return;
      next.reset().setEffectiveWeight(1);
      if (once) { next.setLoop(THREE.LoopOnce, 1); next.clampWhenFinished = true; } else { next.setLoop(THREE.LoopRepeat, Infinity); }
      next.play();
      if (rig.current && rig.current !== next) rig.current.crossFadeTo(next, 0.25, false);
      rig.current = next;
    }
    const idle = () => play('Idle');

    function boxRobot() {
      const mat = new THREE.MeshStandardMaterial({ color: cText, roughness: 0.5, metalness: 0.2 });
      const eye = new THREE.MeshBasicMaterial({ color: cSignal });
      const part = (w, h, d, x, y, z, m = mat) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); return o; };
      const g = new THREE.Group();
      const body = part(0.9, 0.9, 0.55, 0, 1.15, 0);
      const head = part(0.7, 0.5, 0.5, 0, 1.9, 0);
      const legL = new THREE.Group(), legR = new THREE.Group();
      legL.position.set(-0.22, 0.7, 0); legR.position.set(0.22, 0.7, 0);
      legL.add(part(0.25, 0.7, 0.25, 0, -0.35, 0)); legR.add(part(0.25, 0.7, 0.25, 0, -0.35, 0));
      [body, head, legL, legR].forEach((o) => { o.castShadow = true; });
      g.add(body, head, part(0.14, 0.14, 0.05, -0.17, 1.92, 0.26, eye), part(0.14, 0.14, 0.05, 0.17, 1.92, 0.26, eye), part(0.08, 0.3, 0.08, 0, 2.3, 0), legL, legR);
      rig.legs = [legL, legR]; rig.body = g;
      robot.add(g);
    }

    function loadModel() {
      if (!THREE.GLTFLoader || !window.ROBOT_GLB) { boxRobot(); return; }
      let buf;
      try { const bin = atob(window.ROBOT_GLB); buf = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i); } catch (e) { boxRobot(); return; }
      new THREE.GLTFLoader().parse(buf.buffer, '', (gltf) => {
        const m = gltf.scene;
        const box = new THREE.Box3().setFromObject(m);
        m.scale.setScalar(2.1 / Math.max(box.max.y - box.min.y, 0.01));
        box.setFromObject(m);
        m.position.y -= box.min.y;
        /* premium finish: the stock model is matte (roughness 0.9). Re-skin its three materials. */
        const skins = {
          Grey: new THREE.MeshPhysicalMaterial({ color: cText.clone().multiplyScalar(0.93), metalness: 0.25, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 1.5 }),   // ceramic white shell
          Main: new THREE.MeshPhysicalMaterial({ color: cAccent, metalness: 0.9, roughness: 0.26, clearcoat: 0.6, clearcoatRoughness: 0.15, envMapIntensity: 1.7 }),                    // anodised amber
          Black: new THREE.MeshPhysicalMaterial({ color: cSlate.clone().multiplyScalar(0.5), metalness: 0.7, roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.4 }), // polished graphite
        };
        m.traverse((o) => {
          if (!o.isMesh) return;
          o.castShadow = true;
          const swap = (mat) => (mat && skins[mat.name]) || mat;
          o.material = Array.isArray(o.material) ? o.material.map(swap) : swap(o.material);
        });
        robot.add(m);
        rig.mixer = new THREE.AnimationMixer(m);
        gltf.animations.forEach((c) => { rig.actions[c.name] = rig.mixer.clipAction(c); });
        rig.mixer.addEventListener('finished', idle);
        idle();
        guide.classList.add('guide--model');
      }, () => boxRobot());
    }
    loadModel();

    /* movement */
    let target = 0, camX = robot.position.x, heading = 0.3, moving = false, speed = 3.6, arrivedFor = -1, onArrive = null;
    const emote = (n) => { if (!reduce) play(n, true); };

    function arrive() {
      if (arrivedFor === target) return;
      arrivedFor = target; moving = false;
      guide.classList.remove('is-walking');
      heading = 0.3;
      const s = stations[target];
      s.pulse = 1; s.lines.forEach((l) => l.material.color.copy(cAccent)); s.ring.material.opacity = 0.9;
      if (onArrive) { const f = onArrive; onArrive = null; f(); } else { emote('Wave'); sayStage(target); }
    }

    api = {
      go(i, run, then) {
        target = i; arrivedFor = -1; speed = run ? 8 : 3.6; onArrive = then || null;
        thinking(i);
        if (reduce) { robot.position.x = standX(i); arrive(); }
      },
      current: () => target,
      react(name) { emote(name); },
      look(x) { lookX = x; },
    };

    /* click a station in the scene */
    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
    const pick = (ev) => {
      const r = canvas.getBoundingClientRect();
      ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      const hit = ray.intersectObjects(stations.map((s) => s.hit), false)[0];
      return hit ? hit.object.userData.stage : -1;
    };
    const QUIPS = ['Hello. Click a station and I will run straight there.', 'I only walk in straight lines. It is a robot thing.', 'Ask me how long a stage takes, or what you get from it.', 'Open any service below and I will sum it up.'];
    let quip = 0, lookX = 0;
    const onRobot = (ev) => {
      const r = canvas.getBoundingClientRect();
      ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      return ray.intersectObject(robot, true).length > 0;
    };
    canvas.addEventListener('pointermove', (ev) => {
      const r = canvas.getBoundingClientRect();
      lookX = ((ev.clientX - r.left) / r.width) * 2 - 1;
      canvas.style.cursor = pick(ev) >= 0 || onRobot(ev) ? 'pointer' : '';
    });
    canvas.addEventListener('pointerleave', () => { lookX = 0; });
    canvas.addEventListener('click', (ev) => {
      const i = pick(ev);
      if (i >= 0) return runTo(i);
      if (onRobot(ev) && !moving) {
        const moves = ['Wave', 'Jump', 'ThumbsUp', 'Dance', 'Yes'];
        const m = moves[quip % moves.length];
        if (m === 'Dance' && rig.actions.Dance) { play('Dance', true); }
        else emote(m);
        speak(`Stage ${target + 1}: ${STAGES[target].name}`, QUIPS[quip % QUIPS.length], STAGES[target].links);
        quip++;
      }
    });

    let camZ = 9.2;
    function size() {
      const w = stageEl.clientWidth, h = stageEl.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camZ = 9.2 + Math.min(Math.max((1.25 - w / h) * 5, 0), 5);   // tall and narrow: pull back so the station stays in frame
      camera.updateProjectionMatrix();
    }
    new ResizeObserver(size).observe(stageEl);
    size();

    const clock = new THREE.Clock();
    let visible = true, raf = 0;
    new IntersectionObserver((e) => { visible = e[0].isIntersecting; loop(); }, { threshold: 0.02 }).observe(stageEl);
    document.addEventListener('visibilitychange', () => loop());
    function loop() {
      cancelAnimationFrame(raf);
      if (!visible || document.hidden) return;
      raf = requestAnimationFrame(loop);
      const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
      if (rig.mixer) rig.mixer.update(dt);

      const to = standX(target), dx = to - robot.position.x;
      if (Math.abs(dx) > 0.04) {
        if (!moving) { moving = true; guide.classList.add('is-walking'); play(speed > 5 ? 'Running' : 'Walking'); }
        heading = dx > 0 ? Math.PI / 2 : -Math.PI / 2;
        robot.position.x += Math.sign(dx) * Math.min(Math.abs(dx), (Math.abs(dx) > 9 ? speed * 1.6 : speed) * dt);
      } else {
        robot.position.x = to;
        arrive();
      }
      const want = moving ? heading : 0.3 + lookX * 0.8;   // when standing still, turn toward the pointer
      let d = want - robot.rotation.y;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      robot.rotation.y += d * Math.min(dt * 7, 1);

      if (rig.legs) {                        // box robot: swing legs and bob while moving
        const sw = moving ? Math.sin(t * (speed > 5 ? 16 : 9)) * 0.7 : 0;
        rig.legs[0].rotation.x = sw; rig.legs[1].rotation.x = -sw;
        rig.body.position.y = moving ? Math.abs(Math.sin(t * 9)) * 0.08 : Math.sin(t * 2) * 0.03;
      }
      stations.forEach((s, i) => {
        s.top.rotation.y = reduce ? 0 : t * 0.5 + i;
        s.top.position.y = 1.1 + (reduce ? 0 : Math.sin(t * 1.4 + i) * 0.06);
        if (s.pulse > 0) { s.pulse = Math.max(0, s.pulse - dt * 1.3); s.top.scale.setScalar(1 + Math.sin(s.pulse * Math.PI) * 0.25); }
      });
      pool.position.x = robot.position.x; pool.position.z = robot.position.z;
      pool.material.opacity = moving ? 0.3 : 0.5 + Math.sin(t * 2) * 0.06;
      sun.position.set(robot.position.x + 3, 7, robot.position.z + 5);
      sun.target.position.set(robot.position.x, 0, robot.position.z);
      rim.position.set(robot.position.x - 3, 4, -6);
      camX += (robot.position.x + 1.2 - camX) * Math.min(dt * 3.5, 1);
      camera.position.set(camX, 3.0, camZ);
      camera.lookAt(camX, 1.2, 0);
      renderer.render(scene, camera);
    }
    loop();
    return true;
  }

  /* ------------------------------------------------------- scroll, click, react */
  let ok = false;
  try { ok = init3d(); } catch (e) { ok = false; }
  if (!ok) guide.classList.add('guide--flat');

  let lock = false, lockTimer = 0, current = 0;

  /* scroll: services.js reports which stage is on screen */
  guide.addEventListener('stagechange', (e) => {
    current = e.detail;
    if (lock) return;
    if (api) api.go(current); else sayStage(current);
  });

  /* click a stage: Zi runs there while the page scrolls */
  function runTo(i) {
    lock = true;
    current = i;
    if (api) api.go(i, true); else sayStage(i);
    if (window.zcScrollToStage) window.zcScrollToStage(i);
    else { const g = document.getElementById('grp-' + HEAD[i]); if (g) g.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); }
    clearTimeout(lockTimer);
    lockTimer = setTimeout(() => { lock = false; }, 1200);
  }
  window.addEventListener('scroll', () => { if (lock) { clearTimeout(lockTimer); lockTimer = setTimeout(() => { lock = false; }, 300); } }, { passive: true });
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#grp-"]');
    if (!a) return;
    const i = HEAD.indexOf(a.getAttribute('href').slice(5));
    if (i < 0) return;
    e.preventDefault();
    history.replaceState(null, '', a.getAttribute('href'));
    runTo(i);
  });

  /* assistant: open a service and Zi gives its one-line summary */
  let ready = false;
  window.addEventListener('load', () => setTimeout(() => { ready = true; }, 1200));
  document.addEventListener('toggle', (e) => {
    if (!ready) return;
    const d = e.target;
    if (!(d instanceof HTMLDetailsElement) || !d.classList.contains('svc') || !d.open) return;
    const grp = d.closest('.svc-group');
    const i = grp ? HEAD.indexOf(grp.id.replace('grp-', '')) : -1;
    if (i < 0) return;
    const title = d.querySelector('.svc__title').textContent;
    const sum = d.querySelector('.svc__sum').textContent;
    const tag = d.querySelector('.svc__tag');
    const text = `${sum}${tag ? ` Typical shape: ${tag.textContent.toLowerCase()}.` : ''}`;
    if (api && api.current() !== i) api.go(i, false, () => { api.react('ThumbsUp'); speak(title, text, []); });
    else { if (api) api.react('ThumbsUp'); speak(title, text, []); }
  }, true);

  /* ask Zi: three quick questions about the stage on screen */
  guide.querySelectorAll('[data-ask]').forEach((b) => b.addEventListener('click', () => {
    const st = STAGES[current], k = b.dataset.ask, head = `Stage ${current + 1}: ${st.name}`;
    if (api) api.react(k === 'open' ? 'Jump' : 'Yes');
    if (k === 'time') speak(head, st.time, st.links);
    if (k === 'get') speak(head, st.get, st.links);
    if (k === 'open') {
      const d = document.getElementById(st.links[0][0]);
      if (d) { d.open = true; }
    }
  }));

  if (!ok) sayStage(0);
  else setTimeout(() => { if (!spoken) sayStage(current); }, 2500);
})();
