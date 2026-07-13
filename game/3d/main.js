// PURGATORIO — the shore of the mountain. The story continues in 3D:
// out of the grate, onto the island at the foot of the mountain, at dawn.
// Same rules as below: teach then test, lit edges mean walkable,
// death is a splash and an instant return.
import * as THREE from './three.module.min.js';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.45;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x141c2e);
scene.fog = new THREE.FogExp2(0x27324e, 0.012);

const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 500);

// ------------------------------------------------------------- lighting --
const hemi = new THREE.HemisphereLight(0x44547a, 0x1e1812, 1.05);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffb877, 1.4);
sun.position.set(18, 14, 120);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -50; sun.shadow.camera.right = 50;
sun.shadow.camera.top = 60; sun.shadow.camera.bottom = -40;
sun.shadow.camera.far = 300;
scene.add(sun);
scene.add(sun.target);

// the rising sun itself, low behind the mountain
const sunDisc = new THREE.Mesh(
  new THREE.SphereGeometry(9, 24, 24),
  new THREE.MeshBasicMaterial({ color: 0xffd9a0, fog: false }));
sunDisc.position.set(30, 4, 260);
scene.add(sunDisc);
const sunGlow = new THREE.Mesh(
  new THREE.SphereGeometry(26, 24, 24),
  new THREE.MeshBasicMaterial({ color: 0xff9a55, transparent: true,
                                opacity: 0.16, fog: false }));
sunGlow.position.copy(sunDisc.position);
scene.add(sunGlow);

// stars, fading with the dawn
const starGeo = new THREE.BufferGeometry();
{
  const pos = new Float32Array(900 * 3);
  for (let i = 0; i < 900; i++) {
    const a = Math.random() * Math.PI * 2, e = Math.random() * Math.PI * 0.45;
    const r = 380;
    pos[i * 3] = Math.cos(a) * Math.cos(e) * r;
    pos[i * 3 + 1] = Math.sin(e) * r + 10;
    pos[i * 3 + 2] = Math.sin(a) * Math.cos(e) * r;
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
}
const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
  color: 0xf2e3b3, size: 1.4, sizeAttenuation: false, transparent: true,
  opacity: 0.8, fog: false }));
scene.add(stars);

// ---------------------------------------------------------------- world --
// height: 0 on land; two water channels cut the path (jump them);
// hills funnel the walk toward the mountain
const CHANNELS = [[28, 31.4], [52, 55.8]];
function inChannel(z) { return CHANNELS.some(([a, b]) => z > a && z < b); }
function groundH(x, z) {
  if (inChannel(z) && Math.abs(x) < 16) return -4;
  let h = Math.sin(x * 0.18) * Math.cos(z * 0.13) * 0.25;
  if (Math.abs(x) > 12) h += (Math.abs(x) - 12) * 0.5;      // valley walls
  if (z < -2) h += (-2 - z) * 0.8;                          // behind: rise
  return h;
}

// the island ground, displaced to match groundH
{
  const g = new THREE.PlaneGeometry(120, 130, 96, 104);
  g.rotateX(-Math.PI / 2);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i) + 45;
    p.setZ(i, z);
    p.setY(i, inChannel(z) && Math.abs(x) < 16 ? -3.2 : groundH(x, z));
  }
  g.computeVertexNormals();
  const ground = new THREE.Mesh(g, new THREE.MeshStandardMaterial({
    color: 0x4a4434, roughness: 0.95 }));
  ground.receiveShadow = true;
  scene.add(ground);
}
// the path itself — lighter, with the lit edges that mean "walkable"
{
  const path = new THREE.Mesh(
    new THREE.PlaneGeometry(7, 120),
    new THREE.MeshStandardMaterial({ color: 0x6a6148, roughness: 0.9 }));
  path.rotateX(-Math.PI / 2);
  path.position.set(0, 0.03, 42);
  path.receiveShadow = true;
  scene.add(path);
  const edgeMat = new THREE.MeshStandardMaterial({
    color: 0xa8b060, emissive: 0x6a7030, emissiveIntensity: 0.7 });
  for (const sx of [-3.6, 3.6]) {
    const e = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.1, 120), edgeMat);
    e.position.set(sx, 0.08, 42);
    scene.add(e);
  }
}
// the sea
const sea = new THREE.Mesh(
  new THREE.CircleGeometry(400, 48),
  new THREE.MeshStandardMaterial({ color: 0x12283a, roughness: 0.35,
                                   metalness: 0.25 }));
