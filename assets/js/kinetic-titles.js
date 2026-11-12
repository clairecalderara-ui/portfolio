/* ============================================================
   Titres animés : « Accords sensibles », « La brujita », « Miss Worldwide ».
   Les lettres apparaissent une à une, puis grossissent et se soulèvent
   quand le curseur s'approche. Le dernier mot a un dégradé violet → rose
   → blanc calculé lettre par lettre (il ne peut pas devenir invisible).

   Pour animer un titre : ajouter l'attribut data-kinetic sur la balise.
   Option : data-kt-lines="Accords|sensibles" pour forcer les retours à la ligne.
   ============================================================ */
(() => {
  'use strict';
  const targets = Array.from(document.querySelectorAll('[data-kinetic]'));
  if (!targets.length) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const style = document.createElement('style');
  style.textContent = `
    [data-kinetic] .kt-line{display:block;line-height:1.02}
    [data-kinetic] .kt-word{display:inline-block;white-space:nowrap}
    [data-kinetic] .kt-ch{display:inline-block;opacity:0;transform:translateY(.45em) rotate(5deg);filter:blur(6px);
      transition:opacity .7s cubic-bezier(.16,1,.3,1),transform .85s cubic-bezier(.16,1,.3,1),filter .7s ease;
      transition-delay:var(--d,0ms)}
    [data-kinetic] .kt-inner{display:inline-block;transition:transform .22s ease-out;will-change:transform}
    [data-kinetic].is-visible .kt-ch{opacity:1;transform:none;filter:none}
    [data-kinetic] .kt-glow .kt-inner{text-shadow:0 0 28px rgba(192,132,252,.55)}
    @media (prefers-reduced-motion: reduce){
      [data-kinetic] .kt-ch{opacity:1;transform:none;filter:none;transition:none}
    }
  `;
  document.head.appendChild(style);

  const STOPS = [[216, 180, 254], [251, 207, 232], [255, 255, 255]]; // violet clair → rose → blanc
  const gradient = t => {
    const seg = t < 0.5 ? 0 : 1;
    const u = (t - seg * 0.5) / 0.5;
    const a = STOPS[seg], b = STOPS[seg + 1];
    return 'rgb(' + a.map((v, i) => Math.round(v + (b[i] - v) * u)).join(',') + ')';
  };

  const instances = [];

  targets.forEach(old => {
    const label = old.textContent.replace(/\s+/g, ' ').trim();
    const lines = (old.getAttribute('data-kt-lines') || label).split('|').map(l => l.trim()).filter(Boolean);
    if (!lines.length) return;

    // On repart d'un élément vide (supprime l'ancien contenu et d'éventuels anciens écouteurs)
    const root = old.cloneNode(false);
    root.removeAttribute('data-kt-lines');
    root.setAttribute('aria-label', lines.join(' '));
    old.replaceWith(root);

    const lastLine = lines.length - 1;
    const letters = [];
    let index = 0;

    lines.forEach((text, li) => {
      const lineEl = document.createElement('span');
      lineEl.className = 'kt-line';
      lineEl.setAttribute('aria-hidden', 'true');
      const words = text.split(/\s+/);

      words.forEach((word, wi) => {
        const accent = li === lastLine && wi === words.length - 1;
        const wordEl = document.createElement('span');
        wordEl.className = 'kt-word' + (accent ? ' kt-glow' : '');
        const chars = [...word];
        chars.forEach((ch, i) => {
          const outer = document.createElement('span');
          outer.className = 'kt-ch';
          outer.style.setProperty('--d', (index++ * 55) + 'ms');
          const inner = document.createElement('span');
          inner.className = 'kt-inner';
          inner.textContent = ch;
          if (accent) inner.style.color = gradient(chars.length > 1 ? i / (chars.length - 1) : 0);
          outer.appendChild(inner);
          wordEl.appendChild(outer);
          letters.push({ outer, inner, on: false });
        });
        lineEl.appendChild(wordEl);
        if (wi < words.length - 1) lineEl.appendChild(document.createTextNode(' '));
      });
      root.appendChild(lineEl);
    });

    // Apparition quand le titre entre à l'écran
    if ('IntersectionObserver' in window && !reduce) {
      const io = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) { root.classList.add('is-visible'); io.disconnect(); }
      }, { threshold: 0.35 });
      io.observe(root);
    } else {
      root.classList.add('is-visible');
    }

    instances.push({ root, letters });
  });

  if (reduce || !instances.length) return;

  // Les lettres réagissent au curseur
  let px = -9999, py = -9999, raf = 0;
  const RADIUS = 170;

  function reset(l) { if (l.on) { l.inner.style.transform = ''; l.on = false; } }

  function update() {
    raf = 0;
    instances.forEach(({ root, letters }) => {
      const box = root.getBoundingClientRect();
      const pad = 200;
      const near = px > box.left - pad && px < box.right + pad && py > box.top - pad && py < box.bottom + pad;
      letters.forEach(l => {
        if (!near) { reset(l); return; }
        const r = l.outer.getBoundingClientRect();
        const d = Math.hypot(px - (r.left + r.width / 2), py - (r.top + r.height / 2));
        const k = Math.max(0, 1 - d / RADIUS);
        const e = k * k;
        if (e < 0.01) { reset(l); return; }
        l.inner.style.transform = 'translateY(' + (-0.07 * e).toFixed(3) + 'em) scale(' + (1 + 0.42 * e).toFixed(3) + ')';
        l.on = true;
      });
    });
  }
  const schedule = () => { if (!raf) raf = requestAnimationFrame(update); };

  window.addEventListener('pointermove', e => { px = e.clientX; py = e.clientY; schedule(); }, { passive: true });
  window.addEventListener('scroll', schedule, { passive: true });
  document.documentElement.addEventListener('mouseleave', () => { px = py = -9999; schedule(); });
})();
