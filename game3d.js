// 3D Duck Chase game. Three.js scene, menu flow, player, duck AI, house.

import * as THREE from "three";
import { buildDuck, SKINS, animateDuckWalk, animateDuckSlip } from "./duck3d.js";

// ---------- DOM ----------
const canvas = document.getElementById("view");
const hud = document.getElementById("hud");
const menu = document.getElementById("menu");
const gameover = document.getElementById("gameover");
const timeEl = document.getElementById("time");
const bananasEl = document.getElementById("bananas");
const slipsEl = document.getElementById("slips");
const centerTip = document.getElementById("centerTip");
const playerNameInput = document.getElementById("playerName");
const duckNameInput = document.getElementById("duckName");
const playBtn = document.getElementById("playBtn");
const howBtn = document.getElementById("howBtn");
const howPanel = document.getElementById("howPanel");
const skinGrid = document.getElementById("skinGrid");
const playAgainBtn = document.getElementById("playAgainBtn");
const toMenuBtn = document.getElementById("toMenuBtn");
const gameoverTitle = document.getElementById("gameoverTitle");
const gameoverSub = document.getElementById("gameoverSub");

// ---------- Skin grid ----------
let selectedSkin = "mallard";
const SKIN_COLORS = {
  mallard: "linear-gradient(135deg,#2e7d48,#7a5a3a)",
  rubber: "linear-gradient(135deg,#ffe066,#ff8a1e)",
  murder: "linear-gradient(135deg,#1a1a1a,#7a0e0e)",
  banana: "linear-gradient(135deg,#fde047,#a16207)",
  zombie: "linear-gradient(135deg,#77a055,#3a4d1a)",
  ninja: "linear-gradient(135deg,#0a0d14,#f59e0b)",
  royal: "linear-gradient(135deg,#f5f5f5,#fbbf24)",
  chrome: "linear-gradient(135deg,#cbd5e1,#64748b)",
};

function buildSkinGrid() {
  skinGrid.innerHTML = "";
  for (const [id, s] of Object.entries(SKINS)) {
    const card = document.createElement("div");
    card.className = "skin-card";
    card.dataset.skin = id;
    card.innerHTML = `
      <div class="skin-swatch" style="background:${SKIN_COLORS[id] || "#222"}"></div>
      <div class="skin-name">${s.name}</div>
      <div class="skin-desc">${s.desc}</div>
    `;
    card.addEventListener("click", () => selectSkin(id));
    skinGrid.appendChild(card);
  }
  selectSkin(selectedSkin);
}
function selectSkin(id) {
  selectedSkin = id;
  [...skinGrid.children].forEach((c) =>
    c.classList.toggle("active", c.dataset.skin === id)
  );
}
buildSkinGrid();

howBtn.addEventListener("click", () => howPanel.classList.toggle("hidden"));
playBtn.addEventListener("click", startGame);
playAgainBtn.addEventListener("click", startGame);
toMenuBtn.addEventListener("click", () => {
  gameover.classList.add("hidden");
  menu.classList.remove("hidden");
  hud.classList.add("hidden");
  stopGame();
});

// ---------- Three.js core ----------
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x9ed0ea, 60, 160);

const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 400);

// ---------- Lights ----------
const sun = new THREE.DirectionalLight(0xfff1c8, 1.2);
sun.position.set(40, 60, 30);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -60;
sun.shadow.camera.right = 60;
sun.shadow.camera.top = 60;
sun.shadow.camera.bottom = -60;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 200;
scene.add(sun);
scene.add(new THREE.HemisphereLight(0xbfd7ff, 0x3a5a2a, 0.6));
scene.add(new THREE.AmbientLight(0xffffff, 0.25));

// ---------- World ----------
const WORLD = 120;
const world = new THREE.Group();
scene.add(world);

// Ground
{
  const tex = makeGrassTexture();
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(WORLD * 2, WORLD * 2, 1, 1),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  world.add(ground);
}

function makeGrassTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d");
  const grad = g.createLinearGradient(0, 0, 256, 256);
  grad.addColorStop(0, "#6fbf47");
  grad.addColorStop(1, "#4f9a2f");
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 500; i++) {
    g.fillStyle = `rgba(${30 + Math.random() * 30},${100 + Math.random() * 50},${30 + Math.random() * 40},0.5)`;
    g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(40, 40);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Trees scattered around
for (let i = 0; i < 30; i++) {
  const tree = makeTree();
  const angle = Math.random() * Math.PI * 2;
  const dist = 20 + Math.random() * (WORLD - 25);
  tree.position.set(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);
  tree.rotation.y = Math.random() * Math.PI * 2;
  world.add(tree);
}
function makeTree() {
  const t = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.5, 3.5, 10),
    new THREE.MeshStandardMaterial({ color: 0x6b4b2a, roughness: 0.9 })
  );
  trunk.position.y = 1.75;
  trunk.castShadow = true;
  t.add(trunk);
  const leaves = new THREE.Mesh(
    new THREE.SphereGeometry(2.2, 14, 10),
    new THREE.MeshStandardMaterial({ color: 0x3a8a2e, roughness: 0.8 })
  );
  leaves.position.y = 4.8;
  leaves.castShadow = true;
  t.add(leaves);
  return t;
}

// Rocks
for (let i = 0; i < 15; i++) {
  const rock = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.6 + Math.random() * 0.6),
    new THREE.MeshStandardMaterial({ color: 0x8a8a86, roughness: 1 })
  );
  const a = Math.random() * Math.PI * 2;
  const d = 10 + Math.random() * (WORLD - 15);
  rock.position.set(Math.cos(a) * d, 0.3, Math.sin(a) * d);
  rock.castShadow = true;
  rock.receiveShadow = true;
  world.add(rock);
}

// Clouds
for (let i = 0; i < 12; i++) {
  const cloud = makeCloud();
  cloud.position.set(
    (Math.random() - 0.5) * WORLD * 1.5,
    30 + Math.random() * 15,
    (Math.random() - 0.5) * WORLD * 1.5
  );
  world.add(cloud);
}
function makeCloud() {
  const g = new THREE.Group();
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1 });
  for (let i = 0; i < 4; i++) {
    const p = new THREE.Mesh(new THREE.SphereGeometry(2 + Math.random() * 1.5, 10, 8), m);
    p.position.set(i * 2 - 3, Math.random(), Math.random());
    g.add(p);
  }
  return g;
}

// ---------- Banana Hut ----------
const HOUSE_POS = new THREE.Vector3(-12, 0, -8);
const house = buildHouse();
house.position.copy(HOUSE_POS);
world.add(house);

function buildHouse() {
  const g = new THREE.Group();
  // Walls
  const wall = new THREE.Mesh(
    new THREE.BoxGeometry(6, 4, 6),
    new THREE.MeshStandardMaterial({ color: 0xe8c88a, roughness: 0.9 })
  );
  wall.position.y = 2;
  wall.castShadow = true;
  wall.receiveShadow = true;
  g.add(wall);
  // Roof
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(4.8, 2.8, 4),
    new THREE.MeshStandardMaterial({ color: 0xa04229, roughness: 0.8 })
  );
  roof.position.y = 5.4;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  g.add(roof);
  // Door
  const door = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 2.2, 0.1),
    new THREE.MeshStandardMaterial({ color: 0x5a3318, roughness: 0.8 })
  );
  door.position.set(0, 1.1, 3.05);
  g.add(door);
  // Doorknob
  const knob = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 10, 8),
    new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.7, roughness: 0.3 })
  );
  knob.position.set(0.4, 1.1, 3.11);
  g.add(knob);
  // Windows
  for (const x of [-2, 2]) {
    const w = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x9ed6f5, roughness: 0.3, metalness: 0.2 })
    );
    w.position.set(x, 2.5, 3.05);
    g.add(w);
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 0.08, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x5a3318 })
    );
    frame.position.set(x, 2.5, 3.07);
    g.add(frame);
  }
  // Sign
  const signBoard = new THREE.Mesh(
    new THREE.BoxGeometry(3, 0.8, 0.12),
    new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.6 })
  );
  signBoard.position.set(0, 3.6, 3.12);
  g.add(signBoard);
  const signTex = makeSignTexture("BANANA HUT");
  const signFace = new THREE.Mesh(
    new THREE.PlaneGeometry(2.9, 0.7),
    new THREE.MeshBasicMaterial({ map: signTex, transparent: true })
  );
  signFace.position.set(0, 3.6, 3.19);
  g.add(signFace);
  // Banana pile in front
  for (let i = 0; i < 5; i++) {
    const b = makeBanana();
    b.position.set(-1.5 + i * 0.4, 0.2, 4.2 + (i % 2) * 0.2);
    b.rotation.y = i * 0.5;
    g.add(b);
  }
  return g;
}
function makeSignTexture(text) {
  const c = document.createElement("canvas");
  c.width = 512; c.height = 128;
  const g = c.getContext("2d");
  g.fillStyle = "transparent";
  g.clearRect(0, 0, 512, 128);
  g.font = "bold 80px system-ui, sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillStyle = "#5a3318";
  g.fillText(text, 256, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function makeBanana() {
  const geom = new THREE.TorusGeometry(0.3, 0.1, 8, 16, Math.PI * 1.1);
  const m = new THREE.Mesh(geom, new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.6 }));
  m.rotation.z = Math.PI / 2;
  m.castShadow = true;
  return m;
}