sea.rotateX(-Math.PI / 2);
sea.position.y = -1.6;
scene.add(sea);

// THE MOUNTAIN — terraces stacked into the fog, filling the north sky
{
  const mat = new THREE.MeshStandardMaterial({ color: 0x3a4656, roughness: 1 });
  let r = 46, y = 0;
  for (let i = 0; i < 7; i++) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.82, r, 16, 40), mat);
    m.position.set(10, y + 8, 175);
    scene.add(m);
    r *= 0.78; y += 14.5;
  }
  // the summit light
  const tip = new THREE.Mesh(new THREE.SphereGeometry(3, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xfff2cc, fog: false }));
  tip.position.set(10, y + 12, 175);
  scene.add(tip);
}

// dark cypress trees + rocks, scattered off the path
{
  const treeMat = new THREE.MeshStandardMaterial({ color: 0x18251a, roughness: 1 });
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x565248, roughness: 1 });
  for (let i = 0; i < 34; i++) {
    const side = i % 2 ? 1 : -1;
    const x = side * (6.5 + (i * 7.3) % 9), z = (i * 13.7) % 88;
    if (inChannel(z)) continue;
    const t = new THREE.Mesh(new THREE.ConeGeometry(1.1 + (i % 3) * 0.4,
      5 + (i % 4) * 1.6, 8), treeMat);
    t.position.set(x, groundH(x, z) + 2.4, z);
    t.castShadow = true;
    scene.add(t);
  }
  for (let i = 0; i < 14; i++) {
    const x = (i % 2 ? 1 : -1) * (5 + (i * 5.1) % 10), z = (i * 19.3 + 8) % 86;
    if (inChannel(z)) continue;
    const rk = new THREE.Mesh(new THREE.DodecahedronGeometry(0.7 + (i % 3) * 0.5), rockMat);
    rk.position.set(x, groundH(x, z) + 0.4, z);
    rk.rotation.set(i, i * 2, 0);
    rk.castShadow = true;
    scene.add(rk);
  }
}

// fireflies of the dawn — drifting motes
const moteGeo = new THREE.BufferGeometry();
const motes = [];
{
  const pos = new Float32Array(120 * 3);
  for (let i = 0; i < 120; i++) {
    motes.push({ x: (Math.random() - 0.5) * 30, y: 0.6 + Math.random() * 3,
                 z: Math.random() * 90, p: Math.random() * 7 });
    pos[i * 3] = motes[i].x; pos[i * 3 + 1] = motes[i].y; pos[i * 3 + 2] = motes[i].z;
  }
  moteGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
}
const moteCloud = new THREE.Points(moteGeo, new THREE.PointsMaterial({
  color: 0xe8d9a0, size: 0.12, transparent: true, opacity: 0.8 }));
scene.add(moteCloud);

// the GATE at the mountain's foot — two pillars and a standing light
const GATE_Z = 86;
{
  const pmat = new THREE.MeshStandardMaterial({ color: 0x2a2f38, roughness: 0.8 });
  for (const sx of [-2.6, 2.6]) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(1.2, 9, 1.2), pmat);
    p.position.set(sx, 4.5, GATE_Z);
    p.castShadow = true;
    scene.add(p);
  }
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.6, 14, 24, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xfff2cc, transparent: true,
      opacity: 0.14, side: THREE.DoubleSide, depthWrite: false }));
  beam.position.set(0, 7, GATE_Z);
  scene.add(beam);
  const glow = new THREE.PointLight(0xffe8b0, 30, 30);
  glow.position.set(0, 3, GATE_Z);
  scene.add(glow);
}

