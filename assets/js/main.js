// Main Portfolio Interactions
// Magic UI Morphing Text, Kinetic Text, iPod Controls & Sparkles

document.addEventListener('DOMContentLoaded', () => {
  // 1. Magic UI Morphing Text
  initMorphingText();

  // 2. iPod Classic Interactive Audio Player
  initIpodPlayer();

  // 3. Ambient Floating Sparkles
  initSparkles();

  // 4. Smooth Scroll Reveal
  initScrollReveal();
});

// --- Morphing Text ---
function initMorphingText() {
  const morphElement = document.getElementById('morphing-text');
  if (!morphElement) return;

  const phrases = [
    "Direction Artistique",
    "Storytelling & Image",
    "Créatrice & Curieuse",
    "Production Audiovisuelle",
    "Autenticidad & Inclusivité"
  ];

  let index = 0;

  function morph() {
    morphElement.style.opacity = '0';
    morphElement.style.transform = 'translateY(12px) scale(0.96)';

    setTimeout(() => {
      index = (index + 1) % phrases.length;
      morphElement.textContent = phrases[index];
      morphElement.style.opacity = '1';
      morphElement.style.transform = 'translateY(0) scale(1)';
    }, 450);
  }

  setInterval(morph, 3200);
}

// --- iPod Classic Player ---
function initIpodPlayer() {
  const playBtn = document.getElementById('ipod-play-btn');
  const centerBtn = document.getElementById('ipod-center-btn');
  const statusIcon = document.getElementById('ipod-status-icon');
  const waves = document.querySelectorAll('.sound-wave-bar');
  const trackTitle = document.getElementById('ipod-track-title');

  let isPlaying = false;

  const tracks = [
    { title: "MEGA BBL", artist: "Theodora" },
    { title: "Music is the Answer", artist: "Danny Tenaglia" },
    { title: "Sunset in Bali", artist: "Claire's Vibe" },
    { title: "La Brujita Beats", artist: "Aura Mix" }
  ];
  let currentTrackIdx = 0;

  function togglePlay() {
    isPlaying = !isPlaying;
    if (isPlaying) {
      if (statusIcon) statusIcon.innerHTML = '▶';
      waves.forEach((bar, i) => {
        bar.style.animation = `soundWave ${0.4 + (i % 3) * 0.2}s infinite alternate ease-in-out`;
      });
    } else {
      if (statusIcon) statusIcon.innerHTML = '❚❚';
      waves.forEach(bar => {
        bar.style.animation = 'none';
        bar.style.height = '6px';
      });
    }
  }

  function nextTrack() {
    currentTrackIdx = (currentTrackIdx + 1) % tracks.length;
    if (trackTitle) {
      trackTitle.textContent = `${tracks[currentTrackIdx].title} — ${tracks[currentTrackIdx].artist}`;
    }
  }

  if (playBtn) playBtn.addEventListener('click', togglePlay);
  if (centerBtn) centerBtn.addEventListener('click', nextTrack);

  const ipodNext = document.getElementById('ipod-next');
  if (ipodNext) ipodNext.addEventListener('click', nextTrack);

  const ipodPrev = document.getElementById('ipod-prev');
  if (ipodPrev) {
    ipodPrev.addEventListener('click', () => {
      currentTrackIdx = (currentTrackIdx - 1 + tracks.length) % tracks.length;
      if (trackTitle) {
        trackTitle.textContent = `${tracks[currentTrackIdx].title} — ${tracks[currentTrackIdx].artist}`;
      }
    });
  }
}

// --- Floating Ambient Sparkles ---
function initSparkles() {
  let sparkleContainer = document.getElementById('sparkles-container');
  if (!sparkleContainer) {
    sparkleContainer = document.createElement('div');
    sparkleContainer.id = 'sparkles-container';
    sparkleContainer.className = 'fixed inset-0 pointer-events-none z-10 overflow-hidden';
    document.body.appendChild(sparkleContainer);
  }

  sparkleContainer.innerHTML = '';

  const starSvgs = [
    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e9d5ff" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    `<svg width="15" height="15" viewBox="0 0 24 24" fill="#c084fc"><path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z"/></svg>`,
    `<svg width="20" height="20" viewBox="0 0 24 24" fill="#ffffff"><path d="M12 0L13.8 9.5L24 12L13.8 14.5L12 24L10.2 14.5L0 12L10.2 9.5Z"/></svg>`,
    `<svg width="10" height="10" viewBox="0 0 24 24" fill="#e9d5ff"><circle cx="12" cy="12" r="6"/></svg>`
  ];

  for (let i = 0; i < 35; i++) {
    const star = document.createElement('div');
    star.className = 'sparkle-star';
    star.innerHTML = starSvgs[Math.floor(Math.random() * starSvgs.length)];
    star.style.left = `${Math.random() * 98}%`;
    star.style.top = `${Math.random() * 98}%`;
    star.style.opacity = (0.2 + Math.random() * 0.75).toFixed(2);
    star.style.animation = `floatSparkle ${3.5 + Math.random() * 5}s infinite ease-in-out ${Math.random() * 4}s`;
    sparkleContainer.appendChild(star);
  }
}


// --- Scroll Reveal ---
function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal-on-scroll');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('opacity-100', 'translate-y-0');
        entry.target.classList.remove('opacity-0', 'translate-y-10');
      }
    });
  }, { threshold: 0.12 });

  elements.forEach(el => {
    el.classList.add('opacity-0', 'translate-y-10', 'transition-all', 'duration-700', 'ease-out');
    observer.observe(el);
  });
}
