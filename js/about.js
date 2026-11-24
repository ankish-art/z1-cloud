/* About.
   - Photo frame: unveils once the image has loaded (or at once if there is no photo yet),
     then tilts toward the cursor; the photo, monogram and tags move at different depths
   - If the photo file is missing, the frame shows an outlined monogram instead
   - Parallax: hero background, copy and photo drift on scroll; principle cards move a few
     pixels at their own rates
   - "How an engagement runs": a teal line fills as the section scrolls past and each stage lights
   Reduced motion: everything is static and fully visible. */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---- photo ----------------------------------------------------------------- */
  const photo = document.querySelector('[data-photo]');
  if (photo) {
    const img = photo.querySelector('.photo__img');
    const frame = photo.querySelector('.photo__frame');
    const unveil = () => requestAnimationFrame(() => photo.classList.add('is-in'));
    const missing = () => { photo.classList.add('no-photo'); unveil(); };
    if (img) {
      if (img.complete) (img.naturalWidth ? unveil() : missing());
      else { img.addEventListener('load', unveil); img.addEventListener('error', missing); setTimeout(unveil, 1500); }
    } else unveil();

    if (fine.matches) {
      photo.addEventListener('pointermove', (e) => {
        if (reduce.matches) return;
        const r = photo.getBoundingClientRect();
        photo.style.setProperty('--rx', (clamp((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
        photo.style.setProperty('--ry', (clamp((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
      });
      photo.addEventListener('pointerleave', () => { photo.style.setProperty('--rx', 0); photo.style.setProperty('--ry', 0); });
      /* spotlight glow follows the cursor over the frame */
      frame.addEventListener('pointermove', (e) => {
        const r = frame.getBoundingClientRect();
        frame.style.setProperty('--mx', `${e.clientX - r.left}px`);
        frame.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    }
  }

  /* ---- scroll: parallax and the engagement line ------------------------------------ */
  const hero = document.querySelector('.ab-hero');
  const cards = $$('.pc');
  const tl = document.querySelector('[data-tl]');
  const stages = tl ? $$('.tl__s', tl) : [];
  let raf = 0;
  const tick = () => {
    raf = 0;
    const vh = window.innerHeight;
    if (!reduce.matches) {
      if (hero) hero.style.setProperty('--hy', Math.min(window.scrollY, vh * 1.2).toFixed(1));
      if (window.innerWidth > 960) cards.forEach((c) => {
        const r = c.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        c.style.setProperty('--cp', ((r.top + r.height / 2) - vh / 2).toFixed(0));
      });
    }
    if (tl) {
      const r = tl.getBoundingClientRect();
      const vertical = window.innerWidth <= 960;
      const p = reduce.matches ? 1 : clamp((vh * 0.78 - r.top) / (vertical ? r.height : vh * 0.5));
      tl.style.setProperty('--p', p.toFixed(4));
      stages.forEach((s, i) => s.classList.toggle('is-lit', reduce.matches || p >= (i + 0.05) / (stages.length - 0.9)));
    }
  };
  const queue = () => { if (!raf) raf = requestAnimationFrame(tick); };
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue);
  tick();
})();
