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

function calcXP(minutes) {
  if (minutes >= 90) return Math.round(minutes * 1.5);
  if (minutes >= 60) return Math.round(minutes * 1.3);
  if (minutes >= 45) return Math.round(minutes * 1.2);
  if (minutes >= 25) return Math.round(minutes * 1.1);
  return minutes;
}

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

function getLevelInfo(totalXP) {
  let accumulated = 0;
  for (let i = 0; i < LEVELS.length; i++) {
    const lvl = LEVELS[i];
    if (i === LEVELS.length - 1) {
      return { levelData: lvl, xpIntoLevel: totalXP - accumulated, xpForLevel: lvl.xpNeeded, progressFrac: 1 };
    }
    const next = accumulated + lvl.xpNeeded;
    if (totalXP < next) {
      return { levelData: lvl, xpIntoLevel: totalXP - accumulated, xpForLevel: lvl.xpNeeded, progressFrac: (totalXP - accumulated) / lvl.xpNeeded };
    }
    accumulated = next;
  }
}

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

function refreshHUD() {
  const progress = loadProgress();
  const info     = getLevelInfo(progress.totalXP);
  const lvl      = info.levelData;
  document.getElementById('hud-badge').textContent      = lvl.badge;
  document.getElementById('hud-title').textContent      = lvl.title;
  document.getElementById('hud-level-num').textContent  = lvl.level;
  document.getElementById('hud-xp-current').textContent = info.xpIntoLevel;
  document.getElementById('hud-xp-next').textContent    = lvl.xpNeeded === Infinity ? '∞' : lvl.xpNeeded;
  const pct = lvl.xpNeeded === Infinity ? 100 : (info.progressFrac * 100);
  document.getElementById('hud-xp-fill').style.width = `${Math.min(pct, 100)}%`;
}

function showLevelUp(newInfo) {
  const lvl = newInfo.levelData;
  document.getElementById('levelup-badge-big').textContent = lvl.badge;
  document.getElementById('levelup-new-rank').textContent  = lvl.title;
  document.getElementById('levelup-lvl-num').textContent   = `level ${lvl.level}`;
  document.getElementById('levelup-overlay').classList.add('show');
  spawnParticles();
}

function spawnParticles() {
  const colors = ['#7ee8e8','#3ecfcf','#ffffff','#a8e6f0','#5bb8d4'];
  const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
  for (let i = 0; i < 22; i++) {
    const p = document.createElement('div');
    p.className = 'lvl-particle';
    const angle = (i / 22) * 2 * Math.PI;
    const dist  = 80 + Math.random() * 120;
    const size  = 5 + Math.random() * 8;
    p.style.cssText = `
      left:${cx}px; top:${cy}px;
      width:${size}px; height:${size}px;
      background:${colors[i % colors.length]};
      box-shadow:0 0 6px ${colors[i % colors.length]};
      --px:${Math.cos(angle)*dist}px; --py:${Math.sin(angle)*dist}px;
      animation-delay:${Math.random()*0.2}s;
    `;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 1200);
  }
}

document.getElementById('levelup-close').addEventListener('click', () => {
  document.getElementById('levelup-overlay').classList.remove('show');
});


// ═══════════════════════════════════════════
// TIMER STATE
// ═══════════════════════════════════════════

let selectedMinutes  = 15;
let selectedBreakMin = 5;
let breakCustomMode  = false;
let noBreak          = false;
let customMode       = false;

let totalSeconds     = 0;
let remainingSeconds = 0;
let timerInterval    = null;
let isPaused         = false;
let isBreak          = false;          // are we currently on a break?
let sessionCount     = 0;              // sessions completed this run
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
const timerModeLabel = document.getElementById('timer-mode-label');

// ─── Bubbles ──────────────────────────────────
(function spawnBubbles() {
  const container = document.getElementById('bubbles');
  const sizes = [6,10,14,18,8,12,20,7,16,9];
  for (let i = 0; i < 18; i++) {
    const b = document.createElement('div');
    b.className = 'bubble';
    const size = sizes[i % sizes.length] + Math.random() * 6;
    b.style.cssText = `
      width:${size}px; height:${size}px;
      left:${Math.random()*100}%;
      bottom:-${size}px;
      animation-duration:${10 + Math.random()*20}s;
      animation-delay:-${Math.random()*20}s;
      --drift:${(Math.random()-0.5)*80}px;
    `;
    container.appendChild(b);
  }
})();