// ---------- Player (simple 3D character) ----------
const player = {
  obj: new THREE.Group(),
  pos: new THREE.Vector3(10, 0, 10),
  vel: new THREE.Vector3(),
  speed: 10,
  facing: Math.PI,
  radius: 0.6,
  height: 1.8,
  walkPhase: 0,
};
buildPlayer();
world.add(player.obj);

function buildPlayer() {
  const g = player.obj;
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xf3d7b2, roughness: 0.8 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.7 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.8 });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x3b2e1a, roughness: 0.9 });
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.4), shirtMat);
  torso.position.y = 1.1; torso.castShadow = true; g.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), skinMat);
  head.position.y = 1.75; head.castShadow = true; g.add(head);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.29, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), hairMat);
  hair.position.y = 1.78; g.add(hair);
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.85, 0.18), shirtMat);
  armL.position.set(-0.46, 1.1, 0); armL.castShadow = true; armL.name = "armL"; g.add(armL);
  const armR = armL.clone(); armR.position.x = 0.46; armR.name = "armR"; g.add(armR);
  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.7, 0.22), pantsMat);
  legL.position.set(-0.18, 0.35, 0); legL.castShadow = true; legL.name = "legL"; g.add(legL);
  const legR = legL.clone(); legR.position.x = 0.18; legR.name = "legR"; g.add(legR);
}

// ---------- Duck ----------
let duck = null;
const duckState = {
  pos: new THREE.Vector3(-10, 0, -10),
  vel: new THREE.Vector3(),
  facing: 0,
  walkPhase: 0,
  slipTimer: 0,
  stunTimer: 0,
  spin: 0,
  tiltZ: 0,
  scale: 1.6, // duck is "big"
  speed: 7.5,
  radius: 1.4,
};

function spawnDuck() {
  if (duck) world.remove(duck);
  duck = buildDuck(selectedSkin);
  duck.scale.setScalar(duckState.scale);
  world.add(duck);
}

// ---------- Bananas / Peels ----------
const bananasAir = [];
const peels = [];
const particles = [];

function throwBanana() {
  if (!gameRunning) return;
  if (gameData.bananas <= 0) {
    flashTip("Out of peels! Run back to the Banana Hut.");
    return;
  }
  gameData.bananas--;
  bananasEl.textContent = gameData.bananas;
  const dir = new THREE.Vector3(Math.cos(player.facing), 0, Math.sin(player.facing));
  const proj = {
    obj: makeBanana(),
    pos: player.pos.clone().add(new THREE.Vector3(0, 1.2, 0)),
    vel: dir.clone().multiplyScalar(22).add(new THREE.Vector3(0, 7, 0)),
    rot: 0,
  };
  proj.obj.position.copy(proj.pos);
  world.add(proj.obj);
  bananasAir.push(proj);
}

