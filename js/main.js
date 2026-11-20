/* ==========================================================================
   Zi Cloud: global scripts (every page)
   Scripts add motion and small conveniences. They never carry content:
   every page reads and navigates correctly with JavaScript switched off.
   ========================================================================== */

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* --------------------------------------------------------------------------
   Pixel sprites: drawn as crisp SVG squares in currentColor.
   Usage: <span data-sprite="bot" data-px="4" aria-hidden="true"></span>
   -------------------------------------------------------------------------- */
const SPRITES = {
  z:      ['XXXXXXX', '.....XX', '....XX.', '...XX..', '..XX...', '.XX....', 'XXXXXXX'],
  bot:    ['....X....', '...XXX...', '....X....', '.XXXXXXX.', '.X.XXX.X.', '.XXXXXXX.', '...XXX...', 'XXXXXXXXX', 'X.XXXXX.X', '..XX.XX..', '..XX.XX..'],
  person: ['...XXX...', '..XXXXX..', '..X.X.X..', '..XXXXX..', '...XXX...', '.XXXXXXX.', 'X.XXXXX.X', 'X.XXXXX.X', '..XXXXX..', '..XX.XX..', '..XX.XX..'],
  group:  ['.......XXX.......', '.XXX...XXX...XXX.', '.XXX....X....XXX.', '..X...XXXXX...X..', 'XXXXX..XXX..XXXXX', '.XXX...X.X...XXX.', '.X.X...X.X...X.X.', '.X.X.........X.X.'],
  shield: ['XXXXXXXXX', 'X.......X', 'X.......X', 'X.....X.X', 'X....X..X', 'X.X.X...X', 'X..X....X', '.X.....X.', '..X...X..', '...XXX...'],
  lens:   ['.XXXX....', 'X....X...', 'X.XX.X...', 'X.X..X...', 'X....X...', '.XXXX....', '.....XX..', '......XX.', '.......XX'],
  sheet:  ['XXXXXXXXX', 'X..X..X.X', 'XXXXXXXXX', 'X..X..X.X', 'XXXXXXXXX', 'X..X..X.X', 'XXXXXXXXX'],
  mail:   ['XXXXXXXXX', 'XX.....XX', 'X.X...X.X', 'X..X.X..X', 'X...X...X', 'X.......X', 'XXXXXXXXX'],
  clip:   ['...XXX...', '.XXX.XXX.', '.X.....X.', '.X.XXX.X.', '.X.....X.', '.X.XXX.X.', '.X.....X.', '.X.XX..X.', '.XXXXXXX.'],
  clock:  ['..XXXXX..', '.X.....X.', 'X...X...X', 'X...X...X', 'X...XXX.X', 'X.......X', '.X.....X.', '..XXXXX..'],
  split:  ['XXX...XXX', 'X.X...X.X', 'XXXX.XXXX', '.........', '.........', 'XXXX.XXXX', 'X.X...X.X', 'XXX...XXX'],
  trail:  ['XXXXXX...', 'X....XX..', 'X.....X..', 'X.XX..X..', 'X......X.', 'X.XXX...X', 'X.......X', 'X.XX.X.XX', 'XXXXX.X.X'],
};

function sprite(rows, px) {
  const w = Math.max(...rows.map((r) => r.length));
  const rects = rows
    .flatMap((r, y) => [...r].map((c, x) => (c === 'X' ? `<rect x="${x}" y="${y}" width="1" height="1"/>` : '')))
    .join('');
  return `<svg viewBox="0 0 ${w} ${rows.length}" width="${w * px}" height="${rows.length * px}" fill="currentColor" shape-rendering="crispEdges" aria-hidden="true" focusable="false">${rects}</svg>`;
}

document.querySelectorAll('[data-sprite]').forEach((el) => {
  const rows = SPRITES[el.dataset.sprite];
  if (rows) el.innerHTML = sprite(rows, Number(el.dataset.px) || 4);
});

/* --------------------------------------------------------------------------
   Split headings: words rise into place. Screen readers get the full text
   from aria-label, so the word spans are never read as fragments.
   -------------------------------------------------------------------------- */
