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
  let acc = 0;
  for (let i = 0; i < LEVELS.length; i++) {
    const lvl = LEVELS[i];
    if (i === LEVELS.length - 1) {
      return { levelData: lvl, xpIntoLevel: totalXP - acc, xpForLevel: lvl.xpNeeded, progressFrac: 1 };
    }
    const next = acc + lvl.xpNeeded;
    if (totalXP < next) {
      return { levelData: lvl, xpIntoLevel: totalXP - acc, xpForLevel: lvl.xpNeeded, progressFrac: (totalXP - acc) / lvl.xpNeeded };
    }
    acc = next;
  }
}

function addXP(minutes) {
  const progress = loadProgress();
  const oldInfo  = getLevelInfo(progress.totalXP);
  const gained   = calcXP(minutes);
  progress.totalXP  += gained;
  progress.sessions += 1;
  const newInfo = getLevelInfo(progress.totalXP);
  const leveled = newInfo.levelData.level > oldInfo.levelData.level;
  if (leveled) progress.level = newInfo.levelData.level;
  saveProgress(progress);
  return { gained, leveled, newInfo, oldInfo };
}

// ─── Refresh all XP / level displays ─────────
function refreshXP() {
  const progress = loadProgress();
  const info     = getLevelInfo(progress.totalXP);
  const lvl      = info.levelData;
  const pct      = lvl.xpNeeded === Infinity ? 100 : (info.progressFrac * 100);

  // Bottom HUD only
  document.getElementById('hud-badge').textContent      = lvl.badge;
  document.getElementById('hud-title').textContent      = lvl.title;
  document.getElementById('hud-level-num').textContent  = lvl.level;
  document.getElementById('hud-xp-current').textContent = info.xpIntoLevel;
  document.getElementById('hud-xp-next').textContent    = lvl.xpNeeded === Infinity ? '∞' : lvl.xpNeeded;
  document.getElementById('hud-xp-fill').style.width    = `${Math.min(pct, 100)}%`;
}

// ─── Level-up overlay ─────────────────────────
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
  for (let i = 0; i < 24; i++) {
    const p     = document.createElement('div');
    p.className = 'lvl-particle';
    const angle = (i / 24) * 2 * Math.PI;
    const dist  = 90 + Math.random() * 130;
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
    setTimeout(() => p.remove(), 1300);
  }
}

document.getElementById('levelup-close').addEventListener('click', () => {
  document.getElementById('levelup-overlay').classList.remove('show');
});


// ═══════════════════════════════════════════
// SETTINGS PANEL
// ═══════════════════════════════════════════

const panel    = document.getElementById('settings-panel');
const backdrop = document.getElementById('panel-backdrop');

function openPanel() {
  panel.classList.add('open');
  backdrop.classList.add('show');
}
function closePanel() {
  panel.classList.remove('open');
  backdrop.classList.remove('show');
}

document.getElementById('settings-toggle').addEventListener('click', openPanel);
document.getElementById('panel-close').addEventListener('click', closePanel);
backdrop.addEventListener('click', closePanel);


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
let isBreak          = false;
let hasStarted       = false;   // has a session been kicked off yet?
let sessionCount     = 0;
let bgURL            = null;
let taskName         = '';

// ─── DOM refs ─────────────────────────────────
const bigTimer   = document.getElementById('big-timer');
const pauseBtn   = document.getElementById('pause-btn');
const statusDot  = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const modePill   = document.getElementById('mode-pill-text');
const bgLayer    = document.getElementById('bg-layer');
const bgFile     = document.getElementById('bg-file');
const fileName   = document.getElementById('file-name');
const notif      = document.getElementById('notif');
const topClock   = document.getElementById('top-clock');
const topTask    = document.getElementById('top-task-name');

const RING_CIRC = 2 * Math.PI * 130;

function updateRing(remaining, total) {
  const frac = total > 0 ? remaining / total : 0;
  const ring  = document.getElementById('ring-progress');
  ring.style.strokeDasharray  = RING_CIRC;
  ring.style.strokeDashoffset = RING_CIRC * (1 - frac);
}

