/* ============================================================
   Reflet "shiny" qui traverse le nom du hero (Claire Calderara).
   Méthode : on superpose une copie du texte, transparente, dont seul
   un reflet blanc est visible. Le nom d'origine n'est jamais modifié,
   donc rien ne peut être coupé ni changer de style.
   ============================================================ */
(() => {
  'use strict';
  const h = document.querySelector('.hero-signature');
  if (!h) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clipOK = window.CSS && CSS.supports &&
    (CSS.supports('background-clip', 'text') || CSS.supports('-webkit-background-clip', 'text'));
  if (reduce || !clipOK) return;

  const style = document.createElement('style');
  style.textContent = `
    .hero-shine-layer{
      position:absolute; pointer-events:none; user-select:none; -webkit-user-select:none;
      font:inherit; font-feature-settings:inherit; font-kerning:inherit; font-variant:inherit;
      letter-spacing:inherit; word-spacing:inherit; line-height:inherit; text-align:inherit;
      text-transform:inherit; white-space:inherit; text-indent:inherit;
      color:transparent !important; -webkit-text-fill-color:transparent !important;
      text-shadow:none !important; filter:none !important;
      background-color:transparent;
      background-image:linear-gradient(110deg, transparent 40%, rgba(255,255,255,.6) 46%, #ffffff 50%, rgba(255,255,255,.6) 54%, transparent 60%);
      background-repeat:no-repeat; background-size:250% 100%; background-position:100% 0;
      -webkit-background-clip:text; background-clip:text;
      animation:hero-shine-sweep 5s ease-in-out infinite;
    }
    @keyframes hero-shine-sweep{ 0%{background-position:100% 0} 55%,100%{background-position:0 0} }
  `;
  document.head.appendChild(style);

  if (getComputedStyle(h).position === 'static') h.style.position = 'relative';

  const layer = document.createElement('span');
  layer.className = 'hero-shine-layer';
  layer.setAttribute('aria-hidden', 'true');
  layer.textContent = h.textContent.replace(/\s+/g, ' ').trim();
  h.appendChild(layer);

  // La copie déborde largement autour du texte (pour ne rien couper) tout en restant
  // exactement superposée à l'original : on compense avec le même espace en padding.
  function fit() {
    const cs = getComputedStyle(h);
    layer.style.left = '-1.4em';
    layer.style.right = '-.6em';
    layer.style.top = '-.9em';
    layer.style.bottom = '-.9em';
    layer.style.paddingLeft = 'calc(1.4em + ' + cs.paddingLeft + ')';
    layer.style.paddingRight = 'calc(.6em + ' + cs.paddingRight + ')';
    layer.style.paddingTop = 'calc(.9em + ' + cs.paddingTop + ')';
    layer.style.paddingBottom = 'calc(.9em + ' + cs.paddingBottom + ')';
  }
  fit();
  if ('ResizeObserver' in window) new ResizeObserver(fit).observe(h);
  else window.addEventListener('resize', fit);
})();
