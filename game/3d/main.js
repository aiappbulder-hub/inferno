// PURGATORIO — the shore of the mountain. The story continues in 3D:
// out of the grate, onto the island at the foot of the mountain, at dawn.
// Same rules as below: teach then test, lit edges mean walkable,
// death is a splash and an instant return.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

const isCoarse = matchMedia('(pointer: coarse)').matches;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, isCoarse ? 1.6 : 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.45;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x141c2e);
scene.fog = new THREE.FogExp2(0x27324e, 0.012);

const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 500);

// modern pipeline: MSAA render target → bloom → tonemapped output
const composer = new EffectComposer(renderer,
  new THREE.WebGLRenderTarget(innerWidth, innerHeight,
    { samples: 4, type: THREE.HalfFloatType }));
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(
  new THREE.Vector2(innerWidth, innerHeight), 0.5, 0.55, 0.8);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// image-based lighting: materials pick up soft ambient reflections
{
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  if ('environmentIntensity' in scene) scene.environmentIntensity = 0.32;
}

// ------------------------------------------------------ canvas textures --
// procedural texture kitchen: wood grain, burlap, ground noise, sky
function canvasTex(w, h, draw, rx = 1, ry = 1) {
  const c2 = document.createElement('canvas');
  c2.width = w; c2.height = h;
  draw(c2.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c2);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const hex2css = n => '#' + n.toString(16).padStart(6, '0');
const woodCache = new Map();
function woodTex(base) {
  if (woodCache.has(base)) return woodCache.get(base);
  const t = canvasTex(128, 256, (g, w, h) => {
    g.fillStyle = hex2css(base); g.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) {                 // grain streaks
      const x = Math.random() * w, dark = Math.random() < 0.55;
      g.strokeStyle = dark ? 'rgba(20,10,4,0.14)' : 'rgba(255,225,180,0.07)';
      g.lineWidth = 0.5 + Math.random() * 2.2;
      g.beginPath(); g.moveTo(x, 0);
      g.bezierCurveTo(x + 6 - Math.random() * 12, h * 0.33,
                      x + 6 - Math.random() * 12, h * 0.66, x, h);
      g.stroke();
    }
    for (let i = 0; i < 4; i++) {                  // knots
      const x = Math.random() * w, y = Math.random() * h;
      g.strokeStyle = 'rgba(25,12,5,0.25)'; g.lineWidth = 1;
      for (let r = 2; r < 8; r += 2.2)
        g.beginPath(), g.ellipse(x, y, r, r * 1.7, 0, 0, 7), g.stroke();
    }
  }, 1.6, 1.6);
  woodCache.set(base, t);
  return t;
}
function clothTex(base) {
  return canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = hex2css(base); g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 3) {               // weave
      g.fillStyle = y % 6 ? 'rgba(0,0,0,0.09)' : 'rgba(255,240,210,0.05)';
      g.fillRect(0, y, w, 1.4);
    }
    for (let x = 0; x < w; x += 3)
      g.fillStyle = 'rgba(0,0,0,0.05)', g.fillRect(x, 0, 1.2, h);
    for (let i = 0; i < 300; i++)
      g.fillStyle = Math.random() < 0.5 ? 'rgba(0,0,0,0.1)' : 'rgba(255,235,200,0.06)',
      g.fillRect(Math.random() * w, Math.random() * h, 1.3, 1.3);
  }, 3, 3);
}
const groundTexture = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#4a4434'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 2400; i++) {
    const v = Math.random();
    g.fillStyle = v < 0.5 ? 'rgba(20,16,8,0.16)' : 'rgba(200,190,140,0.07)';
    g.fillRect(Math.random() * w, Math.random() * h,
               1 + Math.random() * 2.4, 1 + Math.random() * 1.6);
  }
  for (let i = 0; i < 26; i++) {                   // soil patches
    g.fillStyle = 'rgba(30,22,10,0.12)';
    g.beginPath();
    g.ellipse(Math.random() * w, Math.random() * h,
              6 + Math.random() * 22, 4 + Math.random() * 14,
              Math.random() * 3, 0, 7);
    g.fill();
  }
}, 22, 24);
// dawn sky dome — a real gradient sky instead of a flat clear color
const skyDome = new THREE.Mesh(
  new THREE.SphereGeometry(430, 32, 18),
  new THREE.MeshBasicMaterial({
    side: THREE.BackSide, fog: false, depthWrite: false,
    map: canvasTex(64, 512, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, '#0e1830');
      gr.addColorStop(0.42, '#2b3f60');
      gr.addColorStop(0.62, '#57688a');
      gr.addColorStop(0.74, '#b98d6e');
      gr.addColorStop(0.8, '#e0b285');
      gr.addColorStop(1, '#5a6a86');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    }),
  }));