// ─── Tick marks ───────────────────────────────
(function initTicks() {
  const g = document.getElementById('tick-group');
  for (let i = 0; i < 60; i++) {
    const angle = (i / 60) * 2 * Math.PI - Math.PI / 2;
    const r1 = i % 5 === 0 ? 142 : 145, r2 = 148;
    const line = document.createElementNS('http://www.w3.org/2000/svg','line');
    line.setAttribute('x1', 150 + r1 * Math.cos(angle));
    line.setAttribute('y1', 150 + r1 * Math.sin(angle));
    line.setAttribute('x2', 150 + r2 * Math.cos(angle));
    line.setAttribute('y2', 150 + r2 * Math.sin(angle));
    line.setAttribute('stroke',       i % 5 === 0 ? 'rgba(168,230,240,0.5)' : 'rgba(168,230,240,0.2)');
    line.setAttribute('stroke-width', i % 5 === 0 ? '2' : '1');
    g.appendChild(line);
  }
})();

// ─── Clock ────────────────────────────────────
function updateClock() {
  const now = new Date();
  clockEl.textContent = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
}
setInterval(updateClock, 1000);
updateClock();

// ─── Focus duration buttons ───────────────────
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

// ─── Break duration buttons ───────────────────
document.querySelectorAll('.break-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.break-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    const val = btn.dataset.brk;
    if (val === 'custom') {
      breakCustomMode = true;
      document.getElementById('break-custom-row').style.display = 'flex';
      selectedBreakMin = parseInt(document.getElementById('break-custom-input').value) || 10;
    } else {
      breakCustomMode = false;
      document.getElementById('break-custom-row').style.display = 'none';
      selectedBreakMin = parseInt(val);
    }
  });
});
document.getElementById('break-custom-input').addEventListener('input', e => {
  selectedBreakMin = parseInt(e.target.value) || 10;
});

// ─── No-break toggle ──────────────────────────
document.getElementById('no-break-check').addEventListener('change', e => {
  noBreak = e.target.checked;
  document.querySelector('.break-presets').style.opacity = noBreak ? '0.35' : '1';
  document.querySelector('.break-presets').style.pointerEvents = noBreak ? 'none' : 'auto';
});

// ─── File upload ──────────────────────────────
bgFile.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  if (bgURL) URL.revokeObjectURL(bgURL);
  bgURL = URL.createObjectURL(file);
  fileName.textContent = '✓ ' + file.name;
  showNotif('background loaded 🌊');
});

// ─── Screen helpers ───────────────────────────
function showScreen(screen) {
  [setupScreen, focusScreen, doneScreen].forEach(s => s.classList.remove('active'));
  screen.classList.add('active');
}

function applyBackground() {
  if (bgURL) { bgLayer.style.backgroundImage = `url("${bgURL}")`; bgLayer.classList.add('active'); }
  else       { bgLayer.classList.remove('active'); bgLayer.style.backgroundImage = ''; }
}

function showNotif(msg) {
  notif.textContent = msg;
  notif.classList.add('show');
  setTimeout(() => notif.classList.remove('show'), 2500);
}

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

// ─── Break mode visual swap ───────────────────
function setBreakVisuals(on) {
  const label = document.getElementById('focus-label');
  if (on) {
    document.body.classList.add('break-mode');
    ringProgress.classList.add('break-mode');
    timerDisplay.classList.add('break-mode');
    progressBar.classList.add('break-mode');
    label.classList.add('break-mode');
    statusDot.classList.remove('paused');
    statusDot.classList.add('break');
  } else {
    document.body.classList.remove('break-mode');
    ringProgress.classList.remove('break-mode');
    timerDisplay.classList.remove('break-mode');
    progressBar.classList.remove('break-mode');
    label.classList.remove('break-mode');
    statusDot.classList.remove('break');
  }
}