// ─── Tick marks ───────────────────────────────
(function initTicks() {
  const g = document.getElementById('tick-group');
  for (let i = 0; i < 60; i++) {
    const angle = (i / 60) * 2 * Math.PI - Math.PI / 2;
    const r1 = i % 5 === 0 ? 142 : 145, r2 = 148;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', 150 + r1 * Math.cos(angle));
    line.setAttribute('y1', 150 + r1 * Math.sin(angle));
    line.setAttribute('x2', 150 + r2 * Math.cos(angle));
    line.setAttribute('y2', 150 + r2 * Math.sin(angle));
    line.setAttribute('stroke',       i % 5 === 0 ? 'rgba(168,230,240,0.45)' : 'rgba(168,230,240,0.18)');
    line.setAttribute('stroke-width', i % 5 === 0 ? '2' : '1');
    g.appendChild(line);
  }
})();

// ─── Bubbles ──────────────────────────────────
(function spawnBubbles() {
  const container = document.getElementById('bubbles');
  const sizes = [6,10,14,18,8,12,20,7,16,9];
  for (let i = 0; i < 20; i++) {
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

// ─── Clock ────────────────────────────────────
function updateClock() {
  const now = new Date();
  topClock.textContent =
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
    // live-preview the time if not yet started
    if (!hasStarted) {
      bigTimer.textContent = formatTime(selectedMinutes * 60);
      updateRing(selectedMinutes * 60, selectedMinutes * 60);
    }
  });
});
document.getElementById('custom-input').addEventListener('input', e => {
  selectedMinutes = parseInt(e.target.value) || 30;
  if (!hasStarted) {
    bigTimer.textContent = formatTime(selectedMinutes * 60);
    updateRing(selectedMinutes * 60, selectedMinutes * 60);
  }
});

// ─── Live task name preview ───────────────────
document.getElementById('task-input').addEventListener('input', e => {
  topTask.textContent = e.target.value.trim();
});

// ─── Break buttons ────────────────────────────
document.querySelectorAll('.brk-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.brk-btn').forEach(b => b.classList.remove('selected'));
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
  const grid = document.querySelector('.break-grid');
  grid.style.opacity = noBreak ? '0.3' : '1';
  grid.style.pointerEvents = noBreak ? 'none' : 'auto';
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

// ─── Helpers ──────────────────────────────────
function formatTime(secs) {
  const m = Math.floor(secs / 60), s = secs % 60;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function showNotif(msg) {
  notif.textContent = msg;
  notif.classList.add('show');
  setTimeout(() => notif.classList.remove('show'), 2600);
}

function applyBackground() {
  if (bgURL) { bgLayer.style.backgroundImage = `url("${bgURL}")`; bgLayer.classList.add('active'); }
  else       { bgLayer.classList.remove('active'); bgLayer.style.backgroundImage = ''; }
}

function setBreakVisuals(on) {
  if (on) {
    document.body.classList.add('break-mode');
    statusDot.className = 'status-dot break';
    modePill.textContent = 'break';
  } else {
    document.body.classList.remove('break-mode');
    modePill.textContent = 'focus';
  }
}

function addChip() {
  const chip = document.createElement('div');
  chip.className = 'session-chip';
  document.getElementById('chips').appendChild(chip);
  const label = document.getElementById('chips-label');
  const count = document.querySelectorAll('.session-chip').length;
  label.textContent = count === 1 ? '1 session' : `${count} sessions`;
}

function clearChips() {
  document.getElementById('chips').innerHTML = '';
  document.getElementById('chips-label').textContent = '';
}

// ─── Pause button text helper ─────────────────
function setPauseBtn(running) {
  pauseBtn.textContent = running ? '⏸ pause' : '▶ resume';
}

// ═══════════════════════════════════════════
// TIMER CORE
// ═══════════════════════════════════════════

function startTick() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (isPaused) return;
    remainingSeconds--;
    if (remainingSeconds <= 0) {
      remainingSeconds = 0;
      clearInterval(timerInterval);
      bigTimer.textContent = '00:00';
      if (isBreak) endBreak();
      else         endFocus();
      return;
    }
    bigTimer.textContent = formatTime(remainingSeconds);
    updateRing(remainingSeconds, totalSeconds);
    updateTabTitle();
  }, 1000);
}

// ─── Start session (from panel) ───────────────
document.getElementById('start-btn').addEventListener('click', () => {
  if (customMode)      selectedMinutes  = parseInt(document.getElementById('custom-input').value) || 30;
  if (breakCustomMode) selectedBreakMin = parseInt(document.getElementById('break-custom-input').value) || 10;

  taskName = document.getElementById('task-input').value.trim();

  beginFocus();
  closePanel();
});