function dropPeel(pos) {
  const g = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const strip = new THREE.Mesh(
      new THREE.ConeGeometry(0.15, 0.5, 6, 1, true),
      new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.5, side: THREE.DoubleSide })
    );
    const a = (i / 4) * Math.PI * 2;
    strip.position.set(Math.cos(a) * 0.2, 0.1, Math.sin(a) * 0.2);
    strip.rotation.z = Math.cos(a) * 0.8;
    strip.rotation.x = Math.sin(a) * 0.8;
    g.add(strip);
  }
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.15, 10, 8),
    new THREE.MeshStandardMaterial({ color: 0xfef3c7 })
  );
  core.position.y = 0.12;
  g.add(core);
  g.position.copy(pos);
  g.position.y = 0.05;
  world.add(g);
  peels.push({ obj: g, pos: g.position.clone(), used: false, age: 0 });
}

function spawnFeathers(pos, n, color) {
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 6, 5),
      new THREE.MeshStandardMaterial({ color, roughness: 0.7 })
    );
    m.scale.set(1, 0.3, 1);
    m.position.copy(pos);
    m.position.y += 1 + Math.random();
    world.add(m);
    particles.push({
      obj: m,
      vel: new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        2 + Math.random() * 3,
        (Math.random() - 0.5) * 4
      ),
      life: 1.5,
      age: 0,
    });
  }
}


// ---------- Game state ----------
const gameData = {
  time: 0,
  bananas: 5,
  slips: 0,
  playerName: "Player",
  duckName: "Sir Quackington",
};
let gameRunning = false;

// ---------- Input ----------
const keys = new Set();
window.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  keys.add(k);
  if (gameRunning) {
    if (k === " ") { e.preventDefault(); throwBanana(); }
    if (k === "r") startGame();
  }
});
window.addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));
canvas.addEventListener("mousedown", (e) => {
  if (!gameRunning) return;
  if (e.button === 0) throwBanana();
  if (e.button === 2) dragging = true;
});
canvas.addEventListener("mouseup", (e) => { if (e.button === 2) dragging = false; });
canvas.addEventListener("contextmenu", (e) => e.preventDefault());
let dragging = false;
let lastMouse = { x: 0, y: 0 };
canvas.addEventListener("mousemove", (e) => {
  if (dragging) {
    cameraYaw -= (e.clientX - lastMouse.x) * 0.004;
  }
  lastMouse = { x: e.clientX, y: e.clientY };
});

// ---------- Camera ----------
let cameraYaw = Math.PI * 0.25;
const cameraDistance = 12;
const cameraHeight = 7;

function updateCamera() {
  const tx = player.pos.x - Math.cos(cameraYaw) * cameraDistance;
  const tz = player.pos.z - Math.sin(cameraYaw) * cameraDistance;
  camera.position.set(tx, cameraHeight, tz);
  camera.lookAt(player.pos.x, player.pos.y + 1.5, player.pos.z);
}

// ---------- Resize ----------
function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);
resize();

// ---------- Start / Stop ----------
function startGame() {
  gameData.playerName = playerNameInput.value || "Player";
  gameData.duckName = duckNameInput.value || "Duck";
  gameData.time = 0;
  gameData.bananas = 5;
  gameData.slips = 0;
  timeEl.textContent = "0.0";
  bananasEl.textContent = gameData.bananas;
  slipsEl.textContent = "0";
  // Reset positions
  player.pos.set(10, 0, 10);
  player.vel.set(0, 0, 0);
  player.facing = Math.PI;
  duckState.pos.set(-20, 0, -15);
  duckState.vel.set(0, 0, 0);
  duckState.slipTimer = 0;
  duckState.stunTimer = 0;
  duckState.spin = 0;
  duckState.tiltZ = 0;
  // Clear peels and bananas
  for (const p of peels) world.remove(p.obj);
  for (const b of bananasAir) world.remove(b.obj);
  for (const p of particles) world.remove(p.obj);
  peels.length = 0;
  bananasAir.length = 0;
  particles.length = 0;
  spawnDuck();
  menu.classList.add("hidden");
  gameover.classList.add("hidden");
  hud.classList.remove("hidden");
  gameRunning = true;
  flashTip(`Run! ${gameData.duckName} is hungry.`);
}
function stopGame() {
  gameRunning = false;
}