// ─── Session chips ────────────────────────────
function addSessionChip() {
  const chips = document.getElementById('session-chips');
  const chip  = document.createElement('div');
  chip.className = 'session-chip';
  chip.style.animationDelay = `${sessionCount * 0.05}s`;
  chips.appendChild(chip);
}

function clearSessionChips() {
  document.getElementById('session-chips').innerHTML = '';
}

// ═══════════════════════════════════════════
// TIMER LOGIC
// ═══════════════════════════════════════════

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
      if (isBreak) endBreak();
      else         endFocusSession();
      return;
    }
    timerDisplay.textContent = formatTime(remainingSeconds);
    updateRing(remainingSeconds, totalSeconds);
  }, 1000);
}

// ─── Start fresh focus session ────────────────
document.getElementById('start-btn').addEventListener('click', () => {
  if (customMode) selectedMinutes = parseInt(document.getElementById('custom-input').value) || 30;
  if (breakCustomMode) selectedBreakMin = parseInt(document.getElementById('break-custom-input').value) || 10;

  taskName         = document.getElementById('task-input').value.trim();
  totalSeconds     = selectedMinutes * 60;
  remainingSeconds = totalSeconds;
  isPaused         = false;
  isBreak          = false;
  sessionCount     = 0;

  clearSessionChips();
  setBreakVisuals(false);
  applyBackground();

  focusLabel.textContent   = taskName ? taskName.toLowerCase() : 'deep work session';
  timerModeLabel.textContent = 'remaining';
  timerDisplay.textContent = formatTime(remainingSeconds);
  pauseBtn.textContent     = '⏸ pause';
  statusText.textContent   = 'in flow';
  statusDot.classList.remove('paused','break');

  updateRing(remainingSeconds, totalSeconds);
  showScreen(focusScreen);
  startTimer();
});

// ─── Focus session ends ───────────────────────
function endFocusSession() {
  sessionCount++;
  addSessionChip();

  // Award XP
  const mins   = Math.round(totalSeconds / 60);
  const result = addXP(mins);
  refreshHUD();

  if (noBreak) {
    // Skip straight to done
    bgLayer.classList.remove('active');
    doneStats.textContent = taskName
      ? `you focused on "${taskName}" for ${mins} min ✦`
      : `you focused for ${mins} minutes ✦`;
    document.getElementById('done-xp-amount').textContent = result.gained;
    showScreen(doneScreen);
    setTimeout(() => {
      showNotif(`+${result.gained} xp 🌊`);
      if (result.leveled) setTimeout(() => showLevelUp(result.newInfo), 1200);
    }, 400);
    return;
  }

  // Show break prompt overlay
  document.getElementById('break-prompt-mins').textContent = selectedBreakMin;
  document.getElementById('break-prompt-overlay').classList.add('show');
  showNotif(`focus done! +${result.gained} xp 🌊`);

  // Store result for possible level-up after prompt
  window._lastXpResult = result;
}

// ─── Break prompt buttons ─────────────────────
document.getElementById('start-break-btn').addEventListener('click', () => {
  document.getElementById('break-prompt-overlay').classList.remove('show');
  beginBreak();

  // Show level-up if earned (after short delay)
  const result = window._lastXpResult;
  if (result && result.leveled) setTimeout(() => showLevelUp(result.newInfo), 600);
});

document.getElementById('skip-break-btn').addEventListener('click', () => {
  document.getElementById('break-prompt-overlay').classList.remove('show');

  // Go straight to done or ask for another round?
  // We go to done screen so they can choose new / repeat
  const mins = Math.round(totalSeconds / 60);
  bgLayer.classList.remove('active');
  doneStats.textContent = taskName
    ? `you focused on "${taskName}" for ${mins} min ✦`
    : `you focused for ${mins} minutes ✦`;
  const result = window._lastXpResult;
  if (result) document.getElementById('done-xp-amount').textContent = result.gained;
  showScreen(doneScreen);
  if (result && result.leveled) setTimeout(() => showLevelUp(result.newInfo), 600);
});

