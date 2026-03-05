/* ═══════════════════════════════════════
   FLOW — Focus Timer  |  app.js
════════════════════════════════════════ */

// ═══════════════════════════════════════════
// XP & LEVEL SYSTEM
// ═══════════════════════════════════════════

const LEVELS = [
  { level: 1,  title: 'tide caller',     badge: '🐚',  xpNeeded: 60   },
  { level: 2,  title: 'wave watcher',    badge: '🌊',  xpNeeded: 120  },
  { level: 3,  title: 'reef explorer',   badge: '🪸',  xpNeeded: 200  },
  { level: 4,  title: 'kelp drifter',    badge: '🌿',  xpNeeded: 300  },
  { level: 5,  title: 'deep diver',      badge: '🤿',  xpNeeded: 450  },
  { level: 6,  title: 'pearl seeker',    badge: '🦪',  xpNeeded: 600  },
  { level: 7,  title: 'current rider',   badge: '🐬',  xpNeeded: 800  },
  { level: 8,  title: 'abyss walker',    badge: '🦑',  xpNeeded: 1050 },
  { level: 9,  title: 'ocean sage',      badge: '🐙',  xpNeeded: 1350 },
  { level: 10, title: 'sea sovereign',   badge: '🐋',  xpNeeded: 1700 },
  { level: 11, title: 'storm bringer',   badge: '⚡',  xpNeeded: 2100 },
  { level: 12, title: 'tidal master',    badge: '🌊',  xpNeeded: 2600 },
  { level: 13, title: 'leviathan',       badge: '🐉',  xpNeeded: 3200 },
  { level: 14, title: 'ocean eternal',   badge: '✨',  xpNeeded: 4000 },
  { level: 15, title: 'the deep itself', badge: '🌌',  xpNeeded: Infinity },
];

// XP earned = minutes focused (1 min = 1 xp, bonus for longer sessions)
function calcXP(minutes) {
  if (minutes >= 90) return Math.round(minutes * 1.5);
  if (minutes >= 60) return Math.round(minutes * 1.3);
  if (minutes >= 45) return Math.round(minutes * 1.2);
  if (minutes >= 25) return Math.round(minutes * 1.1);
  return minutes;
}

// Load/save from localStorage
function loadProgress() {
  try {
    const saved = localStorage.getItem('flow_progress');
    if (saved) return JSON.parse(saved);
  } catch(e) {}
  return { totalXP: 0, level: 1, sessions: 0 };
}

function saveProgress(data) {
  try { localStorage.setItem('flow_progress', JSON.stringify(data)); } catch(e) {}
}

// Given totalXP, figure out current level info
function getLevelInfo(totalXP) {
  let accumulated = 0;
  for (let i = 0; i < LEVELS.length; i++) {
    const lvl = LEVELS[i];
    if (i === LEVELS.length - 1) {
      // max level
      return {
        levelData:    lvl,
        xpIntoLevel:  totalXP - accumulated,
        xpForLevel:   lvl.xpNeeded,
        progressFrac: 1,
      };
    }
    const next = accumulated + lvl.xpNeeded;
    if (totalXP < next) {
      return {
        levelData:    lvl,
        xpIntoLevel:  totalXP - accumulated,
        xpForLevel:   lvl.xpNeeded,
        progressFrac: (totalXP - accumulated) / lvl.xpNeeded,
      };
    }
    accumulated = next;
  }
}

// Add XP and return { gained, leveled, newInfo, oldInfo }
function addXP(minutes) {
  const progress = loadProgress();
  const oldInfo  = getLevelInfo(progress.totalXP);
  const gained   = calcXP(minutes);

  progress.totalXP += gained;
  progress.sessions += 1;

  const newInfo = getLevelInfo(progress.totalXP);
  const leveled = newInfo.levelData.level > oldInfo.levelData.level;

  if (leveled) progress.level = newInfo.levelData.level;
  saveProgress(progress);

  return { gained, leveled, newInfo, oldInfo };
}

