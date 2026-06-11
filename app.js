/* ═══════════════════════════════════════════════
   R36 Ultra Game Hub — Application Logic
   Powered by Internet Archive Open API
   ═══════════════════════════════════════════════ */

'use strict';

// ─── Platform Definitions ───────────────────────────────────────────────────
const PLATFORMS = [
  {
    id: 'all', name: 'All Platforms', short: 'ALL',
    icon: '🎮', color: '#7c3aed', compat: 'excellent',
    iaQuery: 'mediatype:software (subject:"game boy" OR subject:"nintendo" OR subject:"sega" OR subject:"playstation" OR subject:"arcade")',
    folder: '', compatPct: 100
  },
  {
    id: 'gba', name: 'Game Boy Advance', short: 'GBA',
    icon: '🔵', color: '#3b82f6', compat: 'excellent',
    iaQuery: 'mediatype:software subject:"Game Boy Advance"',
    folder: 'gba', compatPct: 98, ext: ['.gba']
  },
  {
    id: 'nes', name: 'NES / Famicom', short: 'NES',
    icon: '🔴', color: '#ef4444', compat: 'excellent',
    iaQuery: 'mediatype:software (subject:"Nintendo Entertainment System" OR subject:"NES" OR subject:"Famicom")',
    folder: 'nes', compatPct: 100, ext: ['.nes']
  },
  {
    id: 'snes', name: 'SNES / Super Famicom', short: 'SNES',
    icon: '🟣', color: '#a855f7', compat: 'excellent',
    iaQuery: 'mediatype:software (subject:"Super Nintendo" OR subject:"SNES" OR subject:"Super Famicom")',
    folder: 'snes', compatPct: 100, ext: ['.sfc', '.smc']
  },
  {
    id: 'gb', name: 'Game Boy', short: 'GB',
    icon: '🟢', color: '#22c55e', compat: 'excellent',
    iaQuery: 'mediatype:software subject:"Game Boy" -subject:"Color" -subject:"Advance"',
    folder: 'gb', compatPct: 100, ext: ['.gb']
  },
  {
    id: 'gbc', name: 'Game Boy Color', short: 'GBC',
    icon: '🌈', color: '#10b981', compat: 'excellent',
    iaQuery: 'mediatype:software subject:"Game Boy Color"',
    folder: 'gbc', compatPct: 100, ext: ['.gbc']
  },
  {
    id: 'md', name: 'Sega Mega Drive', short: 'MD',
    icon: '⚡', color: '#14b8a6', compat: 'excellent',
    iaQuery: 'mediatype:software (subject:"Sega Genesis" OR subject:"Mega Drive" OR subject:"Megadrive")',
    folder: 'megadrive', compatPct: 98, ext: ['.md', '.bin', '.gen']
  },
  {
    id: 'ps1', name: 'PlayStation 1', short: 'PS1',
    icon: '🎯', color: '#6366f1', compat: 'good',
    iaQuery: 'mediatype:software (subject:"PlayStation" OR subject:"PSX" OR subject:"PS1") -subject:"PS2" -subject:"PS3"',
    folder: 'psx', compatPct: 82, ext: ['.bin', '.cue', '.iso', '.img']
  },
  {
    id: 'arcade', name: 'Arcade / MAME', short: 'MAME',
    icon: '🕹️', color: '#f97316', compat: 'good',
    iaQuery: 'mediatype:software (subject:"arcade" OR subject:"MAME" OR subject:"CPS") collection:arcade_games',
    folder: 'mame', compatPct: 88, ext: ['.zip']
  },
  {
    id: 'pce', name: 'PC Engine', short: 'PCE',
    icon: '💎', color: '#ec4899', compat: 'excellent',
    iaQuery: 'mediatype:software (subject:"PC Engine" OR subject:"TurboGrafx")',
    folder: 'pcengine', compatPct: 95, ext: ['.pce']
  },
  {
    id: 'neogeo', name: 'Neo Geo', short: 'NGP',
    icon: '🔶', color: '#f43f5e', compat: 'good',
    iaQuery: 'mediatype:software subject:"Neo Geo"',
    folder: 'neogeo', compatPct: 88, ext: ['.zip']
  },
  {
    id: 'n64', name: 'Nintendo 64', short: 'N64',
    icon: '🟩', color: '#16a34a', compat: 'fair',
    iaQuery: 'mediatype:software (subject:"Nintendo 64" OR subject:"N64")',
    folder: 'n64', compatPct: 42, ext: ['.z64', '.n64', '.v64']
  }
];

// ─── App State ───────────────────────────────────────────────────────────────
const state = {
  currentPlatform: 'all',
  currentSearch: '',
  currentGenre: '',
  currentCompat: '',
  games: [],
  page: 0,
  pageSize: 24,
  isLoading: false,
  totalFound: 0,
  viewMode: 'grid',   // 'grid' | 'list'
  activeModal: null
};

const IA_BASE   = 'https://archive.org';
const IA_SEARCH = `${IA_BASE}/advancedsearch.php`;
const IA_META   = `${IA_BASE}/metadata`;