// ─── Begin break ──────────────────────────────
function beginBreak() {
  isBreak          = true;
  totalSeconds     = selectedBreakMin * 60;
  remainingSeconds = totalSeconds;
  isPaused         = false;

  setBreakVisuals(true);
  focusLabel.textContent     = '☁ break time ☁';
  timerModeLabel.textContent = 'break left';
  timerDisplay.textContent   = formatTime(remainingSeconds);
  pauseBtn.textContent       = '⏸ pause';
  statusText.textContent     = 'resting';

  updateRing(remainingSeconds, totalSeconds);
  showScreen(focusScreen);
  startTimer();
}

// ─── Break ends ───────────────────────────────
function endBreak() {
  isBreak = false;
  setBreakVisuals(false);

  // Auto-start next focus round
  totalSeconds     = selectedMinutes * 60;
  remainingSeconds = totalSeconds;
  isPaused         = false;

  focusLabel.textContent     = taskName ? taskName.toLowerCase() : 'deep work session';
  timerModeLabel.textContent = 'remaining';
  timerDisplay.textContent   = formatTime(remainingSeconds);
  pauseBtn.textContent       = '⏸ pause';
  statusText.textContent     = 'in flow';
  statusDot.classList.remove('paused','break');

  updateRing(remainingSeconds, totalSeconds);
  showNotif('break over — back to flow 🌊');
  startTimer();
}

// ─── Pause / resume ───────────────────────────
pauseBtn.addEventListener('click', () => {
  isPaused = !isPaused;
  if (isPaused) {
    pauseBtn.textContent = '▶ resume';
    statusDot.classList.add('paused');
    statusDot.classList.remove('break');
    statusText.textContent = 'paused';
  } else {
    pauseBtn.textContent = '⏸ pause';
    statusDot.classList.remove('paused');
    if (isBreak) statusDot.classList.add('break');
    statusText.textContent = isBreak ? 'resting' : 'in flow';
  }
});

// ─── Reset ────────────────────────────────────
document.getElementById('reset-btn').addEventListener('click', () => {
  clearInterval(timerInterval);
  remainingSeconds       = totalSeconds;
  isPaused               = false;
  pauseBtn.textContent   = '⏸ pause';
  statusDot.classList.remove('paused');
  statusText.textContent = isBreak ? 'resting' : 'in flow';
  timerDisplay.textContent = formatTime(remainingSeconds);
  updateRing(remainingSeconds, totalSeconds);
  startTimer();
  showNotif('reset ↺');
});

// ─── Back ─────────────────────────────────────
document.getElementById('back-btn').addEventListener('click', () => {
  clearInterval(timerInterval);
  document.getElementById('break-prompt-overlay').classList.remove('show');
  bgLayer.classList.remove('active');
  setBreakVisuals(false);
  isBreak = false;
  showScreen(setupScreen);
});

// ─── New / Repeat ─────────────────────────────
document.getElementById('new-btn').addEventListener('click', () => {
  clearSessionChips();
  sessionCount = 0;
  showScreen(setupScreen);
});

document.getElementById('repeat-btn').addEventListener('click', () => {
  // Start fresh focus (same settings)
  isBreak          = false;
  totalSeconds     = selectedMinutes * 60;
  remainingSeconds = totalSeconds;
  isPaused         = false;

  setBreakVisuals(false);
  clearSessionChips();
  sessionCount = 0;

  focusLabel.textContent     = taskName ? taskName.toLowerCase() : 'deep work session';
  timerModeLabel.textContent = 'remaining';
  timerDisplay.textContent   = formatTime(remainingSeconds);
  pauseBtn.textContent       = '⏸ pause';
  statusText.textContent     = 'in flow';
  statusDot.classList.remove('paused','break');

  updateRing(remainingSeconds, totalSeconds);
  applyBackground();
  showScreen(focusScreen);
  startTimer();
});

// ─── Init ─────────────────────────────────────
refreshHUD();
updateRing(15 * 60, 15 * 60);
timerDisplay.textContent = formatTime(15 * 60);
