// INFERNO — Prologue slice (P1–P4)
// A wordless cinematic platformer. No HUD, no combat.
// Verbs: walk/run, jump, crouch. Death teaches; restart is instant.
'use strict';

const W = 320, H = 180;
const cv = document.getElementById('c');
const ctx = cv.getContext('2d');

// ---------------------------------------------------------------- input --
const keys = {};
let anyKeyPulse = false;
addEventListener('keydown', e => {
  if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space'].includes(e.code))
    e.preventDefault();
  if (e.code === 'KeyS' && mode === 'title') {
    toggleSubs(); keys[e.code] = true; audioInit(); return;
  }
  if (!keys[e.code]) anyKeyPulse = true;
  keys[e.code] = true;
  audioInit();
});
addEventListener('keyup', e => { keys[e.code] = false; });

// touch controls — appear on first touch, hold-to-run on the pads
let touchUI = false, touchRestart = false;
let uiS = 1, uiOx = 0, uiOy = 0;
const touchHeld = new Set();
const btns = [
  { k: 'ArrowLeft',  x: 24,  y: 152, r: 16, label: '◀' },
  { k: 'ArrowRight', x: 64,  y: 152, r: 16, label: '▶' },
  { k: 'KeyX',       x: 244, y: 156, r: 14, label: '✦' },
  { k: 'Space',      x: 278, y: 140, r: 14, label: '▲' },
  { k: 'ArrowDown',  x: 298, y: 164, r: 13, label: '▼' },
];
const ptrs = new Map();
function refreshTouches() {
  touchHeld.clear();
  for (const p of ptrs.values())
    for (const b of btns) {
      // generous hit radius, more so once already held (sticky under drift)
      const dx = p.x - b.x, dy = p.y - b.y;
      const r = b.r + (p.held === b.k ? 16 : 8);
      if (dx * dx + dy * dy < r * r) { touchHeld.add(b.k); p.held = b.k; }
    }
}
function ptrPoint(cx, cy, held) {
  return { x: (cx - uiOx) / uiS, y: (cy - uiOy) / uiS, held };
}
let suppressStart = false, touchGo3d = false;
function ptrDown(id, cx, cy, isTouch) {
  audioInit();
  if (isTouch) touchUI = true;
  const p = ptrPoint(cx, cy);
  // the subtitles toggle on the title screen
  if (mode === 'title' && p.x > 96 && p.x < 224 && p.y > 158 && p.y < 174) {
    toggleSubs(); suppressStart = true;
    return;
  }
  if (mode === 'end' && p.x >= 160) touchGo3d = true;   // toward the mountain
  anyKeyPulse = true; touchRestart = true;
  ptrs.set(id, p);
  refreshTouches();
}
if (window.PointerEvent) {
  cv.addEventListener('pointerdown', e => {
    e.preventDefault();
    ptrDown(e.pointerId, e.clientX, e.clientY, e.pointerType !== 'mouse');
  });
  cv.addEventListener('pointermove', e => {
    const p = ptrs.get(e.pointerId);
    if (!p) return;
    ptrs.set(e.pointerId, ptrPoint(e.clientX, e.clientY, p.held));
    refreshTouches();
  });
  for (const ev of ['pointerup', 'pointercancel'])
    cv.addEventListener(ev, e => { ptrs.delete(e.pointerId); refreshTouches(); });
} else {
  // ancient mobile browsers: raw touch events
  cv.addEventListener('touchstart', e => {
    for (const t of e.changedTouches)
      ptrDown('t' + t.identifier, t.clientX, t.clientY, true);
  });
  cv.addEventListener('touchmove', e => {
    for (const t of e.changedTouches) {
      const p = ptrs.get('t' + t.identifier);
      if (p) ptrs.set('t' + t.identifier,
                      ptrPoint(t.clientX, t.clientY, p.held));
    }
    refreshTouches();
  });
  for (const ev of ['touchend', 'touchcancel'])
    cv.addEventListener(ev, e => {
      for (const t of e.changedTouches) ptrs.delete('t' + t.identifier);
      refreshTouches();
    });
}
// stop iOS magnifier/selection/scroll without killing pointer events
cv.addEventListener('touchstart', e => e.preventDefault(), { passive: false });
cv.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
addEventListener('contextmenu', e => e.preventDefault());

const left  = () => keys.ArrowLeft || keys.KeyA || touchHeld.has('ArrowLeft');
const right = () => keys.ArrowRight || keys.KeyD || touchHeld.has('ArrowRight');
const run   = () => keys.ShiftLeft || keys.ShiftRight ||
  (touchUI && (touchHeld.has('ArrowLeft') || touchHeld.has('ArrowRight')));
const jumpK = () => keys.Space || keys.ArrowUp || keys.KeyW || touchHeld.has('Space');
const down  = () => keys.ArrowDown || keys.KeyS || touchHeld.has('ArrowDown');
const fire  = () => keys.KeyX || keys.KeyC || touchHeld.has('KeyX');

function drawTouchUI(c) {
  if (!touchUI) return;
  c.textAlign = 'center'; c.textBaseline = 'middle';
  for (const b of btns) {
    const held = touchHeld.has(b.k);
    if (b.k === 'KeyX' && !player.gunHas) continue;
    c.globalAlpha = held ? 0.45 : 0.20;
    c.beginPath(); c.arc(b.x, b.y, b.r, 0, 7);
    c.fillStyle = '#EFE3C0'; c.fill();
    c.globalAlpha = held ? 0.9 : 0.5;
    c.fillStyle = '#0A0A0A'; c.font = 'bold 9px system-ui, sans-serif';
    c.fillText(b.label, b.x, b.y + 0.5);
  }
  c.globalAlpha = 1; c.textBaseline = 'alphabetic';
}

// --------------------------------------------------------------- helpers --
function poly(c, pts, fill) {
  c.beginPath();
  c.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
  c.closePath(); c.fillStyle = fill; c.fill();
}
function ell(c, x, y, rx, ry, fill) {
  c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 7); c.fillStyle = fill; c.fill();
}
function box(c, x, y, w, h, fill) { c.fillStyle = fill; c.fillRect(x, y, w, h); }
function rbox(c, x, y, w, h, r, fill) {
  c.beginPath();
  if (c.roundRect) c.roundRect(x, y, w, h, r);
  else c.rect(x, y, w, h);
  c.fillStyle = fill; c.fill();
}
function vgrad(c, x, y, w, h, c0, c1) {
  const g = c.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, c0); g.addColorStop(1, c1);
  c.fillStyle = g; c.fillRect(x, y, w, h);
}
function fxDustHint(c, x, y) {
  const p = (T * 2.4) % 1;
  c.globalAlpha = 0.4 * (1 - p);
  ell(c, x - p * 6, y - 1 - p * 3, 1.6 + p * 2.4, 1 + p, '#7A7468');
  c.globalAlpha = 1;
}
function cable(c, x0, x1, y0, sag, col) {
  c.strokeStyle = col; c.lineWidth = 1.2; c.beginPath();
  c.moveTo(x0, y0);
  c.quadraticCurveTo((x0 + x1) / 2, y0 + sag * 2, x1, y0);
  c.stroke();
}
function glowCircle(c, x, y, r, col, a) {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, col.replace('A)', (a) + ')'));
  g.addColorStop(1, col.replace('A)', '0)'));
  c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
}
const AMBER = 'rgba(232,163,61,A)';
const ROSE  = 'rgba(196,120,138,A)';
const VIRGIL_GRAY = '#565B63';

// --------------------------------------------------------------- figures --
// Flat-shape cutout figure. x = center, y = feet, h = full height.
function figure(c, x, y, h, coat, o = {}) {
  const skin = o.skin || '#C9986B', hair = o.hair || '#161414';
  const facing = o.facing || 1, ph = o.legPhase || 0;
  const crouch = o.crouch, jump = o.jump, moving = o.moving;
  c.save(); c.translate(x, y); c.scale(facing, 1);
  const hh = crouch ? h * 0.68 : h;
  const legs = hh * 0.46, torso = hh * 0.38, hr = h * 0.075;
  const hip = -legs, sh = -legs - torso;
  const pants = o.pants || shadeHex(coat, 0.55);
  // legs
  let sw = jump ? h * 0.15 : Math.sin(ph) * h * 0.17 * (moving ? 1 : 0.12);
  if (crouch && moving) sw = h * 0.22;           // slide stance
  poly(c, [[-h*.07, hip], [-h*.005, hip], [-sw + h*.02, 0], [-sw - h*.02, 0]], pants);
  poly(c, [[h*.005, hip], [h*.07, hip], [sw + h*.02, 0], [sw - h*.02, 0]], pants);
  // torso (leans forward when crouched)
  const lean = crouch ? h * 0.09 : 0;
  poly(c, [[-h*.11 + lean, sh], [h*.11 + lean, sh], [h*.075, hip], [-h*.075, hip]], coat);
  // near arm
  poly(c, [[h*.05 + lean, sh + h*.02], [h*.10 + lean, sh + h*.04],
           [h*.07, hip - h*.01], [h*.04, hip - h*.02]], shadeHex(coat, 0.85));
  // head
  const hx0 = lean * 1.4, hy = sh - hr - h * 0.015;
  box(c, hx0 - h*.02, sh - h*.03, h*.04, h*.04, skin);
  ell(c, hx0, hy, hr, hr * 1.12, skin);
  if (o.cap) {
    c.beginPath(); c.ellipse(hx0, hy - hr*0.28, hr*1.18, hr*0.85, 0, Math.PI, 0);
    c.fillStyle = o.cap; c.fill();
    box(c, hx0 - hr*1.3, hy - hr*0.35, hr*2.6, hr*0.32, o.cap);
  } else {
    c.beginPath(); c.ellipse(hx0, hy - hr*0.18, hr, hr*0.9, 0, Math.PI, 0);
    c.fillStyle = hair; c.fill();
    // back of the head, so the profile reads
    box(c, hx0 - hr - 0.15, hy - hr * 0.55, hr * 0.6, hr * 1.15, hair);
  }
  if (o.face !== false) {          // one eye, forward — a face in profile
    box(c, hx0 + hr * 0.32, hy - hr * 0.22, 0.85, 0.85, o.eye || '#241A12');
  }
  c.restore();
}
function shadeHex(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * f), g = Math.round(((n >> 8) & 255) * f),
        b = Math.round((n & 255) * f);
  return `rgb(${r},${g},${b})`;
}

// Quadruped silhouette: the beasts.
// o: len, ht, legH, mane, gaunt, facing, phase, lower (0..1), eye
function beast(c, x, y, o) {
  const f = o.facing || 1, len = o.len, ht = o.ht, legH = o.legH;
  const col = o.col || '#050807';
  const lower = o.lower || 0;
  ell(c, x, y + 1.6, len * 0.42, 2, 'rgba(0,0,0,0.3)');   // grounding shadow
  c.save(); c.translate(x, y - lower * legH * 0.55); c.scale(f, 1);
  const by = -legH - ht / 2 + lower * legH * 0.4;    // body center
  // legs (4), swinging pairs
  for (let i = 0; i < 4; i++) {
    const lx = -len * 0.34 + (i % 2) * len * 0.66 + (i > 1 ? len * 0.06 : 0);
    const swing = Math.sin((o.phase || 0) + (i % 2 ? Math.PI : 0) + (i > 1 ? 0.7 : 0))
                  * len * 0.08 * (o.moving ? 1 : 0.1);
    poly(c, [[lx - 1.4, by + ht * 0.2], [lx + 1.4, by + ht * 0.2],
             [lx + swing + 1.1, -lower * -1], [lx + swing - 1.1, 0]], col);
  }
  // body
  c.beginPath(); c.ellipse(0, by, len / 2, ht / 2 * (o.gaunt ? 0.78 : 1), 0, 0, 7);
  c.fillStyle = col; c.fill();
  if (o.gaunt) {  // high haunches
    ell(c, -len * 0.32, by - ht * 0.18, len * 0.16, ht * 0.42, col);
  }
  // neck + head
  const nx = len * 0.46, hy2 = by - ht * (0.42 - lower * 0.25);
  poly(c, [[nx - len*0.1, by], [nx + len*0.12, hy2], [nx + len*0.2, hy2 + 2],
           [nx + len*0.04, by + 2]], col);
  ell(c, nx + len * 0.19, hy2, len * 0.13, ht * 0.3, col);
  // ears + muzzle
  poly(c, [[nx + len*0.12, hy2 - ht*0.26], [nx + len*0.17, hy2 - ht*0.52],
           [nx + len*0.21, hy2 - ht*0.24]], col);
  poly(c, [[nx + len*0.28, hy2 - 1.5], [nx + len*0.40, hy2 + 0.5],
           [nx + len*0.28, hy2 + 2.5]], col);
  if (o.mane) { ell(c, nx + len * 0.06, hy2 + 2, len * 0.2, ht * 0.52, col); }
  // tail
  c.strokeStyle = col; c.lineWidth = 1.6; c.beginPath();
  c.moveTo(-len / 2 + 1, by - ht * 0.1);
  c.quadraticCurveTo(-len * 0.72, by - ht * (o.gaunt ? 0.1 : 0.85),
                     -len * 0.66, by - ht * (o.gaunt ? 0.5 : 1.15));
  c.stroke();
  // eye
  if (o.eye !== false) {
    c.fillStyle = '#E8A33D';
    c.fillRect(nx + len * 0.2, hy2 - 1.2, 1.6, 1.4);
  }
  c.restore();
}

function treeSil(c, x, gy, s, col) {
  box(c, x - s * 0.06, gy - s * 0.62, s * 0.12, s * 0.62, col);
  ell(c, x, gy - s * 0.82, s * 0.42, s * 0.34, col);
  ell(c, x - s * 0.28, gy - s * 0.62, s * 0.26, s * 0.2, col);
  ell(c, x + s * 0.26, gy - s * 0.66, s * 0.28, s * 0.22, col);
}
function lamp(c, x, gy, flicker) {
  const on = flicker === undefined ? 1 : flicker;
  box(c, x - 1.2, gy - 52, 2.4, 52, '#0A0F0A');
  box(c, x - 5, gy - 55, 10, 4, '#0A0F0A');
  if (on > 0.05) {
    box(c, x - 3, gy - 53.4, 6, 2.2, '#E8A33D');
    glowCircle(c, x, gy - 51, 40, AMBER, 0.32 * on);
    // light pool
    c.globalAlpha = 0.16 * on;
    ell(c, x, gy + 1, 30, 4.5, '#E8A33D');
    c.globalAlpha = 1;
  }
}

// ---------------------------------------------------------------- player --
const GROUND = 150, WALK = 42, RUN = 88, JUMPV = -168, GRAV = 540;
const player = {
  x: 20, y: GROUND, vx: 0, vy: 0, on: true, crouch: false,
  facing: 1, phase: 0, maxX: 0, stun: 0, h: 26,
  gunHas: false, gunT: 0,
};
let deaths = 0;

function resetPlayer(x) {
  Object.assign(player, { x, y: GROUND, vx: 0, vy: 0, on: true,
                          crouch: false, stun: 0, maxX: x });
}

// the highest floor at x that is at-or-below the given feet height.
// GROUND unless a gap eats it; scene platforms (sc.plats) stack above.
function surfaceY(sc, x, feetY) {
  let g = (sc.inGap && sc.inGap(x)) ? 1e9 : GROUND;
  if (sc.plats) for (const p of sc.plats)
    if (x > p.x0 && x < p.x1 && p.y >= feetY - 2 && p.y < g) g = p.y;
  return g;
}
// every walkable surface shares one language: a bright lit edge
function groundBand(c, w2, fill, edge) {
  box(c, 0, GROUND, w2, 30, fill);
  box(c, 0, GROUND - 0.6, w2, 2.2, edge);
  c.globalAlpha = 0.3; box(c, 0, GROUND + 2, w2, 1.2, '#000');
  c.globalAlpha = 1;
}
function platBand(c, p, fill, edge) {
  box(c, p.x0, p.y, p.x1 - p.x0, 5, fill);
  box(c, p.x0, p.y - 0.6, p.x1 - p.x0, 1.8, edge);
}