// --------------------------------------------------------------- actors --
function makeFigure(coat, skin, cap) {
  const g = new THREE.Group();
  const cmat = new THREE.MeshStandardMaterial({ color: coat, roughness: 0.85 });
  const smat = new THREE.MeshStandardMaterial({ color: skin, roughness: 0.7 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 0.9, 6, 12), cmat);
  body.position.y = 1.0; body.castShadow = true;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.27, 16, 16), smat);
  head.position.y = 1.95; head.castShadow = true;
  g.add(body, head);
  if (cap) {
    const cm = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.12, 14),
      new THREE.MeshStandardMaterial({ color: 0x33383f }));
    cm.position.y = 2.14;
    g.add(cm);
  } else {
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 14,
      0, Math.PI * 2, 0, Math.PI * 0.45),
      new THREE.MeshStandardMaterial({ color: 0x14120f }));
    hair.position.y = 1.97;
    g.add(hair);
  }
  return g;
}
const dante = makeFigure(0x2a2f38, 0xc9986b, false);
// a soft warm fill so he reads against every backdrop
const fill = new THREE.PointLight(0xffd9b0, 4, 8);
fill.position.set(0.6, 2.6, -1.4);
dante.add(fill);
scene.add(dante);
const virgil = makeFigure(0x565b63, 0xc9986b, true);
virgil.position.set(1.6, 0, GATE_Z - 4);
virgil.rotation.y = Math.PI;
scene.add(virgil);
const lamp = new THREE.PointLight(0xe8a33d, 8, 12);
lamp.position.set(1.0, 1.4, GATE_Z - 4.6);
scene.add(lamp);

// ---------------------------------------------------------------- input --
const keys = {};
addEventListener('keydown', e => { keys[e.code] = true; audioInit(); });
addEventListener('keyup', e => { keys[e.code] = false; });
let dragYaw = 0, dragging = false, lastPX = 0;
let stickV = { x: 0, z: 0 }, stickOn = false, stickId = -1, stickBase = null;
addEventListener('pointerdown', e => {
  audioInit();
  if (e.clientX < innerWidth * 0.45 && e.pointerType !== 'mouse') {
    stickOn = true; stickId = e.pointerId;
    stickBase = { x: e.clientX, y: e.clientY };
  } else { dragging = true; lastPX = e.clientX; }
});
addEventListener('pointermove', e => {
  if (stickOn && e.pointerId === stickId) {
    stickV.x = Math.max(-1, Math.min(1, (e.clientX - stickBase.x) / 48));
    stickV.z = Math.max(-1, Math.min(1, (e.clientY - stickBase.y) / 48));
  } else if (dragging) {
    dragYaw -= (e.clientX - lastPX) * 0.004; lastPX = e.clientX;
  }
});
addEventListener('pointerup', e => {
  if (e.pointerId === stickId) { stickOn = false; stickV = { x: 0, z: 0 }; }
  dragging = false;
  if (e.pointerType !== 'mouse' && e.clientX >= innerWidth * 0.45 &&
      performance.now() - tapT < 220) doJump();
});
let tapT = 0;
addEventListener('pointerdown', e => {
  if (e.clientX >= innerWidth * 0.45 && e.pointerType !== 'mouse')
    tapT = performance.now();
});