skyDome.renderOrder = -10;
scene.add(skyDome);

// the real thing: Poly Haven's Venice-sunset HDRI (CC0) as both the sky
// and the light of the world — photographic dawn over water. The canvas
// dome stays as the file:// fallback.
if (location.protocol !== 'file:') {
  new RGBELoader().load('assets/venice_sunset_1k.hdr', tex => {
    tex.mapping = THREE.EquirectangularReflectionMapping;
    const pm = new THREE.PMREMGenerator(renderer);
    scene.environment = pm.fromEquirectangular(tex).texture;
    if ('environmentIntensity' in scene) scene.environmentIntensity = 0.6;
    scene.background = tex;
    scene.backgroundIntensity = 0.8;
    // blur the panorama's Venice skyline into pure dawn light —
    // the island should feel like the only land in the world
    scene.backgroundBlurriness = 0.22;
    if (scene.backgroundRotation) scene.backgroundRotation.set(0, Math.PI * 0.5, 0);
    if (scene.environmentRotation)
      scene.environmentRotation.copy(scene.backgroundRotation);
    skyDome.visible = false;
    sunDisc.visible = false;
    sunGlow.visible = false;
    stars.visible = false;
  }, undefined, () => {});
}

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
    map: groundTexture, roughness: 0.95 }));
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
  new THREE.MeshStandardMaterial({ color: 0x16324a, roughness: 0.12,
                                   metalness: 0.55 }));
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
// Articulated humanoids: a full joint hierarchy (pelvis, torso, neck/head,
// shoulders→elbows→hands, hips→knees→feet) driven by procedural walk /
// run / idle / jump cycles. Stylized, not photoreal — but they move like
// people, not pills.
function limbSeg(len, r, mat, jointM) {
  const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, Math.max(0.02, len - r * 2), 4, 10), mat);
  m.position.y = -len / 2;
  m.castShadow = true;
  g.add(m);
  if (jointM) {                      // the mannequin's visible ball joint
    const j = new THREE.Mesh(new THREE.SphereGeometry(r * 1.35, 10, 10), jointM);
    j.castShadow = true;
    g.add(j);
  }
  return g;
}
function makeHuman(o) {
  // wood grain on every wooden part — the mannequin reads as carved,
  // not extruded
  const coatM = new THREE.MeshStandardMaterial({ map: woodTex(o.coat), roughness: 0.8 });
  const trouM = new THREE.MeshStandardMaterial({ map: woodTex(o.trousers), roughness: 0.82 });
  const skinM = new THREE.MeshStandardMaterial({ map: woodTex(o.skin), roughness: 0.7 });
  const hairM = new THREE.MeshStandardMaterial({ color: o.hair, roughness: 0.95 });
  const shoeM = new THREE.MeshStandardMaterial({ map: woodTex(o.shoe ?? 0x15130f), roughness: 0.7 });
  const jointM = o.joint
    ? new THREE.MeshStandardMaterial({ map: woodTex(o.joint), roughness: 0.6 })
    : null;
  if (o.clothCoat) { coatM.map = clothTex(o.coat); coatM.roughness = 0.95; }

  const root = new THREE.Group();
  const parts = { arms: {}, legs: {} };

  const pelvis = new THREE.Group();
  pelvis.position.y = 1.02;
  root.add(pelvis);
  parts.pelvis = pelvis;
  const hips = new THREE.Mesh(new THREE.CapsuleGeometry(0.185, 0.1, 4, 10), trouM);
  hips.rotation.z = Math.PI / 2; hips.castShadow = true;
  pelvis.add(hips);

  const torso = new THREE.Group();
  pelvis.add(torso);
  parts.torso = torso;
  const chest = new THREE.Mesh(new THREE.CapsuleGeometry(0.21, 0.3, 4, 12), coatM);
  chest.position.y = 0.42; chest.castShadow = true;
  torso.add(chest);
  parts.chest = chest;
  // the overcoat's skirt, flaring past the hips
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.225, 0.29, 0.4, 12), coatM);
  skirt.position.y = 0.08; skirt.castShadow = true;
  torso.add(skirt);

  // neck + head with a face
  const neck = new THREE.Group();
  neck.position.y = 0.68;
  torso.add(neck);
  parts.head = neck;
  const throat = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.09, 8), skinM);
  throat.position.y = 0.03; throat.castShadow = true;
  neck.add(throat);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.15, 20, 18), skinM);
  skull.position.y = 0.17; skull.scale.y = 1.12; skull.castShadow = true;
  neck.add(skull);
  for (const sx of [-0.055, 0.055]) {               // eyes
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.017, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0x1a130c, roughness: 0.3 }));
    eye.position.set(sx, 0.19, 0.132);
    neck.add(eye);
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.012, 0.02), hairM);
    brow.position.set(sx, 0.225, 0.132);
    neck.add(brow);
  }
  const nose = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.05, 0.035), skinM);
  nose.position.set(0, 0.155, 0.145);
  neck.add(nose);
  if (o.tophat) {                                    // Virgil's top hat
    const hatM = new THREE.MeshStandardMaterial({ color: 0x241f1c, roughness: 0.85 });
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.125, 0.24, 16), hatM);
    crown.position.y = 0.4; crown.castShadow = true;
    neck.add(crown);
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.185, 0.185, 0.02, 18), hatM);
    brim.position.y = 0.285; brim.castShadow = true;
    neck.add(brim);
  } else {                                           // carved bowl hair
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.158, 18, 14,
      0, Math.PI * 2, 0, Math.PI * 0.58), hairM);
    hair.position.y = 0.18; hair.scale.y = 1.08;
    hair.rotation.x = -0.12; hair.castShadow = true;
    neck.add(hair);
  }
  if (o.cape) {                                      // the traveler's cape
    const capeM = new THREE.MeshStandardMaterial({ map: clothTex(o.cape),
      roughness: 1, side: THREE.DoubleSide });
    const cape = new THREE.Mesh(
      new THREE.ConeGeometry(0.36, 0.98, 10, 1, true), capeM);
    cape.scale.z = 0.5;
    cape.position.set(0, 0.28, -0.1);
    cape.castShadow = true;
    torso.add(cape);
    parts.cape = cape;
    // the mantle over the shoulders
    const mantle = new THREE.Mesh(
      new THREE.ConeGeometry(0.3, 0.3, 10, 1, true), capeM);
    mantle.position.y = 0.62;
    mantle.castShadow = true;
    torso.add(mantle);
  }

  // arms: shoulder → elbow → hand
  for (const [key, sx] of [['L', -0.255], ['R', 0.255]]) {
    const sh = new THREE.Group();
    sh.position.set(sx, 0.58, 0);
    torso.add(sh);
    const upper = limbSeg(0.32, 0.06, o.bareArms ? skinM : coatM, jointM);
    sh.add(upper);
    const el = new THREE.Group();
    el.position.y = -0.32;
    upper.add(el);
    const fore = limbSeg(0.28, 0.05, o.bareArms ? skinM : coatM, jointM);
    el.add(fore);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 10), skinM);
    hand.position.y = -0.29; hand.castShadow = true;
    fore.add(hand);
    parts.arms[key] = { sh, el, hand };
  }
  // legs: hip → knee → foot
  for (const [key, sx] of [['L', -0.105], ['R', 0.105]]) {
    const hip = new THREE.Group();
    hip.position.set(sx, -0.02, 0);
    pelvis.add(hip);
    const thigh = limbSeg(0.5, 0.082, trouM, jointM);
    hip.add(thigh);
    const knee = new THREE.Group();
    knee.position.y = -0.5;
    thigh.add(knee);
    const shin = limbSeg(0.48, 0.06, trouM, jointM);
    knee.add(shin);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.07, 0.23), shoeM);
    foot.position.set(0, -0.475, 0.055); foot.castShadow = true;
    shin.add(foot);
    parts.legs[key] = { hip, knee };
  }
  return { root, parts };
}