let coyote = 0, jbuf = 0, prevJumpHeld = false, stepT = 0;
function updatePlayer(dt, sc) {
  const wasOn = player.on;
  // coyote time + jump buffering: the controls forgive, so death never
  // feels like the keyboard's fault
  coyote = player.on ? 0.09 : coyote - dt;
  const pressed = jumpK() && !prevJumpHeld;
  prevJumpHeld = jumpK();
  jbuf = pressed ? 0.12 : jbuf - dt;
  if (player.stun > 0) { player.stun -= dt; player.vx = 0; }
  else {
    const spd = (run() ? RUN : WALK) * (sc.speedMul || 1);
    let dir = (right() ? 1 : 0) - (left() ? 1 : 0);
    player.crouch = down() && player.on;
    let s = spd;
    if (player.crouch) s = (Math.abs(player.vx) > WALK + 5 && sc.slide) ? RUN : WALK * 0.6;
    if (sc.ice) {                    // momentum: the ninth circle owns your feet
      const tgt = dir * s;
      player.vx += (tgt - player.vx) * Math.min(1, dt * 2.0);
    } else player.vx = dir * s;
    if (dir) player.facing = dir;
    if (jbuf > 0 && coyote > 0 && !player.crouch) {
      player.vy = JUMPV; player.on = false; coyote = 0; jbuf = 0;
      sfx.jump();
      fx.push({ x: player.x, y: player.y, t: 0, kind: 'dust' });
    }
  }
  player.x += player.vx * dt;
  if (!player.on) {
    player.vy += GRAV * dt;
    const prevY = player.y;
    player.y += player.vy * dt;
    if (player.vy > 0) {              // one-way floors: land only from above
      const f = surfaceY(sc, player.x, prevY);
      if (f < 1e8 && prevY <= f + 0.5 && player.y >= f) {
        player.y = f; player.vy = 0; player.on = true;
      }
    }
  } else {
    const f = surfaceY(sc, player.x, player.y);
    if (f - player.y > 3) { player.on = false; player.vy = 20; }
    else player.y = f;
  }
  if (!wasOn && player.on) {          // landing: heard and seen
    sfx.land();
    fx.push({ x: player.x - 3, y: player.y, t: 0, kind: 'dust' });
    fx.push({ x: player.x + 3, y: player.y, t: 0, kind: 'dust' });
  }
  if (player.on && Math.abs(player.vx) > WALK + 5) {   // running kicks dust
    stepT += dt;
    if (stepT > 0.22) {
      stepT = 0;
      fx.push({ x: player.x - player.facing * 3, y: player.y, t: 0, kind: 'dust' });
    }
  }
  player.x = Math.max(6, Math.min(sc.w - 6, player.x));
  player.maxX = Math.max(player.maxX, player.x);
  player.shY = player.on ? player.y : surfaceY(sc, player.x, player.y);
  if (Math.abs(player.vx) > 1) player.phase += dt * (Math.abs(player.vx) > WALK + 5 ? 13 : 8);
}

function drawPlayer(c) {
  // grounding shadow on whatever surface is below — you always know
  // where you'll land
  const shY = player.shY ?? GROUND;
  const dy = Math.max(0, shY - player.y);
  if (shY < 1e8 && player.y <= shY + 1) {
    const ss = Math.max(0.35, 1 - dy / 90);
    ell(c, player.x, shY + 1.6, 6.5 * ss, 1.7 * ss, 'rgba(0,0,0,0.35)');
  }
  // squash & stretch
  const sy = player.on ? 1 : (player.vy < 0 ? 1.08 : 0.94);
  c.save(); c.translate(player.x, player.y); c.scale(1 / sy, sy);
  figure(c, 0, 0, player.h, '#2A2F38', {
    facing: player.facing, legPhase: player.phase,
    crouch: player.crouch, jump: !player.on,
    moving: Math.abs(player.vx) > 1, hair: '#14120F',
  });
  c.restore();
  // a breath of rim light so he reads on every background
  c.globalAlpha = 0.3;
  box(c, player.x + player.facing * 2.6, player.y - (player.crouch ? 15 : 21),
      0.8, player.crouch ? 8 : 12, '#C7DCE2');
  c.globalAlpha = 1;
}

// ----------------------------------------------------------------- audio --
// Everything synthesized: filtered-noise ambience, oscillator sfx.
// The subway is the score; music never plays.
let AC = null, master = null, ambGain = null, ambFilter = null, ambKey = '';
function audioInit() {
  if (AC) { AC.resume(); return; }
  try { AC = new (window.AudioContext || window.webkitAudioContext)(); }
  catch (e) { return; }
  master = AC.createGain(); master.gain.value = 0.5;
  master.connect(AC.destination);
  const len = AC.sampleRate * 2;
  const buf = AC.createBuffer(1, len, AC.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = AC.createBufferSource();
  src.buffer = buf; src.loop = true;
  ambFilter = AC.createBiquadFilter();
  ambFilter.type = 'lowpass'; ambFilter.frequency.value = 500;
  ambGain = AC.createGain(); ambGain.gain.value = 0;
  src.connect(ambFilter); ambFilter.connect(ambGain); ambGain.connect(master);
  src.start();
}
function ambience(key, freq, level) {
  if (!AC || ambKey === key) return;
  ambKey = key;
  ambFilter.frequency.setTargetAtTime(freq, AC.currentTime, 0.6);
  ambGain.gain.setTargetAtTime(level, AC.currentTime, 0.9);
}
function tone(f0, f1, dur, type = 'square', vol = 0.12, delay = 0) {
  if (!AC) return;
  const t0 = AC.currentTime + delay;
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t0);
  o.frequency.exponentialRampToValueAtTime(Math.max(28, f1), t0 + dur);
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  o.connect(g); g.connect(master);
  o.start(t0); o.stop(t0 + dur + 0.03);
}
// music: a slow synthesized pad, one root note per area, descending as
// you descend; sparse bell notes above it
let musA = null, musB = null, musGain = null, musRoot = 0, nextBell = 0;
function musicEnsure() {
  if (!AC || musGain) return;
  musGain = AC.createGain(); musGain.gain.value = 0.045;
  musGain.connect(master);
  const f = AC.createBiquadFilter();
  f.type = 'lowpass'; f.frequency.value = 850; f.connect(musGain);
  musA = AC.createOscillator(); musA.type = 'sine';
  musB = AC.createOscillator(); musB.type = 'triangle';
  const gb = AC.createGain(); gb.gain.value = 0.45;
  musB.connect(gb); gb.connect(f); musA.connect(f);
  musA.frequency.value = 110; musB.frequency.value = 165;
  musA.start(); musB.start();
}
function music(root) {
  if (!AC) return;
  musicEnsure();
  if (root === musRoot) return;
  musRoot = root;
  musA.frequency.setTargetAtTime(root, AC.currentTime, 1.4);
  musB.frequency.setTargetAtTime(root * 1.4983, AC.currentTime, 1.8);
}
const BELLS = [1, 1.189, 1.498, 1.782, 2];
function bellTick() {
  if (!AC || !musRoot || T < nextBell) return;
  nextBell = T + 5 + Math.random() * 8;
  const n = musRoot * 2 * BELLS[(Math.random() * BELLS.length) | 0];
  tone(n, n * 0.995, 1.6, 'sine', 0.026);
}

const sfx = {
  jump:   () => tone(200, 320, 0.09, 'sine', 0.045),
  death:  () => tone(150, 38, 0.5, 'triangle', 0.22),
  shot:   () => tone(950, 190, 0.11, 'square', 0.09),
  shield: () => tone(500, 680, 0.2, 'sine', 0.07),
  blast:  () => { tone(320, 55, 0.42, 'sawtooth', 0.16);
                  tone(1300, 220, 0.3, 'square', 0.07); },
  ebolt:  () => tone(210, 85, 0.2, 'sawtooth', 0.08),
  hiss:   () => tone(820, 210, 0.28, 'triangle', 0.05),
  clunk:  () => tone(170, 55, 0.16, 'square', 0.11),
  rumble: () => tone(64, 24, 1.6, 'triangle', 0.26),
  punch:  () => { tone(1500, 1100, 0.03, 'square', 0.09);
                  tone(1500, 1100, 0.03, 'square', 0.09, 0.11); },
  land:   () => tone(150, 88, 0.07, 'triangle', 0.05),
  bump:   () => tone(120, 78, 0.06, 'square', 0.06),
  win:    () => { tone(392, 392, 0.12, 'sine', 0.06);
                  tone(587, 587, 0.18, 'sine', 0.06, 0.12); },
};

// ------------------------------------------------------------- narration --
// A quiet narrator (built-in browser voice) tells the story for players
// who don't know the poem. Subtitles always; each line speaks once per run.
const spoken = new Set();
let subText = '', subT = 0;
let subsOn = true;
try { subsOn = localStorage.getItem('inferno_subs') !== '0'; } catch (e) {}
function toggleSubs() {
  subsOn = !subsOn;
  if (!subsOn) { subText = ''; subT = 0; }
  try { localStorage.setItem('inferno_subs', subsOn ? '1' : '0'); } catch (e) {}
}
function say(id, text, showSub = true) {
  if (spoken.has(id)) return;
  spoken.add(id);
  if (showSub && subsOn) { subText = text; subT = Math.max(2.8, text.length * 0.075); }
  try {
    if (window.speechSynthesis) {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.95; u.pitch = 0.8; u.volume = 0.9;
      speechSynthesis.speak(u);
    }
  } catch (e) { /* narration is optional */ }
}
function clearNarration() {
  spoken.clear(); subText = ''; subT = 0;
  try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) {}
}
function drawSubtitle(c) {
  if (subT <= 0 || !subText) return;
  c.font = 'italic 8px Georgia, serif';
  const words = subText.split(' '), lines = [];
  let cur = '';
  for (const w of words) {
    const t = cur ? cur + ' ' + w : w;
    if (c.measureText(t).width > 225) { lines.push(cur); cur = w; }
    else cur = t;
  }
  if (cur) lines.push(cur);
  const lh = 10, y0 = 172 - lines.length * lh;
  const wmax = Math.max(...lines.map(l => c.measureText(l).width));
  c.fillStyle = 'rgba(0,0,0,0.5)';
  c.fillRect(W / 2 - wmax / 2 - 7, y0 - 8, wmax + 14, lines.length * lh + 7);
  c.fillStyle = '#E8DCC0'; c.textAlign = 'center';
  lines.forEach((l, i) => c.fillText(l, W / 2, y0 + i * lh));
}

// ---------------------------------------------------------------- combat --
// The gun, found beneath the surface. Another World's grammar:
// tap = shot, hold = plant a shield, long hold = charge blast.
const shots = [], eBolts = [], shields = [], fx = [];
function clearCombat() {
  shots.length = 0; eBolts.length = 0; shields.length = 0; fx.length = 0;
  player.gunT = 0;
}

function updateGun(dt) {
  if (!player.gunHas) return;
  if (fire()) { player.gunT += dt; return; }
  if (player.gunT <= 0) return;
  const t = player.gunT, dir = player.facing; player.gunT = 0;
  const gy = player.y - (player.crouch ? 9 : 14);
  if (t >= 1.1) {
    shots.push({ x: player.x + dir * 7, y: gy, vx: dir * 300, super: true });
    sfx.blast();
  } else if (t >= 0.35) {
    if (shields.length < 2) {
      shields.push({ x: player.x + dir * 7, hp: 3, t: 0 });
      sfx.shield();
    }
  } else {
    shots.push({ x: player.x + dir * 7, y: gy, vx: dir * 330, super: false });
    fx.push({ x: player.x + dir * 9, y: gy, t: 0, kind: 'muzzle' });
    sfx.shot();
  }
}

function updateShades(sc, dt) {
  for (const sh of sc.shades) {
    if (sh.dead) { sh.dead += dt; continue; }
    sh.t = (sh.t || 0) + dt;
    const dx = player.x - sh.x, ad = Math.abs(dx);
    if (sh.state === 'lurk') {
      sh.x += Math.sign(dx) * 26 * dt;
      if (ad < 80) sh.state = 'rush';
    } else {
      sh.x += Math.sign(dx) * 64 * dt;
    }
    if (ad < 7) kill('shade');
  }
}

function updateProjectiles(dt, sc) {
  for (let i = shots.length; i--;) {
    const s = shots[i]; s.x += s.vx * dt;
    if (s.x < 0 || s.x > sc.w) { shots.splice(i, 1); continue; }
    let used = false;
    if (sc.shades) for (const sh of sc.shades) {
      if (!sh.dead && Math.abs(s.x - sh.x) < 8) {
        sh.dead = 0.001; fx.push({ x: sh.x, y: GROUND - 14, t: 0, kind: 'poof' });
        sfx.hiss();
        if (!s.super) used = true;
        break;
      }
    }
    if (!used && sc.demon && !sc.demon.dead &&
        Math.abs(s.x - sc.demon.x) < 11) {
      if (sc.demon.state === 'pause' || s.super) {
        sc.demon.hp -= s.super ? 3 : 1;
        fx.push({ x: sc.demon.x, y: GROUND - 20, t: 0, kind: 'hit' });
        if (sc.demon.hp <= 0) {
          sc.demon.dead = true;
          fx.push({ x: sc.demon.x, y: GROUND - 16, t: 0, kind: 'poof' });
        }
      } else fx.push({ x: s.x, y: s.y, t: 0, kind: 'hit' });   // armor
      used = !s.super;
    }
    if (!used && sc.gate && !sc.gate.broken && s.x > sc.gate.x - 4) {
      if (s.super) {
        sc.gate.broken = true; sfx.clunk();
        for (let k = 0; k < 6; k++)
          fx.push({ x: sc.gate.x + (k % 2) * 4 - 2, y: GROUND - 6 - k * 5,
                    t: 0, kind: 'poof' });
      } else fx.push({ x: s.x, y: s.y, t: 0, kind: 'hit' });
      used = true;
    }
    if (!used && sc.hands) for (const hd of sc.hands) {
      if (hd.state === 'up' && Math.abs(s.x - hd.x) < 7) {
        hd.state = 'gone';
        fx.push({ x: hd.x, y: GROUND - 6, t: 0, kind: 'poof' });
        used = true; break;
      }
    }
    if (used) shots.splice(i, 1);
  }
  for (let i = eBolts.length; i--;) {
    const b = eBolts[i]; b.x += b.vx * dt;
    let stop = false;
    for (const s of shields) {
      if (s.hp > 0 && Math.abs(b.x - s.x) < 4) {
        s.hp--; fx.push({ x: s.x, y: b.y, t: 0, kind: 'hit' }); stop = true;
        break;
      }
    }
    if (stop || b.x < 0 || b.x > sc.w) { eBolts.splice(i, 1); continue; }
    // a well-timed jump clears a bolt; otherwise it's shield or death
    const airborne = !player.on && player.y < GROUND - 16;
    if (!airborne && Math.abs(b.x - player.x) < 6) {
      kill('bolt'); eBolts.splice(i, 1);
    }
  }
  for (let i = shields.length; i--;) {
    const s = shields[i]; s.t += dt;
    if (s.hp <= 0 || s.t > 9) shields.splice(i, 1);
  }
  for (let i = fx.length; i--;) { fx[i].t += dt; if (fx[i].t > 0.6) fx.splice(i, 1); }
}

function drawShade(c, sh, i) {
  if (sh.dead) {
    const a = Math.max(0, 1 - sh.dead * 2.5);
    if (a <= 0) return;
    c.globalAlpha = a;
  }
  const bob = Math.sin(T * 3 + i * 1.7) * 2, x = sh.x, y = GROUND - 2 + bob;
  poly(c, [[x - 5, y], [x - 2, y - 16], [x + 2, y - 19], [x + 5, y - 14],
           [x + 3, y], [x + 7, y + 1], [x - 6, y + 2]], '#0A0D12');
  ell(c, x + 0.5, y - 16, 3.2, 3.8, '#0A0D12');
  c.fillStyle = '#D8E8EC';
  c.fillRect(x - 0.5, y - 17, 1.1, 1.1);
  c.fillRect(x + 2, y - 17, 1.1, 1.1);
  c.globalAlpha = 1;
}

