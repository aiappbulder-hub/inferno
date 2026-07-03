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
  { k: 'ArrowLeft',  x: 26,  y: 156, r: 14, label: '◀' },
  { k: 'ArrowRight', x: 62,  y: 156, r: 14, label: '▶' },
  { k: 'KeyX',       x: 248, y: 158, r: 13, label: '✦' },
  { k: 'Space',      x: 280, y: 143, r: 13, label: '▲' },
  { k: 'ArrowDown',  x: 298, y: 165, r: 12, label: '▼' },
];
const ptrs = new Map();
function refreshTouches() {
  touchHeld.clear();
  for (const p of ptrs.values())
    for (const b of btns) {
      const dx = p.x - b.x, dy = p.y - b.y, r = b.r + 5;
      if (dx * dx + dy * dy < r * r) touchHeld.add(b.k);
    }
}
cv.addEventListener('pointerdown', e => {
  e.preventDefault();
  audioInit();
  if (e.pointerType !== 'mouse') touchUI = true;
  anyKeyPulse = true; touchRestart = true;
  ptrs.set(e.pointerId, { x: (e.clientX - uiOx) / uiS, y: (e.clientY - uiOy) / uiS });
  refreshTouches();
});
cv.addEventListener('pointermove', e => {
  if (!ptrs.has(e.pointerId)) return;
  ptrs.set(e.pointerId, { x: (e.clientX - uiOx) / uiS, y: (e.clientY - uiOy) / uiS });
  refreshTouches();
});
for (const ev of ['pointerup', 'pointercancel', 'pointerout'])
  cv.addEventListener(ev, e => { ptrs.delete(e.pointerId); refreshTouches(); });
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
function vgrad(c, x, y, w, h, c0, c1) {
  const g = c.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, c0); g.addColorStop(1, c1);
  c.fillStyle = g; c.fillRect(x, y, w, h);
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

function updatePlayer(dt, sc) {
  if (player.stun > 0) { player.stun -= dt; player.vx = 0; }
  else {
    const spd = run() ? RUN : WALK;
    let dir = (right() ? 1 : 0) - (left() ? 1 : 0);
    player.crouch = down() && player.on;
    let s = spd;
    if (player.crouch) s = (Math.abs(player.vx) > WALK + 5 && sc.slide) ? RUN : WALK * 0.6;
    player.vx = dir * s;
    if (dir) player.facing = dir;
    if (jumpK() && player.on && !player.crouch) {
      player.vy = JUMPV; player.on = false; sfx.jump();
    }
  }
  player.x += player.vx * dt;
  if (!player.on) {
    player.vy += GRAV * dt; player.y += player.vy * dt;
    if (player.y >= GROUND && !(sc.inGap && sc.inGap(player.x))) {
      player.y = GROUND; player.vy = 0; player.on = true;
    }
  } else if (sc.inGap && sc.inGap(player.x)) {
    player.on = false; player.vy = 20;
  }
  player.x = Math.max(6, Math.min(sc.w - 6, player.x));
  player.maxX = Math.max(player.maxX, player.x);
  if (Math.abs(player.vx) > 1) player.phase += dt * (Math.abs(player.vx) > WALK + 5 ? 13 : 8);
}

function drawPlayer(c) {
  figure(c, player.x, player.y, player.h, '#2A2F38', {
    facing: player.facing, legPhase: player.phase,
    crouch: player.crouch, jump: !player.on,
    moving: Math.abs(player.vx) > 1, hair: '#14120F',
  });
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
};

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

