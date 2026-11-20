/* Services: the method line.
   - A marker travels down the sticky spine as the groups scroll past
   - The step for the group on screen lights up
   - A link such as services/#svc-05 opens that panel */
(() => {
  const groups = [...document.querySelectorAll('.svc-group')];
  const layout = document.querySelector('.svc-layout');
  const spine = document.querySelector('.spine');
  const links = [...document.querySelectorAll('.spine__link')];
  if (!groups.length || !layout || !spine) return;

  const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
  let ticking = false;

  function update() {
    ticking = false;
    const vh = window.innerHeight;
    const r = layout.getBoundingClientRect();
    // progress through the list: 0 when its top reaches the middle of the screen, 1 when its bottom does
    const p = clamp((vh * 0.5 - r.top) / Math.max(r.height, 1), 0, 1);
    spine.style.setProperty('--p', p.toFixed(4));

    let active = 0;
    groups.forEach((g, i) => { if (g.getBoundingClientRect().top < vh * 0.5) active = i; });
    links.forEach((l, i) => l.classList.toggle('is-on', i === active));
  }
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();

  // Deep link: open the panel named in the address
  const id = location.hash.replace('#', '');
  const target = id && document.getElementById(id);
  if (target && target.tagName === 'DETAILS') {
    target.open = true;
    setTimeout(() => target.scrollIntoView({ block: 'start' }), 300);
  }
})();