function drawCombat(c) {
  for (const s of shots) {
    if (s.super) {
      glowCircle(c, s.x, s.y, 10, AMBER, 0.5);
      box(c, s.x - 7, s.y - 1.4, 14, 2.8, '#F2CE7A');
    } else box(c, s.x - 5, s.y - 0.8, 10, 1.6, '#9FE8D8');
  }
  for (const b of eBolts) {
    box(c, b.x - 5, b.y - 1, 10, 2, '#E86A2B');
    glowCircle(c, b.x, b.y, 5, 'rgba(232,106,43,A)', 0.5);
  }
  for (const s of shields) {
    c.globalAlpha = (0.5 + 0.25 * Math.sin(T * 9)) * (s.hp / 3 * 0.6 + 0.4);
    box(c, s.x - 1, GROUND - 26, 2, 26, '#8FE0CE');
    glowCircle(c, s.x, GROUND - 13, 10, 'rgba(143,224,206,A)', 0.35);
    c.globalAlpha = 1;
  }
  for (const f of fx) {
    const p = f.t / 0.6;
    c.globalAlpha = 1 - p;
    if (f.kind === 'poof') {
      ell(c, f.x, f.y - p * 8, 4 + p * 7, 4 + p * 7, '#1A2430');
      c.globalAlpha = (1 - p) * 0.6;
      ell(c, f.x, f.y - p * 8, 2 + p * 3, 2 + p * 3, '#9FE8D8');
    } else if (f.kind === 'dust') {
      c.globalAlpha = Math.max(0, 1 - p * 1.8) * 0.5;
      ell(c, f.x, f.y - 1 - p * 5, 2 + p * 3.5, 1.2 + p * 1.6, '#7A7468');
    } else if (f.kind === 'muzzle') {
      if (f.t < 0.1) {
        c.globalAlpha = 1 - f.t / 0.1;
        ell(c, f.x, f.y, 3.4, 2.2, '#D8FFF2');
      }
    } else ell(c, f.x, f.y, 2 + p * 4, 2 + p * 4, '#F2CE7A');
    c.globalAlpha = 1;
  }
  if (player.gunHas && mode !== 'title') {
    const dir = player.facing, gy = player.y - (player.crouch ? 9 : 14);
    box(c, player.x + dir * 4, gy - 1, dir * 4.5, 1.8, '#11151C');
    if (player.gunT > 0.35) {
      const chg = player.gunT > 1.1;
      glowCircle(c, player.x + dir * 9, gy, 6,
                 chg ? AMBER : 'rgba(143,224,206,A)', chg ? 0.8 : 0.4);
    }
  }
}

// a horned demon: aim → three bolts → a glowing opening. Shared by the
// Vestibule and the Malebranche of Fraud.
function updateDemon(d, dt) {
  if (d.dead) return;
  d.t += dt;
  if (d.state === 'aim' && d.t > 0.7) { d.state = 'fire'; d.t = 0; d.n = 0; }
  else if (d.state === 'fire') {
    if (d.t > d.n * 0.32) {
      eBolts.push({ x: d.x - 9, y: GROUND - 13, vx: -175 });
      sfx.ebolt();
      d.n++;
      if (d.n >= 3) { d.state = 'pause'; d.t = 0; }
    }
  } else if (d.state === 'pause' && d.t > 1.6) { d.state = 'aim'; d.t = 0; }
  if (Math.abs(player.x - d.x) < 12) kill('demon');
}
function drawDemon(c, d) {
  if (d.dead) return;
  const dx = d.x, lean = d.state === 'aim' ? -1.5 : 0;
  ell(c, dx, GROUND + 1.6, 9, 2, 'rgba(0,0,0,0.3)');
  poly(c, [[dx - 8, GROUND], [dx - 5 + lean, GROUND - 26],
           [dx + lean, GROUND - 33], [dx + 5 + lean, GROUND - 27],
           [dx + 9, GROUND], [dx + 12, GROUND + 1], [dx - 10, GROUND + 1]],
       '#07090D');
  ell(c, dx + lean, GROUND - 30, 4.4, 5, '#07090D');
  poly(c, [[dx - 4 + lean, GROUND - 33], [dx - 7 + lean, GROUND - 40],
           [dx - 1 + lean, GROUND - 35]], '#07090D');
  poly(c, [[dx + 4 + lean, GROUND - 33], [dx + 7 + lean, GROUND - 40],
           [dx + 1 + lean, GROUND - 35]], '#07090D');
  const hot = d.state === 'aim' ? 0.9 : 0.5;
  c.fillStyle = '#E86A2B';
  c.fillRect(dx - 2.6 + lean, GROUND - 31, 1.6, 1.4);
  c.fillRect(dx + 1 + lean, GROUND - 31, 1.6, 1.4);
  glowCircle(c, dx + lean, GROUND - 30, 6, 'rgba(232,106,43,A)', hot * 0.4);
  if (d.state === 'pause') {                    // the opening — hit it NOW
    glowCircle(c, dx, GROUND - 20, 8,
               'rgba(232,106,43,A)', 0.5 + 0.3 * Math.sin(T * 10));
  }
}

function drawVirgil(c, x, y, o = {}) {
  ell(c, x, y + 1.6, 5.5, 1.5, 'rgba(0,0,0,0.3)');
  figure(c, x, y, 27, VIRGIL_GRAY, {
    cap: '#33383F', facing: o.facing || 1, legPhase: o.phase || 0,
    moving: o.moving, hair: '#3A3F45',
  });
  if (o.lamp !== false) {
    const lx = x + (o.facing || 1) * 5;
    box(c, lx - 1.5, y - 15, 3, 4.5, '#E8A33D');
    glowCircle(c, lx, y - 13, o.lampR || 30, AMBER, o.lampA ?? 0.25);
  }
}

// ----------------------------------------------------------------- state --
let mode = 'title';          // title | quote | play | dead | drop | end
let modeT = 0, sceneIdx = 0, camX = 0, T = 0;
let lastSceneIdx = -1, titleT = 9;
let deathCause = '';

function kill(cause) {
  if (mode !== 'play') return;
  deathCause = cause; deaths++;
  mode = 'dead'; modeT = 0;
  sfx.death();
}

// ---------------------------------------------------------------- scenes --
// P1 — The Park at Night
function makePark() {
  const w = 320;
  const flies = Array.from({length: 9}, (_, i) => ({
    x: 30 + i * 34, y: 90 + (i * 37) % 40, p: i * 1.7 }));
  return {
    w, name: 'park', entry: 14, slide: false,
    plats: [{ x0: 152, x1: 176, y: GROUND - 11 }],   // the stile top
    reset() { resetPlayer(this.entry); this.bumpS = false; this.bumpB = false; },
    update(dt) {
      say('p1', "I was only walking home. But the park felt wrong that night.");
      // teach, then test: a knee-high stile — jump it, or stand on it.
      // Bumping it is loud and harmless; the pit later is neither.
      if (player.on && player.y >= GROUND - 1) {
        if (player.x > 150 && player.x < 172 && player.maxX < 172) {
          player.x = 150;
          if (!this.bumpS) { this.bumpS = true; sfx.bump();
            fx.push({ x: 152, y: GROUND, t: 0, kind: 'dust' }); }
        }
        if (player.x <= 146) this.bumpS = false;
        // and a low branch — only a crouch passes. The leopard will ask
        // for the same answer, with teeth.
        if (!player.crouch && player.x > 258 && player.x < 278 &&
            player.maxX < 278) {
          player.x = 258;
          if (!this.bumpB) { this.bumpB = true; sfx.bump();
            fx.push({ x: 260, y: GROUND - 14, t: 0, kind: 'dust' }); }
        }
        if (player.x <= 254) this.bumpB = false;
      }
      if (player.x >= w - 7) nextScene();
    },
    draw(c) {
      vgrad(c, 0, 0, w, 118, '#0A1210', '#17231A');
      // stars, held still, each keeping its own time
      for (let i = 0; i < 26; i++) {
        const sx = (i * 61 + 9) % w, sy = (i * 37) % 74;
        c.globalAlpha = 0.25 + 0.55 * Math.abs(Math.sin(T * 0.9 + i * 2.1));
        box(c, sx, sy, i % 6 ? 0.9 : 1.3, i % 6 ? 0.9 : 1.3, '#D8E8EC');
        c.globalAlpha = 1;
      }
      // city glow, left horizon — the world he is leaving
      glowCircle(c, 20, 116, 60, AMBER, 0.14);
      // skyline with a few windows still awake
      for (let i = 0; i < 7; i++) {
        const bx = i * 13 - 4, by = 96 + (i * 29 % 17);
        box(c, bx, by, 9, 22, '#0A120C');
        if (i % 2) { box(c, bx + 2, by + 4, 1.4, 1.8, '#E8A33D');
                     box(c, bx + 5.4, by + 9, 1.4, 1.8, '#B37A2E'); }
      }
      // the moon, haloed
      glowCircle(c, 252, 28, 22, 'rgba(216,232,236,A)', 0.16);
      c.strokeStyle = '#D8E8EC'; c.lineWidth = 1.4; c.beginPath();
      c.arc(252, 28, 7, -0.6, 2.2); c.stroke();
      vgrad(c, 0, 118, w, 62, '#141E12', '#0E140C');
      // the path: warm packed earth, nothing like the night above it
      groundBand(c, w, '#2B2214', '#A8B060');
      // back fence
      for (let x = 8; x < w; x += 22) box(c, x, 122, 1.6, 28, '#0A0F0A');
      box(c, 0, 126, w, 1.4, '#0A0F0A'); box(c, 0, 140, w, 1.4, '#0A0F0A');
      treeSil(c, 52, GROUND, 60, '#0B140B');
      treeSil(c, 288, GROUND, 70, '#0A120A');
      // a bench nobody sits on
      box(c, 188, GROUND - 9, 26, 2.2, '#141B12');
      box(c, 189, GROUND - 13, 24, 2, '#141B12');
      box(c, 190, GROUND - 7, 2, 7, '#0E140C');
      box(c, 210, GROUND - 7, 2, 7, '#0E140C');
      // the stile: sturdy planks you can stand on, top edge lit like
      // every other walkable surface
      box(c, 156, GROUND - 11, 3, 11, '#3A3020');
      box(c, 169, GROUND - 11, 3, 11, '#3A3020');
      platBand(c, this.plats[0], '#4A3D26', '#A8B060');
      // the low branch — pale wood against the dark, moonlight in the gap
      glowCircle(c, 266, GROUND - 9, 15, 'rgba(216,232,236,A)', 0.12);
      c.save(); c.translate(288, GROUND - 46); c.rotate(0.4);
      box(c, -40, 0, 40, 3.4, '#3A3020'); c.restore();
      box(c, 252, GROUND - 21, 32, 3.2, '#4A3D26');
      box(c, 252, GROUND - 21.6, 32, 1.2, '#8A7A50');
      for (let lx = 255; lx < 282; lx += 6)
        ell(c, lx + Math.sin(T * 2 + lx) * 1.2, GROUND - 16, 3.2, 4,
            '#26331C');
      lamp(c, 104, GROUND);
      lamp(c, 226, GROUND);
      // fireflies
      for (const f of flies) {
        const fx = f.x + Math.sin(T * 0.7 + f.p) * 6;
        const fy = f.y + Math.sin(T * 1.1 + f.p * 2) * 4;
        c.globalAlpha = 0.5 + 0.5 * Math.sin(T * 2 + f.p);
        box(c, fx, fy, 1.2, 1.2, '#E8D9A0');
        c.globalAlpha = 1;
      }
    },
  };
}

// P2 — The Leopard
function makeLeopard() {
  const w = 320;
  const L = { x: 210, dir: -1, state: 'patrol', t: 0, lower: 0, vx: 0,
              tx: 0, ty: 0, vy: 0, yy: 0 };
  const RAIL_X0 = 240, RAIL_X1 = 288, TRIG = 176;
  return {
    w, name: 'leopard', entry: 12, slide: false, L,
    reset() {
      resetPlayer(this.entry);
      Object.assign(L, { x: 210, dir: -1, state: 'patrol', t: 0, lower: 0,
                         vx: 0, yy: 0, vy: 0 });
    },
    update(dt) {
      say('p2', "A beast barred the path — sleek, patient, hungry. It struck at anything standing tall.");
      L.t += dt;
      const standing = !player.crouch;
      if (L.state === 'patrol') {
        L.lower = Math.max(0, L.lower - dt * 3);
        L.x += L.dir * 20 * dt;
        if (L.x < 188) L.dir = 1;
        if (L.x > 234) L.dir = -1;
        L.moving = true;
        if (player.x > TRIG && standing) { L.state = 'telegraph'; L.t = 0; }
        // walking into the beast is death regardless
        if (Math.abs(player.x - L.x) < 13) kill('leopard');
      } else if (L.state === 'telegraph') {
        L.moving = false;
        L.dir = player.x < L.x ? -1 : 1;
        L.lower = Math.min(1, L.lower + dt * 4);      // shoulder drop
        if (L.t > 0.45) {
          L.state = 'lunge'; L.t = 0;
          L.vx = (player.x < L.x ? -1 : 1) * 300;
          L.vy = -95; L.yy = 0;
        }
      } else if (L.state === 'lunge') {
        L.moving = false;
        L.x += L.vx * dt;
        L.vy += 420 * dt; L.yy += L.vy * dt;
        if (L.yy > 0) { L.yy = 0; L.state = 'recover'; L.t = 0; }
        // the lunge kills standing prey only — it sails over a crouched man
        if (Math.abs(player.x - L.x) < 11 && !player.crouch && L.yy > -14)
          kill('leopard');
      } else if (L.state === 'recover') {
        L.moving = false;
        L.lower = 0;
        if (L.t > 0.9) L.state = 'patrol';
      }
      // the low gate rail: standing men are stopped
      if (!player.crouch && player.on) {
        if (player.x > RAIL_X0 - 6 && player.x < RAIL_X1 && player.vx > 0 &&
            player.maxX < RAIL_X0) player.x = Math.min(player.x, RAIL_X0 - 6);
        if (player.x > RAIL_X0 - 6 && player.x < RAIL_X1 &&
            player.y > GROUND - 1 && player.maxX >= RAIL_X0 - 6 &&
            player.x < RAIL_X1) {
          // stood up under the rail: bounced back down
          player.crouch = true;
        }
      }
      if (player.x >= w - 7) nextScene();
    },
    draw(c) {
      vgrad(c, 0, 0, w, 118, '#060B07', '#121A11');
      vgrad(c, 0, 118, w, 62, '#0F160E', '#0B100A');
      groundBand(c, w, '#2B2214', '#A8B060');
      // funneling hedges at the flanks
      ell(c, 6, 136, 42, 36, '#060B06');
      ell(c, 62, 146, 30, 18, '#070C07');
      treeSil(c, 302, GROUND, 66, '#060B06');
      // failing lamp — lit, but it drops out
      const fl = Math.sin(T * 13) > -0.78 ? 0.8 : 0.05;
      lamp(c, 160, GROUND, fl);
      // the fence and its low gate
      for (let x = 180; x < w; x += 16) box(c, x, 120, 1.6, 30, '#0A0F0A');
      box(c, 180, 124, w - 180, 1.6, '#0A0F0A');
      box(c, RAIL_X0, 136, RAIL_X1 - RAIL_X0, 2.4, '#11170F'); // the rail
      box(c, RAIL_X0 - 1.6, 124, 2.2, 26, '#11170F');
      box(c, RAIL_X1 - 0.6, 124, 2.2, 26, '#11170F');
      // the leopard
      beast(c, L.x, GROUND + L.yy, {
        len: 30, ht: 11, legH: 9, facing: L.dir, col: '#040706',
        phase: T * 9, lower: L.lower, moving: L.moving,
      });
      // eyes catch the dark
      c.globalAlpha = 0.5 + 0.5 * Math.sin(T * 2.2);
      glowCircle(c, L.x + L.dir * 16, GROUND + L.yy - 14, 7, AMBER, 0.35);
      c.globalAlpha = 1;
    },
  };
}