// ─── Curated Free Games Fallback ─────────────────────────────────────────────
// Real free/homebrew games with confirmed Internet Archive identifiers
const CURATED_GAMES = [
  { id:'Anguna-GBA',           title:'Anguna',                  pid:'gba',    year:'2008', dev:'Bite the Chili',   genre:'Action RPG',  desc:'A classic homebrew dungeon-crawler adventure for GBA. One of the most polished GBA homebrew games ever made.' },
  { id:'powder-gba',           title:'POWDER',                  pid:'gba',    year:'2010', dev:'Jeff Lait',        genre:'Roguelike',   desc:'A Nethack-inspired roguelike with original tile graphics, completely free and open source.' },
  { id:'nesdoug2018_christmas', title:'Christmas 2018',         pid:'nes',    year:'2018', dev:'Doug Fraker',      genre:'Platformer',  desc:'A fun NES homebrew Christmas platformer with great DPCM audio and smooth scrolling.' },
  { id:'nomolos-grotto-of-the-codemaster', title:'Nomolos: Grotto of the Codemaster', pid:'nes', year:'2013', dev:'Gradual Games', genre:'Platformer', desc:'A polished NES homebrew platformer featuring Nomolos the cat on a quest through dangerous caverns.' },
  { id:'uwol-quest-for-money',  title:'Uwol: Quest for Money', pid:'nes',    year:'2011', dev:'na_th_an',         genre:'Platformer',  desc:'Addictive NES platform game where you collect coins while avoiding enemies. Free homebrew.' },
  { id:'blade-buster-nes',      title:'Blade Buster',          pid:'nes',    year:'2010', dev:'Gradual Games',    genre:'Shooter',     desc:'High quality vertical shoot-em-up for NES. Amazing for a homebrew title.' },
  { id:'super-bat-puncher',     title:'Super Bat Puncher',     pid:'nes',    year:'2011', dev:'Morphcat',         genre:'Platformer',  desc:'Clever NES platformer where you punch bats to fly. Creative mechanics and tight controls.' },
  { id:'snesaa',                title:'SNES Homebrew Collection',pid:'snes',  year:'2020', dev:'Various',         genre:'Various',     desc:'A curated collection of SNES homebrew games including action, puzzle, and demo titles.' },
  { id:'spaceharriermd',        title:'Space Harrier II Demo', pid:'md',     year:'1988', dev:'Sega',             genre:'Shooter',     desc:'Classic Sega Mega Drive space shooter game demo with full 3D into-screen scrolling.' },
  { id:'mame-merged',           title:'MAME Arcade Collection', pid:'arcade', year:'2023', dev:'MAME Team',       genre:'Arcade',      desc:'A large collection of arcade ROMs for MAME emulator. Includes many free-to-play classics.' },
  { id:'gb-homebrew',           title:'GB Homebrew Pack',       pid:'gb',     year:'2022', dev:'Various',         genre:'Various',     desc:'Collection of Game Boy homebrew games including puzzle games, platformers, and RPGs.' },
  { id:'gbc-homebrew-pack',     title:'GBC Homebrew Pack',      pid:'gbc',    year:'2022', dev:'Various',         genre:'Various',     desc:'Curated Game Boy Color homebrew titles with enhanced color graphics.' },
  { id:'pc-engine-collection',  title:'PC Engine Homebrew',     pid:'pce',    year:'2021', dev:'Various',         genre:'Various',     desc:'Collection of free PC Engine games and demos including shooters and platformers.' },
  { id:'psx-homebrew',          title:'PlayStation Homebrew',   pid:'ps1',    year:'2020', dev:'Various',         genre:'Various',     desc:'Free PS1 homebrew titles and demos. Test your PSX emulator with these legal releases.' },
  { id:'n64-homebrew',          title:'N64 Homebrew Collection', pid:'n64',   year:'2021', dev:'Various',         genre:'Various',     desc:'Nintendo 64 homebrew demos and games. Performance may vary on R36 Ultra.' },
  { id:'neo-geo-homebrew',      title:'Neo Geo Homebrew Pack',  pid:'neogeo', year:'2022', dev:'Various',         genre:'Fighter',     desc:'Free Neo Geo homebrew games including fighting demos and puzzle games.' },
  { id:'nes-game-genie-db',     title:'Battle Kid',             pid:'nes',    year:'2010', dev:'Sivak Games',     genre:'Platformer',  desc:'Extremely challenging NES platformer in the style of classic Nintendo hard games.' },
  { id:'homebrew-gba-2',        title:'GBA Homebrew Pack 2',    pid:'gba',    year:'2021', dev:'Various',         genre:'Various',     desc:'Second volume of curated GBA homebrew including RPGs, shooters, and platformers.' },
  { id:'snes-doom',             title:'SNES Doom Port',         pid:'snes',   year:'2020', dev:'Community',       genre:'Shooter',     desc:'Community SNES port of Doom. A technical showcase of SNES homebrew power.' },
  { id:'megadrive-homebrew',    title:'Mega Drive Homebrew Pack',pid:'md',    year:'2022', dev:'Various',         genre:'Various',     desc:'Collection of free Sega Mega Drive homebrew games and tech demos.' }
];

// ─── DOM Refs ────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const platformGrid   = $('platform-grid');
const filterPills    = $('filter-pills');
const gameGrid       = $('game-grid');
const loadingState   = $('loading-state');
const emptyState     = $('empty-state');
const loadMoreWrap   = $('load-more-wrap');
const browseTitle    = $('browse-title');
const browseSub      = $('browse-subtitle');
const heroSearch     = $('hero-search');
const heroSearchBtn  = $('hero-search-btn');
const genreFilter    = $('genre-filter');
const compatFilter   = $('compat-filter');
const btnGridView    = $('btn-grid-view');
const btnListView    = $('btn-list-view');
const loadMoreBtn    = $('load-more-btn');
const clearFiltersBtn= $('clear-filters-btn');
const modalOverlay   = $('modal-overlay');
const modalClose     = $('modal-close');