function drawVirgil(c, x, y, o = {}) {
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
    reset() { resetPlayer(this.entry); },
    update(dt) {
      if (player.x >= w - 7) nextScene();
    },
    draw(c) {
      vgrad(c, 0, 0, w, 118, '#070C08', '#131D12');
      // city glow, left horizon — the world he is leaving
      glowCircle(c, 20, 116, 60, AMBER, 0.10);
      // skyline
      for (let i = 0; i < 7; i++)
        box(c, i * 13 - 4, 96 + (i * 29 % 17), 9, 22, '#0A120C');
      // crescent
      c.strokeStyle = '#D8E8EC'; c.lineWidth = 1; c.beginPath();
      c.arc(252, 28, 7, -0.6, 2.2); c.stroke();
      vgrad(c, 0, 118, w, 62, '#10180E', '#0B110A');
      box(c, 0, GROUND, w, 30, '#0D130B');
      // back fence
      for (let x = 8; x < w; x += 22) box(c, x, 122, 1.6, 28, '#0A0F0A');
      box(c, 0, 126, w, 1.4, '#0A0F0A'); box(c, 0, 140, w, 1.4, '#0A0F0A');
      treeSil(c, 52, GROUND, 60, '#0A120A');
      treeSil(c, 150, GROUND, 46, '#0A120A');
      treeSil(c, 288, GROUND, 70, '#081008');
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
      box(c, 0, GROUND, w, 30, '#0C110B');
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
      // the bough: standing men stumble
      if (!player.crouch && player.on && player.stun <= 0 &&
          player.x > BOUGH - 6 && player.x < BOUGH + 6) {
        player.stun = 0.75; player.x = BOUGH - 7;
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
      box(c, 0, GROUND, w, 30, '#0C110B');
      // collapsed fence + pit
      box(c, GAP0, GROUND, GAP1 - GAP0, 30, '#010302');
      poly(c, [[GAP0 - 12, GROUND], [GAP0, GROUND], [GAP0 - 3, GROUND + 6],
               [GAP0 - 14, GROUND + 4]], '#0A0F0A');
      poly(c, [[GAP1, GROUND], [GAP1 + 10, GROUND], [GAP1 + 14, GROUND + 5],
               [GAP1 + 3, GROUND + 6]], '#0A0F0A');
      for (let x = 40; x < w; x += 90) {
        if (x > GAP0 - 30 && x < GAP1 + 10) continue;
        box(c, x, 122, 1.6, 28, '#0A0F0A');
      }
      // the leaning tree and its low bough
      treeSil(c, BOUGH + 26, GROUND, 84, '#081007');
      c.save(); c.translate(BOUGH + 18, GROUND - 60); c.rotate(0.42);
      box(c, -66, 0, 66, 3.4, '#081007'); c.restore();
      box(c, BOUGH - 12, 133, 30, 2.6, '#0A1108');   // the bough itself
      lamp(c, 200, GROUND); lamp(c, 430, GROUND);
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
    reset() { resetPlayer(this.entry); wolf.x = 276; wolf.idle = 0; },
    update(dt) {
      // she advances as you do; there is no way past her
      const press = Math.max(0, player.maxX - 46);
      wolf.x = Math.min(wolf.x, 276 - press * 0.30);
      const moving = Math.abs(player.vx) > 1;
      wolf.idle = moving ? 0 : wolf.idle + dt;
      if (wolf.idle > 5) wolf.x -= 9 * dt;          // patience runs out
      if (wolf.x - player.x < 20) kill('wolf');
      // the grate: the only open way is down
      if (player.on && down() && player.x > GRATE0 + 4 && player.x < GRATE1 - 2
          && player.maxX > 60) {
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
      box(c, 0, GROUND, w, 30, '#0C110B');
      treeSil(c, 30, GROUND, 62, '#070C07');
      lamp(c, 120, GROUND);
      // the grate — and the faint warm light from below
      glowCircle(c, (GRATE0 + GRATE1) / 2, GROUND + 6, 22, ROSE, 0.20);
      box(c, GRATE0, GROUND - 1, GRATE1 - GRATE0, 4, '#020403');
      for (let x = GRATE0 + 3; x < GRATE1 - 2; x += 5)
        box(c, x, GROUND - 1, 1.6, 4, '#101510');
      box(c, GRATE0 + 8, GROUND - 1, 8, 4, '#020403'); // bars broken here
      // the she-wolf
      beast(c, wolf.x, GROUND, {
        len: 34, ht: 12, legH: 11, facing: -1, col: '#040605',
        phase: T * 6, moving: false, gaunt: true,
      });
      c.globalAlpha = 0.6 + 0.4 * Math.sin(T * 3.1);
      glowCircle(c, wolf.x - 19, GROUND - 17, 7, AMBER, 0.4);
      c.globalAlpha = 1;
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
      }
      // Virgil kneels at the lock; the dark comes loose
      if (!this.wave && player.x > 430) {
        this.wave = true;
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
      box(c, 0, GROUND, w, 30, '#0E1118');
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

// P6 — The Vestibule: the futile, a demon of the door, a gate for the blast
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
      if (!this.spawned && player.x > 110) {
        this.spawned = true;
        this.shades.push({ x: 290, state: 'lurk' }, { x: 350, state: 'lurk' });
      }
      updateShades(this, dt);
      if (!demon.dead) {
        demon.t += dt;
        if (demon.state === 'idle') {
          if (player.x > demon.x - 150) { demon.state = 'aim'; demon.t = 0; }
        } else if (demon.state === 'aim' && demon.t > 0.7) {
          demon.state = 'fire'; demon.t = 0; demon.n = 0;
        } else if (demon.state === 'fire') {
          if (demon.t > demon.n * 0.32) {
            eBolts.push({ x: demon.x - 9, y: GROUND - 13, vx: -175 });
            sfx.ebolt();
            demon.n++;
            if (demon.n >= 3) { demon.state = 'pause'; demon.t = 0; }
          }
        } else if (demon.state === 'pause' && demon.t > 1.6) {
          demon.state = 'aim'; demon.t = 0;
        }
        if (Math.abs(player.x - demon.x) < 12) kill('demon');
      }
      if (!this.gate.broken) player.x = Math.min(player.x, this.gate.x - 10);
      else if (player.x >= w - 8) nextScene();
    },
    draw(c) {
      vgrad(c, 0, 0, w, 120, '#0B0E14', '#181D28');
      vgrad(c, 0, 120, w, 60, '#131720', '#0D1016');
      box(c, 0, GROUND, w, 30, '#0F1219');
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
      if (!demon.dead) {
        const dx = demon.x, lean = demon.state === 'aim' ? -1.5 : 0;
        poly(c, [[dx - 8, GROUND], [dx - 5 + lean, GROUND - 26],
                 [dx + lean, GROUND - 33], [dx + 5 + lean, GROUND - 27],
                 [dx + 9, GROUND], [dx + 12, GROUND + 1], [dx - 10, GROUND + 1]],
             '#07090D');
        ell(c, dx + lean, GROUND - 30, 4.4, 5, '#07090D');
        poly(c, [[dx - 4 + lean, GROUND - 33], [dx - 7 + lean, GROUND - 40],
                 [dx - 1 + lean, GROUND - 35]], '#07090D');
        poly(c, [[dx + 4 + lean, GROUND - 33], [dx + 7 + lean, GROUND - 40],
                 [dx + 1 + lean, GROUND - 35]], '#07090D');
        const hot = demon.state === 'aim' ? 0.9 : 0.5;
        c.fillStyle = '#E86A2B';
        c.fillRect(dx - 2.6 + lean, GROUND - 31, 1.6, 1.4);
        c.fillRect(dx + 1 + lean, GROUND - 31, 1.6, 1.4);
        glowCircle(c, dx + lean, GROUND - 30, 6, 'rgba(232,106,43,A)', hot * 0.4);
        if (demon.state === 'pause') {              // the opening
          glowCircle(c, dx, GROUND - 20, 8,
                     'rgba(232,106,43,A)', 0.5 + 0.3 * Math.sin(T * 10));
        }
      }
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
      this.pt += dt;
      const a = car.x - 30, b = car.x + 30;
      if (this.phase === 'approach') {
        if (player.x >= a - 8) {
          this.phase = 'refusal'; this.pt = 0; player.stun = 2.6;
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
        }
      } else if (this.phase === 'quake') {
        this.quake = Math.min(1, this.pt / 0.4);
        if (this.pt > 2.1) { mode = 'end'; modeT = 0; }
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
      // the pier
      box(c, 0, GROUND, 214, 8, '#0C1013');
      for (let x = 10; x < 210; x += 24) box(c, x, GROUND + 8, 3, 22, '#090D10');
      // far shore
      box(c, 448, GROUND, w - 448, 8, '#0C1013');
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

const scenes = [makePark(), makeLeopard(), makeChase(), makeWolf(),
                makeHall(), makeVestibule(), makeAcheron()];

function nextScene() {
  sceneIdx++;
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
  c.fillText('a wordless descent', W / 2, 88);
  c.fillStyle = '#3E3E42'; c.font = '7px system-ui, sans-serif';
  c.fillText('← → move   ⇧ run   space jump   ↓ crouch   x fire', W / 2, 132);
  if (Math.sin(T * 3) > -0.2) {
    c.fillStyle = '#8A8578'; c.font = '8px system-ui, sans-serif';
    c.fillText('press any key', W / 2, 150);
  }
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
  if (modeT < 1.1) {   // the gate's flicker — gone before it can be read
    if (modeT > 0.5 && modeT < 0.62) {
      c.fillStyle = '#3D2A1E'; c.font = '600 10px Georgia, serif';
      c.textAlign = 'center';
      c.fillText('A B A N D O N   A L L   H O P E', W / 2, 88);
    }
    return;
  }
  const a = Math.min(1, (modeT - 1.1) / 1.5);
  c.globalAlpha = a; c.textAlign = 'center';
  glowCircle(c, W / 2, 84, 70, ROSE, 0.14 * a);
  c.fillStyle = '#E8D9A0'; c.font = '600 20px Georgia, serif';
  c.fillText('L I M B O', W / 2, 80);
  c.fillStyle = '#8A8578'; c.font = 'italic 9px Georgia, serif';
  c.fillText('the first circle', W / 2, 96);
  c.fillStyle = '#6E6E73'; c.font = '8px system-ui, sans-serif';
  c.fillText('end of the prologue slice — the descent continues', W / 2, 118);
  if (deaths)
    c.fillText(deaths + (deaths === 1 ? ' death' : ' deaths'), W / 2, 130);
  c.fillStyle = '#8A8578';
  if (Math.sin(T * 3) > -0.2) c.fillText('press R to descend again', W / 2, 148);
  c.globalAlpha = 1;
}

// ------------------------------------------------------------------ loop --
let last = 0;
function frame(ts) {
  const dt = Math.min(0.033, (ts - last) / 1000 || 0.016);
  last = ts; T += dt; modeT += dt;
  const sc = currentScene();

  if (mode === 'title' && anyKeyPulse && modeT > 0.4) { mode = 'quote'; modeT = 0; }
  else if (mode === 'quote' && (modeT > 5 || (anyKeyPulse && modeT > 0.8))) {
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
  } else if (mode === 'end' && (keys.KeyR || (touchRestart && modeT > 1.2))) {
    mode = 'title'; modeT = 0; deaths = 0; sceneIdx = 0;
    player.gunHas = false; scenes[0].reset();
  }
  anyKeyPulse = false; touchRestart = false;

  // the subway is the score
  if (AC) {
    if (mode === 'title' || mode === 'quote' || mode === 'end')
      ambience('card', 220, 0.015);
    else if (sceneIdx <= 3) ambience('surface', 640, 0.035);   // night wind
    else if (sceneIdx === 6) ambience('water', 290, 0.05);     // the Acheron
    else ambience('under', 150, 0.045);                        // deep rumble
  }

  // render
  const s = Math.min(innerWidth / W, innerHeight / H);
  if (cv.width !== innerWidth * devicePixelRatio) {
    cv.width = innerWidth * devicePixelRatio;
    cv.height = innerHeight * devicePixelRatio;
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
    camX = Math.max(0, Math.min(sc.w - W, player.x - W / 2));
    const shk = sc.quake || 0;
    ctx.save();
    ctx.translate(-camX + (Math.random() - 0.5) * 3.2 * shk,
                  (Math.random() - 0.5) * 2.6 * shk);
    sc.draw(ctx);
    if (mode !== 'drop' || modeT < 0.5) drawPlayer(ctx);
    drawCombat(ctx);
    ctx.restore();
    // shadow lift — keeps the mood, uncrushes the blacks
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = 'rgb(44,48,46)';
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
    // vignette
    const vg = ctx.createRadialGradient(W/2, H/2, H*0.45, W/2, H/2, H*0.95);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.24)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    if (mode === 'dead') {
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
  }
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
             get sceneIdx() { return sceneIdx; }, get deaths() { return deaths; } };

requestAnimationFrame(frame);