// P3 — The Lion (chase)
function makeChase() {
  const w = 640;
  const GAP0 = 300, GAP1 = 345, BOUGH = 484;
  const lion = { x: -60, on: false };
  return {
    w, name: 'chase', entry: 10, slide: true, lion,
    inGap: x => x > GAP0 + 4 && x < GAP1 - 4,
    reset() {
      resetPlayer(this.entry);
      lion.x = -60; lion.on = false; this.t0 = 0;
    },
    update(dt) {
      say('p3', "Then a lion — and it was hunting me. I ran.");
      this.t0 = (this.t0 || 0) + dt;
      if (this.t0 > 0.9) lion.on = true;
      if (lion.on) {
        let sp = 80;
        if (lion.x < player.x - 130) sp = 108;      // rubber band
        if (this.inGap(lion.x + 14)) { /* the lion clears it, always */ }
        lion.x += sp * dt;
        if (lion.x > player.x - 9 && Math.abs(player.y - GROUND) < 24)
          kill('lion');
      }
      // the pit
      if (player.y > GROUND + 22) kill('fall');
      // the bough: standing men stumble — and hear and see it
      if (!player.crouch && player.on && player.stun <= 0 &&
          player.x > BOUGH - 6 && player.x < BOUGH + 6) {
        player.stun = 0.75; player.x = BOUGH - 7;
        sfx.bump();
        fx.push({ x: BOUGH - 5, y: GROUND - 14, t: 0, kind: 'dust' });
        fx.push({ x: BOUGH - 9, y: GROUND, t: 0, kind: 'dust' });
      }
      if (player.x >= w - 8) nextScene();
    },
    draw(c) {
      vgrad(c, 0, 0, w, 118, '#060A07', '#10170e');
      // long service wall
      box(c, 0, 74, w, 46, '#0B120C');
      for (let x = 0; x < w; x += 46) box(c, x, 74, 1.4, 46, '#080E09');
      for (let x = 20; x < w; x += 120)
        ell(c, x, 96, 14, 8, '#070D08');             // stains
      vgrad(c, 0, 118, w, 62, '#0E150D', '#0A0f09');
      groundBand(c, w, '#2B2214', '#A8B060');
      // collapsed fence + pit
      box(c, GAP0 - 1, GROUND - 1, GAP1 - GAP0 + 2, 31, '#010302');
      poly(c, [[GAP0 - 12, GROUND], [GAP0, GROUND], [GAP0 - 3, GROUND + 6],
               [GAP0 - 14, GROUND + 4]], '#0A0F0A');
      poly(c, [[GAP1, GROUND], [GAP1 + 10, GROUND], [GAP1 + 14, GROUND + 5],
               [GAP1 + 3, GROUND + 6]], '#0A0F0A');
      for (let x = 40; x < w; x += 90) {
        if (x > GAP0 - 30 && x < GAP1 + 10) continue;
        box(c, x, 122, 1.6, 28, '#0A0F0A');
      }
      // the leaning tree and its low bough — pale wood, lamplit, with
      // moss that shows exactly how low you must go
      lamp(c, 200, GROUND); lamp(c, 452, GROUND);
      treeSil(c, BOUGH + 26, GROUND, 84, '#081007');
      c.save(); c.translate(BOUGH + 18, GROUND - 56); c.rotate(0.5);
      box(c, -52, 0, 52, 4, '#3A3020'); c.restore();
      box(c, BOUGH - 14, 132, 32, 3.6, '#4A3D26');   // the bough itself
      box(c, BOUGH - 14, 131.4, 32, 1.2, '#8A7A50');
      for (let mx = BOUGH - 11; mx < BOUGH + 16; mx += 7) {
        const sw2 = Math.sin(T * 2.4 + mx) * 1.4;
        box(c, mx + sw2, 135.4, 1, 5 + (mx % 3), '#26331C');
      }
      // the lion
      if (lion.on) {
        beast(c, lion.x, GROUND, {
          len: 42, ht: 16, legH: 12, facing: 1, col: '#050806',
          phase: T * 14, moving: true, mane: true,
        });
        glowCircle(c, lion.x + 24, GROUND - 22, 8, AMBER, 0.3);
      }
    },
  };
}

// P4 — The She-Wolf
function makeWolf() {
  const w = 320;
  const GRATE0 = 188, GRATE1 = 214;
  const wolf = { x: 276, idle: 0 };
  return {
    w, name: 'wolf', entry: 10, slide: false, wolf,
    reset() {
      resetPlayer(this.entry);
      wolf.x = 276; wolf.idle = 0; wolf.snarl = false;
      this.creaked = false; this.growled = false;
    },
    update(dt) {
      say('p4', "Last came a starving she-wolf, matching me step for step. There was no way past her — only the broken grate, and whatever lay below.");
      // she advances as you do — but never past her line beyond the grate,
      // so the grate itself is always safe ground
      const press = Math.max(0, player.maxX - 46);
      wolf.x = Math.min(wolf.x, Math.max(246, 276 - press * 0.22));
      const moving = Math.abs(player.vx) > 1;
      wolf.idle = moving ? 0 : wolf.idle + dt;
      if (wolf.idle > 5 && wolf.x > 238) wolf.x -= 7 * dt;   // patience, floored
      const gap = wolf.x - player.x;
      wolf.snarl = gap < 36;                        // the warning before the bite
      if (wolf.snarl && !this.growled) {
        this.growled = true;
        tone(95, 55, 0.4, 'sawtooth', 0.1);
      }
      if (gap > 44) this.growled = false;
      if (gap < 16) kill('wolf');
      // the grate: it creaks underfoot, and the way down shows itself
      const onGrate = player.on && player.x > GRATE0 + 2 && player.x < GRATE1;
      if (onGrate && !this.creaked) { this.creaked = true; sfx.clunk(); }
      if (!onGrate) this.creaked = false;
      this.onGrate = onGrate;
      if (onGrate && down() && player.maxX > 60) {
        mode = 'drop'; modeT = 0; sfx.rumble();
      }
    },
    draw(c) {
      vgrad(c, 0, 0, w, 118, '#040705', '#0D130C');
      // the shuttered station, right — home, closed
      box(c, 232, 52, 88, 98, '#0B0F0B');
      vgrad(c, 232, 52, 88, 30, '#0D110C', '#0B0F0B');
      // arch, boarded
      c.beginPath(); c.arc(276, 118, 26, Math.PI, 0); c.lineTo(302, GROUND);
      c.lineTo(250, GROUND); c.closePath(); c.fillStyle = '#060906'; c.fill();
      for (let i = 0; i < 4; i++) {
        c.save(); c.translate(276, 108 + i * 10); c.rotate(i % 2 ? 0.08 : -0.1);
        box(c, -25, 0, 50, 3, '#0E120D'); c.restore();
      }
      box(c, 244, 60, 64, 12, '#080C08');            // dead sign box
      vgrad(c, 0, 118, w, 62, '#0E140D', '#0A0F09');
      groundBand(c, w, '#2B2214', '#A8B060');
      treeSil(c, 30, GROUND, 62, '#070C07');
      lamp(c, 120, GROUND);
      // the grate — and the warm light from below, breathing
      glowCircle(c, (GRATE0 + GRATE1) / 2, GROUND + 6, 26, ROSE,
                 0.22 + 0.08 * Math.sin(T * 2));
      box(c, GRATE0, GROUND - 1, GRATE1 - GRATE0, 4, '#020403');
      for (let x = GRATE0 + 3; x < GRATE1 - 2; x += 5)
        box(c, x, GROUND - 1, 1.6, 4, '#101510');
      box(c, GRATE0 + 8, GROUND - 1, 8, 4, '#020403'); // bars broken here
      // standing on it, the way down shows itself
      if (this.onGrate) {
        const gy = GROUND - 26 + Math.sin(T * 4) * 2;
        c.globalAlpha = 0.55 + 0.3 * Math.sin(T * 4);
        poly(c, [[197, gy], [205, gy], [201, gy + 5]], '#EFE3C0');
        glowCircle(c, 201, gy + 2, 8, 'rgba(239,227,192,A)', 0.3);
        c.globalAlpha = 1;
      }
      // the she-wolf — head drops and eyes flare when you're too close
      beast(c, wolf.x, GROUND, {
        len: 34, ht: 12, legH: 11, facing: -1, col: '#040605',
        phase: T * 6, moving: false, gaunt: true,
        lower: wolf.snarl ? 0.5 : 0,
      });
      c.globalAlpha = wolf.snarl ? 1 : 0.6 + 0.4 * Math.sin(T * 3.1);
      glowCircle(c, wolf.x - 19, GROUND - (wolf.snarl ? 12 : 17),
                 wolf.snarl ? 10 : 7, AMBER, wolf.snarl ? 0.6 : 0.4);
      c.globalAlpha = 1;
      if (wolf.snarl)                              // paws scrape the ground
        fxDustHint(c, wolf.x - 26, GROUND);
    },
  };
}

// P5 — The Dark Ticket Hall: Virgil, and the gun
function makeHall() {
  const w = 640;
  const v = { x: 150, phase: 0, moving: false, facing: 1 };
  return {
    w, name: 'hall', entry: 16, slide: true, shades: [], v,
    reset() {
      resetPlayer(this.entry); clearCombat();
      this.shades.length = 0; this.wave = false; this.doorOpen = false;
      v.x = 150;
    },
    update(dt) {
      say('p5', "I fell into a dark older than the city. And someone was waiting for me.");
      if (player.x > 64)
        say('virgil', "He said his name was Virgil — a poet, dead two thousand years, sent to guide me down through Hell itself. His lamp held the dark back. I followed.");
      // Virgil leads, lamp in hand, to the far door
      const tv = this.wave ? 505 : Math.min(505, player.x + 52);
      const dv = tv - v.x;
      v.moving = Math.abs(dv) > 2;
      if (v.moving) v.facing = dv >= 0 ? 1 : -1;
      v.x += Math.max(-46 * dt, Math.min(46 * dt, dv));
      v.phase += v.moving ? dt * 10 : 0;
      // the kiosk: a transit-police sidearm, holstered forever
      if (!player.gunHas && player.x > 344) {
        player.gunHas = true;
        fx.push({ x: 352, y: GROUND - 16, t: 0, kind: 'hit' });
        say('gun', "A watchman's pistol, still in its kiosk. Its owner would not be needing it. Tap to fire; hold to raise a shield.");
      }
      // Virgil kneels at the lock; the dark comes loose
      if (!this.wave && player.x > 430) {
        this.wave = true;
        say('shades', "The restless dead came for the light. They fall to a single shot — if you are quick.");
        this.shades.push({ x: 620, state: 'lurk' }, { x: 566, state: 'lurk' },
                         { x: 176, state: 'lurk' });
      }
      updateShades(this, dt);
      if (this.wave && !this.doorOpen && this.shades.every(s => s.dead)) {
        this.doorOpen = true; sfx.clunk();
      }
      if (!this.doorOpen) player.x = Math.min(player.x, 592);
      else if (player.x >= w - 8) nextScene();
    },
    draw(c) {
      vgrad(c, 0, 0, w, 120, '#0A0D12', '#161B24');
      vgrad(c, 0, 120, w, 60, '#12161E', '#0C0F15');
      groundBand(c, w, '#1E2531', '#8FA3BC');
      for (let x = 40; x < w; x += 96) {           // columns
        box(c, x, 24, 9, GROUND - 24, '#0B0F14');
        box(c, x - 2, 24, 13, 5, '#0B0F14');
      }
      for (const bx of [128, 262]) {               // dead ticket booths
        box(c, bx, 108, 40, 42, '#0C1017');
        box(c, bx + 5, 114, 30, 14, '#080B10');
      }
      // toppled turnstile
      c.save(); c.translate(210, GROUND - 3); c.rotate(1.25);
      box(c, -2, -12, 4, 14, '#151A22'); c.restore();
      // the kiosk and the sidearm
      box(c, 340, 104, 26, 46, '#0D1119');
      box(c, 344, 110, 18, 12, '#090C11');
      if (!player.gunHas) {
        const p = 0.4 + 0.3 * Math.sin(T * 4);
        glowCircle(c, 353, GROUND - 12, 9, 'rgba(143,224,206,A)', p);
        box(c, 350, GROUND - 13, 5, 1.8, '#11151C');
      }
      // the far door
      box(c, 598, 92, 20, GROUND - 92, '#0A0D12');
      if (this.doorOpen) {
        vgrad(c, 604, 92, 12, GROUND - 92, '#3D4A44', '#141A18');
        glowCircle(c, 612, 124, 26, 'rgba(143,224,206,A)', 0.16);
      }
      drawVirgil(c, v.x, GROUND, {
        facing: v.facing, phase: v.phase, moving: v.moving,
        lampA: this.wave ? 0.1 : 0.24,
      });
      this.shades.forEach((sh, i) => drawShade(c, sh, i));
    },
  };
}

