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
});
addEventListener('keyup', e => { keys[e.code] = false; });
const left  = () => keys.ArrowLeft || keys.KeyA;
const right = () => keys.ArrowRight || keys.KeyD;
const run   = () => keys.ShiftLeft || keys.ShiftRight;
const jumpK = () => keys.Space || keys.ArrowUp || keys.KeyW;
const down  = () => keys.ArrowDown || keys.KeyS;

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
    if (jumpK() && player.on && !player.crouch) { player.vy = JUMPV; player.on = false; }
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

// ----------------------------------------------------------------- state --
let mode = 'title';          // title | quote | play | dead | drop | end
let modeT = 0, sceneIdx = 0, camX = 0, T = 0;
let deathCause = '';

function kill(cause) {
  if (mode !== 'play') return;
  deathCause = cause; deaths++;
  mode = 'dead'; modeT = 0;
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
        mode = 'drop'; modeT = 0;
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

const scenes = [makePark(), makeLeopard(), makeChase(), makeWolf()];

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
  c.fillText('← → move   ⇧ run   space jump   ↓ crouch', W / 2, 132);
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
  glowCircle(c, W / 2, 96, 60, ROSE, 0.10 * a);
  c.fillStyle = '#EFE3C0'; c.font = '600 13px Georgia, serif';
  c.fillText('the descent continues', W / 2, 86);
  c.fillStyle = '#6E6E73'; c.font = '8px system-ui, sans-serif';
  c.fillText('end of the prologue slice', W / 2, 104);
  if (deaths)
    c.fillText(deaths + (deaths === 1 ? ' death' : ' deaths'), W / 2, 116);
  c.fillStyle = '#8A8578';
  if (Math.sin(T * 3) > -0.2) c.fillText('press R to descend again', W / 2, 142);
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
  } else if (mode === 'dead') {
    if (modeT > 0.55) { mode = 'play'; modeT = 0; sc.reset(); }
  } else if (mode === 'drop') {
    player.y += 26 * dt; player.vx = 0;
    if (modeT > 0.8) { mode = 'end'; modeT = 0; }
  } else if (mode === 'end' && keys.KeyR) {
    mode = 'title'; modeT = 0; deaths = 0; sceneIdx = 0; scenes[0].reset();
  }
  if (keys.KeyR && mode === 'play' && modeT > 0.5) { /* no mid-game reset */ }
  anyKeyPulse = false;

  // render
  const s = Math.min(innerWidth / W, innerHeight / H);
  if (cv.width !== innerWidth * devicePixelRatio) {
    cv.width = innerWidth * devicePixelRatio;
    cv.height = innerHeight * devicePixelRatio;
  }
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, innerWidth, innerHeight);
  const ox = (innerWidth - W * s) / 2, oy = (innerHeight - H * s) / 2;
  ctx.setTransform(devicePixelRatio * s, 0, 0, devicePixelRatio * s,
                   devicePixelRatio * ox, devicePixelRatio * oy);
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();

  if (mode === 'title') drawTitle(ctx);
  else if (mode === 'quote') drawQuote(ctx);
  else if (mode === 'end') drawEnd(ctx);
  else {
    camX = Math.max(0, Math.min(sc.w - W, player.x - W / 2));
    ctx.save(); ctx.translate(-camX, 0);
    sc.draw(ctx);
    if (mode !== 'drop' || modeT < 0.5) drawPlayer(ctx);
    ctx.restore();
    // shadow lift — keeps the mood, uncrushes the blacks
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = 'rgb(30,34,31)';
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
    // vignette
    const vg = ctx.createRadialGradient(W/2, H/2, H*0.45, W/2, H/2, H*0.95);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.32)');
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