// ---------------------------------------------------------------- audio --
let AC = null, master = null;
function audioInit() {
  if (AC) { AC.resume(); return; }
  try { AC = new (window.AudioContext || window.webkitAudioContext)(); }
  catch (e) { return; }
  master = AC.createGain(); master.gain.value = 0.4;
  master.connect(AC.destination);
  // the dawn pad — rising now, as the descent's fell
  const mk = (f, type, g0) => {
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = type; o.frequency.value = f; g.gain.value = g0;
    o.connect(g); g.connect(master); o.start();
    return o;
  };
  mk(87.3, 'sine', 0.05); mk(130.8, 'triangle', 0.024); mk(174.6, 'sine', 0.014);
  // gulls & surf: filtered noise
  const len = AC.sampleRate * 2, buf = AC.createBuffer(1, len, AC.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = AC.createBufferSource(); src.buffer = buf; src.loop = true;
  const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 420;
  const g = AC.createGain(); g.gain.value = 0.045;
  src.connect(f); f.connect(g); g.connect(master); src.start();
}
function tone(f0, f1, dur, type = 'sine', vol = 0.08) {
  if (!AC) return;
  const t0 = AC.currentTime, o = AC.createOscillator(), g = AC.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t0);
  o.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t0 + dur);
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + dur + 0.03);
}

// ------------------------------------------------------------ narration --
let subsOn = true;
try { subsOn = localStorage.getItem('inferno_subs') !== '0'; } catch (e) {}
const spoken = new Set();
const subEl = document.getElementById('sub');
const subTextEl = document.getElementById('subtext');
let subTimer = null;
function say(id, text) {
  if (spoken.has(id)) return;
  spoken.add(id);
  if (subsOn) {
    subTextEl.textContent = text;
    subEl.style.display = 'block';
    clearTimeout(subTimer);
    subTimer = setTimeout(() => { subEl.style.display = 'none'; },
                          Math.max(3200, text.length * 80));
  }
  try {
    if (window.speechSynthesis) {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.95; u.pitch = 0.8; u.volume = 0.9;
      speechSynthesis.speak(u);
    }
  } catch (e) {}
}

// ----------------------------------------------------------------- state --
const P = { x: 0, y: 0, z: 2, vy: 0, on: true, yaw: 0, run: 0, cp: 0 };
let T = 0, ended = false, deaths = 0;
const CHECKPOINTS = [2, 22, 44, 66];

function doJump() {
  if (P.on && !ended) { P.vy = 7.4; P.on = false; tone(200, 320, 0.09, 'sine', 0.05); }
}

setTimeout(() => { document.getElementById('card').style.opacity = 1; }, 400);
setTimeout(() => { document.getElementById('card').style.opacity = 0; }, 5200);
setTimeout(() => say('open',
  "We climbed out beneath a sky I had stopped believing in. Dawn, and the sea — and ahead of us, rising out of the water, the mountain. Virgil waited at its gate."), 1400);