// P6 — THE GATE OF HELL: the inscription, and stones that warn before
// they fall. The first stone falls harmlessly ahead — teach, then test.
function makeGate() {
  const w = 480;
  const drops = [{ x: 200, cyc: 3.2, off: 1.6 }, { x: 272, cyc: 3.6, off: 0.4 },
                 { x: 330, cyc: 3.0, off: 1.9 }];
  return {
    w, name: 'gate', entry: 12, title: 'THE GATE',
    reset() { resetPlayer(this.entry); clearCombat(); this.t = 0; },
    ph(d) { return (this.t + d.off) % d.cyc; },
    update(dt) {
      say('pgate', "We came to a gate as tall as the dark itself, and words burned above it: abandon all hope, you who enter here. The stones of it were still falling. Their shadows warned us where.");
      this.t += dt;
      for (const d of drops) {
        const p = this.ph(d);
        // lethal only near the floor — matching exactly what the eye sees
        if (p > d.cyc - 0.35 && (p - (d.cyc - 0.35)) / 0.35 > 0.55 &&
            Math.abs(player.x - d.x) < 8 && player.y > GROUND - 26)
          kill('stone');
      }
      if (player.x >= w - 14) nextScene();
    },
    draw(c) {
      vgrad(c, 0, 0, w, 150, '#060510', '#191524');
      // the wall, colossal — its top beyond the sky
      box(c, 0, 0, w, 64, '#070609');
      vgrad(c, 0, 64, w, 26, '#070609', 'rgba(7,6,9,0)');
      // masonry: courses and staggered blocks
      for (let y = 6; y < 62; y += 14) {
        box(c, 0, y, w, 1, '#100D18');
        for (let x = (y % 28 ? 0 : 30); x < w; x += 60)
          box(c, x, y, 1, 14, '#100D18');
      }
      // buttresses marching to the door
      for (const bx of [40, 130, 226, 310]) {
        vgrad(c, bx, 0, 14, GROUND, '#0B0912', '#141020');
        box(c, bx - 2, 58, 18, 5, '#0B0912');
        box(c, bx + 2, 64, 10, GROUND - 64, '#0E0B16');
      }
      // chains that once held something
      cable(c, 88, 150, 66, 12, '#0B0912');
      cable(c, 238, 296, 60, 15, '#0B0912');
      // the door's rose light stains the flagstones all the way out
      glowCircle(c, 300, GROUND + 4, 90, ROSE, 0.06);
      // the doorway into the dark
      const dx0 = 356, dw = 86;
      c.beginPath(); c.arc(dx0 + dw / 2, 128, dw / 2, Math.PI, 0);
      c.lineTo(dx0 + dw, GROUND); c.lineTo(dx0, GROUND); c.closePath();
      c.fillStyle = '#030207'; c.fill();
      glowCircle(c, dx0 + dw / 2, 132, 44, ROSE, 0.14);
      // embers rising out of it
      for (let i = 0; i < 14; i++) {
        const ep = (T * 26 + i * 31) % 90;
        c.globalAlpha = 0.55 * (1 - ep / 90);
        box(c, dx0 + 10 + (i * 17) % 66, GROUND - ep, 1, 1.4, '#C4788A');
        c.globalAlpha = 1;
      }
      // the inscription — it flares legible, then dims to a scar
      const flare = Math.max(0, Math.sin(T * 0.5) - 0.82) / 0.18;
      c.globalAlpha = 0.18 + 0.82 * flare;
      c.fillStyle = flare > 0.4 ? '#E8A33D' : '#4A3A2A';
      c.font = '600 8px Georgia, serif'; c.textAlign = 'center';
      c.fillText('A B A N D O N   A L L   H O P E', dx0 + dw / 2, 74);
      c.fillText('Y O U   W H O   E N T E R   H E R E', dx0 + dw / 2, 86);
      c.globalAlpha = 1;
      groundBand(c, w, '#211D2B', '#9C93B8');
      // rubble of stones already fallen
      for (const [bx, bw2] of [[64, 10], [130, 8], [246, 12], [304, 9]])
        poly(c, [[bx, GROUND], [bx + bw2, GROUND], [bx + bw2 - 2, GROUND - 6],
                 [bx + 2, GROUND - 5]], '#201C2A');
      // the falling stones: growing shadow, trembling block, then the drop
      for (const d of drops) {
        const p = this.ph(d);
        const warn = p > d.cyc - 1.05 && p <= d.cyc - 0.35;
        const fall = p > d.cyc - 0.35;
        if (warn) {
          const a = (p - (d.cyc - 1.05)) / 0.7;
          c.globalAlpha = 0.25 + 0.5 * a;
          ell(c, d.x, GROUND + 1, 2 + 7 * a, 1.6, '#000');
          c.globalAlpha = 0.4 + 0.4 * Math.sin(T * 22);
          box(c, d.x - 2 + Math.sin(T * 40) * 0.7, 62, 4, 4, '#8A8578');
          c.globalAlpha = 1;
        }
        if (fall) {
          const fp = (p - (d.cyc - 0.35)) / 0.35;
          const fy = 64 + fp * fp * (GROUND - 72);
          c.globalAlpha = 0.3;                     // motion streak
          box(c, d.x - 2.4, fy - 14, 4.8, 14, '#3A3450');
          c.globalAlpha = 1;
          box(c, d.x - 4, fy, 8, 8, '#3A3450');
          box(c, d.x - 4, fy, 8, 2, '#4A4462');
          if (fp > 0.94)
            for (let k = 0; k < 3; k++)
              box(c, d.x - 6 + k * 5, GROUND - 2, 2, 2, '#3A3450');
        }
      }
      // Virgil at the threshold, lamp up, waiting
      drawVirgil(c, dx0 - 14, GROUND, { facing: 1, lampA: 0.2 });
    },
  };
}

// P7 — The Vestibule: the futile, a demon of the door, a gate for the blast
function makeVestibule() {
  const w = 640;
  const demon = { x: 412, hp: 3, state: 'idle', t: 0, n: 0, dead: false };
  return {
    w, name: 'vestibule', entry: 14, slide: true, shades: [], demon,
    gate: { x: 574, broken: false },
    reset() {
      resetPlayer(this.entry); clearCombat();
      this.shades.length = 0; this.spawned = false;
      Object.assign(demon, { hp: 3, state: 'idle', t: 0, n: 0, dead: false });
      this.gate.broken = false;
    },
    update(dt) {
      say('p6', "Virgil called this the Vestibule. These souls chose nothing in life — now they chase a blank banner, forever.");
      if (!this.spawned && player.x > 110) {
        this.spawned = true;
        this.shades.push({ x: 290, state: 'lurk' }, { x: 350, state: 'lurk' });
      }
      updateShades(this, dt);
      if (!demon.dead) {
        if (demon.state === 'idle' && player.x > demon.x - 150) {
          demon.state = 'aim'; demon.t = 0;
          say('demon', "A demon held the way. Virgil warned me: its kind must pause for breath after every volley. Shield its fire — strike its opening.");
        }
        if (demon.state !== 'idle') updateDemon(demon, dt);
      } else {
        say('gate', "Beyond it, a gate rusted shut. Hold the trigger until the charge sings, and let go.");
      }
      if (!this.gate.broken) player.x = Math.min(player.x, this.gate.x - 10);
      else if (player.x >= w - 8) nextScene();
    },
    draw(c) {
      vgrad(c, 0, 0, w, 120, '#0B0E14', '#181D28');
      vgrad(c, 0, 120, w, 60, '#131720', '#0D1016');
      groundBand(c, w, '#1E2531', '#8FA3BC');
      for (let x = 20; x < w; x += 110)
        box(c, x, 30, 8, GROUND - 30, '#0C0F16');
      // the futile, chasing the blank banner forever, high on the mezzanine
      const oy = 56, ox = 250;
      for (let i = 0; i < 8; i++) {
        const a = T * 0.9 + i * Math.PI / 4;
        const sx = ox + Math.cos(a) * 128, sy = oy + Math.sin(a) * 13;
        c.globalAlpha = 0.5 + 0.3 * Math.sin(a);
        figure(c, sx, sy + 14, 15, '#232833', {
          skin: '#232833', hair: '#232833',
          legPhase: T * 12 + i, moving: true,
          facing: Math.cos(a + Math.PI / 2) >= 0 ? 1 : -1,
        });
        c.globalAlpha = 1;
      }
      const ba = T * 0.9 - 0.5;                    // the banner leads them
      c.save();
      c.translate(ox + Math.cos(ba) * 128, oy + Math.sin(ba) * 13 + 4);
      c.rotate(Math.sin(T * 2) * 0.3);
      box(c, -6, -3, 12, 6, '#2E3542'); c.restore();
      // the demon of the door
      drawDemon(c, demon);
      // the rusted gate
      const g = this.gate;
      box(c, g.x - 3, 84, 26, 6, '#1A1712');
      if (!g.broken) {
        for (let i = 0; i < 5; i++)
          box(c, g.x + i * 4.6, 88, 2.2, GROUND - 88, '#221D15');
        box(c, g.x - 2, 112, 24, 3, '#1A1712');
      } else {
        for (let i = 0; i < 5; i++) {
          const bend = (i % 2 ? 1 : -1) * (5 + i * 2);
          c.save(); c.translate(g.x + i * 4.6, GROUND);
          c.rotate(bend * 0.05);
          box(c, 0, -(20 + i * 4), 2.2, 20 + i * 4, '#221D15');
          c.restore();
        }
        glowCircle(c, g.x + 10, 120, 20, 'rgba(143,224,206,A)', 0.12);
      }
      this.shades.forEach((sh, i) => drawShade(c, sh, i));
    },
  };
}

// P7 — The Acheron: Charon refuses, Virgil's ticket, the crossing
function makeAcheron() {
  const w = 560;
  const car = { x: 210, moving: false };
  return {
    w, name: 'acheron', entry: 12, slide: false, hands: [], car,
    quake: 0,
    reset() {
      resetPlayer(this.entry); clearCombat();
      this.hands.length = 0; this.phase = 'approach'; this.pt = 0;
      car.x = 210; car.moving = false;
      this.h1 = false; this.h2 = false; this.quake = 0;
    },
    update(dt) {
      say('p7', "We came to a black river underground. Virgil named it: the Acheron — the border of Hell.");
      this.pt += dt;
      const a = car.x - 30, b = car.x + 30;
      if (this.phase === 'approach') {
        if (player.x >= a - 8) {
          this.phase = 'refusal'; this.pt = 0; player.stun = 2.6;
          say('charon', "The ferryman was Charon, and he carries only the dead. He refused me — until Virgil showed a ticket that cannot be refused.");
        }
        player.x = Math.min(player.x, a - 8);
      } else if (this.phase === 'refusal') {
        if (!this.punched && this.pt > 1.3) {        // Virgil's leitmotif
          this.punched = true; sfx.punch();
        }
        if (this.pt > 2.6) this.phase = 'cross';
      } else if (this.phase === 'cross') {
        if (!car.moving && player.on && player.x > a + 4) car.moving = true;
        if (car.moving) {
          const vx = 15 * dt;
          car.x += vx;
          player.x += vx;
          if (player.x < a - 3 || player.x > b + 3) kill('water');
          const prog = (car.x - 210) / (452 - 210);
          if (prog > 0.3 && !this.h1) {
            this.h1 = true;
            this.hands.push({ x: car.x - 22, state: 'tele', t: 0 });
            say('hands', "The drowned do not care for passengers. Keep clear of their hands — or answer them.");
          }
          if (prog > 0.62 && !this.h2) {
            this.h2 = true;
            this.hands.push({ x: car.x + 24, state: 'tele', t: 0 });
          }
          if (car.x >= 452) { car.moving = false; this.phase = 'ashore'; }
        }
      } else if (this.phase === 'ashore') {
        if (player.x > w - 44) {
          this.phase = 'quake'; this.pt = 0; player.stun = 3;
          sfx.rumble();
          say('quake', "On the far shore the earth shook, and a red light rose from the deep. Limbo — the first circle — was waiting.");
        }
      } else if (this.phase === 'quake') {
        this.quake = Math.min(1, this.pt / 0.4);
        if (this.pt > 2.1) nextScene();              // into Limbo itself
      }
      for (const hd of this.hands) {
        if (hd.state === 'gone') continue;
        hd.t += dt;
        if (car.moving) hd.x += 15 * dt;
        if (hd.state === 'tele' && hd.t > 0.7) { hd.state = 'up'; hd.t = 0; }
        else if (hd.state === 'up') {
          if (Math.abs(player.x - hd.x) < 7) kill('drowned');
          if (hd.t > 2.4) hd.state = 'gone';
        }
      }
    },
    draw(c) {
      vgrad(c, 0, 0, w, 118, '#05080A', '#0E1418');
      for (let x = 30; x < w; x += 88)
        poly(c, [[x, 20], [x + 9, 20], [x + 7, 118], [x - 2, 118]], '#0A0F12');
      // the water
      vgrad(c, 0, GROUND + 4, w, 26, '#060D10', '#03080A');
      for (let i = 0; i < 24; i++) {
        const rx = (i * 53 + Math.sin(T * 0.8 + i) * 8) % w;
        box(c, rx, GROUND + 7 + (i * 17) % 18, 8 + (i % 3) * 4, 0.8, '#123034');
      }
      // slow bubbles from what lies under the water
      for (let i = 0; i < 8; i++) {
        const bp = (T * 0.4 + i * 0.71) % 1;
        c.globalAlpha = 0.4 * (1 - bp);
        ell(c, (i * 73 + 30) % w, GROUND + 22 - bp * 14, 1 + bp, 1 + bp,
            '#1B4A44');
        c.globalAlpha = 1;
      }
      // the pier
      box(c, 0, GROUND, 214, 8, '#1A2228');
      box(c, 0, GROUND - 0.6, 214, 1.8, '#7FA0AB');
      for (let x = 10; x < 210; x += 24) box(c, x, GROUND + 8, 3, 22, '#090D10');
      // far shore
      box(c, 448, GROUND, w - 448, 8, '#1A2228');
      box(c, 448, GROUND - 0.6, w - 448, 1.8, '#7FA0AB');
      // the deep tunnel, right — where the red light will come from
      poly(c, [[520, 60], [560, 52], [560, GROUND], [508, GROUND]], '#040608');
      if (this.phase === 'quake' || this.quake > 0) {
        glowCircle(c, 546, 120, 60, 'rgba(179,58,38,A)', 0.5 * this.quake);
      }
      // the flat-car
      box(c, car.x - 30, GROUND - 1, 60, 6, '#0F1315');
      box(c, car.x - 30, GROUND + 5, 60, 3, '#080B0D');
      box(c, car.x - 29, GROUND - 6, 2, 5, '#1A2124');
      box(c, car.x + 27, GROUND - 6, 2, 5, '#1A2124');
      // CHARON
      const cx = car.x + 20;
      const shake = this.phase === 'refusal' && this.pt < 1.4
                    ? Math.sin(this.pt * 18) * 1.6 : 0;
      poly(c, [[cx - 3, GROUND - 34], [cx + 4, GROUND - 34],
               [cx + 8, GROUND - 10], [cx + 11, GROUND - 1],
               [cx - 9, GROUND - 1], [cx - 5, GROUND - 12]], '#060A0B');
      poly(c, [[cx - 6 + shake, GROUND - 34], [cx + 7 + shake, GROUND - 34],
               [cx + 4 + shake, GROUND - 38], [cx - 2 + shake, GROUND - 38]],
           '#060A0B');
      c.fillStyle = '#E8A33D';
      c.fillRect(cx - 1 + shake, GROUND - 36.5, 1.2, 1.2);
      c.fillRect(cx + 2 + shake, GROUND - 36.5, 1.2, 1.2);
      c.strokeStyle = '#040708';
      c.lineWidth = 1.4; c.beginPath();
      c.moveTo(cx + 6, GROUND - 28);
      c.lineTo(cx + 14 + Math.sin(T * 0.7) * 2, GROUND + 24);
      c.stroke();
      // Virgil — beside you to the pier, aboard for the crossing
      const vOn = this.phase !== 'approach';
      const vx = vOn ? car.x - 20
                     : Math.min(player.x - 18, 170);
      drawVirgil(c, Math.max(24, vx), GROUND, {
        facing: 1, lampA: 0.18,
        moving: false,
      });
      // the ticket, shown to the one who cannot refuse it
      if (this.phase === 'refusal' && this.pt > 1.3) {
        const tx = (vOn ? car.x - 20 : Math.min(player.x - 18, 170)) + 7;
        box(c, tx, GROUND - 20, 3.4, 2.2, '#EFE3C0');
        glowCircle(c, tx + 1.5, GROUND - 19, 7, AMBER, 0.5);
      }
      // the drowned, grabbing at the deck
      for (const hd of this.hands) {
        if (hd.state === 'gone') continue;
        if (hd.state === 'tele') {
          const p = hd.t / 0.7;
          c.globalAlpha = 0.6 - 0.3 * p;
          c.strokeStyle = '#1B4A44'; c.lineWidth = 0.8;
          c.beginPath();
          c.ellipse(hd.x, GROUND + 6, 4 + 6 * p, 1.4 + 1.6 * p, 0, 0, 7);
          c.stroke();
          c.globalAlpha = 1;
        } else {
          const up = Math.min(1, hd.t / 0.35);
          poly(c, [[hd.x - 2, GROUND + 6], [hd.x - 1, GROUND + 6 - 14 * up],
                   [hd.x + 1.6, GROUND + 6 - 15 * up], [hd.x + 2.4, GROUND + 6]],
               '#10151A');
          if (up >= 1) {
            for (let f = 0; f < 3; f++)
              box(c, hd.x - 2 + f * 1.6, GROUND - 9.4,
                  0.9, 2.6 + Math.sin(T * 6 + f) * 0.5, '#10151A');
          }
        }
      }
    },
  };
}

// ============================ THE NINE CIRCLES ============================