document.querySelectorAll('.split-heading').forEach((el) => {
  const text = el.textContent.trim().replace(/\s+/g, ' ');
  el.setAttribute('aria-label', text);
  el.innerHTML = text
    .split(' ')
    .map((w, i) => `<span class="word" aria-hidden="true"><span style="--i:${i}">${w.replace(/[&<>]/g, (c) => `&#${c.charCodeAt(0)};`)}</span></span>`)
    .join(' ');
});

/* --------------------------------------------------------------------------
   Reveal on scroll (.reveal, .split-heading) → .is-visible
   -------------------------------------------------------------------------- */
const revealTargets = document.querySelectorAll('.reveal, .split-heading');
if (reduceMotion || !('IntersectionObserver' in window)) {
  revealTargets.forEach((el) => el.classList.add('is-visible'));
} else {
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('is-visible');
        io.unobserve(e.target);
      }
    }),
    { threshold: 0.2, rootMargin: '0px 0px -8% 0px' }
  );
  revealTargets.forEach((el) => io.observe(el));
}

/* --------------------------------------------------------------------------
   Header shadow, scroll progress bar, scroll-linked parallax
   -------------------------------------------------------------------------- */
const header = document.querySelector('.site-header');
const progressBar = document.querySelector('.scroll-progress');
const parallaxEls = reduceMotion ? [] : [...document.querySelectorAll('[data-parallax]')];

let ticking = false;
function onScroll() {
  const y = window.scrollY;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  if (header) header.classList.toggle('is-scrolled', y > 8);
  if (progressBar) progressBar.style.setProperty('--progress', max > 0 ? (y / max).toFixed(4) : 0);
  parallaxEls.forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) return;
    const speed = Number(el.dataset.parallax) || 0.1;
    const offset = (rect.top + rect.height / 2 - window.innerHeight / 2) * speed;
    el.style.setProperty('--parallax', `${offset.toFixed(1)}px`);
    el.style.setProperty('--gp', `${offset.toFixed(1)}px`);
  });
  ticking = false;
}
window.addEventListener('scroll', () => {
  if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
}, { passive: true });
onScroll();

/* --------------------------------------------------------------------------
   Mobile navigation toggle
   -------------------------------------------------------------------------- */
const navToggle = document.querySelector('.nav-toggle');
const nav = document.getElementById('site-nav');
if (navToggle && nav) {
  navToggle.addEventListener('click', () => {
    const open = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!open));
    nav.classList.toggle('is-open', !open);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) {
      nav.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.focus();
    }
  });
}

/* --------------------------------------------------------------------------
   Spotlight: teal glow follows the cursor on fine pointers
   -------------------------------------------------------------------------- */
if (finePointer && !reduceMotion) {
  document.querySelectorAll('.spotlight').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });
}

/* --------------------------------------------------------------------------
   Marquee: duplicate the track once so the loop is seamless.
   The copy is hidden from screen readers.
   -------------------------------------------------------------------------- */
document.querySelectorAll('.marquee__track').forEach((track) => {
  [...track.children].forEach((child) => {
    const copy = child.cloneNode(true);
    copy.setAttribute('aria-hidden', 'true');
    track.append(copy);
  });
});

/* --------------------------------------------------------------------------
   Cookie banner: remember the choice for this browser
   -------------------------------------------------------------------------- */
const banner = document.querySelector('.cookie-banner');
if (banner) {
  let choice = null;
  try { choice = localStorage.getItem('zi-cookie-choice'); } catch (e) { /* storage blocked */ }
  if (!choice) banner.hidden = false;
  banner.querySelectorAll('[data-cookie]').forEach((btn) => {
    btn.addEventListener('click', () => {
      try { localStorage.setItem('zi-cookie-choice', btn.dataset.cookie); } catch (e) { /* ignore */ }
      banner.hidden = true;
    });
  });
}

/* --------------------------------------------------------------------------
   Logo: the dot of the "i" is amber, as in the brand wordmark (brand §2).
   The text stays "Zi Cloud" for screen readers (the wordmark is aria-hidden,
   the link carries the label). Without JS the plain wordmark is shown.
   -------------------------------------------------------------------------- */
document.querySelectorAll('.logo__word').forEach((el) => {
  if (el.textContent.trim() !== 'Zi Cloud') return;
  el.innerHTML = 'Z<span class="logo__i">ı</span> Cloud';
});