// the animation brain: one function, four gaits blended by move/run/air
function animateHuman(h, a) {
  const p = h.parts, ph = a.phase, mv = a.move, rn = a.run;
  const L = p.legs.L, R = p.legs.R, AL = p.arms.L, AR = p.arms.R;
  if (!a.grounded) {
    // airborne: tuck the leading leg, trail the other, arms out for balance
    L.hip.rotation.x = -0.85; L.knee.rotation.x = 1.15;
    R.hip.rotation.x = 0.35; R.knee.rotation.x = 0.55;
    AL.sh.rotation.x = -0.9; AL.el.rotation.x = -0.35;
    AR.sh.rotation.x = 0.4; AR.el.rotation.x = -0.6;
    p.torso.rotation.x = 0.14;
    p.pelvis.position.y = 1.02;
  } else {
    const swing = Math.sin(ph), cswing = Math.sin(ph + Math.PI);
    const amp = mv * (0.42 + 0.35 * rn);
    // legs: hips scissor; the knee folds during its leg's swing-through
    L.hip.rotation.x = swing * amp;
    R.hip.rotation.x = cswing * amp;
    L.knee.rotation.x = Math.max(0, Math.sin(ph + 1.1)) * mv * (0.55 + 0.85 * rn);
    R.knee.rotation.x = Math.max(0, Math.sin(ph + Math.PI + 1.1)) * mv * (0.55 + 0.85 * rn);
    // arms counter-swing, elbows carried higher at a run
    AL.sh.rotation.x = cswing * amp * 0.85;
    AR.sh.rotation.x = swing * amp * 0.85;
    AL.el.rotation.x = -(0.18 + 0.75 * rn * mv +
                         Math.max(0, Math.sin(ph)) * 0.25 * mv);
    AR.el.rotation.x = -(0.18 + 0.75 * rn * mv +
                         Math.max(0, Math.sin(ph + Math.PI)) * 0.25 * mv);
    // torso: forward lean with speed, counter-twist against the hips,
    // and quiet breathing when still
    p.torso.rotation.x = 0.03 + (0.06 + 0.14 * rn) * mv;
    p.torso.rotation.y = swing * 0.1 * mv;
    p.pelvis.rotation.y = -swing * 0.08 * mv;
    p.pelvis.position.y = 1.02 + Math.abs(Math.sin(ph)) * 0.05 * mv +
                          Math.sin(a.t * 1.7) * 0.006 * (1 - mv);
    p.chest.scale.setScalar(1 + Math.sin(a.t * 1.7) * 0.015 * (1 - mv));
    // head steadies against the bob
    p.head.rotation.x = -p.torso.rotation.x * 0.5;
    if (!a.headYawOverride) p.head.rotation.y *= 0.9;
    // idle arms hang with a small sway
    if (mv < 0.05) {
      AL.sh.rotation.x = Math.sin(a.t * 1.1) * 0.03;
      AR.sh.rotation.x = Math.sin(a.t * 1.1 + 2) * 0.03;
      AL.sh.rotation.z = 0.07; AR.sh.rotation.z = -0.07;
    } else { AL.sh.rotation.z = 0.04; AR.sh.rotation.z = -0.04; }
  }
  if (p.cape) {          // the cape trails with speed, lifts in the air
    p.cape.rotation.x = 0.05 + mv * 0.28 + Math.sin(ph) * 0.05 * mv +
                        (a.grounded ? 0 : 0.3);
  }
}