// Circle 1 — LIMBO: the terminus; crowds surge when a ghost train arrives;
// Minos judges at the exit, his tail the barrier
function makeLimbo() {
  const w = 760;
  const clusters = [{ x: 150, w: 44 }, { x: 300, w: 50 }, { x: 452, w: 44 }];
  const PIVOT = 702;
  return {
    w, name: 'limbo', entry: 12, title: 'LIMBO',
    plats: [{ x0: 146, x1: 192, y: GROUND - 15 }],   // abandoned luggage
    reset() { resetPlayer(this.entry); clearCombat(); this.t = 0; },
    update(dt) {
      say('c1', "Limbo — the first circle. These souls did no wrong; they only lived without the light. When a train pretends to arrive, the crowd surges. Slip through behind them.");
      if (player.x > 540)
        say('c1b', "Past the crowds, the great pagans rest in a lounge of green glass — Homer, Plato, the poets. Virgil is welcomed there as an equal. And at the very end waits Minos, the judge. His tail is the barrier. Cross while it is raised.");
      this.t += dt;
      this.surge = (this.t % 7) > 4.6;
      if (!this.surge && player.y >= GROUND - 1) for (const cl of clusters) {
        if (player.x > cl.x - 8 && player.x < cl.x + cl.w + 8)
          player.x = player.x < cl.x + cl.w / 2 ? cl.x - 8 : cl.x + cl.w + 8;
      }
      // Minos: his tail sweeps the exit, and warns before it falls
      const ph = this.t % 3.4;
      this.tailDown = ph < 2.05;
      this.tailWarn = ph > 2.95;                     // blink before the slam
      if (this.tailDown && player.x > PIVOT - 8 && player.x < PIVOT + 10)
        kill('minos');
      if (player.x >= w - 8) nextScene();
    },
    draw(c) {
      vgrad(c, 0, 0, w, 60, '#40100A', '#6B2013');
      vgrad(c, 0, 60, w, 44, '#27717C', '#1D5660');       // the ghost train
      box(c, 0, 60, w, 4, '#194C54');
      for (let x = 8; x < w; x += 56) rbox(c, x, 68, 24, 16, 2, '#E8D9A0');
      box(c, 0, 104, w, 6, '#0F2A30');
      vgrad(c, 0, 110, w, 40, '#9A3220', '#792415');
      box(c, 0, 110, w, 2, '#D9C8A0');
      groundBand(c, w, '#4A140B', '#E8D9A0');
      // the luggage pile — a way over the first crowd, if you jump
      const lp = this.plats[0];
      box(c, lp.x0 + 4, GROUND - 10, 16, 10, '#6E4A2B');
      box(c, lp.x0 + 22, GROUND - 9, 14, 9, '#4A3B58');
      box(c, lp.x0 + 8, lp.y + 1.5, 26, 6, '#8C5A2B');
      platBand(c, lp, '#6E4A2B', '#E8D9A0');
      const coats = ['#5C4632', '#4A3B58', '#7A2E2E', '#2E5C4A', '#8C8C94'];
      clusters.forEach((cl, ci) => {
        for (let i = 0; i < Math.floor(cl.w / 11); i++)
          figure(c, cl.x + 6 + i * 11, GROUND - (this.surge ? 3 : 0),
                 20 + ((i + ci) % 3) * 2, coats[(i + ci) % coats.length],
                 { face: false });
      });
      // the First-Class Lounge — green glass, gold light, the great pagans
      box(c, 540, 78, 128, GROUND - 78, '#12332B');
      vgrad(c, 544, 82, 120, GROUND - 84, 'rgba(88,140,96,0.35)',
            'rgba(30,60,42,0.15)');
      for (let gx = 556; gx < 660; gx += 26)
        box(c, gx, 82, 1.6, GROUND - 84, '#0C241E');
      glowCircle(c, 604, 116, 44, 'rgba(201,178,107,A)', 0.16);
      box(c, 552, GROUND - 10, 30, 2.4, '#0C241E');        // benches
      box(c, 622, GROUND - 10, 30, 2.4, '#0C241E');
      const pagans = [[566, 22, '#3A4A38'], [590, 24, '#4A4432'],
                      [636, 23, '#3E3A4A']];
      pagans.forEach(([px, phh, pc], i) => {
        const nod = i === 1 ? Math.sin(T * 1.1) * 0.8 : 0;
        figure(c, px, GROUND + nod * 0, phh, pc,
               { face: false, hair: '#2A2A22' });
        box(c, px - 2.6, GROUND - phh + nod, 5.2, 1.2, '#7FA05A');  // laurel
      });
      // MINOS at the exit — the inspector whose tail is the barrier
      const mx = PIVOT + 12;
      ell(c, mx + 1, GROUND + 1.6, 10, 2, 'rgba(0,0,0,0.3)');
      poly(c, [[mx - 9, GROUND], [mx - 5, GROUND - 40], [mx + 6, GROUND - 44],
               [mx + 11, GROUND], [mx + 14, GROUND + 1], [mx - 11, GROUND + 1]],
           '#2B0B06');
      ell(c, mx + 1, GROUND - 41, 5, 5.6, '#2B0B06');
      c.fillStyle = '#E8A33D';
      c.fillRect(mx - 1, GROUND - 42, 1.4, 1.4);
      c.fillRect(mx + 2.4, GROUND - 42, 1.4, 1.4);
      // the tail-arm: warns with a blink, then slams
      if (this.tailWarn) {
        glowCircle(c, PIVOT + 2, 108, 10, AMBER,
                   0.35 + 0.35 * Math.sin(T * 20));
      }
      if (this.tailDown) {
        box(c, PIVOT, 112, 4, GROUND - 112, '#2B0B06');
        for (let y = 116; y < GROUND; y += 10) box(c, PIVOT, y, 4, 4, '#B33A26');
      } else {
        box(c, PIVOT, 108, 26, 4, '#2B0B06');
        for (let x = PIVOT + 2; x < PIVOT + 24; x += 9)
          box(c, x, 108, 4, 4, '#B33A26');
      }
    },
  };
}

// Circle 2 — LUST: the gale owns your feet and your jumps
function makeLustLvl() {
  const w = 560;
  return {
    w, name: 'lust', entry: 10, title: 'LUST',
    inGap: x => (x > 150 && x < 196) || (x > 330 && x < 386),
    plats: [{ x0: 332, x1: 380, y: GROUND - 22 }],   // a duct rides the wind
    reset() { resetPlayer(this.entry); clearCombat(); this.t = 0; },
    update(dt) {
      say('c2', "The second circle: Lust. A storm that never rests. The wind owns your steps here — and your jumps. Crouch to hold your ground.");
      this.t += dt;
      this.wind = (Math.sin(this.t * 0.9) + Math.sin(this.t * 0.37 + 2)) * 30;
      player.x += this.wind * dt *
                  (player.on && player.crouch ? 0.2 : 1);
      if (player.y > GROUND + 22) kill('fall');
      if (player.x >= w - 8) nextScene();
    },
    draw(c) {
      vgrad(c, 0, 0, w, 180, '#241019', '#6B3A50');
      ell(c, 20, 80, 70, 60, '#140A10');
      ell(c, 540, 100, 70, 60, '#140A10');
      for (let i = 0; i < 8; i++) {                       // the gale, drawn —
        // its brightness IS the wind meter
        const y0 = 20 + i * 16, amp = 5 + (i % 3) * 3;
        const wA = 0.22 + Math.min(0.5, Math.abs(this.wind || 0) / 55);
        c.strokeStyle = `rgba(215,167,180,${wA})`; c.lineWidth = 0.6;
        c.beginPath();
        for (let x = 0; x < w; x += 6) {
          const y = y0 + amp * Math.sin(x / 38 + this.t * (1 + i * 0.07));
          x ? c.lineTo(x, y) : c.moveTo(x, y);
        }
        c.stroke();
      }
      for (let i = 0; i < 5; i++) {                       // souls, blown
        const sx = ((this.t * 46 + i * 130) % (w + 60)) - 30;
        const sy = 34 + 16 * Math.sin(sx / 60 + i);
        poly(c, [[sx - 8, sy + 2], [sx + 6, sy - 1], [sx + 10, sy + 1],
                 [sx + 5, sy + 4], [sx - 11, sy + 5]], '#1E1018');
      }
      // ground with two wind-cut gaps, their lips picked out in light
      for (const [x0, x1] of [[0, 150], [196, 330], [386, w]]) {
        box(c, x0, GROUND, x1 - x0, 30, '#180A10');
        box(c, x0, GROUND - 0.6, x1 - x0, 2.2, '#D9A7B4');
        if (x0 > 0) box(c, x0, GROUND, 3, 5, '#EFE3C0');
        if (x1 < w) box(c, x1 - 3, GROUND, 3, 5, '#EFE3C0');
      }
      // the hanging duct platform over the second gap, chained to the dark
      const dp = this.plats[0];
      cable(c, dp.x0 + 4, dp.x0 + 4, dp.y - 40, 0, '#140A10');
      cable(c, dp.x1 - 4, dp.x1 - 4, dp.y - 40, 0, '#140A10');
      box(c, dp.x0 + 3, dp.y - 40, 1.4, 40, '#140A10');
      box(c, dp.x1 - 5, dp.y - 40, 1.4, 40, '#140A10');
      platBand(c, dp, '#3A2531', '#D9A7B4');
      // the couple, sheltered leeward of the duct — always together
      figure(c, 526, GROUND, 18, '#3A2531', { face: false });
      figure(c, 533, GROUND, 19, '#3A2531', { face: false });
    },
  };
}

// Circle 3 — GLUTTONY: mud tax on every verb; pass each of Cerberus's
// mouths only while it sleeps
function makeGluttony() {
  const w = 560;
  const zones = [{ x0: 148, x1: 240 }, { x0: 252, x1: 344 }, { x0: 356, x1: 448 }];
  return {
    w, name: 'gluttony', entry: 10, title: 'GLUTTONY', speedMul: 0.55,
    reset() { resetPlayer(this.entry); clearCombat(); this.t = 0; },
    headAwake(i) {
      const ph = (this.t % 10.5) / 3.5;               // each sleeps in turn
      return Math.floor(ph) !== i;
    },
    headStirring(i) {
      const ph = (this.t % 10.5) / 3.5;
      return Math.floor(ph) === i && (ph % 1) > 0.82;  // about to wake
    },
    update(dt) {
      say('c3', "The third: Gluttony. Black rain, and mud that swallows every step. Cerberus guards it — three heads, and only one sleeps at a time. Pass each mouth while its eyes are dark.");
      this.t += dt;
      zones.forEach((z, i) => {
        if (this.headAwake(i) && player.x > z.x0 && player.x < z.x1)
          kill('cerberus');
      });
      if (player.x >= w - 8) nextScene();
    },
    draw(c) {
      vgrad(c, 0, 0, w, 150, '#232C18', '#3A452A');
      // black rain
      for (let i = 0; i < 60; i++) {
        const rx = (i * 47 + T * 130 * (1 + i % 3 * 0.2)) % w;
        const ry = (i * 83 + T * 260) % 150;
        c.strokeStyle = 'rgba(16,16,14,0.7)';
        c.beginPath(); c.moveTo(rx, ry); c.lineTo(rx - 1.5, ry + 7); c.stroke();
      }
      groundBand(c, w, '#241C0C', '#B0B060');           // the mire
      for (let x = 0; x < w; x += 26)
        ell(c, x + 13, GROUND + 2, 12, 2.5, '#1C160C');
      // rain striking the mud — little crowns where it lands
      for (let i = 0; i < 10; i++) {
        const sp = (T * 2.1 + i * 0.73) % 1;
        if (sp < 0.25) {
          const sx = (i * 113 + 40) % w;
          c.globalAlpha = 1 - sp * 4;
          c.strokeStyle = '#3A452A'; c.lineWidth = 0.7;
          c.beginPath();
          c.ellipse(sx, GROUND + 1, 2 + sp * 14, 0.8 + sp * 2, 0, 0, 7);
          c.stroke();
          c.globalAlpha = 1;
        }
      }
      // three tunnel mouths, a head in each
      zones.forEach((z, i) => {
        const cxm = (z.x0 + z.x1) / 2;
        c.beginPath(); c.ellipse(cxm, 118, 52, 46, 0, Math.PI, 0);
        c.fillStyle = '#151A0E'; c.fill();
        // the watched ground glows faintly amber — the exact deadly span
        if (this.headAwake(i)) {
          c.globalAlpha = 0.10 + 0.05 * Math.sin(T * 6 + i);
          box(c, z.x0, GROUND - 2, z.x1 - z.x0, 5, '#E8A33D');
          c.globalAlpha = 1;
        }
        // the head: a muzzle over the pass
        const awake = this.headAwake(i), stir = this.headStirring(i);
        poly(c, [[cxm - 16, 96], [cxm + 16, 96], [cxm + 10, 122],
                 [cxm - 10, 122]], '#0B0F07');
        ell(c, cxm, 94, 15, 12, '#0B0F07');
        poly(c, [[cxm - 12, 84], [cxm - 16, 72], [cxm - 5, 82]], '#0B0F07');
        poly(c, [[cxm + 12, 84], [cxm + 16, 72], [cxm + 5, 82]], '#0B0F07');
        if (awake || stir) {
          const gl = awake ? 0.9 : 0.35 + 0.4 * Math.sin(T * 16);
          c.globalAlpha = gl;
          c.fillStyle = '#E8A33D';
          c.fillRect(cxm - 5, 92, 2.4, 2); c.fillRect(cxm + 2.6, 92, 2.4, 2);
          c.globalAlpha = 1;
        }
      });
    },
  };
}

// Circle 4 — GREED: the hoarders' carts roll forever; jump them
function makeGreed() {
  const w = 560;
  const carts = [];
  return {
    w, name: 'greed', entry: 10, title: 'GREED', carts,
    plats: [{ x0: 268, x1: 310, y: GROUND - 13 }],   // hop the carts from here
    reset() {
      resetPlayer(this.entry); clearCombat();
      carts.length = 0; this.t = 0; this.n1 = 0; this.n2 = 0;
    },
    update(dt) {
      say('c4', "The fourth: Greed. They pushed their wealth in circles all their lives, and they have not stopped. The carts stop for no one — go over them.");
      this.t += dt;
      if (this.t > this.n1) { this.n1 = this.t + 3.1; carts.push({ x: w + 20, v: -62 }); }
      if (this.t > this.n2 + 1.4) { this.n2 = this.t + 3.8; carts.push({ x: -20, v: 58 }); }
      for (let i = carts.length; i--;) {
        const k = carts[i]; k.x += k.v * dt;
        if (k.x < -40 || k.x > w + 40) { carts.splice(i, 1); continue; }
        if (Math.abs(k.x - player.x) < 15 && player.y > GROUND - 12)
          kill('cart');
      }
      if (player.x >= w - 8) nextScene();
    },
    draw(c) {
      vgrad(c, 0, 0, w, 150, '#3A300E', '#6E5713');
      for (let x = 20; x < w; x += 90) {                  // hoard mounds
        ell(c, x + 30, 128, 42, 26, '#4A3B0F');
        speckleGold(c, x + 4, 106, 60, 24, 14, x);
      }
      groundBand(c, w, '#2A2206', '#E8C84A');
      platBand(c, this.plats[0], '#4A3B0F', '#E8C84A');   // the crate mound
      box(c, this.plats[0].x0 + 6, GROUND - 8, 10, 8, '#3A300C');
      box(c, this.plats[0].x0 + 24, GROUND - 8, 12, 8, '#3A300C');
      for (const k of carts) {
        box(c, k.x - 14, GROUND - 12, 28, 10, '#2A230C');
        box(c, k.x - 12, GROUND - 16, 24, 5, '#C9A227');
        ell(c, k.x - 8, GROUND - 1, 3.4, 3.4, '#1A1508');
        ell(c, k.x + 8, GROUND - 1, 3.4, 3.4, '#1A1508');
        // its pusher, faceless as the poem keeps them
        figure(c, k.x - Math.sign(k.v) * 19, GROUND, 19, '#4A3B0F',
               { face: false, skin: '#4A3B0F', hair: '#4A3B0F',
                 legPhase: T * 9, moving: true, facing: Math.sign(k.v) });
      }
    },
  };
}
function speckleGold(c, x, y, w2, h2, n, seed) {
  let s = seed;
  for (let i = 0; i < n; i++) {
    s = (s * 9301 + 49297) % 233280;
    const rx = x + (s / 233280) * w2;
    s = (s * 9301 + 49297) % 233280;
    box(c, rx, y + (s / 233280) * h2, 1.6, 1.2, '#E8C84A');
  }
}

