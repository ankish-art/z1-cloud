/* ==========================================================================
   Shared behaviour for the inner pages.
   - Animated details/summary accordions (details.acc and anything with
     [data-anim]). Without JavaScript they open and close natively.
   ========================================================================== */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('details[data-anim]').forEach((d) => {
    const summary = d.querySelector(':scope > summary');
    const body = d.querySelector(':scope > .acc__body, :scope > .svc__body');
    if (!summary || !body) return;
    let anim = null;

    summary.addEventListener('click', (e) => {
      if (reduce) return;                       // native toggle, no motion
      e.preventDefault();
      if (anim) anim.cancel();

      if (d.open) {
        const h = body.offsetHeight;
        anim = body.animate({ height: [`${h}px`, '0px'], opacity: [1, 0] }, { duration: 500, easing: 'cubic-bezier(0.45, 0, 0.2, 1)' });
        anim.onfinish = () => { d.open = false; anim = null; body.style.height = ''; };
      } else {
        d.open = true;
        const h = body.scrollHeight;
        anim = body.animate({ height: ['0px', `${h}px`], opacity: [0, 1] }, { duration: 600, easing: 'cubic-bezier(0.45, 0, 0.2, 1)' });
        anim.onfinish = () => { anim = null; body.style.height = ''; };
      }
    });
  });
})();