// DANTE — a dark-walnut artist's mannequin under a rough burlap cape
const danteH = makeHuman({
  coat: 0x5c4132, trousers: 0x4e3628, skin: 0x6b4a33, hair: 0x241610,
  joint: 0x3a2a1d, shoe: 0x33241a, bareArms: true,
  cape: 0xa39478, tophat: false,
});
const dante = danteH.root;
// a soft warm fill so he reads against every backdrop
const fill = new THREE.PointLight(0xffd9b0, 10, 9);
fill.position.set(0.4, 2.8, -2.0);
dante.add(fill);
scene.add(dante);

// VIRGIL — lighter oak, belted khaki greatcoat, top hat, and an Edison
// bulb held up on its wire: his lamp, as the renders have it
const virgilH = makeHuman({
  coat: 0x8f8266, trousers: 0x6e5138, skin: 0x96704c, hair: 0x8a8578,
  joint: 0x59422e, shoe: 0x2b2019, tophat: true, clothCoat: true,
});
const virgil = virgilH.root;
virgil.position.set(1.6, 0, GATE_Z - 4);
virgil.rotation.y = Math.PI;
scene.add(virgil);
{
  const vr = virgilH.parts.arms.R;
  vr.sh.rotation.x = -0.95; vr.el.rotation.x = -0.25;
  const glass = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 14),
    new THREE.MeshStandardMaterial({ color: 0xfff2cc, transparent: true,
      opacity: 0.28, roughness: 0.1 }));
  glass.position.y = -0.16; glass.scale.y = 1.25;
  vr.hand.add(glass);
  const filament = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.06, 6),
    new THREE.MeshStandardMaterial({ color: 0xffc873,
      emissive: 0xffb84d, emissiveIntensity: 3.2 }));
  filament.position.y = -0.16;
  vr.hand.add(filament);
  const socket = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.032, 0.05, 8),
    new THREE.MeshStandardMaterial({ color: 0x6b5a3a, metalness: 0.5,
      roughness: 0.5 }));
  socket.position.y = -0.075;
  vr.hand.add(socket);
}
const lamp = new THREE.PointLight(0xffc873, 9, 13);
lamp.position.y = -0.18;
virgilH.parts.arms.R.hand.add(lamp);