// Circle 5 — WRATH: the Styx crossing, and the gate of Dis that Virgil
// cannot open — heaven's messenger walks the third rail
function makeWrath() {
  const w = 560;
  const car = { x: 100, moving: false };
  return {
    w, name: 'wrath', entry: 10, title: 'WRATH', hands: [], car, shades: [],
    reset() {
      resetPlayer(this.entry); clearCombat();
      this.hands.length = 0; this.shades.length = 0;
      car.x = 100; car.moving = false;
      this.phase = 'board'; this.pt = 0; this.hn = 0; this.msgX = -30;
    },
    update(dt) {
      say('c5', "The fifth: Wrath, and the drowned river Styx. The wrathful do not care for boats. Past the water stands the iron city of Dis — and for once, Virgil could not open the way.");
      this.pt += dt;
      const a = car.x - 28, b = car.x + 28;
      if (this.phase === 'board') {
        if (player.on && player.x > a + 4) { this.phase = 'cross'; car.moving = true; }
      } else if (this.phase === 'cross') {
        const vx = 20 * dt;
        car.x += vx; player.x += vx;
        if (player.x < a - 3 || player.x > b + 3) kill('styx');
        const prog = (car.x - 100) / (360 - 100);
        if (prog > this.hn * 0.3 + 0.15 && this.hn < 3) {
          this.hn++;
          this.hands.push({ x: car.x + (this.hn % 2 ? -20 : 22), state: 'tele', t: 0 });
        }
        if (car.x >= 360) { car.moving = false; this.phase = 'gate'; this.pt = 0;
          this.shades.push({ x: 470, state: 'lurk' }, { x: 430, state: 'lurk' });
          say('dis', "The gate of Dis stayed shut against us. We could only hold our ground — until heaven sent someone who walks where no one walks.");
        }
      } else if (this.phase === 'gate') {
        updateShades(this, dt);
        if (this.pt > 7) {
          this.msgX += 46 * dt;
          if (this.msgX > 496 && !this.opened) {
            this.opened = true; sfx.clunk();
            this.shades.forEach(s => { if (!s.dead) s.dead = 0.001; });
          }
        }
        if (this.opened && player.x >= w - 8) nextScene();
        if (!this.opened) player.x = Math.min(player.x, 492);
      }
      for (const hd of this.hands) {
        if (hd.state === 'gone') continue;
        hd.t += dt;
        if (car.moving) hd.x += 20 * dt;
        if (hd.state === 'tele' && hd.t > 0.6) { hd.state = 'up'; hd.t = 0; }
        else if (hd.state === 'up') {
          if (Math.abs(player.x - hd.x) < 7) kill('wrathful');
          if (hd.t > 1.9) hd.state = 'gone';
        }
      }
    },
    draw(c) {
      vgrad(c, 0, 0, w, 118, '#171208', '#3A2E1E');
      // Dis: iron wall, right
      vgrad(c, 500, 30, 60, 120, '#2A1D14', '#171008');
      for (let y = 40; y < 148; y += 16) box(c, 500, y, 60, 2, '#0E0906');
      box(c, 496, 96, 10, 54, this.opened ? '#3A2E1E' : '#0B0704');
      if (this.opened) glowCircle(c, 505, 122, 20, AMBER, 0.2);
      // water
      vgrad(c, 0, GROUND + 4, w, 26, '#140F06', '#0A0703');
      for (let i = 0; i < 20; i++)
        box(c, (i * 61 + T * 12 % 61) % 420, GROUND + 8 + (i * 13) % 16,
            10, 0.8, '#33270F');
      box(c, 0, GROUND, 96, 8, '#332412');               // near pier
      box(c, 0, GROUND - 0.6, 96, 1.8, '#C9A96A');
      box(c, 420, GROUND, 140, 8, '#332412');            // far shore
      box(c, 420, GROUND - 0.6, 140, 1.8, '#C9A96A');
      box(c, car.x - 28, GROUND - 1, 56, 6, '#100C06');  // the ferry
      box(c, car.x - 28, GROUND + 5, 56, 3, '#080604');
      for (const hd of this.hands) {
        if (hd.state === 'gone') continue;
        if (hd.state === 'tele') {
          c.strokeStyle = '#4A3B1E'; c.lineWidth = 0.8;
          c.beginPath();
          c.ellipse(hd.x, GROUND + 6, 4 + 6 * (hd.t / 0.6),
                    1.3 + 1.4 * (hd.t / 0.6), 0, 0, 7);
          c.stroke();
        } else {
          const up = Math.min(1, hd.t / 0.3);
          poly(c, [[hd.x - 2, GROUND + 6], [hd.x - 1, GROUND + 6 - 13 * up],
                   [hd.x + 1.6, GROUND + 6 - 14 * up], [hd.x + 2.4, GROUND + 6]],
               '#1A1208');
        }
      }
      this.shades.forEach((sh, i) => drawShade(c, sh, i));
      // heaven's messenger, when it is time
      if (this.msgX > -20) {
        glowCircle(c, this.msgX, GROUND - 12, 16, 'rgba(216,232,236,A)', 0.5);
        figure(c, this.msgX, GROUND, 24, '#D8E8EC',
               { skin: '#EFE3C0', hair: '#D8E8EC', legPhase: T * 8,
                 moving: true, face: false });
      }
    },
  };
}

// Circle 6 — HERESY: the burning tombs light the dark; fire keeps a rhythm
function makeHeresy() {
  const w = 560;
  const vents = [150, 205, 260, 340, 395, 450];
  return {
    w, name: 'heresy', entry: 10, title: 'HERESY',
    ventOn(i) { return ((T * 0.8 + i * 0.47) % 2.4) < 0.7; },
    ventWarn(i) { return ((T * 0.8 + i * 0.47) % 2.4) > 2.0; },
    reset() { resetPlayer(this.entry); clearCombat(); },
    update(dt) {
      say('c6', "The sixth: Heresy. Tombs of fire light the only path there is. The flames keep their own rhythm — learn it, and walk between.");
      vents.forEach((vx, i) => {
        if (this.ventOn(i) && Math.abs(player.x - vx) < 9 &&
            player.y > GROUND - 30) kill('fire');
      });
      if (player.x >= w - 8) nextScene();
    },
    draw(c) {
      vgrad(c, 0, 0, w, 150, '#170805', '#3F1B14');
      // embers rising off the tombs
      for (let i = 0; i < 18; i++) {
        const ep = (T * 20 + i * 43) % 110;
        c.globalAlpha = 0.55 * (1 - ep / 110);
        box(c, (i * 61 + 30 + Math.sin(T + i) * 6) % w, 140 - ep, 1, 1.4,
            '#F2B441');
        c.globalAlpha = 1;
      }
      groundBand(c, w, '#200B05', '#F2B441');
      // tomb-cabinets, glowing from within
      for (let x = 40; x < w; x += 105) {
        box(c, x, 96, 34, 54, '#301410');
        box(c, x + 4, 102, 26, 10, '#8C3B2E');
        glowCircle(c, x + 17, 107, 18, 'rgba(242,180,65,A)', 0.25);
        box(c, x - 2, 92, 38, 5, '#1C0A06');            // lid, ajar
      }
      vents.forEach((vx, i) => {
        box(c, vx - 5, GROUND - 2, 10, 3, '#1C0A06');
        if (this.ventOn(i)) {
          const fh = 26 + Math.sin(T * 21 + i) * 4;
          poly(c, [[vx - 4.5, GROUND - 2], [vx, GROUND - 2 - fh],
                   [vx + 4.5, GROUND - 2]], '#E86A2B');
          poly(c, [[vx - 2.4, GROUND - 2], [vx, GROUND - 2 - fh * 0.6],
                   [vx + 2.4, GROUND - 2]], '#F2B441');
          glowCircle(c, vx, GROUND - 14, 16, 'rgba(232,106,43,A)', 0.4);
        } else if (this.ventWarn(i)) {
          glowCircle(c, vx, GROUND - 4, 8,
                     'rgba(232,106,43,A)', 0.3 + 0.25 * Math.sin(T * 18));
        }
      });
    },
  };
}

// Circle 7 — VIOLENCE: the Minotaur chase, then Geryon carries you down
function makeViolence() {
  const w = 640;
  const mino = { x: -70, on: false };
  return {
    w, name: 'violence', entry: 10, title: 'VIOLENCE', slide: true, mino,
    inGap: x => (x > 250 && x < 296) || (x > 430 && x < 472),
    reset() {
      resetPlayer(this.entry); clearCombat();
      mino.x = -70; mino.on = false; this.t = 0; this.phase = 'run';
    },
    update(dt) {
      say('c7', "The seventh: Violence. The Minotaur guards it, and it remembers being cheated. Run — and at the cliff, trust the monster with the honest face.");
      this.t += dt;
      if (this.phase === 'run') {
        if (this.t > 1.0) mino.on = true;
        if (mino.on) {
          mino.x += (mino.x < player.x - 130 ? 105 : 82) * dt;
          if (mino.x > player.x - 10 && Math.abs(player.y - GROUND) < 24)
            kill('minotaur');
        }
        if (player.y > GROUND + 22) kill('fall');
        if (player.x >= w - 46) {
          this.phase = 'geryon'; this.pt = 0; player.stun = 3;
          say('geryon', "Geryon — fraud itself, with a kind and honest face — carried us down the cliff on his back.");
        }
      } else {
        this.pt += dt;
        if (this.pt > 2.6) nextScene();
      }
    },
    draw(c) {
      vgrad(c, 0, 0, w, 150, '#2B0808', '#5E1414');
      // fire-rain, drifting
      for (let i = 0; i < 40; i++) {
        const rx = (i * 53 + T * 40) % w;
        const ry = (i * 71 + T * 90) % 140;
        box(c, rx, ry, 1, 3, 'rgba(232,106,43,0.6)');
      }
      groundBand(c, w, '#300A0A', '#FF8A4A');
      for (const [x0, x1] of [[250, 296], [430, 472]])
        box(c, x0 - 1, GROUND - 1, x1 - x0 + 2, 31, '#0A0202');
      // the wood of dead wiring, background
      for (let x = 60; x < w; x += 120) {
        box(c, x, 96, 3, GROUND - 96, '#1A0505');
        for (const [dx, dy] of [[-14, 108], [12, 100], [-8, 90]])
          c.beginPath(), c.moveTo(x + 1, dy + 14),
          c.quadraticCurveTo(x + dx, dy + 4, x + dx * 1.4, dy),
          c.strokeStyle = '#1A0505', c.lineWidth = 2, c.stroke();
      }
      if (mino.on && this.phase === 'run') {
        beast(c, mino.x, GROUND, {
          len: 46, ht: 18, legH: 13, facing: 1, col: '#120404',
          phase: T * 14, moving: true, mane: true,
        });
        // horns
        poly(c, [[mino.x + 26, GROUND - 30], [mino.x + 32, GROUND - 40],
                 [mino.x + 29, GROUND - 28]], '#120404');
        glowCircle(c, mino.x + 26, GROUND - 26, 8, 'rgba(232,106,43,A)', 0.4);
      }
      if (this.phase === 'geryon') {
        // the funicular with the kind face, hanging at the cliff edge
        const gy = GROUND - 6 + Math.sin(T * 1.4) * 2;
        rbox(c, w - 58, gy - 20, 52, 26, 4, '#B8AE96');
        box(c, w - 52, gy - 14, 10, 6, '#3A2E1E');       // gentle eyes
        box(c, w - 30, gy - 14, 10, 6, '#3A2E1E');
        c.strokeStyle = '#3A2E1E'; c.lineWidth = 1;
        c.beginPath(); c.arc(w - 36, gy - 2, 8, 0.2, Math.PI - 0.2); c.stroke();
        // the sting below, where no passenger looks
        poly(c, [[w - 14, gy + 6], [w - 4, gy + 16], [w - 12, gy + 10]],
             '#420D0D');
      }
    },
  };
}

// Circle 8 — FRAUD: even the floor lies
function makeFraud() {
  const w = 640;
  const TILE = 24, T0 = 96, TN = 16;
  const demon = { x: 560, hp: 3, state: 'idle', t: 0, n: 0, dead: false };
  return {
    w, name: 'fraud', entry: 10, title: 'FRAUD', shades: [], demon,
    isFalse(i) { return i % 3 === 1 || i === 7; },
    inGap(x) {
      const i = Math.floor((x - T0) / TILE);
      return i >= 0 && i < TN && this.holes.has(i);
    },
    reset() {
      resetPlayer(this.entry); clearCombat();
      this.holes = new Set(); this.standT = 0; this.lastTile = -1;
      this.shades.length = 0; this.spawned = false;
      Object.assign(demon, { hp: 3, state: 'idle', t: 0, n: 0, dead: false });
    },
    update(dt) {
      say('c8', "The eighth circle: Fraud. Believe nothing here. The signs point the wrong way — and even the floor lies. Cross it at a run, or it will open under your feet.");
      const i = Math.floor((player.x - T0) / TILE);
      if (player.on && i >= 0 && i < TN && this.isFalse(i) && !this.holes.has(i)) {
        if (i === this.lastTile) this.standT += dt;
        else { this.lastTile = i; this.standT = 0; }
        if (this.standT > 0.34) {
          this.holes.add(i); sfx.clunk();
          fx.push({ x: T0 + i * TILE + 12, y: GROUND + 4, t: 0, kind: 'poof' });
        }
      }
      if (!this.spawned && player.x > 300) {
        this.spawned = true;
        this.shades.push({ x: 470, state: 'lurk' }, { x: 520, state: 'lurk' });
      }
      updateShades(this, dt);
      // the Malebranche — the demon crew who escort, then betray
      if (!demon.dead) {
        if (demon.state === 'idle' && player.x > demon.x - 140) {
          demon.state = 'aim'; demon.t = 0;
          say('malebranche', "One of the Malebranche waited past the floors — the demons who offer escort, and mean ambush. I knew its rhythm by now.");
        }
        if (demon.state !== 'idle') updateDemon(demon, dt);
      }
      if (player.y > GROUND + 22) kill('fall');
      if (player.x >= w - 8) nextScene();
    },
    draw(c) {
      vgrad(c, 0, 0, w, 150, '#3A3628', '#6B6552');
      // office strata and lying signage
      for (let x = 30; x < w; x += 110) {
        box(c, x, 60, 70, 34, '#4A4436');
        for (let wx = x + 6; wx < x + 64; wx += 16)
          box(c, wx, 66, 10, 12, '#2E2A20');
      }
      for (const [sx, dir] of [[120, -1], [300, -1], [470, 1]]) {
        rbox(c, sx, 44, 30, 12, 2, '#EFE3C0');
        // arrows that point back the way you came
        poly(c, dir < 0
          ? [[sx + 8, 50], [sx + 16, 45.5], [sx + 16, 54.5]]
          : [[sx + 22, 50], [sx + 14, 45.5], [sx + 14, 54.5]], '#3A3628');
        box(c, sx + (dir < 0 ? 17 : 6), 48.5, 8, 3, '#3A3628');
      }
      // the floor: tiles, the false ones invisible among them
      box(c, 0, GROUND, T0, 30, '#4A4436');
      box(c, 0, GROUND - 0.6, T0, 2.2, '#C9BF9E');
      box(c, T0 + TN * TILE, GROUND, w - T0 - TN * TILE, 30, '#4A4436');
      box(c, T0 + TN * TILE, GROUND - 0.6, w - T0 - TN * TILE, 2.2, '#C9BF9E');
      for (let i = 0; i < TN; i++) {
        if (this.holes.has(i)) { box(c, T0 + i * TILE, GROUND, TILE, 30, '#0C0B08'); continue; }
        box(c, T0 + i * TILE, GROUND, TILE, 30, '#4A4436');
        box(c, T0 + i * TILE, GROUND - 0.6, TILE - 1, 2.2, '#C9BF9E');
        // the liars carry hairline cracks — visible to whoever looks twice
        if (this.isFalse(i)) {
          const tx = T0 + i * TILE;
          c.strokeStyle = '#35311F'; c.lineWidth = 0.7;
          c.beginPath();
          c.moveTo(tx + 5, GROUND + 2); c.lineTo(tx + 11, GROUND + 5);
          c.lineTo(tx + 9, GROUND + 9);
          c.moveTo(tx + 15, GROUND + 3); c.lineTo(tx + 19, GROUND + 7);
          c.stroke();
        }
      }
      this.shades.forEach((sh, i) => drawShade(c, sh, i));
      drawDemon(c, demon);
    },
  };
}