// ------------------------------------------------------------------ loop --
let last = 0;
function frame(ts) {
  const dt = Math.min(0.05, (ts - last) / 1000 || 0.016);
  last = ts; T += dt;

  if (!ended) {
    // movement, camera-relative
    const fwd = (keys.KeyW || keys.ArrowUp ? 1 : 0) -
                (keys.KeyS || keys.ArrowDown ? 1 : 0) - stickV.z;
    const strafe = (keys.KeyD || keys.ArrowRight ? 1 : 0) -
                   (keys.KeyA || keys.ArrowLeft ? 1 : 0) + stickV.x;
    if (keys.Space) doJump();
    const running = keys.ShiftLeft || keys.ShiftRight || stickOn;
    const spd = (running ? 8.2 : 4.4);
    const mx = Math.max(-1, Math.min(1, strafe)), mz = Math.max(-1, Math.min(1, fwd));
    const mag = Math.hypot(mx, mz);
    if (mag > 0.05) {
      const dx = (Math.sin(dragYaw) * mz + Math.cos(dragYaw) * mx) / Math.max(1, mag);
      const dz = (Math.cos(dragYaw) * mz - Math.sin(dragYaw) * mx) / Math.max(1, mag);
      P.x += dx * spd * dt;
      P.z += dz * spd * dt;
      const tyaw = Math.atan2(dx, dz);
      let dy2 = tyaw - P.yaw;
      while (dy2 > Math.PI) dy2 -= Math.PI * 2;
      while (dy2 < -Math.PI) dy2 += Math.PI * 2;
      P.yaw += dy2 * Math.min(1, dt * 10);
      P.run += dt * (running ? 13 : 8);
    }
    P.x = Math.max(-18, Math.min(18, P.x));
    P.z = Math.max(-3, Math.min(GATE_Z + 2, P.z));
    // gravity & ground
    const gh = groundH(P.x, P.z);
    if (!P.on) {
      P.vy -= 22 * dt;
      P.y += P.vy * dt;
      if (P.vy < 0 && P.y <= gh) { P.y = gh; P.vy = 0; P.on = true;
        tone(150, 88, 0.07, 'triangle', 0.04); }
    } else {
      if (gh < P.y - 1.2) { P.on = false; P.vy = 0; }
      else P.y = gh;
    }
    // the water takes the careless — back to the last checkpoint
    if (P.y < -1.4) {
      deaths++;
      tone(150, 40, 0.5, 'triangle', 0.15);
      let cp = CHECKPOINTS[0];
      for (const c of CHECKPOINTS) if (c < P.z - 1) cp = c;
      P.x = 0; P.z = cp; P.y = groundH(0, cp); P.vy = 0; P.on = true;
    }
    // story beats
    if (P.z > 24) say('ch1',
      "The island was cut by tide-channels. The water here does not keep what it takes — but it takes.");
    if (P.z > 58) say('ch2',
      "Virgil stood at the gate at the mountain's foot, lamp in hand, waiting the way he always waited — as if I were the one guiding him.");
    // the gate ends the chapter
    if (P.z > GATE_Z - 3.5 && Math.abs(P.x) < 3.5) {
      ended = true;
      say('end2', "Here begins the second kingdom: the mountain where souls are made clean. But that is another climb.");
      document.getElementById('end').classList.add('on');
    }
  }

  // dawn advances slowly the whole chapter
  const dawn = Math.min(1, 0.2 + T / 55 + P.z / 160);
  stars.material.opacity = 0.8 * (1 - dawn * 0.9);
  sun.intensity = 1.2 + dawn * 1.0;
  hemi.intensity = 1.0 + dawn * 0.55;
  scene.fog.color.setHSL(0.62 - dawn * 0.08, 0.3, 0.18 + dawn * 0.12);
  scene.background.copy(scene.fog.color);

  // actors
  dante.position.set(P.x, P.y, P.z);
  dante.rotation.y = P.yaw;
  const bob = P.on ? Math.abs(Math.sin(P.run)) * 0.08 : 0.12;
  dante.children[0].position.y = 1.0 + bob;
  dante.children[1].position.y = 1.95 + bob;
  virgil.position.y = groundH(virgil.position.x, virgil.position.z);
  lamp.intensity = 7 + Math.sin(T * 2.1) * 1.2;
  sunGlow.material.opacity = 0.13 + Math.sin(T * 0.8) * 0.03;

  // motes drift
  const mp = moteGeo.attributes.position;
  for (let i = 0; i < motes.length; i++) {
    const m = motes[i];
    mp.setY(i, m.y + Math.sin(T * 0.8 + m.p) * 0.4);
    mp.setX(i, m.x + Math.sin(T * 0.5 + m.p * 2) * 0.6);
  }
  mp.needsUpdate = true;

  // sea breathes
  sea.position.y = -1.6 + Math.sin(T * 0.6) * 0.06;

  // camera: over the shoulder, drag to orbit
  const cd = 8.5, ch = 3.6;
  const cx = P.x - Math.sin(dragYaw) * cd;
  const cz = P.z - Math.cos(dragYaw) * cd;
  camera.position.lerp(new THREE.Vector3(cx, P.y + ch, cz), Math.min(1, dt * 5));
  camera.lookAt(P.x, P.y + 1.6, P.z + 2.5);
  sun.target.position.set(P.x, 0, P.z);

  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
window.G3 = { P, get ended() { return ended; }, get deaths() { return deaths; } };
requestAnimationFrame(frame);