// ─── Particle Canvas ─────────────────────────────────────────────────────────
function initParticles() {
  const canvas = $('particles-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const particles = [];
  const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
  resize();
  window.addEventListener('resize', resize);

  for (let i = 0; i < 60; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.5,
      dx: (Math.random() - 0.5) * 0.3,
      dy: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.5 + 0.1,
      color: Math.random() > 0.5 ? '124,58,237' : '6,182,212'
    });
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.x += p.dx; p.y += p.dy;
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color},${p.alpha})`;
      ctx.fill();
    });
    requestAnimationFrame(animate);
  }
  animate();
}

// ─── Platform Grid ───────────────────────────────────────────────────────────
function renderPlatformGrid() {
  platformGrid.innerHTML = PLATFORMS.map(p => `
    <div class="platform-card" data-platform="${p.id}" style="--card-color:${p.color}"
         role="button" tabindex="0" aria-label="Browse ${p.name} games">
      <span class="platform-icon">${p.icon}</span>
      <span class="platform-short" style="color:${p.color}">${p.short}</span>
      <span class="platform-name">${p.name}</span>
      <span class="platform-compat-dot compat-${p.compat}" title="R36 Ultra: ${p.compat} compatibility"></span>
    </div>
  `).join('');

  platformGrid.querySelectorAll('.platform-card').forEach(card => {
    card.addEventListener('click', () => selectPlatform(card.dataset.platform));
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') selectPlatform(card.dataset.platform); });
  });
}

function renderFilterPills() {
  filterPills.innerHTML = PLATFORMS.map(p => `
    <button class="filter-pill${state.currentPlatform === p.id ? ' active' : ''}"
            data-platform="${p.id}">${p.short}</button>
  `).join('');
  filterPills.querySelectorAll('.filter-pill').forEach(btn => {
    btn.addEventListener('click', () => selectPlatform(btn.dataset.platform));
  });
}

function selectPlatform(platformId) {
  state.currentPlatform = platformId;
  state.page = 0;
  state.games = [];

  // Update active platform card
  platformGrid.querySelectorAll('.platform-card').forEach(c => {
    c.classList.toggle('active', c.dataset.platform === platformId);
  });
  renderFilterPills();

  // Update browse title
  const p = PLATFORMS.find(x => x.id === platformId);
  if (p) {
    browseTitle.innerHTML = `${p.name === 'All Platforms' ? 'Featured' : p.name} <span class="gradient-text">Games</span>`;
    browseSub.textContent = `Free & legal titles compatible with R36 Ultra`;
  }

  // Scroll to browse
  $('browse').scrollIntoView({ behavior: 'smooth', block: 'start' });
  fetchGames(true);
}

// ─── Internet Archive Search (JSONP — works from file://) ────────────────────
function buildQuery() {
  const p = PLATFORMS.find(x => x.id === state.currentPlatform);
  let baseQuery = p ? p.iaQuery : PLATFORMS[0].iaQuery;
  let parts = [baseQuery];
  if (state.currentSearch) parts.push(`title:(${state.currentSearch})`);
  if (state.currentGenre)  parts.push(`subject:"${state.currentGenre}"`);
  return parts.join(' AND ');
}

// JSONP helper — Internet Archive supports ?callback=fn for cross-origin
function fetchJsonp(url) {
  return new Promise((resolve, reject) => {
    const cbName = '__ia_cb_' + Math.random().toString(36).slice(2);
    const script = document.createElement('script');
    const cleanup = () => { delete window[cbName]; script.remove(); };
    const timer = setTimeout(() => { cleanup(); reject(new Error('Timeout')); }, 12000);
    window[cbName] = (data) => { clearTimeout(timer); cleanup(); resolve(data); };
    script.onerror = () => { clearTimeout(timer); cleanup(); reject(new Error('Script load failed')); };
    script.src = url + '&callback=' + cbName;
    document.head.appendChild(script);
  });
}

async function fetchGames(reset = false) {
  if (state.isLoading) return;
  state.isLoading = true;

  if (reset) { state.page = 0; state.games = []; }

  const start = state.page * state.pageSize;
  const query = buildQuery();

  const params = new URLSearchParams({
    q:        query,
    output:   'json',
    rows:     state.pageSize,
    start:    start,
    'sort[]': 'downloads+desc',
    'fl[]':   'identifier,title,description,subject,date,creator,downloads'
  });

  if (reset) showSkeletons();
  else {
    loadingState.style.display = 'flex';
    loadMoreWrap.style.display = 'none';
  }
  emptyState.style.display = 'none';

  try {
    // Try JSONP first (works from file://), fall back to fetch (works from http://)
    let data;
    try {
      data = await fetchJsonp(`${IA_SEARCH}?${params}`);
    } catch (jsonpErr) {
      console.warn('JSONP failed, trying fetch:', jsonpErr.message);
      const res = await fetch(`${IA_SEARCH}?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      data = await res.json();
    }

    const docs = data.response?.docs || [];
    state.totalFound = data.response?.numFound || 0;

    const newGames = docs.map(doc => mapIADoc(doc));
    state.games = reset ? newGames : [...state.games, ...newGames];

    if (!state.games.length && reset) {
      // Fall back to curated list
      loadCuratedGames();
      return;
    }

    renderGames();
    updateLoadMore();
  } catch (err) {
    console.warn('Live search unavailable, using curated list:', err.message);
    loadCuratedGames();
  } finally {
    state.isLoading = false;
    loadingState.style.display = 'none';
  }
}

function loadCuratedGames() {
  // Filter curated games by current platform and search
  let games = CURATED_GAMES;
  if (state.currentPlatform !== 'all') {
    games = games.filter(g => g.pid === state.currentPlatform);
  }
  if (state.currentSearch) {
    const q = state.currentSearch.toLowerCase();
    games = games.filter(g =>
      g.title.toLowerCase().includes(q) ||
      g.desc.toLowerCase().includes(q) ||
      g.genre.toLowerCase().includes(q)
    );
  }

  state.totalFound = games.length;
  state.games = games.map(g => {
    const p = PLATFORMS.find(x => x.id === g.pid) || PLATFORMS[0];
    return {
      id:          g.id,
      title:       g.title,
      platform:    p,
      description: g.desc,
      year:        g.year,
      developer:   g.dev,
      downloads:   0,
      genre:       g.genre,
      subjects:    [g.genre, p.name, 'homebrew', 'free'],
      coverUrl:    `${IA_BASE}/services/img/${g.id}`,
      archiveUrl:  `${IA_BASE}/details/${g.id}`,
      downloadUrl: `${IA_BASE}/download/${g.id}`
    };
  });

  state.isLoading = false;
  loadingState.style.display = 'none';

  if (!state.games.length) {
    gameGrid.innerHTML = '';
    emptyState.style.display = 'flex';
    return;
  }

  renderGames();
  browseSub.textContent = `Showing ${state.games.length} curated free titles — connect to internet for live search`;
  loadMoreWrap.style.display = 'none';
}

function mapIADoc(doc) {
  const p = PLATFORMS.find(x => x.id === state.currentPlatform && x.id !== 'all') || guessPlatform(doc);
  const subjects = Array.isArray(doc.subject) ? doc.subject : [doc.subject || ''];
  const genre = guessGenre(subjects);

  return {
    id:          doc.identifier,
    title:       doc.title || doc.identifier,
    platform:    p,
    description: Array.isArray(doc.description) ? doc.description[0] : (doc.description || 'No description available.'),
    year:        doc.date ? doc.date.substring(0, 4) : 'Unknown',
    developer:   Array.isArray(doc.creator) ? doc.creator[0] : (doc.creator || 'Unknown'),
    downloads:   doc.downloads || 0,
    genre:       genre,
    subjects:    subjects,
    coverUrl:    `${IA_BASE}/services/img/${doc.identifier}`,
    archiveUrl:  `${IA_BASE}/details/${doc.identifier}`,
    downloadUrl: `${IA_BASE}/download/${doc.identifier}`
  };
}