// Circle 9 — TREACHERY: ice underfoot, wind that must be crawled,
// and Lucifer at the center — where down becomes up
function makeTreachery() {
  const w = 700;
  const SECTORS = [[150, 230], [300, 380], [450, 530]];
  return {
    w, name: 'treachery', entry: 10, title: 'TREACHERY', ice: true,
    reset() { resetPlayer(this.entry); clearCombat(); this.flip = 0; },
    inWind(x) { return SECTORS.some(([a, b]) => x > a && x < b); },
    update(dt) {
      say('c9', "The ninth circle: Treachery. Ice to the horizon — and frozen at its center, the traitor of traitors. Lucifer himself. The wind from his wings will throw you; crawl through it.");
      for (const [x0, x1] of SECTORS) {
        if (player.x > x0 && player.x < x1)
          player.x -= (player.crouch && player.on ? 10 : 52) * dt;
      }
      if (player.x > 620 && !this.flip) {
        say('climb', "There was no way around him — only down his side. And at the very center of the world, down became up.");
        player.stun = 4;
      }
      if (player.x > 620) {
        this.flip = Math.min(1, this.flip + dt / 2.4);
        if (this.flip >= 1) { mode = 'end'; modeT = 0; }
      }
      if (player.x >= w - 8) player.x = w - 8;
    },
    draw(c) {
      vgrad(c, 0, 0, w, 148, '#22313A', '#6B8894');
      // snow, always falling, leaning with the wind
      for (let i = 0; i < 46; i++) {
        const sy = (i * 41 + T * (26 + (i % 5) * 8)) % 176;
        const sx = (i * 89 + Math.sin(T * 0.8 + i) * 14 - T * 30) % w;
        c.globalAlpha = 0.35 + (i % 3) * 0.18;
        box(c, (sx + w) % w, sy, 1 + (i % 3) * 0.4, 1 + (i % 3) * 0.4,
            '#E4F0F3');
        c.globalAlpha = 1;
      }
      // wind shear, dense inside the deadly sectors — the danger is legible
      for (let i = 0; i < 30; i++) {
        const rx = (i * 67 + T * 160) % w;
        const inSec = this.inWind(rx);
        c.globalAlpha = inSec ? 0.75 : 0.28;
        box(c, rx, 30 + (i * 37) % 110, (inSec ? 14 : 7) + i % 6, 0.9,
            '#C7DCE2');
        c.globalAlpha = 1;
      }
      vgrad(c, 0, 148, w, 32, '#9AB4BE', '#C4DAE2');     // the ice
      for (let x = 20; x < w; x += 70)
        box(c, x, 154 + (x % 3) * 4, 16, 1, '#6E8B96');
      // the sealed damned, silhouettes under the surface — one pair close
      for (const [sx, sy] of [[60, 162], [150, 170], [250, 166], [340, 163],
                              [430, 169], [500, 164]])
        rbox(c, sx, sy, 13, 3, 1, '#54707B');
      rbox(c, 560, 167, 11, 3, 1, '#3C525C');
      rbox(c, 570, 165, 11, 3, 1, '#3C525C');
      // LUCIFER, filling the end of the world — both wings spread
      poly(c, [[610, 10], [700, 4], [700, 150], [592, 150]], '#0A0D10');
      poly(c, [[610, 30], [540, 6], [542, 40], [596, 46]], '#131A20');
      poly(c, [[622, 22], [576, 0], [580, 24], [618, 34]], '#0E141A');
      for (const [ex, ey, ec] of [[632, 46, '#B33A26'], [618, 56, '#8A8F96'],
                                   [648, 56, '#C9B26B']]) {
        box(c, ex, ey, 2.2, 2.2, ec);
        box(c, ex + 6, ey, 2.2, 2.2, ec);
        glowCircle(c, ex + 4, ey + 1, 6, 'rgba(179,58,38,A)', 0.25);
      }
      // frost on him
      for (let i = 0; i < 30; i++)
        box(c, 600 + (i * 31) % 96, 56 + (i * 47) % 90, 1.4, 1.2,
            'rgba(199,220,226,0.7)');
    },
  };
}

const scenes = [makePark(), makeLeopard(), makeChase(), makeWolf(),
                makeHall(), makeGate(), makeVestibule(), makeAcheron(),
                makeLimbo(), makeLustLvl(), makeGluttony(), makeGreed(),
                makeWrath(), makeHeresy(), makeViolence(), makeFraud(),
                makeTreachery()];

let camSnap = true;
function nextScene() {
  sceneIdx++;
  sfx.win();                          // a small chord for every level cleared
  camSnap = true;
  if (sceneIdx >= scenes.length) { mode = 'end'; modeT = 0; return; }
  scenes[sceneIdx].reset();
}
function currentScene() { return scenes[sceneIdx]; }

// ----------------------------------------------------------------- cards --
function drawTitle(c) {
  box(c, 0, 0, W, H, '#000');
  glowCircle(c, W / 2, 74, 70, ROSE, 0.08);
  c.fillStyle = '#EFE3C0';
  c.font = '600 21px Georgia, serif';
  c.textAlign = 'center';
  const s = 'I N F E R N O';
  c.fillText(s, W / 2, 70);
  c.fillStyle = '#6E6E73'; c.font = '9px Georgia, serif';
  c.fillText('a narrated descent', W / 2, 88);
  c.fillStyle = '#3E3E42'; c.font = '7px system-ui, sans-serif';
  c.fillText('← → move   ⇧ run   space jump   ↓ crouch   x fire', W / 2, 132);
  if (Math.sin(T * 3) > -0.2) {
    c.fillStyle = '#8A8578'; c.font = '8px system-ui, sans-serif';
    c.fillText('press any key', W / 2, 150);
  }
  // subtitles toggle
  c.fillStyle = 'rgba(239,227,192,0.08)';
  c.fillRect(96, 158, 128, 16);
  c.strokeStyle = 'rgba(239,227,192,0.25)';
  c.strokeRect(96.5, 158.5, 127, 15);
  c.fillStyle = subsOn ? '#B8AE96' : '#55524A';
  c.font = '7px system-ui, sans-serif';
  c.fillText('subtitles: ' + (subsOn ? 'ON' : 'OFF') + '   (S / tap)', W / 2, 168);
}
function drawQuote(c) {
  box(c, 0, 0, W, H, '#000');
  const a = Math.min(1, modeT / 1.2) * (modeT > 4.2 ? Math.max(0, 1 - (modeT - 4.2) / 0.8) : 1);
  c.globalAlpha = a;
  c.fillStyle = '#B8AE96'; c.font = 'italic 10px Georgia, serif';
  c.textAlign = 'center';
  c.fillText('In the middle of the journey of our life', W / 2, 82);
  c.fillText('I came to myself in a dark wood…', W / 2, 98);
  c.globalAlpha = 1;
}
function drawEnd(c) {
  box(c, 0, 0, W, H, '#000');
  if (modeT < 0.9) {   // a black beat before the sky
    return;
  }
  // the stars — the poem's last word, and ours
  const a = Math.min(1, (modeT - 1.1) / 2);
  vgrad(c, 0, 0, W, H, '#0A1020', '#2B3A5C');
  for (let i = 0; i < 60; i++) {                 // stars arriving one by one
    if (modeT - 1.1 < i * 0.09) continue;
    const sx = (i * 97) % W, sy = (i * 53) % 120;
    c.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(T * 1.2 + i));
    box(c, sx, sy, i % 5 ? 1 : 1.6, i % 5 ? 1 : 1.6, '#F2E3B3');
  }
  c.globalAlpha = a;
  vgrad(c, 0, 150, W, 30, 'rgba(242,227,179,0)', '#3D3A2E');
  c.textAlign = 'center';
  c.fillStyle = '#EFE3C0'; c.font = 'italic 600 12px Georgia, serif';
  c.fillText('…and we came forth,', W / 2, 78);
  c.fillText('to see again the stars.', W / 2, 94);
  c.fillStyle = '#6E6E73'; c.font = '8px system-ui, sans-serif';
  c.fillText('the descent is done', W / 2, 122);
  if (deaths)
    c.fillText(deaths + (deaths === 1 ? ' death' : ' deaths'), W / 2, 134);
  c.fillStyle = '#8A8578';
  if (Math.sin(T * 3) > -0.2) {
    c.textAlign = 'left';
    c.fillText('R ↺ descend again', 26, 150);
    c.textAlign = 'right';
    c.fillText('toward the mountain → enter', W - 26, 150);
    c.textAlign = 'center';
  }
  c.globalAlpha = 1;
}

// ------------------------------------------------------------------ loop --
let last = 0;
function frame(ts) {
  const dt = Math.min(0.033, (ts - last) / 1000 || 0.016);
  last = ts; T += dt; modeT += dt;
  const sc = currentScene();

  if (mode === 'title' && anyKeyPulse && modeT > 0.4 && !suppressStart) {
    mode = 'quote'; modeT = 0;
    say('open', "Midway through the journey of my life, I came to myself in a dark wood, for I had lost the way.", false);
  } else if (mode === 'quote' && (modeT > 5 || (anyKeyPulse && modeT > 0.8))) {
    mode = 'play'; modeT = 0; sceneIdx = 0; scenes[0].reset();
  } else if (mode === 'play') {
    updatePlayer(dt, sc);
    sc.update(dt);
    if (mode === 'play') { updateGun(dt); updateProjectiles(dt, sc); }
  } else if (mode === 'dead') {
    if (modeT > 0.55) { mode = 'play'; modeT = 0; sc.reset(); }
  } else if (mode === 'drop') {
    player.y += 26 * dt; player.vx = 0;
    if (modeT > 0.85) {
      nextScene();
      if (mode !== 'end') { mode = 'play'; modeT = 0; }
    }
  } else if (mode === 'end') {
    if (modeT > 2.2)
      say('endline', "And we came forth, to see again the stars.", false);
    if (keys.Enter || (touchGo3d && modeT > 1.2)) {   // the story continues
      location.href = '3d/';
    } else if (keys.KeyR || (touchRestart && !touchGo3d && modeT > 1.2)) {
      mode = 'title'; modeT = 0; deaths = 0; sceneIdx = 0;
      player.gunHas = false; scenes[0].reset(); clearNarration();
    }
  }
  anyKeyPulse = false; touchRestart = false; suppressStart = false;
  subT -= dt;
  if (lastSceneIdx !== sceneIdx) { lastSceneIdx = sceneIdx; titleT = 0; }
  titleT += dt;

  // the subway is the score
  if (AC) {
    if (mode === 'title' || mode === 'quote' || mode === 'end')
      ambience('card', 220, 0.015);
    else if (sceneIdx <= 3) ambience('surface', 640, 0.035);   // night wind
    else if (sceneIdx === 7 || sceneIdx === 12)
      ambience('water', 290, 0.05);                            // the rivers
    else ambience('under', 150, 0.045);                        // deep rumble
    // one root note per depth, falling as you fall
    const ROOTS = [110, 98, 87.3, 82.4, 73.4, 69.3, 65.4, 58.3,
                   61.7, 55, 51.9, 49, 46.2, 43.7, 41.2, 38.9, 36.7];
    music(mode === 'play' || mode === 'dead' || mode === 'drop'
          ? ROOTS[Math.min(sceneIdx, ROOTS.length - 1)] : 82.4);
    bellTick();
  }

  // render — size the canvas to the *visible* viewport every frame, so
  // mobile URL-bar collapse and iOS 100vh quirks never skew hit-testing
  const s = Math.min(innerWidth / W, innerHeight / H);
  const bw = Math.round(innerWidth * devicePixelRatio);
  const bh = Math.round(innerHeight * devicePixelRatio);
  if (cv.width !== bw || cv.height !== bh) {
    cv.width = bw; cv.height = bh;
    cv.style.width = innerWidth + 'px';
    cv.style.height = innerHeight + 'px';
  }
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, innerWidth, innerHeight);
  const ox = (innerWidth - W * s) / 2, oy = (innerHeight - H * s) / 2;
  uiS = s; uiOx = ox; uiOy = oy;
  ctx.setTransform(devicePixelRatio * s, 0, 0, devicePixelRatio * s,
                   devicePixelRatio * ox, devicePixelRatio * oy);
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();

  if (mode === 'title') drawTitle(ctx);
  else if (mode === 'quote') drawQuote(ctx);
  else if (mode === 'end') drawEnd(ctx);
  else {
    const camT = Math.max(0, Math.min(sc.w - W, player.x - W / 2));
    camX = camSnap ? camT : camX + (camT - camX) * Math.min(1, dt * 9);
    camSnap = false;
    let shk = sc.quake || 0;
    if (mode === 'dead' && modeT < 0.16) shk = Math.max(shk, 0.8);
    ctx.save();
    if (sc.flip) {                 // the world turns over at its center
      ctx.translate(W / 2, H / 2);
      ctx.rotate(Math.PI * sc.flip);
      ctx.translate(-W / 2, -H / 2);
    }
    ctx.translate(-camX + (Math.random() - 0.5) * 3.2 * shk,
                  (Math.random() - 0.5) * 2.6 * shk);
    sc.draw(ctx);
    if (mode !== 'drop' || modeT < 0.5) drawPlayer(ctx);
    drawCombat(ctx);
    ctx.restore();
    // shadow lift — keeps the mood, uncrushes the blacks
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = 'rgb(55,59,56)';
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
    // vignette
    const vg = ctx.createRadialGradient(W/2, H/2, H*0.45, W/2, H/2, H*0.95);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.18)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    if (mode === 'dead') {
      if (modeT < 0.12) {              // the hit lands: one red frame
        ctx.fillStyle = `rgba(170,36,24,${0.4 * (1 - modeT / 0.12)})`;
        ctx.fillRect(0, 0, W, H);
      }
      ctx.fillStyle = `rgba(0,0,0,${Math.min(1, modeT * 3)})`;
      ctx.fillRect(0, 0, W, H);
    }
    if (mode === 'drop') {
      ctx.fillStyle = `rgba(0,0,0,${Math.min(1, modeT * 1.6)})`;
      ctx.fillRect(0, 0, W, H);
    }
    if (mode === 'play' && modeT < 0.3) {           // respawn fade-in
      ctx.fillStyle = `rgba(0,0,0,${1 - modeT / 0.3})`;
      ctx.fillRect(0, 0, W, H);
    }
    // circle title card, held for a breath on arrival
    if (sc.title && titleT < 3.4 && mode === 'play') {
      const a = Math.min(1, titleT / 0.6) *
                (titleT > 2.6 ? Math.max(0, 1 - (titleT - 2.6) / 0.8) : 1);
      ctx.globalAlpha = a;
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(0, 20, W, 30);
      ctx.fillStyle = '#E8D9A0';
      ctx.font = '600 15px Georgia, serif'; ctx.textAlign = 'center';
      ctx.fillText(sc.title.split('').join(' '), W / 2, 40);
      ctx.globalAlpha = 1;
    }
  }
  drawSubtitle(ctx);
  drawTouchUI(ctx);
  ctx.restore();
  requestAnimationFrame(frame);
}

// debug/test hooks
const q = new URLSearchParams(location.search);
if (q.has('scene')) {
  mode = 'play'; sceneIdx = Math.min(scenes.length - 1, +q.get('scene'));
  scenes[sceneIdx].reset();
}
window.G = { player, scenes, get mode() { return mode; },
             get sceneIdx() { return sceneIdx; }, get deaths() { return deaths; },
             get sub() { return subText; }, get subOn() { return subT > 0; } };

requestAnimationFrame(frame);