function gameOver() {
  gameRunning = false;
  gameoverTitle.textContent = `${gameData.duckName} caught ${gameData.playerName}!`;
  gameoverSub.textContent = `Survived ${gameData.time.toFixed(1)}s — ${gameData.slips} slip${gameData.slips === 1 ? "" : "s"} caused.`;
  gameover.classList.remove("hidden");
  hud.classList.add("hidden");
}

let tipTimer = 0;
function flashTip(text) {
  centerTip.textContent = text;
  centerTip.classList.add("show");
  tipTimer = 2.2;
}

// ---------- Loop ----------
const clock = new THREE.Clock();
function loop() {
  const dt = Math.min(0.05, clock.getDelta());
  if (gameRunning) update(dt);
  updateCamera();
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}
loop();

function update(dt) {
  gameData.time += dt;
  timeEl.textContent = gameData.time.toFixed(1);

  // Player movement (camera-relative)
  let mx = 0, mz = 0;
  if (keys.has("w") || keys.has("arrowup")) mz += 1;
  if (keys.has("s") || keys.has("arrowdown")) mz -= 1;
  if (keys.has("a") || keys.has("arrowleft")) mx -= 1;
  if (keys.has("d") || keys.has("arrowright")) mx += 1;
  if (keys.has("q")) cameraYaw -= dt * 2;
  if (keys.has("e")) cameraYaw += dt * 2;

  if (mx || mz) {
    const len = Math.hypot(mx, mz);
    mx /= len; mz /= len;
    // Rotate input into camera space
    const fwdX = Math.cos(cameraYaw);
    const fwdZ = Math.sin(cameraYaw);
    const rgtX = -Math.sin(cameraYaw);
    const rgtZ = Math.cos(cameraYaw);
    const dx = fwdX * mz + rgtX * mx;
    const dz = fwdZ * mz + rgtZ * mx;
    player.pos.x += dx * player.speed * dt;
    player.pos.z += dz * player.speed * dt;
    player.facing = Math.atan2(dz, dx);
    player.walkPhase += dt * 10;
  }
  // Clamp to world
  const lim = WORLD - 5;
  player.pos.x = clamp(player.pos.x, -lim, lim);
  player.pos.z = clamp(player.pos.z, -lim, lim);
  player.obj.position.copy(player.pos);
  player.obj.rotation.y = -player.facing + Math.PI / 2;
  // Walk animation
  const armL = player.obj.getObjectByName("armL");
  const armR = player.obj.getObjectByName("armR");
  const legL = player.obj.getObjectByName("legL");
  const legR = player.obj.getObjectByName("legR");
  const sw = (mx || mz) ? Math.sin(player.walkPhase) * 0.5 : 0;
  if (armL) armL.rotation.x = sw;
  if (armR) armR.rotation.x = -sw;
  if (legL) legL.rotation.x = -sw;
  if (legR) legR.rotation.x = sw;

  // House pickup
  const distHouse = player.pos.distanceTo(HOUSE_POS);
  if (distHouse < 5 && gameData.bananas < 5) {
    gameData.bananas = 5;
    bananasEl.textContent = gameData.bananas;
    flashTip("Peels restocked!");
  }

  // Duck AI
  if (duckState.stunTimer > 0) {
    duckState.stunTimer -= dt;
    duckState.pos.addScaledVector(duckState.vel, dt);
    duckState.vel.multiplyScalar(0.93);
    duckState.spin += dt * 6;
    duckState.tiltZ = Math.min(Math.PI / 2, duckState.tiltZ + dt * 3);
  } else if (duckState.slipTimer > 0) {
    duckState.slipTimer -= dt;
    duckState.pos.addScaledVector(duckState.vel, dt);
    duckState.vel.multiplyScalar(0.9);
    duckState.spin += dt * 12;
    duckState.tiltZ += dt * 4;
    if (duckState.slipTimer <= 0) {
      duckState.stunTimer = 1.2;
      flashTip(`${gameData.duckName}: "QUAAACK?!"`);
    }
  } else {
    // Chase
    const dx = player.pos.x - duckState.pos.x;
    const dz = player.pos.z - duckState.pos.z;
    const len = Math.max(0.1, Math.hypot(dx, dz));
    duckState.vel.x = (dx / len) * duckState.speed;
    duckState.vel.z = (dz / len) * duckState.speed;
    duckState.pos.x += duckState.vel.x * dt;
    duckState.pos.z += duckState.vel.z * dt;
    duckState.facing = Math.atan2(dz, dx);
    duckState.walkPhase += dt * 6;
    duckState.tiltZ *= 0.85;
    duckState.spin *= 0.9;
    // Peel collision
    for (const p of peels) {
      if (p.used) continue;
      if (duckState.pos.distanceTo(p.pos) < duckState.radius + 0.5) {
        triggerSlip(p.pos);
        p.used = true;
      }
    }
  }

  if (duck) {
    duck.position.copy(duckState.pos);
    duck.rotation.y = -duckState.facing + Math.PI / 2;
    duck.rotation.z = duckState.tiltZ;
    if (duckState.slipTimer > 0 || duckState.stunTimer > 0) {
      animateDuckSlip(duck, duckState.spin, 1);
    } else {
      animateDuckWalk(duck, duckState.walkPhase, 1);
    }
  }

  // Catch check
  if (duckState.stunTimer <= 0 && duckState.slipTimer <= 0) {
    if (duckState.pos.distanceTo(player.pos) < duckState.radius + player.radius) {
      spawnFeathers(player.pos, 20, 0xffeecc);
      gameOver();
      return;
    }
  }

  // Bananas in flight
  for (const b of bananasAir) {
    b.vel.y -= 22 * dt;
    b.pos.addScaledVector(b.vel, dt);
    b.rot += dt * 10;
    b.obj.position.copy(b.pos);
    b.obj.rotation.y = b.rot;
    b.obj.rotation.z = b.rot * 0.5;
    // Direct duck hit
    if (duckState.slipTimer <= 0 && duckState.stunTimer <= 0) {
      const dd = b.pos.distanceTo(duckState.pos.clone().add(new THREE.Vector3(0, 2, 0)));
      if (dd < 1.5) {
        triggerSlip(duckState.pos);
        spawnFeathers(duckState.pos, 10, 0xfff7b0);
        b.pos.y = -10; // mark for removal
      }
    }
    if (b.pos.y <= 0.1) {
      dropPeel(b.pos);
      world.remove(b.obj);
    }
  }
  for (let i = bananasAir.length - 1; i >= 0; i--) {
    if (bananasAir[i].pos.y <= 0.1) bananasAir.splice(i, 1);
  }

  // Peel aging
  for (const p of peels) p.age += dt;
  for (let i = peels.length - 1; i >= 0; i--) {
    if (peels[i].used || peels[i].age > 15) {
      world.remove(peels[i].obj);
      peels.splice(i, 1);
    }
  }

  // Particles
  for (const p of particles) {
    p.age += dt;
    p.vel.y -= 8 * dt;
    p.obj.position.addScaledVector(p.vel, dt);
  }
  for (let i = particles.length - 1; i >= 0; i--) {
    if (particles[i].age > particles[i].life) {
      world.remove(particles[i].obj);
      particles.splice(i, 1);
    }
  }

  // Tip timer
  if (tipTimer > 0) {
    tipTimer -= dt;
    if (tipTimer <= 0) centerTip.classList.remove("show");
  }
}

function triggerSlip(origin) {
  const ax = duckState.pos.x - origin.x;
  const az = duckState.pos.z - origin.z;
  const len = Math.max(0.1, Math.hypot(ax, az));
  const boost = 10;
  duckState.vel.x = (ax / len) * boost + (Math.random() - 0.5) * 4;
  duckState.vel.z = (az / len) * boost + (Math.random() - 0.5) * 4;
  duckState.slipTimer = 1.0;
  duckState.spin = 0;
  gameData.slips++;
  slipsEl.textContent = gameData.slips;
  spawnFeathers(duckState.pos, 12, 0xfff0a0);
  flashTip(`${gameData.duckName} slipped!`);
}

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