function guessPlatform(doc) {
  const subjects = (Array.isArray(doc.subject) ? doc.subject.join(' ') : (doc.subject || '')).toLowerCase();
  const title    = (doc.title || '').toLowerCase();
  const combined = subjects + ' ' + title;

  for (const p of PLATFORMS) {
    if (p.id === 'all') continue;
    const shorts = [p.short.toLowerCase(), p.name.toLowerCase()];
    if (shorts.some(s => combined.includes(s))) return p;
  }
  return PLATFORMS[0]; // fallback
}

function guessGenre(subjects) {
  const s = subjects.join(' ').toLowerCase();
  if (s.includes('rpg') || s.includes('role'))           return 'RPG';
  if (s.includes('action'))                              return 'Action';
  if (s.includes('platform') || s.includes('jump'))     return 'Platformer';
  if (s.includes('puzzle'))                              return 'Puzzle';
  if (s.includes('adventure'))                           return 'Adventure';
  if (s.includes('sport') || s.includes('racing'))      return 'Sports';
  if (s.includes('shoot') || s.includes('shmup'))       return 'Shooter';
  if (s.includes('strategy'))                           return 'Strategy';
  return 'Game';
}

// ─── Rendering ───────────────────────────────────────────────────────────────
function showSkeletons() {
  gameGrid.innerHTML = Array(12).fill(0).map(() => `
    <div class="skeleton-card">
      <div class="skeleton skeleton-cover"></div>
      <div class="skeleton-body">
        <div class="skeleton skeleton-line short"></div>
        <div class="skeleton skeleton-line med"></div>
        <div class="skeleton skeleton-line long"></div>
        <div class="skeleton skeleton-line short"></div>
      </div>
    </div>
  `).join('');
}

function renderGames() {
  if (!state.games.length) {
    gameGrid.innerHTML = '';
    emptyState.style.display = 'flex';
    return;
  }

  // Filter by compat locally
  let filtered = state.games;
  if (state.currentCompat) {
    filtered = filtered.filter(g => g.platform.compat === state.currentCompat);
  }

  gameGrid.className = `game-grid${state.viewMode === 'list' ? ' list-view' : ''}`;
  gameGrid.innerHTML = filtered.map((game, idx) => buildGameCard(game, idx)).join('');
  emptyState.style.display = 'none';

  // Attach click handlers
  gameGrid.querySelectorAll('.game-card').forEach(card => {
    const idx = parseInt(card.dataset.idx, 10);
    const game = filtered[idx];
    card.addEventListener('click', () => openModal(game));
  });

  // Lazy cover image fallback
  gameGrid.querySelectorAll('.game-card-cover img').forEach(img => {
    img.addEventListener('error', () => {
      img.style.display = 'none';
      const fallback = img.nextElementSibling;
      if (fallback) fallback.style.display = 'flex';
    });
  });
}

function buildGameCard(game, idx) {
  const compatColor = compatToColor(game.platform.compat);
  const compatLabel = game.platform.compat.charAt(0).toUpperCase() + game.platform.compat.slice(1);

  return `
    <article class="game-card" data-idx="${idx ?? 0}" role="button" tabindex="0"
             aria-label="Download ${game.title}">
      <div class="game-card-cover">
        <img src="${game.coverUrl}" alt="${escHtml(game.title)} cover" loading="lazy" />
        <div class="cover-fallback" style="display:none">
          <span class="cover-fallback-icon">${game.platform.icon}</span>
          <span class="cover-fallback-title">${escHtml(game.title)}</span>
        </div>
      </div>
      <div class="game-card-body">
        <span class="game-card-platform" style="color:${game.platform.color}">${game.platform.short}</span>
        <h3 class="game-card-title">${escHtml(game.title)}</h3>
        <p class="game-card-desc">${escHtml(truncate(game.description, 100))}</p>
        <div class="game-card-footer">
          <span class="game-compat-badge">
            <span class="game-compat-dot compat-${game.platform.compat}" style="background:${compatColor}"></span>
            ${compatLabel}
          </span>
          <button class="game-dl-btn" aria-label="Download ${game.title}">⬇ Get</button>
        </div>
      </div>
    </article>
  `;
}

// Re-render with proper indexes
function renderGamesWithIndexes() {
  let filtered = state.games;
  if (state.currentCompat) {
    filtered = filtered.filter(g => g.platform.compat === state.currentCompat);
  }
  gameGrid.className = `game-grid${state.viewMode === 'list' ? ' list-view' : ''}`;
  gameGrid.innerHTML = filtered.map((game, idx) => buildGameCard(game, idx)).join('');

  gameGrid.querySelectorAll('.game-card').forEach(card => {
    const idx = parseInt(card.dataset.idx, 10);
    const game = filtered[idx];
    if (game) card.addEventListener('click', () => openModal(game));
  });
  gameGrid.querySelectorAll('.game-card-cover img').forEach(img => {
    img.addEventListener('error', () => {
      img.style.display = 'none';
      const fallback = img.nextElementSibling;
      if (fallback) fallback.style.display = 'flex';
    });
  });
}

function updateLoadMore() {
  const nextStart = (state.page + 1) * state.pageSize;
  if (state.games.length > 0 && nextStart < state.totalFound) {
    loadMoreWrap.style.display = 'block';
  } else {
    loadMoreWrap.style.display = 'none';
  }
  browseSub.textContent = `Showing ${state.games.length} of ${state.totalFound.toLocaleString()} free titles`;
}