// ─── Update HUD ──────────────────────────────
function refreshHUD() {
  const progress = loadProgress();
  const info     = getLevelInfo(progress.totalXP);
  const lvl      = info.levelData;

  document.getElementById('hud-badge').textContent       = lvl.badge;
  document.getElementById('hud-title').textContent       = lvl.title;
  document.getElementById('hud-level-num').textContent   = lvl.level;
  document.getElementById('hud-xp-current').textContent  = info.xpIntoLevel;
  document.getElementById('hud-xp-next').textContent     =
    lvl.xpNeeded === Infinity ? '∞' : lvl.xpNeeded;

  const pct = lvl.xpNeeded === Infinity ? 100 : (info.progressFrac * 100);
  document.getElementById('hud-xp-fill').style.width = `${Math.min(pct, 100)}%`;
}

// ─── Level-up overlay ────────────────────────
function showLevelUp(newInfo) {
  const lvl = newInfo.levelData;
  document.getElementById('levelup-badge-big').textContent  = lvl.badge;
  document.getElementById('levelup-new-rank').textContent   = lvl.title;
  document.getElementById('levelup-lvl-num').textContent    = `level ${lvl.level}`;

  const overlay = document.getElementById('levelup-overlay');
  overlay.classList.add('show');

  // Particle burst
  spawnParticles();
}

function spawnParticles() {
  const colors = ['#7ee8e8', '#3ecfcf', '#ffffff', '#a8e6f0', '#5bb8d4'];
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;

  for (let i = 0; i < 22; i++) {
    const p  = document.createElement('div');
    p.className = 'lvl-particle';
    const angle = (i / 22) * 2 * Math.PI;
    const dist  = 80 + Math.random() * 120;
    const px    = Math.cos(angle) * dist;
    const py    = Math.sin(angle) * dist;
    const size  = 5 + Math.random() * 8;

    p.style.cssText = `
      left: ${cx}px; top: ${cy}px;
      width: ${size}px; height: ${size}px;
      background: ${colors[i % colors.length]};
      box-shadow: 0 0 6px ${colors[i % colors.length]};
      --px: ${px}px; --py: ${py}px;
      animation-delay: ${Math.random() * 0.2}s;
    `;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 1200);
  }
}

document.getElementById('levelup-close').addEventListener('click', () => {
  document.getElementById('levelup-overlay').classList.remove('show');
});


// ═══════════════════════════════════════════
// TIMER & APP STATE
// ═══════════════════════════════════════════

let selectedMinutes  = 15;
let customMode       = false;
let totalSeconds     = 0;
let remainingSeconds = 0;
let timerInterval    = null;
let isPaused         = false;
let bgURL            = null;
let taskName         = '';

const RING_CIRCUMFERENCE = 2 * Math.PI * 130;

// ─── DOM refs ─────────────────────────────────
const setupScreen  = document.getElementById('setup-screen');
const focusScreen  = document.getElementById('focus-screen');
const doneScreen   = document.getElementById('done-screen');
const timerDisplay = document.getElementById('timer-display');
const ringProgress = document.getElementById('ring-progress');
const progressBar  = document.getElementById('progress-bar');
const pauseBtn     = document.getElementById('pause-btn');
const statusDot    = document.getElementById('status-dot');
const statusText   = document.getElementById('status-text');
const focusLabel   = document.getElementById('focus-label');
const doneStats    = document.getElementById('done-stats');
const bgLayer      = document.getElementById('bg-layer');
const bgFile       = document.getElementById('bg-file');
const fileName     = document.getElementById('file-name');
const notif        = document.getElementById('notif');
const clockEl      = document.getElementById('clock-display');

