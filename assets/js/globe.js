/* ============================================================
   Globe façon Magic UI — globe 3D en points, qui tourne, que l'on
   peut faire glisser, avec les pays visités mis en lumière.
   Remplace assets/js/globe.js
   Nécessite d3 + topojson (déjà chargés dans index.html).
   ============================================================ */
(() => {
  'use strict';

  const container = document.getElementById('globe-container');
  const tooltip = document.getElementById('globe-tooltip');
  if (!container || !window.d3 || !window.topojson) return;

  // Pays visités : nom anglais (carte) → nom français (infobulle)
  const VISITED = {
    'France': 'France',
    'Germany': 'Allemagne',
    'Switzerland': 'Suisse',
    'Spain': 'Espagne',
    'Italy': 'Italie',
    'Hungary': 'Hongrie',
    'Austria': 'Autriche',
    'Czechia': 'République tchèque',
    'Slovakia': 'Slovaquie',
    'Greece': 'Grèce',
    'Croatia': 'Croatie',
    'Portugal': 'Portugal',
    'United Kingdom': 'Royaume-Uni',
    'Netherlands': 'Pays-Bas',
    'Norway': 'Norvège',
    'Denmark': 'Danemark',
    'Sweden': 'Suède',
    'Turkey': 'Turquie',
    'Indonesia': 'Indonésie',
    'Thailand': 'Thaïlande',
    'Malaysia': 'Malaisie',
    'Australia': 'Australie',
    'Mexico': 'Mexique',
    'Costa Rica': 'Costa Rica',
    'Argentina': 'Argentine',
    'Chile': 'Chili',
    'Brazil': 'Brésil',
    'Uruguay': 'Uruguay',
    'Canada': 'Canada'
  };
  const WORLD_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json';

  const counter = document.getElementById('globe-count');
  if (counter) counter.textContent = Object.keys(VISITED).length;

  const RAD = Math.PI / 180;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Canvas ----------
  const status = document.createElement('p');
  status.textContent = 'Chargement du globe…';
  status.style.cssText = 'position:absolute;color:#c4b5fd;font-size:12px;letter-spacing:.15em;text-transform:uppercase;';
  container.style.cssText = 'position:relative;width:100%;display:flex;align-items:center;justify-content:center;';
  container.appendChild(status);

  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'width:100%;height:auto;aspect-ratio:1/1;display:block;cursor:grab;touch-action:pan-y;';
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Globe 3D des pays visités par Claire');
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  let size = 600, R = 260, dpr = 1;
  function resize() {
    size = container.clientWidth || 600;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    R = size * 0.44;
    canvas.width = canvas.height = Math.round(size * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(container);
  else window.addEventListener('resize', resize);

  // ---------- Données ----------
  let features = [];   // pays visités (avec boîtes englobantes)
  let allCountries = [];
  let dotX, dotY, dotZ, dotC; // points du globe (vecteurs 3D + index du pays visité, -1 sinon)

  const names = Object.keys(VISITED);

  // France métropolitaine + Corse seulement (on retire la Guyane de la carte 110m)
  function trim(f) {
    if (f.properties.name === 'France' && f.geometry.type === 'MultiPolygon') {
      return { ...f, geometry: { type: 'MultiPolygon', coordinates: f.geometry.coordinates.filter(p => p[0][0][0] > -20) } };
    }
    return f;
  }

  function inBox(b, lon, lat) {
    const w = b[0][0], s = b[0][1], e = b[1][0], n = b[1][1];
    if (lat < s || lat > n) return false;
    return w <= e ? (lon >= w && lon <= e) : (lon >= w || lon <= e);
  }

  async function buildDots() {
    const px = [], py = [], pz = [], pc = [];
    const step = 1.25;
    let rows = 0;
    for (let lat = -58; lat <= 84; lat += step) {
      const n = Math.max(1, Math.round(360 * Math.cos(lat * RAD) / step));
      for (let i = 0; i < n; i++) {
        const lon = -180 + (i + 0.5) * 360 / n;
        let hit = null;
        for (const c of allCountries) {
          if (inBox(c.box, lon, lat) && d3.geoContains(c.f, [lon, lat])) { hit = c; break; }
        }
        if (!hit) continue;
        const la = lat * RAD, lo = lon * RAD;
        px.push(Math.cos(la) * Math.sin(lo));
        py.push(Math.sin(la));
        pz.push(Math.cos(la) * Math.cos(lo));
        pc.push(hit.visitedIdx);
      }
      if (++rows % 14 === 0) await new Promise(r => setTimeout(r)); // ne bloque pas la page
    }
    dotX = Float32Array.from(px); dotY = Float32Array.from(py);
    dotZ = Float32Array.from(pz); dotC = Int16Array.from(pc);
  }

  // ---------- Rotation / interaction ----------
  let lon0 = 12, lat0 = 22;       // centre de la vue (degrés)
  let dragging = false, lastX = 0, lastY = 0;
  let pointer = null;             // position de la souris dans le canvas
  let hover = -1;
  let running = true, frameN = 0;

  canvas.addEventListener('pointerdown', e => {
    dragging = true; lastX = e.clientX; lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
    canvas.style.cursor = 'grabbing';
    setTip(-1);
  });
  canvas.addEventListener('pointermove', e => {
    const r = canvas.getBoundingClientRect();
    pointer = { x: (e.clientX - r.left) * size / r.width, y: (e.clientY - r.top) * size / r.height, cx: e.clientX, cy: e.clientY };
    if (dragging) {
      lon0 -= (e.clientX - lastX) * 0.35;
      lat0 = Math.max(-70, Math.min(70, lat0 + (e.clientY - lastY) * 0.35));
      lastX = e.clientX; lastY = e.clientY;
    } else {
      pickAt(pointer);
      positionTip(e.clientX, e.clientY);
    }
  });
  const endDrag = () => { dragging = false; canvas.style.cursor = 'grab'; };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('pointerleave', () => { pointer = null; setTip(-1); });

  // pixel écran → pays visité sous le curseur
  function pickAt(p) {
    if (!p || !features.length) { setTip(-1); return; }
    const x = (p.x - size / 2) / R, y = -(p.y - size / 2) / R;
    const d2 = x * x + y * y;
    if (d2 > 1) { setTip(-1); return; }
    const z2 = Math.sqrt(1 - d2);
    const c = lon0 * RAD, t = lat0 * RAD;
    const y1 = y * Math.cos(t) + z2 * Math.sin(t);
    const z1 = -y * Math.sin(t) + z2 * Math.cos(t);
    const wx = x * Math.cos(c) + z1 * Math.sin(c);
    const wz = -x * Math.sin(c) + z1 * Math.cos(c);
    const lon = Math.atan2(wx, wz) / RAD, lat = Math.asin(Math.max(-1, Math.min(1, y1))) / RAD;
    let found = -1;
    for (let i = 0; i < features.length; i++) {
      if (inBox(features[i].box, lon, lat) && d3.geoContains(features[i].f, [lon, lat])) { found = i; break; }
    }
    setTip(found);
  }

  function setTip(idx) {
    hover = idx;
    if (!tooltip) return;
    if (idx < 0) { tooltip.style.opacity = '0'; canvas.style.cursor = dragging ? 'grabbing' : 'grab'; return; }
    tooltip.textContent = VISITED[features[idx].name];
    tooltip.style.opacity = '1';
    canvas.style.cursor = 'pointer';
  }
  function positionTip(x, y) {
    if (!tooltip) return;
    tooltip.style.left = (x + 14) + 'px';
    tooltip.style.top = (y + 14) + 'px';
  }

  // ---------- Dessin ----------
  const buckets = { dimFar: [], dimNear: [], visFar: [], visNear: [], hov: [] };

  function draw() {
    const cx = size / 2, cy = size / 2;
    ctx.clearRect(0, 0, size, size);

    // halo extérieur
    let g = ctx.createRadialGradient(cx, cy, R * 0.92, cx, cy, R * 1.28);
    g.addColorStop(0, 'rgba(168,85,247,0.38)');
    g.addColorStop(0.45, 'rgba(147,51,234,0.12)');
    g.addColorStop(1, 'rgba(147,51,234,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, R * 1.28, 0, Math.PI * 2); ctx.fill();

    // corps de la sphère
    g = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R);
    g.addColorStop(0, '#2a1458');
    g.addColorStop(0.6, '#150a2e');
    g.addColorStop(1, '#0a0418');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(192,132,252,0.35)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    if (!dotX) return;

    const c = lon0 * RAD, t = lat0 * RAD;
    const cc = Math.cos(c), sc = Math.sin(c), ct = Math.cos(t), st = Math.sin(t);
    for (const k in buckets) buckets[k].length = 0;

    for (let i = 0; i < dotX.length; i++) {
      const x = dotX[i], y = dotY[i], z = dotZ[i];
      const x1 = x * cc - z * sc;
      const z1 = x * sc + z * cc;
      const z2 = y * st + z1 * ct;
      if (z2 <= 0.02) continue;
      const y2 = y * ct - z1 * st;
      const sx = cx + x1 * R, sy = cy - y2 * R;
      const v = dotC[i], near = z2 > 0.4;
      if (v < 0) (near ? buckets.dimNear : buckets.dimFar).push(sx, sy);
      else if (v === hover) buckets.hov.push(sx, sy);
      else (near ? buckets.visNear : buckets.visFar).push(sx, sy);
    }

    const squares = (arr, color, s) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      for (let i = 0; i < arr.length; i += 2) ctx.rect(arr[i] - s / 2, arr[i + 1] - s / 2, s, s);
      ctx.fill();
    };
    const circles = (arr, color, r) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      for (let i = 0; i < arr.length; i += 2) { ctx.moveTo(arr[i] + r, arr[i + 1]); ctx.arc(arr[i], arr[i + 1], r, 0, Math.PI * 2); }
      ctx.fill();
    };

    const u = size / 600;
    // pays non visités : points discrets
    squares(buckets.dimFar, 'rgba(196,181,253,0.20)', 1.5 * u * 1.3);
    squares(buckets.dimNear, 'rgba(196,181,253,0.50)', 1.7 * u * 1.3);

    // pays visités : lueur + points lumineux
    ctx.globalCompositeOperation = 'lighter';
    circles(buckets.visNear, 'rgba(232,121,249,0.10)', 5.5 * u);
    circles(buckets.visFar, 'rgba(232,121,249,0.06)', 4.5 * u);
    circles(buckets.hov, 'rgba(255,255,255,0.18)', 7 * u);
    ctx.globalCompositeOperation = 'source-over';
    circles(buckets.visFar, 'rgba(216,150,255,0.75)', 1.7 * u * 1.3);
    circles(buckets.visNear, '#f0abfc', 2.1 * u * 1.3);
    circles(buckets.hov, '#ffffff', 2.6 * u * 1.3);
  }

  function frame() {
    if (running) {
      frameN++;
      if (!dragging && !reduceMotion && hover < 0) lon0 += 0.22;
      if (pointer && !dragging && frameN % 5 === 0) pickAt(pointer);
      draw();
    }
    requestAnimationFrame(frame);
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(es => { running = es[0].isIntersecting; }).observe(container);
  }

  // ---------- Démarrage ----------
  fetch(WORLD_URL)
    .then(r => r.json())
    .then(async world => {
      const feats = topojson.feature(world, world.objects.countries).features;
      for (const f0 of feats) {
        const name = f0.properties.name;
        if (name === 'Antarctica') continue;
        const f = trim(f0);
        const visitedIdx = names.indexOf(name);
        const entry = { f, name, box: d3.geoBounds(f), visitedIdx };
        allCountries.push(entry);
        if (visitedIdx >= 0) features[visitedIdx] = entry;
      }
      features = features.filter(Boolean);
      // réindexe les pays visités
      features.forEach((e, i) => { e.visitedIdx = i; });
      await buildDots();
      status.remove();
      requestAnimationFrame(frame);
    })
    .catch(() => {
      status.textContent = 'Le globe n’a pas pu se charger (connexion nécessaire).';
    });
})();