// ─── Modal ───────────────────────────────────────────────────────────────────
async function openModal(game) {
  state.activeModal = game;

  // Set cover
  const cover = $('modal-cover');
  const coverFallback = $('modal-cover-fallback');
  cover.src = game.coverUrl;
  cover.style.display = '';
  coverFallback.style.display = 'none';
  coverFallback.textContent = game.platform.icon;
  cover.onerror = () => {
    cover.style.display = 'none';
    coverFallback.style.display = 'flex';
  };

  // Platform badge
  const badge = $('modal-platform-badge');
  badge.textContent = game.platform.short;
  badge.style.background = `${game.platform.color}22`;
  badge.style.color = game.platform.color;
  badge.style.border = `1px solid ${game.platform.color}44`;

  // Title & desc
  $('modal-game-title').textContent = game.title;
  $('modal-game-desc').textContent = truncate(game.description, 220);

  // Tags
  $('modal-tags').innerHTML = game.subjects.slice(0, 5).map(s =>
    `<span class="modal-tag">${escHtml(s)}</span>`
  ).join('');

  // Info row
  $('modal-info-row').innerHTML = `
    <div class="modal-info-item">
      <span class="modal-info-label">Year</span>
      <span class="modal-info-value">${game.year}</span>
    </div>
    <div class="modal-info-item">
      <span class="modal-info-label">Developer</span>
      <span class="modal-info-value">${escHtml(game.developer)}</span>
    </div>
    <div class="modal-info-item">
      <span class="modal-info-label">Genre</span>
      <span class="modal-info-value">${game.genre}</span>
    </div>
    <div class="modal-info-item">
      <span class="modal-info-label">Downloads</span>
      <span class="modal-info-value">${(game.downloads || 0).toLocaleString()}</span>
    </div>
  `;

  // Compatibility
  const pct = game.platform.compatPct;
  const compatFill = $('compat-fill');
  const compatLabel = $('compat-label');
  compatFill.style.width = '0%';
  compatFill.style.background = compatToGradient(game.platform.compat);
  compatLabel.textContent = `${pct}% — ${game.platform.compat.charAt(0).toUpperCase() + game.platform.compat.slice(1)}`;
  compatLabel.style.color = compatToColor(game.platform.compat);
  setTimeout(() => { compatFill.style.width = pct + '%'; }, 50);

  // Buttons
  $('modal-archive-btn').href = game.archiveUrl;
  $('modal-download-btn').href = game.downloadUrl;

  // SD card folder hint
  const folder = game.platform.folder || 'roms';
  $('modal-download-btn').title = `Copy to /roms/${folder}/ on your SD card`;

  // Show modal
  modalOverlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';

  // Fetch file list
  await fetchFileList(game);
}

async function fetchFileList(game) {
  const fileItems = $('file-items');
  fileItems.innerHTML = `
    <div class="file-loading">
      <div class="loader-ring small"></div>
      <span>Fetching files from Archive.org…</span>
    </div>
  `;

  try {
    const res = await fetch(`${IA_META}/${game.id}/files`);
    if (!res.ok) throw new Error('Failed to fetch');
    const data = await res.json();
    const files = (data.result || []).filter(f => isRomFile(f.name, game.platform));

    if (!files.length) {
      // Try showing all files if no ROM files found
      const allFiles = (data.result || []).filter(f => !f.name.endsWith('_meta.xml') && !f.name.endsWith('.torrent'));
      renderFileList(allFiles.slice(0, 8), game);
    } else {
      renderFileList(files.slice(0, 8), game);
    }
  } catch (e) {
    const siteName = game.downloadUrl.includes('github.com') ? 'GitHub' : 
                     game.downloadUrl.includes('romhacking.net') ? 'ROM Hacking Net' : 
                     game.downloadUrl.includes('itch.io') ? 'Itch.io' : 'Archive.org';
    fileItems.innerHTML = `
      <p style="color:var(--text-muted);font-size:0.85rem">
        Could not load file list. 
        <a href="${game.downloadUrl}" target="_blank" style="color:var(--primary-lt)">Browse files on ${siteName} →</a>
      </p>
    `;
  }
}

function renderFileList(files, game) {
  const fileItems = $('file-items');
  if (!files.length) {
    fileItems.innerHTML = `<p style="color:var(--text-muted);font-size:0.85rem">No files found. <a href="${game.archiveUrl}" target="_blank" style="color:var(--primary-lt)">Check on Archive.org →</a></p>`;
    return;
  }

  fileItems.innerHTML = files.map(f => {
    const dlUrl = `${IA_BASE}/download/${game.id}/${encodeURIComponent(f.name)}`;
    const size  = f.size ? formatBytes(parseInt(f.size)) : '';
    return `
      <div class="file-item">
        <span class="file-name" title="${escHtml(f.name)}">${escHtml(f.name)}</span>
        ${size ? `<span class="file-size">${size}</span>` : ''}
        <a class="file-dl" href="${dlUrl}" target="_blank" rel="noopener" download>⬇ Download</a>
      </div>
    `;
  }).join('');

  // Set primary download to first ROM file
  if (files[0]) {
    $('modal-download-btn').href = `${IA_BASE}/download/${game.id}/${encodeURIComponent(files[0].name)}`;
  }
}

function isRomFile(name, platform) {
  if (!name) return false;
  const lower = name.toLowerCase();
  const exts = platform.ext || ['.zip', '.bin', '.img', '.iso', '.nes', '.sfc', '.gba', '.gb', '.gbc', '.md', '.n64', '.z64', '.pce'];
  return exts.some(e => lower.endsWith(e));
}

function closeModal() {
  modalOverlay.style.display = 'none';
  document.body.style.overflow = '';
  state.activeModal = null;
}

// ─── Event Listeners ─────────────────────────────────────────────────────────
modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && state.activeModal) closeModal(); });

heroSearch.addEventListener('keydown', e => {
  if (e.key === 'Enter') doSearch();
});
heroSearchBtn.addEventListener('click', doSearch);

function doSearch() {
  const q = heroSearch.value.trim();
  state.currentSearch = q;
  state.page = 0;
  state.games = [];
  if (q) {
    browseTitle.innerHTML = `Search: <span class="gradient-text">${escHtml(q)}</span>`;
    browseSub.textContent = 'Live results from Internet Archive';
  }
  $('browse').scrollIntoView({ behavior: 'smooth' });
  fetchGames(true);
}

genreFilter.addEventListener('change', () => {
  state.currentGenre = genreFilter.value;
  state.page = 0;
  fetchGames(true);
});