// -------------------------------------------------------- real 3D models --
// Drop a rigged GLB (Blender/Mixamo/Meshy export) at models/dante.glb and
// it replaces the mannequin. Animation clips named *idle*/*walk*/*run*
// (case-insensitive) are blended by the same movement state that drives
// the procedural rig. No file → the mannequin plays on.
let mixer = null;
const acts = {};
if (location.protocol !== 'file:')   // over file:// the probe can't work
new GLTFLoader().load('models/dante.glb', gltf => {
  const m = gltf.scene;
  const box = new THREE.Box3().setFromObject(m);
  m.scale.setScalar(2.05 / Math.max(0.001, box.max.y - box.min.y));
  m.position.y = 0;
  m.traverse(n => { if (n.isMesh) n.castShadow = true; });
  dante.add(m);
  danteH.parts.pelvis.visible = false;
  mixer = new THREE.AnimationMixer(m);
  for (const clip of gltf.animations) {
    const n = clip.name.toLowerCase();
    if (n.includes('run')) acts.run = mixer.clipAction(clip);
    else if (n.includes('walk')) acts.walk = mixer.clipAction(clip);
    else if (n.includes('idle')) acts.idle = mixer.clipAction(clip);
  }
  for (const a of Object.values(acts)) { a.play(); a.setEffectiveWeight(0); }
  (acts.idle || Object.values(acts)[0])?.setEffectiveWeight(1);
}, undefined, () => { /* no model shipped — mannequin it is */ });

// a fox of the shore (Khronos sample, CC0 model / CC-BY rig) — ambles the
// safe strip between the channels, bolts when Dante comes close
let fox = null, foxMixer = null;
const foxActs = {};
const foxS = { x: -9, z: 38, dir: 1 };
if (location.protocol !== 'file:')
new GLTFLoader().load('assets/Fox.glb', g => {
  fox = g.scene;
  fox.scale.setScalar(0.012);
  fox.traverse(n => { if (n.isMesh) n.castShadow = true; });
  scene.add(fox);
  foxMixer = new THREE.AnimationMixer(fox);
  for (const c of g.animations)
    foxActs[c.name.toLowerCase()] = foxMixer.clipAction(c);
  (foxActs.walk || Object.values(foxActs)[0])?.play();
}, undefined, () => {});

// ---------------------------------------------------------------- input --
const keys = {};
addEventListener('keydown', e => { keys[e.code] = true; audioInit(); });
addEventListener('keyup', e => { keys[e.code] = false; });

let dragYaw = 0, dragging = false, lastPX = 0;
let stickV = { x: 0, z: 0 };

// --- visible touch controls: a real on-screen stick + jump button ---
const stickEl = document.getElementById('stick');
const nubEl = document.getElementById('nub');
const jumpEl = document.getElementById('jump');
let stickId = -1, stickBase = null;
let jumpId = -1;

