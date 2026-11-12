/* ============================================================
   Effet "Hyper Text" (Magic UI) en JavaScript classique :
   les lettres se mélangent puis se remettent en place, quand le
   titre apparaît à l'écran et à chaque survol.

   Dans les pages projets/*.html, juste avant </body> :
   <script src="../assets/js/hyper-text.js" data-auto defer></script>
   -> data-auto applique l'effet à tous les titres h1, h2, h3 de la page
      (hors header / nav / footer).
   Sans data-auto : seuls les éléments avec l'attribut data-hyper-text.
   ============================================================ */
(() => {
  'use strict';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const script = document.currentScript;
  const auto = !!(script && script.hasAttribute('data-auto'));

  const style = document.createElement('style');
  style.textContent = '.ht-word{display:inline-block;white-space:nowrap}.ht-char{display:inline-block;text-align:center}';
  document.head.appendChild(style);

  const UP = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const LOW = 'abcdefghijklmnopqrstuvwxyz';
  const isLetter = ch => /\p{L}/u.test(ch);
  const randomFor = ch => {
    const pool = ch === ch.toLowerCase() ? LOW : UP;
    return pool[(Math.random() * pool.length) | 0];
  };

  // Découpe le texte (en gardant les balises internes) en mots > lettres
  function split(el) {
    const chars = [];
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    for (const node of nodes) {
      if (!node.nodeValue.trim()) continue;
      const frag = document.createDocumentFragment();
      node.nodeValue.split(/(\s+)/).forEach(part => {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
        const word = document.createElement('span');
        word.className = 'ht-word';
        word.setAttribute('aria-hidden', 'true');
        for (const ch of part) {
          const s = document.createElement('span');
          s.className = 'ht-char';
          s.textContent = ch;
          word.appendChild(s);
          if (isLetter(ch)) chars.push({ el: s, ch });
        }
        frag.appendChild(word);
      });
      node.parentNode.replaceChild(frag, node);
    }
    return chars;
  }

  // Fige la largeur de chaque lettre pour que le titre ne "saute" pas
  function lockWidths(chars) {
    chars.forEach(c => {
      const w = c.el.getBoundingClientRect().width;
      const fs = parseFloat(getComputedStyle(c.el).fontSize);
      if (w > 0 && fs > 0) c.el.style.width = (w / fs) + 'em';
    });
  }

  function run(state) {
    if (state.raf) cancelAnimationFrame(state.raf);
    const n = state.chars.length;
    const duration = Math.min(1400, Math.max(650, n * 55));
    const start = performance.now();
    let last = 0;
    const step = now => {
      const p = Math.min(1, (now - start) / duration);
      if (now - last > 45 || p === 1) {
        last = now;
        const revealed = Math.floor(p * n);
        state.chars.forEach((c, i) => {
          c.el.textContent = (p === 1 || i < revealed) ? c.ch : randomFor(c.ch);
        });
      }
      state.raf = p < 1 ? requestAnimationFrame(step) : 0;
    };
    state.raf = requestAnimationFrame(step);
  }

  const observer = 'IntersectionObserver' in window
    ? new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (e.isIntersecting) { run(e.target.__ht); observer.unobserve(e.target); }
        });
      }, { threshold: 0.4 })
    : null;

  function init(el) {
    if (el.__ht) return;
    const label = el.textContent.replace(/\s+/g, ' ').trim();
    if (!label) return;
    const chars = split(el);
    if (!chars.length) return;
    el.setAttribute('aria-label', label);
    const state = { chars, raf: 0 };
    el.__ht = state;

    el.addEventListener('mouseenter', () => { if (!state.raf) run(state); });

    const ready = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    ready.then(() => {
      lockWidths(chars);
      if (observer) observer.observe(el); else run(state);
    });
  }

  function start() {
    const targets = new Set(document.querySelectorAll('[data-hyper-text]'));
    if (auto) {
      document.querySelectorAll('h1, h2, h3').forEach(h => {
        if (!h.closest('header, nav, footer')) targets.add(h);
      });
    }
    targets.forEach(init);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