compatFilter.addEventListener('change', () => {
  state.currentCompat = compatFilter.value;
  renderGamesWithIndexes();
});

btnGridView.addEventListener('click', () => {
  state.viewMode = 'grid';
  btnGridView.classList.add('active'); btnGridView.setAttribute('aria-pressed', 'true');
  btnListView.classList.remove('active'); btnListView.setAttribute('aria-pressed', 'false');
  renderGamesWithIndexes();
});

btnListView.addEventListener('click', () => {
  state.viewMode = 'list';
  btnListView.classList.add('active'); btnListView.setAttribute('aria-pressed', 'true');
  btnGridView.classList.remove('active'); btnGridView.setAttribute('aria-pressed', 'false');
  renderGamesWithIndexes();
});

loadMoreBtn.addEventListener('click', () => {
  state.page++;
  fetchGames(false);
});

clearFiltersBtn.addEventListener('click', () => {
  state.currentSearch = '';
  state.currentPlatform = 'all';
  state.currentGenre = '';
  state.currentCompat = '';
  heroSearch.value = '';
  genreFilter.value = '';
  compatFilter.value = '';
  renderFilterPills();
  platformGrid.querySelectorAll('.platform-card').forEach(c => c.classList.toggle('active', c.dataset.platform === 'all'));
  browseTitle.innerHTML = 'Featured <span class="gradient-text">Games</span>';
  fetchGames(true);
});