// ─── Spawn bubbles ────────────────────────────
(function spawnBubbles() {
  const container = document.getElementById('bubbles');
  const sizes = [6, 10, 14, 18, 8, 12, 20, 7, 16, 9];
  for (let i = 0; i < 18; i++) {
    const b        = document.createElement('div');
    b.className    = 'bubble';
    const size     = sizes[i % sizes.length] + Math.random() * 6;
    const left     = Math.random() * 100;
    const duration = 10 + Math.random() * 20;
    const delay    = Math.random() * 20;
    const drift    = (Math.random() - 0.5) * 80;
    b.style.cssText = `
      width:${size}px; height:${size}px;
      left:${left}%;
      bottom:-${size}px;
      animation-duration:${duration}s;
      animation-delay:-${delay}s;
      --drift:${drift}px;
    `;
    container.appendChild(b);
  }
})();

// ─── SVG tick marks ───────────────────────────
(function initTicks() {
  const g = document.getElementById('tick-group');
  for (let i = 0; i < 60; i++) {
    const angle = (i / 60) * 2 * Math.PI - Math.PI / 2;
    const r1    = i % 5 === 0 ? 142 : 145;
    const r2    = 148;
    const line  = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', 150 + r1 * Math.cos(angle));
    line.setAttribute('y1', 150 + r1 * Math.sin(angle));
    line.setAttribute('x2', 150 + r2 * Math.cos(angle));
    line.setAttribute('y2', 150 + r2 * Math.sin(angle));
    line.setAttribute('stroke',       i % 5 === 0 ? 'rgba(168,230,240,0.5)' : 'rgba(168,230,240,0.2)');
    line.setAttribute('stroke-width', i % 5 === 0 ? '2' : '1');
    g.appendChild(line);
  }
})();