// ─── Begin a focus round ──────────────────────
function beginFocus() {
  isBreak          = false;
  hasStarted       = true;
  totalSeconds     = selectedMinutes * 60;
  remainingSeconds = totalSeconds;
  isPaused         = false;

  setBreakVisuals(false);
  applyBackground();

  bigTimer.textContent   = formatTime(remainingSeconds);
  topTask.textContent    = taskName || '';
  statusText.textContent = 'in flow';
  statusDot.className    = 'status-dot running';
  document.getElementById('timer-mode-label').textContent = 'remaining';
  document.getElementById('ring-progress').classList.remove('break-mode');
  setPauseBtn(true);
  updateRing(remainingSeconds, totalSeconds);

  startTick();
  requestNotifPermission();
  updateTabTitle();
}

// ─── Focus ends ───────────────────────────────
function endFocus() {
  sessionCount++;
  addChip();

  const mins   = Math.round(totalSeconds / 60);
  const result = addXP(mins);
  refreshXP();

  if (noBreak) {
    hasStarted = false;
    statusDot.className    = 'status-dot';
    statusText.textContent = 'done ✦';
    bgLayer.classList.remove('active');
    document.title = PAGE_TITLE;
    playChime(false);
    sendNotification('🫧 focus complete!', `+${result.gained} xp earned${taskName ? ' · ' + taskName : ''}`);
    setTimeout(() => {
      showNotif(`session done! +${result.gained} xp 🌊`);
      if (result.leveled) setTimeout(() => showLevelUp(result.newInfo), 1200);
    }, 300);
    setPauseBtn(false);
    pauseBtn.textContent = '▶ start';
    return;
  }

  // Show break prompt
  document.getElementById('break-prompt-mins').textContent = selectedBreakMin;
  document.getElementById('break-prompt-overlay').classList.add('show');
  playChime(false);
  sendNotification('🫧 focus complete!', `Take a ${selectedBreakMin} min break · +${result.gained} xp`);
  showNotif(`focus done! +${result.gained} xp 🌊`);
  window._lastXpResult = result;
}

// ─── Break prompt ─────────────────────────────
document.getElementById('start-break-btn').addEventListener('click', () => {
  document.getElementById('break-prompt-overlay').classList.remove('show');
  beginBreak();
  const r = window._lastXpResult;
  if (r && r.leveled) setTimeout(() => showLevelUp(r.newInfo), 600);
});

document.getElementById('skip-break-btn').addEventListener('click', () => {
  document.getElementById('break-prompt-overlay').classList.remove('show');
  // Go straight back to ready state
  hasStarted = false;
  bigTimer.textContent   = formatTime(selectedMinutes * 60);
  statusDot.className    = 'status-dot';
  statusText.textContent = 'ready';
  pauseBtn.textContent   = '▶ start';
  bgLayer.classList.remove('active');
  const r = window._lastXpResult;
  if (r && r.leveled) setTimeout(() => showLevelUp(r.newInfo), 400);
});

// ─── Begin break ──────────────────────────────
function beginBreak() {
  isBreak          = true;
  totalSeconds     = selectedBreakMin * 60;
  remainingSeconds = totalSeconds;
  isPaused         = false;

  setBreakVisuals(true);
  document.getElementById('ring-progress').classList.add('break-mode');
  document.getElementById('timer-mode-label').textContent = 'break left';
  bigTimer.textContent   = formatTime(remainingSeconds);
  statusText.textContent = 'resting';
  setPauseBtn(true);
  updateRing(remainingSeconds, totalSeconds);

  startTick();
  updateTabTitle();
}

// ─── Break ends — auto-start next focus ───────
function endBreak() {
  isBreak = false;
  setBreakVisuals(false);
  playChime(true);
  sendNotification('🌊 break over!', 'Time to get back in the flow.');
  showNotif('break over — back to flow 🌊');
  beginFocus();
}

// ─── Pause / resume ───────────────────────────
pauseBtn.addEventListener('click', () => {
  if (!hasStarted) {
    // First press starts the session
    beginFocus();
    return;
  }
  isPaused = !isPaused;
  if (isPaused) {
    statusDot.className    = 'status-dot paused';
    statusText.textContent = 'paused';
    setPauseBtn(false);
  } else {
    statusDot.className    = isBreak ? 'status-dot break' : 'status-dot running';
    statusText.textContent = isBreak ? 'resting' : 'in flow';
    setPauseBtn(true);
  }
});

