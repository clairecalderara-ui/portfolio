/* ============================================================
   Titre "Accords sensibles" : les lettres apparaissent une à une,
   puis grossissent et se soulèvent quand le curseur s'approche.
   Reconstruit le contenu de #kinetic-container (les deux mots,
   avec un dégradé calculé lettre par lettre : il ne peut plus
   devenir invisible).
   ============================================================ */
(() => {
  'use strict';
  const old = document.getElementById('kinetic-container');
  if (!old) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lines = (old.getAttribute('data-kt-lines') || 'Accords|sensibles').split('|');

  const style = document.createElement('style');
  style.textContent = `
    #kinetic-container .kt-line{display:block;line-height:1.02}
    #kinetic-container .kt-ch{display:inline-block;opacity:0;transform:translateY(.45em) rotate(5deg);filter:blur(6px);
      transition:opacity .7s cubic-bezier(.16,1,.3,1),transform .85s cubic-bezier(.16,1,.3,1),filter .7s ease;
      transition-delay:var(--d,0ms)}
    #kinetic-container .kt-inner{display:inline-block;transition:transform .22s ease-out;will-change:transform}
    #kinetic-container.is-visible .kt-ch{opacity:1;transform:none;filter:none}
    #kinetic-container .kt-glow .kt-inner{text-shadow:0 0 28px rgba(192,132,252,.55)}
    @media (prefers-reduced-motion: reduce){
      #kinetic-container .kt-ch{opacity:1;transform:none;filter:none;transition:none}
    }
  `;
  document.head.appendChild(style);

  // On repart d'un élément vide (supprime l'ancien contenu et les anciens écouteurs)
  const root = old.cloneNode(false);
  root.removeAttribute('data-kt-lines');
  root.setAttribute('aria-label', lines.join(' '));
  old.replaceWith(root);

  const STOPS = [[216, 180, 254], [251, 207, 232], [255, 255, 255]]; // violet clair → rose → blanc
  const gradient = t => {
    const seg = t < 0.5 ? 0 : 1;
    const u = (t - seg * 0.5) / 0.5;
    const a = STOPS[seg], b = STOPS[seg + 1];
    return 'rgb(' + a.map((v, i) => Math.round(v + (b[i] - v) * u)).join(',') + ')';
  };

  const letters = [];
  let index = 0;
  lines.forEach((text, li) => {
    const line = document.createElement('span');
    line.className = 'kt-line' + (li === 1 ? ' kt-glow' : '');
    line.setAttribute('aria-hidden', 'true');
    const chars = [...text];
    chars.forEach((ch, i) => {
      const outer = document.createElement('span');
      outer.className = 'kt-ch';
      outer.style.setProperty('--d', (index++ * 55) + 'ms');
      const inner = document.createElement('span');
      inner.className = 'kt-inner';
      inner.textContent = ch;
      inner.style.color = li === 1 ? gradient(chars.length > 1 ? i / (chars.length - 1) : 0) : '#ffffff';
      outer.appendChild(inner);
      line.appendChild(outer);
      letters.push({ outer, inner, on: false });
    });
    root.appendChild(line);
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
  if (reduce) return;

  // Les lettres réagissent au curseur
  let px = -9999, py = -9999, raf = 0;
  const RADIUS = 170;

  function reset(l) { if (l.on) { l.inner.style.transform = ''; l.on = false; } }

  function update() {
    raf = 0;
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
  }
  const schedule = () => { if (!raf) raf = requestAnimationFrame(update); };

  window.addEventListener('pointermove', e => { px = e.clientX; py = e.clientY; schedule(); }, { passive: true });
  window.addEventListener('scroll', schedule, { passive: true });
  document.documentElement.addEventListener('mouseleave', () => { px = py = -9999; schedule(); });
})();