function showTouchUI() { document.body.classList.add('touch'); }
// don't wait for a mystery gesture to reveal the controls — if the
// device can touch, show them from the first frame
if ('ontouchstart' in window || navigator.maxTouchPoints > 0 ||
    matchMedia('(pointer: coarse)').matches) showTouchUI();

// the stick: fixed at bottom-left, drag anywhere near it to steer
stickEl.addEventListener('pointerdown', e => {
  e.preventDefault(); audioInit(); showTouchUI();
  stickId = e.pointerId;
  const r = stickEl.getBoundingClientRect();
  stickBase = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  stickEl.setPointerCapture(stickId);
});
stickEl.addEventListener('pointermove', e => {
  if (e.pointerId !== stickId || !stickBase) return;
  const dx = e.clientX - stickBase.x, dy = e.clientY - stickBase.y;
  const max = 40, d = Math.min(1, Math.hypot(dx, dy) / max);
  const a = Math.atan2(dy, dx);
  stickV.x = Math.cos(a) * d; stickV.z = Math.sin(a) * d;
  nubEl.style.transform = `translate(${Math.cos(a) * d * max}px, ${Math.sin(a) * d * max}px)`;
});
function stickRelease(e) {
  if (e.pointerId !== stickId) return;
  stickId = -1; stickV = { x: 0, z: 0 };
  nubEl.style.transform = 'translate(0,0)';
}
stickEl.addEventListener('pointerup', stickRelease);
stickEl.addEventListener('pointercancel', stickRelease);

// the jump button: tap it, plain and visible
jumpEl.addEventListener('pointerdown', e => {
  e.preventDefault(); audioInit(); showTouchUI();
  jumpId = e.pointerId; jumpEl.classList.add('held'); doJump();
});
function jumpRelease(e) {
  if (e.pointerId !== jumpId) return;
  jumpId = -1; jumpEl.classList.remove('held');
}
jumpEl.addEventListener('pointerup', jumpRelease);
jumpEl.addEventListener('pointercancel', jumpRelease);