// ─── Reset ────────────────────────────────────
document.getElementById('reset-btn').addEventListener('click', () => {
  if (!hasStarted) return;
  clearInterval(timerInterval);
  remainingSeconds       = totalSeconds;
  isPaused               = false;
  bigTimer.textContent   = formatTime(remainingSeconds);
  updateRing(remainingSeconds, totalSeconds);
  statusDot.className    = isBreak ? 'status-dot break' : 'status-dot running';
  statusText.textContent = isBreak ? 'resting' : 'in flow';
  setPauseBtn(true);
  startTick();
  showNotif('reset ↺');
});

// ─── End / back ───────────────────────────────
document.getElementById('back-btn').addEventListener('click', () => {
  clearInterval(timerInterval);
  document.getElementById('break-prompt-overlay').classList.remove('show');
  bgLayer.classList.remove('active');
  setBreakVisuals(false);
  isBreak    = false;
  hasStarted = false;
  clearChips();
  sessionCount = 0;

  bigTimer.textContent   = formatTime(selectedMinutes * 60);
  updateRing(selectedMinutes * 60, selectedMinutes * 60);
  document.getElementById('ring-progress').classList.remove('break-mode');
  document.getElementById('timer-mode-label').textContent = 'ready';
  statusDot.className    = 'status-dot';
  statusText.textContent = 'ready';
  topTask.textContent    = '';
  pauseBtn.textContent   = '▶ start';
  document.title = PAGE_TITLE;
});

// ═══════════════════════════════════════════
// PICTURE-IN-PICTURE
// ═══════════════════════════════════════════

const pipCanvas = document.getElementById('pip-canvas');
const pipVideo  = document.getElementById('pip-video');
const pipBtn    = document.getElementById('pip-btn');
const pipCtx    = pipCanvas.getContext('2d');
let   pipActive = false;
let   pipFrame  = null;

function drawPiPFrame() {
  const W = pipCanvas.width, H = pipCanvas.height;
  const cx = W / 2, cy = H / 2;
  const r  = 155;

  pipCtx.clearRect(0, 0, W, H);

  // Background
  const bgGrad = pipCtx.createRadialGradient(cx, cy - 40, 20, cx, cy, W * 0.7);
  bgGrad.addColorStop(0, '#1a5f8a');
  bgGrad.addColorStop(1, '#0d2f52');
  pipCtx.fillStyle = bgGrad;
  pipCtx.fillRect(0, 0, W, H);

  // Track ring
  pipCtx.beginPath();
  pipCtx.arc(cx, cy, r, 0, 2 * Math.PI);
  pipCtx.strokeStyle = 'rgba(168,230,240,0.12)';
  pipCtx.lineWidth   = 18;
  pipCtx.stroke();

  // Progress arc
  const total = totalSeconds || 1;
  const frac  = hasStarted ? (remainingSeconds / total) : 1;
  const start = -Math.PI / 2;
  const end   = start + 2 * Math.PI * frac;

  const arcGrad = pipCtx.createLinearGradient(cx - r, cy, cx + r, cy);
  if (isBreak) {
    arcGrad.addColorStop(0,   '#1a7a5a');
    arcGrad.addColorStop(0.5, '#3ecfaf');
    arcGrad.addColorStop(1,   '#a8f0d6');
  } else {
    arcGrad.addColorStop(0,   '#1a6a9a');
    arcGrad.addColorStop(0.4, '#3ecfcf');
    arcGrad.addColorStop(1,   '#ffffff');
  }

  pipCtx.beginPath();
  pipCtx.arc(cx, cy, r, start, end);
  pipCtx.strokeStyle = arcGrad;
  pipCtx.lineWidth   = 10;
  pipCtx.lineCap     = 'round';
  pipCtx.shadowColor = isBreak ? 'rgba(62,207,175,0.8)' : 'rgba(126,232,232,0.8)';
  pipCtx.shadowBlur  = 14;
  pipCtx.stroke();
  pipCtx.shadowBlur  = 0;

  // Timer text
  pipCtx.font         = 'bold 72px sans-serif';
  pipCtx.fillStyle    = '#ffffff';
  pipCtx.textAlign    = 'center';
  pipCtx.textBaseline = 'middle';
  pipCtx.shadowColor  = isBreak ? 'rgba(62,207,175,0.7)' : 'rgba(126,232,232,0.7)';
  pipCtx.shadowBlur   = 18;
  pipCtx.fillText(bigTimer.textContent, cx, cy - 10);
  pipCtx.shadowBlur   = 0;

  // Mode label
  const modeStr = isBreak ? 'BREAK' : (isPaused ? 'PAUSED' : (hasStarted ? 'FOCUS' : 'READY'));
  pipCtx.font      = '600 18px sans-serif';
  pipCtx.fillStyle = isBreak ? 'rgba(168,240,214,0.7)' : 'rgba(168,230,240,0.6)';
  pipCtx.fillText(modeStr, cx, cy + 50);

  // Task name
  const task = document.getElementById('task-input').value.trim();
  if (task) {
    pipCtx.font      = '500 14px sans-serif';
    pipCtx.fillStyle = 'rgba(255,255,255,0.35)';
    pipCtx.fillText(task.toLowerCase(), cx, cy + 76);
  }

  if (pipActive) pipFrame = requestAnimationFrame(drawPiPFrame);
}