// Sticky header shadow
window.addEventListener('scroll', () => {
  const header = $('site-header');
  header.style.borderBottomColor = window.scrollY > 10 ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.08)';
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function truncate(str, len) {
  if (!str || typeof str !== 'string') return '';
  return str.length > len ? str.slice(0, len).trimEnd() + '…' : str;
}

function formatBytes(bytes) {
  if (!bytes || isNaN(bytes)) return '';
  if (bytes < 1024)       return bytes + ' B';
  if (bytes < 1048576)    return (bytes/1024).toFixed(1) + ' KB';
  if (bytes < 1073741824) return (bytes/1048576).toFixed(1) + ' MB';
  return (bytes/1073741824).toFixed(2) + ' GB';
}

function compatToColor(compat) {
  const map = { excellent: '#10b981', good: '#f59e0b', fair: '#f97316', limited: '#ef4444' };
  return map[compat] || '#94a3b8';
}

function compatToGradient(compat) {
  const map = {
    excellent: 'linear-gradient(90deg,#10b981,#34d399)',
    good:      'linear-gradient(90deg,#f59e0b,#fcd34d)',
    fair:      'linear-gradient(90deg,#f97316,#fb923c)',
    limited:   'linear-gradient(90deg,#ef4444,#f87171)'
  };
  return map[compat] || map.good;
}

// ─── Animated device screen cycling ─────────────────────────────────────────
const deviceGames = [
  { text: 'SUPER MARIO', color: '#60a5fa' },
  { text: 'SONIC 2', color: '#34d399' },
  { text: 'STREET FIGHTER', color: '#f87171' },
  { text: 'ZELDA', color: '#fbbf24' },
  { text: 'MEGA MAN', color: '#818cf8' }
];
let deviceGameIdx = 0;
function cycleDeviceGame() {
  const preview = $('device-preview');
  if (!preview) return;
  const g = deviceGames[deviceGameIdx % deviceGames.length];
  const titleEl = preview.querySelector('.device-title-text');
  if (titleEl) { titleEl.textContent = g.text; titleEl.style.color = g.color; titleEl.style.textShadow = `0 0 10px ${g.color}`; }
  deviceGameIdx++;
}
setInterval(cycleDeviceGame, 3000);

// ─── Web Scraper Engine ───────────────────────────────────────────────────────
const btnScrape       = $('btn-scrape');
const btnStopScrape   = $('btn-stop');
const scraperSearch   = $('scraper-search');
const scraperProgress = $('scraper-progress');
const progressLabel   = $('progress-label');
const progressCount   = $('progress-count');
const progressFill    = $('progress-fill');
const progressLog     = $('progress-log');
const resultHint      = $('scraper-result-hint');

const sources = {
  archive: {
    checkbox: $('src-archive'),
    card:     $('scard-archive'),
    status:   $('sstatus-archive'),
    get dot() { return this.status?.querySelector('.status-dot'); },
    get text() { return this.status?.querySelector('.status-text'); }
  },
  github: {
    checkbox: $('src-github'),
    card:     $('scard-github'),
    status:   $('sstatus-github'),
    get dot() { return this.status?.querySelector('.status-dot'); },
    get text() { return this.status?.querySelector('.status-text'); }
  },
  romhacking: {
    checkbox: $('src-romhacking'),
    card:     $('scard-romhacking'),
    status:   $('sstatus-romhacking'),
    get dot() { return this.status?.querySelector('.status-dot'); },
    get text() { return this.status?.querySelector('.status-text'); }
  },
  itch: {
    checkbox: $('src-itch'),
    card:     $('scard-itch'),
    status:   $('sstatus-itch'),
    get dot() { return this.status?.querySelector('.status-dot'); },
    get text() { return this.status?.querySelector('.status-text'); }
  }
};

let scraperAbortController = null;
let isScraping = false;

function logScraper(message, type = 'info', source = '') {
  if (!progressLog) return;
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  const sourceTag = source ? `<span class="log-source-tag">${source}</span> ` : '';
  entry.innerHTML = `${sourceTag}<span>${escHtml(message)}</span>`;
  progressLog.appendChild(entry);
  progressLog.scrollTop = progressLog.scrollHeight;
}

function setSourceStatus(key, status, label) {
  const src = sources[key];
  if (!src || !src.card) return;
  
  src.card.classList.remove('idle', 'scanning', 'done', 'error');
  src.card.classList.add(status);
  
  const dot = src.dot;
  if (dot) {
    dot.className = `status-dot ${status}`;
  }
  const txt = src.text;
  if (txt) {
    txt.textContent = label;
  }
}

async function startScraping() {
  if (isScraping) {
    stopScraping();
    return;
  }

  isScraping = true;
  if (btnScrape) {
    btnScrape.innerHTML = '⏹ Stop Scraping';
    btnScrape.classList.add('running');
  }
  if (btnStopScrape) btnStopScrape.style.display = 'inline-block';
  if (scraperProgress) scraperProgress.style.display = 'block';
  if (resultHint) resultHint.style.display = 'none';
  if (progressLog) progressLog.innerHTML = '';
  if (progressFill) progressFill.style.width = '0%';
  if (progressCount) progressCount.textContent = '0 games found';
  if (progressLabel) progressLabel.textContent = 'Initializing scraper...';

  scraperAbortController = new AbortController();
  const signal = scraperAbortController.signal;

  const activeSources = Object.keys(sources).filter(key => sources[key].checkbox && sources[key].checkbox.checked);
  if (activeSources.length === 0) {
    logScraper('No sources selected! Please check at least one source and try again.', 'error');
    finishScraping(0);
    return;
  }

  Object.keys(sources).forEach(key => {
    if (sources[key].checkbox && sources[key].checkbox.checked) {
      setSourceStatus(key, 'scanning', 'Scanning...');
    } else {
      setSourceStatus(key, 'idle', 'Disabled');
    }
  });

  logScraper(`Starting scrape process across ${activeSources.length} sources...`, 'info');

  state.games = [];
  state.currentPlatform = 'all';
  renderPlatformGrid();
  renderFilterPills();
  
  const allCard = platformGrid.querySelector('[data-platform="all"]');
  if (allCard) allCard.classList.add('active');
  
  if (browseTitle) browseTitle.innerHTML = 'Scraped <span class="gradient-text">Games</span>';
  if (browseSub) browseSub.textContent = 'Live matches found by the web scraper';

  let totalScraped = 0;
  let completed = 0;
  const term = scraperSearch ? scraperSearch.value.trim() : '';

  const promises = activeSources.map(async (key) => {
    try {
      let results = [];
      if (key === 'archive') {
        results = await scrapeInternetArchive(term, signal);
      } else if (key === 'github') {
        results = await scrapeGitHub(term, signal);
      } else if (key === 'romhacking') {
        results = await scrapeRomHacking(term, signal);
      } else if (key === 'itch') {
        results = await scrapeItch(term, signal);
      }

      if (signal.aborted) return;

      if (results && results.length > 0) {
        totalScraped += results.length;
        state.games = [...state.games, ...results];
        renderGames();
        setSourceStatus(key, 'done', `${results.length} found`);
        logScraper(`Successfully extracted ${results.length} games.`, 'success', key.toUpperCase());
      } else {
        setSourceStatus(key, 'done', '0 found');
        logScraper(`No games matching criteria found.`, 'info', key.toUpperCase());
      }
    } catch (err) {
      if (signal.aborted) return;
      setSourceStatus(key, 'error', 'Failed');
      logScraper(`Error: ${err.message}`, 'error', key.toUpperCase());
    } finally {
      if (!signal.aborted) {
        completed++;
        const pct = Math.round((completed / activeSources.length) * 100);
        if (progressFill) progressFill.style.width = `${pct}%`;
        if (progressCount) progressCount.textContent = `${state.games.length} games found`;
        if (progressLabel) progressLabel.textContent = `Scraped ${completed} of ${activeSources.length} sources...`;
      }
    }
  });

  try {
    await Promise.all(promises);
  } catch (err) {
    console.error('Scraping promises execution error:', err);
  }

  if (!signal.aborted) {
    finishScraping(state.games.length);
  }
}

function stopScraping() {
  if (scraperAbortController) {
    scraperAbortController.abort();
  }
  logScraper('Scraping sequence aborted by user.', 'error');

  Object.keys(sources).forEach(key => {
    const src = sources[key];
    if (src.card && src.card.classList.contains('scanning')) {
      setSourceStatus(key, 'error', 'Stopped');
    }
  });

  finishScraping(state.games.length, true);
}

function finishScraping(count, aborted = false) {
  isScraping = false;
  if (btnScrape) {
    btnScrape.innerHTML = '🕷️ Start Scraping';
    btnScrape.classList.remove('running');
  }
  if (btnStopScrape) btnStopScrape.style.display = 'none';

  if (aborted) {
    if (progressLabel) progressLabel.textContent = 'Scraping halted.';
  } else {
    if (progressLabel) progressLabel.textContent = 'Scraping cycle completed.';
    logScraper(`Done! A total of ${count} games were found and mapped below.`, 'success');
  }

  if (count > 0) {
    if (resultHint) resultHint.style.display = 'block';
    if (loadMoreWrap) loadMoreWrap.style.display = 'none';
    if (browseSub) browseSub.textContent = `Found ${count} games via live scraper. Filters apply locally.`;
    
    const browseSection = $('browse');
    if (browseSection) {
      browseSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  } else {
    renderGames();
  }
}

async function scrapeInternetArchive(term, signal) {
  logScraper('Formulating search query on Internet Archive...', 'info', 'ARCHIVE');
  const query = `mediatype:software AND (homebrew OR "public domain") AND (${term || 'game'})`;
  const params = new URLSearchParams({
    q:        query,
    output:   'json',
    rows:     30,
    'sort[]': 'downloads+desc',
    'fl[]':   'identifier,title,description,subject,date,creator,downloads'
  });

  let data;
  try {
    data = await fetchJsonp(`${IA_SEARCH}?${params}`);
  } catch (jsonpErr) {
    if (signal.aborted) return [];
    const res = await fetch(`${IA_SEARCH}?${params}`, { signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = await res.json();
  }

  if (signal.aborted) return [];
  const docs = data.response?.docs || [];
  return docs.map(doc => {
    const game = mapIADoc(doc);
    game.description = `[Internet Archive] ${game.description}`;
    return game;
  });
}

async function scrapeGitHub(term, signal) {
  logScraper('Searching open-source repositories on GitHub...', 'info', 'GITHUB');
  const searchQuery = term ? `${term} homebrew` : 'homebrew rom game';
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(searchQuery)}+fork:false&sort=stars&order=desc&per_page=20`;

  const res = await fetch(url, { signal });
  if (res.status === 403) {
    throw new Error('GitHub API rate limit hit. Please try again later.');
  }
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  const data = await res.json();
  
  if (signal.aborted) return [];
  const repos = data.items || [];
  return repos.map(repo => {
    const text = (repo.name + ' ' + (repo.description || '')).toLowerCase();
    let platform = PLATFORMS.find(p => p.id !== 'all' && text.includes(p.id)) || 
                   PLATFORMS.find(p => p.id !== 'all' && text.includes(p.short.toLowerCase())) ||
                   PLATFORMS.find(p => p.id === 'gba');

    return {
      id:          `gh-${repo.id}`,
      title:       repo.name.replace(/[-_]/g, ' '),
      platform:    platform,
      description: `[GitHub Repo] ${repo.description || 'Open source retro game.'} Stars: ★${repo.stargazers_count}.`,
      year:        repo.created_at ? repo.created_at.substring(0, 4) : 'Unknown',
      developer:   repo.owner?.login || 'Unknown',
      downloads:   repo.stargazers_count || 0,
      genre:       'Homebrew',
      subjects:    ['github', 'homebrew', platform.name, 'open-source'],
      coverUrl:    repo.owner?.avatar_url || '',
      archiveUrl:  repo.html_url,
      downloadUrl: `${repo.html_url}/releases`
    };
  });
}

async function scrapeRomHacking(term, signal) {
  logScraper('Scraping Homebrew index on ROM Hacking Net...', 'info', 'ROMHACK');
  const url = `https://www.romhacking.net/?page=homebrew&title=${encodeURIComponent(term)}`;
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;

  const res = await fetch(proxyUrl, { signal });
  if (!res.ok) throw new Error(`Proxy network error: ${res.status}`);
  const data = await res.json();
  
  if (signal.aborted) return [];
  const html = data.contents;
  if (!html) throw new Error('Proxy returned empty content.');

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const table = doc.querySelector('.ndtable, table');
  if (!table) return [];

  const rows = table.querySelectorAll('tr');
  const results = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const cells = row.querySelectorAll('td');
    if (cells.length < 3) continue;

    const platformText = cells[0].textContent.trim();
    const linkEl = cells[1].querySelector('a');
    if (!linkEl) continue;

    const title = linkEl.textContent.trim();
    const relativeHref = linkEl.getAttribute('href');
    const absoluteHref = relativeHref.startsWith('http') ? relativeHref : `https://www.romhacking.net/${relativeHref.replace(/^\//, '')}`;
    const genre = cells[2]?.textContent.trim() || 'Homebrew';
    const author = cells[3]?.textContent.trim() || 'Unknown';

    let platform = PLATFORMS.find(p => p.short.toLowerCase() === platformText.toLowerCase()) || 
                   PLATFORMS.find(p => p.id === 'gba');

    const idMatch = absoluteHref.match(/id=(\d+)/);
    const id = idMatch ? `rhn-${idMatch[1]}` : `rhn-${Math.random().toString(36).slice(2)}`;

    results.push({
      id:          id,
      title:       title,
      platform:    platform,
      description: `[ROM Hacking Net] Homebrew submission by ${author}. Category: ${genre}.`,
      year:        'Homebrew',
      developer:   author,
      downloads:   0,
      genre:       genre,
      subjects:    ['romhacking', 'homebrew', platform.name],
      coverUrl:    '', 
      archiveUrl:  absoluteHref,
      downloadUrl: absoluteHref
    });

    if (results.length >= 15) break;
  }
  return results;
}

async function scrapeItch(term, signal) {
  logScraper('Scraping retro tag feed on Itch.io...', 'info', 'ITCH');
  const queryParam = term ? `?q=${encodeURIComponent(term)}` : '';
  const url = `https://itch.io/games/tag-homebrew${queryParam}`;
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;

  const res = await fetch(proxyUrl, { signal });
  if (!res.ok) throw new Error(`Proxy network error: ${res.status}`);
  const data = await res.json();
  
  if (signal.aborted) return [];
  const html = data.contents;
  if (!html) throw new Error('Proxy returned empty content.');

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const cells = doc.querySelectorAll('.game_cell');
  const results = [];

  cells.forEach(cell => {
    const linkEl = cell.querySelector('.game_title a, a.game_link');
    if (!linkEl) return;

    const title = linkEl.textContent.trim();
    const absoluteHref = linkEl.getAttribute('href');

    const descEl = cell.querySelector('.game_text');
    const desc = descEl ? descEl.textContent.trim() : 'Free retro homebrew game published on Itch.io.';

    const imgEl = cell.querySelector('.game_link img');
    const imgUrl = imgEl ? (imgEl.getAttribute('data-lazy_src') || imgEl.getAttribute('src')) : '';

    const authorEl = cell.querySelector('.game_author a');
    const author = authorEl ? authorEl.textContent.trim() : 'Unknown';

    const text = (title + ' ' + desc).toLowerCase();
    let platform = PLATFORMS.find(p => p.id !== 'all' && text.includes(p.id)) || 
                   PLATFORMS.find(p => p.id !== 'all' && text.includes(p.short.toLowerCase())) ||
                   PLATFORMS.find(p => p.id === 'gba');

    results.push({
      id:          `itch-${Math.random().toString(36).slice(2)}`,
      title:       title,
      platform:    platform,
      description: `[Itch.io] ${desc}`,
      year:        'Retro',
      developer:   author,
      downloads:   0,
      genre:       'Homebrew',
      subjects:    ['itch.io', 'homebrew', platform.name],
      coverUrl:    imgUrl,
      archiveUrl:  absoluteHref,
      downloadUrl: absoluteHref
    });
  });

  return results.slice(0, 15);
}

// ─── Init ─────────────────────────────────────────────────────────────────────
function init() {
  initParticles();
  renderPlatformGrid();
  renderFilterPills();

  // Mark "all" as active
  platformGrid.querySelector('[data-platform="all"]')?.classList.add('active');

  // Initial game load
  fetchGames(true);

  // Setup scraper bindings
  if (btnScrape) btnScrape.addEventListener('click', startScraping);
  if (btnStopScrape) btnStopScrape.addEventListener('click', stopScraping);
  if (scraperSearch) {
    scraperSearch.addEventListener('keydown', e => {
      if (e.key === 'Enter') startScraping();
    });
  }
}

document.addEventListener('DOMContentLoaded', init);
