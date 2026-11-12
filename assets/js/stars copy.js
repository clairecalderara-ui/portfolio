/* ============================================================
   Petites étoiles qui scintillent et dérivent doucement en fond.
   À ajouter sur chaque page (sauf si main.js les gère déjà) :
   <script src="assets/js/stars.js" defer></script>
   (dans projets/*.html : src="../assets/js/stars.js")
   ============================================================ */
(() => {
  'use strict';
  if (window.__starsInit) return;
  window.__starsInit = true;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Le canvas est derrière le contenu de la page
  const style = document.createElement('style');
  style.textContent = `
    #bg-stars{position:fixed;inset:0;width:100%;height:100%;z-index:0;pointer-events:none}
    body > main, body > section, body > footer{position:relative}
  `;
  document.head.appendChild(style);

  const canvas = document.createElement('canvas');
  canvas.id = 'bg-stars';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d');

  const COLORS = ['255,255,255', '233,213,255', '245,194,231', '196,181,253'];
  let w = 0, h = 0, dpr = 1, stars = [];

  function makeStars() {
    const count = Math.max(60, Math.min(170, Math.round(w * h / 9000)));
    stars = Array.from({ length: count }, () => {
      const sparkle = Math.random() < 0.12;
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        r: sparkle ? 1.4 + Math.random() * 1.2 : 0.4 + Math.random() * 1.1,
        a: 0.35 + Math.random() * 0.55,
        speed: 0.4 + Math.random() * 1.4,
        phase: Math.random() * Math.PI * 2,
        vx: (Math.random() - 0.5) * 0.06,
        vy: -(0.02 + Math.random() * 0.07),
        color: COLORS[(Math.random() * COLORS.length) | 0],
        sparkle
      };
    });
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    makeStars();
    draw(0);
  }

  function draw(time) {
    ctx.clearRect(0, 0, w, h);
    const t = time / 1000;
    for (const s of stars) {
      const tw = reduceMotion ? 1 : 0.55 + 0.45 * Math.sin(t * s.speed + s.phase);
      const alpha = s.a * tw;
      ctx.fillStyle = `rgba(${s.color},${alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
      if (s.sparkle) {
        // petite étoile à 4 branches
        const len = s.r * 4.5 * (0.7 + 0.3 * tw);
        ctx.strokeStyle = `rgba(${s.color},${alpha * 0.8})`;
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(s.x - len, s.y); ctx.lineTo(s.x + len, s.y);
        ctx.moveTo(s.x, s.y - len); ctx.lineTo(s.x, s.y + len);
        ctx.stroke();
      }
    }
  }

  function tick(time) {
    for (const s of stars) {
      s.x += s.vx; s.y += s.vy;
      if (s.y < -10) { s.y = h + 10; s.x = Math.random() * w; }
      if (s.x < -10) s.x = w + 10;
      if (s.x > w + 10) s.x = -10;
    }
    draw(time);
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', resize);
  resize();
  if (!reduceMotion) requestAnimationFrame(tick);
})();