// ─── Live clock ───────────────────────────────
function updateClock() {
  const now = new Date();
  clockEl.textContent =
    `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
}
setInterval(updateClock, 1000);
updateClock();

// ─── Duration buttons ─────────────────────────
document.querySelectorAll('.dur-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.dur-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    const val = btn.dataset.min;
    if (val === 'custom') {
      customMode = true;
      document.getElementById('custom-row').style.display = 'flex';
      selectedMinutes = parseInt(document.getElementById('custom-input').value) || 30;
    } else {
      customMode = false;
      document.getElementById('custom-row').style.display = 'none';
      selectedMinutes = parseInt(val);
    }
  });
});

document.getElementById('custom-input').addEventListener('input', e => {
  selectedMinutes = parseInt(e.target.value) || 30;
});

// ─── Background upload ────────────────────────
bgFile.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  if (bgURL) URL.revokeObjectURL(bgURL);
  bgURL = URL.createObjectURL(file);
  fileName.textContent = '✓ ' + file.name;
  showNotif('background loaded 🌊');
});

// ─── Screen transitions ───────────────────────
function showScreen(screen) {
  [setupScreen, focusScreen, doneScreen].forEach(s => s.classList.remove('active'));
  screen.classList.add('active');
}

// ─── Helpers ──────────────────────────────────
function formatTime(secs) {
  const m = Math.floor(secs / 60), s = secs % 60;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function updateRing(remaining, total) {
  const fraction = remaining / total;
  ringProgress.style.strokeDasharray  = RING_CIRCUMFERENCE;
  ringProgress.style.strokeDashoffset = RING_CIRCUMFERENCE * (1 - fraction);
  progressBar.style.width = `${(1 - fraction) * 100}%`;
}

function applyBackground() {
  if (bgURL) {
    bgLayer.style.backgroundImage = `url("${bgURL}")`;
    bgLayer.classList.add('active');
  } else {
    bgLayer.classList.remove('active');
    bgLayer.style.backgroundImage = '';
  }
}

function showNotif(msg) {
  notif.textContent = msg;
  notif.classList.add('show');
  setTimeout(() => notif.classList.remove('show'), 2500);
}

// ─── Timer ────────────────────────────────────
function startTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (isPaused) return;
    remainingSeconds--;
    if (remainingSeconds <= 0) {
      remainingSeconds = 0;
      clearInterval(timerInterval);
      timerDisplay.textContent = '00:00';
      updateRing(0, totalSeconds);
      finishSession();
      return;
    }
    timerDisplay.textContent = formatTime(remainingSeconds);
    updateRing(remainingSeconds, totalSeconds);
  }, 1000);
}

// ─── Start session ────────────────────────────
document.getElementById('start-btn').addEventListener('click', () => {
  if (customMode) selectedMinutes = parseInt(document.getElementById('custom-input').value) || 30;
  taskName         = document.getElementById('task-input').value.trim();
  totalSeconds     = selectedMinutes * 60;
  remainingSeconds = totalSeconds;
  isPaused         = false;

  applyBackground();
  focusLabel.textContent   = taskName ? taskName.toLowerCase() : 'deep work session';
  timerDisplay.textContent = formatTime(remainingSeconds);
  pauseBtn.textContent     = '⏸ pause';
  statusText.textContent   = 'in flow';
  statusDot.classList.remove('paused');

  updateRing(remainingSeconds, totalSeconds);
  showScreen(focusScreen);
  startTimer();
});

// ─── Pause / resume ───────────────────────────
pauseBtn.addEventListener('click', () => {
  isPaused = !isPaused;
  if (isPaused) {
    pauseBtn.textContent = '▶ resume';
    statusDot.classList.add('paused');
    statusText.textContent = 'paused';
  } else {
    pauseBtn.textContent = '⏸ pause';
    statusDot.classList.remove('paused');
    statusText.textContent = 'in flow';
  }
});

// ─── Reset ────────────────────────────────────
document.getElementById('reset-btn').addEventListener('click', () => {
  clearInterval(timerInterval);
  remainingSeconds       = totalSeconds;
  isPaused               = false;
  pauseBtn.textContent   = '⏸ pause';
  statusText.textContent = 'in flow';
  statusDot.classList.remove('paused');
  timerDisplay.textContent = formatTime(remainingSeconds);
  updateRing(remainingSeconds, totalSeconds);
  startTimer();
  showNotif('reset ↺');
});

// ─── Back ─────────────────────────────────────
document.getElementById('back-btn').addEventListener('click', () => {
  clearInterval(timerInterval);
  bgLayer.classList.remove('active');
  showScreen(setupScreen);
});

// ─── Session complete ─────────────────────────
function finishSession() {
  bgLayer.classList.remove('active');

  const mins = Math.round(totalSeconds / 60);

  // Award XP
  const result = addXP(mins);

  // Update done screen
  doneStats.textContent = taskName
    ? `you focused on "${taskName}" for ${mins} min ✦`
    : `you focused for ${mins} minutes ✦`;
  document.getElementById('done-xp-amount').textContent = result.gained;

  showScreen(doneScreen);

  // Refresh HUD
  refreshHUD();

  // Animate XP badge in after short delay
  setTimeout(() => {
    showNotif(`+${result.gained} xp 🌊`);
    // If leveled up, show overlay after notif
    if (result.leveled) {
      setTimeout(() => showLevelUp(result.newInfo), 1200);
    }
  }, 400);
}

// ─── New / Repeat ─────────────────────────────
document.getElementById('new-btn').addEventListener('click', () => showScreen(setupScreen));

document.getElementById('repeat-btn').addEventListener('click', () => {
  remainingSeconds       = totalSeconds;
  isPaused               = false;
  pauseBtn.textContent   = '⏸ pause';
  statusText.textContent = 'in flow';
  statusDot.classList.remove('paused');
  timerDisplay.textContent = formatTime(remainingSeconds);
  updateRing(remainingSeconds, totalSeconds);
  applyBackground();
  showScreen(focusScreen);
  startTimer();
});

// ─── Init ─────────────────────────────────────
refreshHUD();
updateRing(15 * 60, 15 * 60);
timerDisplay.textContent = formatTime(15 * 60);