async function startPiP() {
  if (!document.pictureInPictureEnabled) {
    showNotif('PiP not supported in this browser');
    return;
  }

  try {
    // Draw a frame onto canvas first so the stream has content
    drawPiPFrame();

    // Capture canvas as a video stream
    const stream = pipCanvas.captureStream(15);

    // Wire stream to video element
    pipVideo.srcObject = stream;

    // Must play before PiP
    await pipVideo.play();

    // Request PiP
    await pipVideo.requestPictureInPicture();

    pipActive = true;
    showNotif('timer popped out ⧉');

    // Keep drawing frames
    pipFrame = requestAnimationFrame(drawPiPFrame);

  } catch(err) {
    console.error('PiP error:', err);
    showNotif('could not open popout: ' + err.message);
  }
}

async function stopPiP() {
  pipActive = false;
  cancelAnimationFrame(pipFrame);
  if (document.pictureInPictureElement) {
    await document.exitPictureInPicture().catch(() => {});
  }
  pipVideo.srcObject = null;
}

pipBtn.addEventListener('click', () => {
  if (pipActive) stopPiP();
  else           startPiP();
});

document.addEventListener('leavepictureinpicture', () => {
  pipActive = false;
  cancelAnimationFrame(pipFrame);
});

// ═══════════════════════════════════════════
// TAB TITLE
// ═══════════════════════════════════════════

const PAGE_TITLE = 'Flow — Focus Timer';

function updateTabTitle() {
  if (!hasStarted) {
    document.title = PAGE_TITLE;
    return;
  }
  const time   = formatTime(remainingSeconds);
  const prefix = isBreak ? '🌊' : '🫧';
  const label  = isBreak ? 'break' : 'focus';
  document.title = `${prefix} ${time} · ${label}`;
}

// ═══════════════════════════════════════════
// NOTIFICATIONS
// ═══════════════════════════════════════════

async function requestNotifPermission() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') {
    await Notification.requestPermission();
  }
}

function sendNotification(title, body) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const n = new Notification(title, {
    body,
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.75em' font-size='60'%3E🫧%3C/text%3E%3C/svg%3E",
    silent: true,   // we handle our own sound
  });
  setTimeout(() => n.close(), 6000);
}

// ═══════════════════════════════════════════
// AUDIO CHIME  (Web Audio API — no file needed)
// ═══════════════════════════════════════════

let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playChime(isBreakEnd = false) {
  try {
    const ctx  = getAudioCtx();
    // Ocean-themed chord: two gentle sine tones fading out
    const notes = isBreakEnd
      ? [523.25, 659.25, 783.99]   // C5 E5 G5  — warm "back to work" major
      : [783.99, 987.77, 1174.66]; // G5 B5 D6  — airy "done!" sparkle

    notes.forEach((freq, i) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type      = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      const start = ctx.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.18, start + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 1.4);

      osc.start(start);
      osc.stop(start + 1.5);
    });
  } catch (e) {
    console.warn('Audio chime failed:', e);
  }
}

// ═══════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════
refreshXP();
bigTimer.textContent = formatTime(selectedMinutes * 60);
updateRing(selectedMinutes * 60, selectedMinutes * 60);