// dragging anywhere else on the canvas orbits the camera
renderer.domElement.addEventListener('pointerdown', e => {
  audioInit(); dragging = true; lastPX = e.clientX;
});
addEventListener('pointermove', e => {
  if (dragging) { dragYaw -= (e.clientX - lastPX) * 0.004; lastPX = e.clientX; }
});
addEventListener('pointerup', () => { dragging = false; });

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
    // on the stick, pushing it further out runs; a light touch walks
    const stickMag = Math.hypot(stickV.x, stickV.z);
    const running = keys.ShiftLeft || keys.ShiftRight || stickMag > 0.6;
    const spd = (running ? 8.2 : 4.4);
    const mx = Math.max(-1, Math.min(1, strafe)), mz = Math.max(-1, Math.min(1, fwd));
    const mag = Math.hypot(mx, mz);
    if (mag > 0.05) {
      // camera forward is (sin yaw, cos yaw); screen-right is its cross
      // with up = (-cos yaw, sin yaw) — so D/stick-right goes screen-right
      const dx = (Math.sin(dragYaw) * mz - Math.cos(dragYaw) * mx) / Math.max(1, mag);
      const dz = (Math.cos(dragYaw) * mz + Math.sin(dragYaw) * mx) / Math.max(1, mag);
      P.x += dx * spd * dt;
      P.z += dz * spd * dt;
      const tyaw = Math.atan2(dx, dz);
      let dy2 = tyaw - P.yaw;
      while (dy2 > Math.PI) dy2 -= Math.PI * 2;
      while (dy2 < -Math.PI) dy2 += Math.PI * 2;
      P.yaw += dy2 * Math.min(1, dt * 10);
      P.run += dt * (running ? 13 : 8);
      P.moveT = 1; P.runT = running ? 1 : 0;
    } else { P.moveT = 0; P.runT = 0; }
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
  if (scene.background && scene.background.isColor)   // HDR sky owns it once loaded
    scene.background.copy(scene.fog.color);

  // actors — the rigs do the acting
  P.moveS = (P.moveS || 0) + ((P.moveT || 0) - (P.moveS || 0)) * Math.min(1, dt * 9);
  P.runS = (P.runS || 0) + ((P.runT || 0) - (P.runS || 0)) * Math.min(1, dt * 6);
  dante.position.set(P.x, P.y, P.z);
  // bank into turns: the body leans against the yaw rate
  const yawRate = (P.yaw - (P.lastYaw ?? P.yaw)) / Math.max(dt, 0.001);
  P.lastYaw = P.yaw;
  P.bank = (P.bank || 0) + (Math.max(-0.16, Math.min(0.16, -yawRate * 0.05))
           - (P.bank || 0)) * Math.min(1, dt * 6);
  dante.rotation.set(0, P.yaw, P.bank * P.moveS);
  animateHuman(danteH, { t: T, phase: P.run, move: P.moveS, run: P.runS,
                         grounded: P.on });
  if (mixer) {                       // a real model is riding this state
    mixer.update(dt);
    acts.idle?.setEffectiveWeight(1 - P.moveS);
    acts.walk?.setEffectiveWeight(P.moveS * (1 - P.runS));
    acts.run?.setEffectiveWeight(P.moveS * P.runS);
  }
  // footsteps land where the stride lands
  const stepSign = Math.sin(P.run) >= 0 ? 1 : -1;
  if (P.on && P.moveS > 0.4 && stepSign !== (P.lastStep ?? stepSign)) {
    tone(stepSign > 0 ? 95 : 88, 55, 0.06, 'triangle', 0.05);
  }
  P.lastStep = stepSign;
  // Virgil: breathing idle, lamp arm held, head turning to watch Dante come
  virgil.position.y = groundH(virgil.position.x, virgil.position.z);
  animateHuman(virgilH, { t: T + 3.1, phase: 0, move: 0, run: 0,
                          grounded: true, headYawOverride: true });
  const va = virgilH.parts.arms.R;
  va.sh.rotation.x = -0.95 + Math.sin(T * 1.4) * 0.03;  // the bulb, held high
  va.el.rotation.x = -0.25;
  {
    const wy = Math.atan2(P.x - virgil.position.x, P.z - virgil.position.z);
    let hd = wy - virgil.rotation.y - virgilH.parts.head.rotation.y;
    while (hd > Math.PI) hd -= Math.PI * 2;
    while (hd < -Math.PI) hd += Math.PI * 2;
    const near = P.z > GATE_Z - 30;
    const tgt = near ? Math.max(-0.75, Math.min(0.75,
      virgilH.parts.head.rotation.y + hd)) : 0;
    virgilH.parts.head.rotation.y +=
      (tgt - virgilH.parts.head.rotation.y) * Math.min(1, dt * 3);
  }
  lamp.intensity = 7 + Math.sin(T * 2.1) * 1.2;
  if (fox && foxMixer) {
    const near = Math.hypot(P.x - foxS.x, P.z - foxS.z) < 6;
    if (near && foxActs.run && !foxActs.run.isRunning()) {
      foxActs.walk?.stop(); foxActs.run.play();
    } else if (!near && foxActs.walk && !foxActs.walk.isRunning()) {
      foxActs.run?.stop(); foxActs.walk.play();
    }
    foxS.x += foxS.dir * (near ? 4.6 : 1.1) * dt;
    if (foxS.x > 10) foxS.dir = -1;
    if (foxS.x < -10) foxS.dir = 1;
    fox.position.set(foxS.x, groundH(foxS.x, foxS.z), foxS.z);
    fox.rotation.y = foxS.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
    foxMixer.update(dt);
  }
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

  // camera: over the shoulder, drag to orbit — close enough to see a face
  const cd = 7.0, ch = 3.0;
  const cx = P.x - Math.sin(dragYaw) * cd;
  const cz = P.z - Math.cos(dragYaw) * cd;
  camera.position.lerp(new THREE.Vector3(cx, P.y + ch, cz), Math.min(1, dt * 5));
  camera.lookAt(P.x, P.y + 1.6, P.z + 2.5);
  sun.target.position.set(P.x, 0, P.z);

  composer.render();
  requestAnimationFrame(frame);
}
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
  bloom.setSize(innerWidth, innerHeight);
});
window.G3 = { P, foxS, get fox() { return !!fox; },
              get ended() { return ended; }, get deaths() { return deaths; } };
requestAnimationFrame(frame);
