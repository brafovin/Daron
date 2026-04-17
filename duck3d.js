// 3D duck builder. Exports buildDuck(skinId) -> THREE.Group and SKINS catalog.

import * as THREE from "three";

export const SKINS = {
  mallard: {
    name: "Mallard",
    desc: "Classic realistic duck",
    body: 0x6b4a2b,
    head: 0x155c3a,
    beak: 0xd4a437,
    wing: 0x4a3219,
    eye: 0x0a0a0a,
    neckRing: true,
    breast: 0x5a2a18,
    specular: 0x333333,
    roughness: 0.6,
    accessory: null,
  },
  rubber: {
    name: "Rubber",
    desc: "Glossy bath duck",
    body: 0xffd835,
    head: 0xffd835,
    beak: 0xff8a1e,
    wing: 0xf4b400,
    eye: 0x0a0a0a,
    roughness: 0.25,
    metalness: 0.0,
    accessory: null,
  },
  murder: {
    name: "Murder",
    desc: "Blood. Knife. Eek.",
    body: 0x151515,
    head: 0x1a1a1a,
    beak: 0x7a0e0e,
    wing: 0x0b0b0b,
    eye: 0xff1212,
    roughness: 0.8,
    accessory: "knife_blood",
  },
  banana: {
    name: "Banana Peel",
    desc: "Iconic. Slippery.",
    body: 0xfde047,
    head: 0xfde047,
    beak: 0xa16207,
    wing: 0xfacc15,
    eye: 0x1a1a1a,
    roughness: 0.5,
    accessory: "peel_hood",
  },
  zombie: {
    name: "Zombie",
    desc: "Undead waterfowl",
    body: 0x77a055,
    head: 0x668a44,
    beak: 0x8a6a3a,
    wing: 0x557a38,
    eye: 0xf5f5c0,
    roughness: 0.85,
    accessory: "stitches",
  },
  ninja: {
    name: "Ninja",
    desc: "Silent but quacky",
    body: 0x151822,
    head: 0x101218,
    beak: 0xf59e0b,
    wing: 0x0a0d14,
    eye: 0xf8fafc,
    roughness: 0.4,
    accessory: "headband",
  },
  royal: {
    name: "Royal",
    desc: "Wears an actual crown",
    body: 0xf5f5f5,
    head: 0xf5f5f5,
    beak: 0xf59e0b,
    wing: 0xe5e7eb,
    eye: 0x0f172a,
    roughness: 0.5,
    accessory: "crown",
  },
  chrome: {
    name: "Chrome",
    desc: "Too shiny to touch",
    body: 0xcbd5e1,
    head: 0xcbd5e1,
    beak: 0xf59e0b,
    wing: 0x94a3b8,
    eye: 0x0a0a0a,
    roughness: 0.1,
    metalness: 0.95,
    accessory: null,
  },
};

function mat(color, roughness = 0.6, metalness = 0.0) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness,
    flatShading: false,
  });
}

/**
 * Build a stylized but believable duck as a THREE.Group.
 * The group's pivot is at the ground under the feet; "forward" is +X.
 */
export function buildDuck(skinId = "mallard") {
  const skin = SKINS[skinId] || SKINS.mallard;
  const roughness = skin.roughness ?? 0.6;
  const metalness = skin.metalness ?? 0.0;

  const root = new THREE.Group();
  root.name = `duck:${skinId}`;

  const bodyMat = mat(skin.body, roughness, metalness);
  const headMat = mat(skin.head ?? skin.body, roughness, metalness);
  const beakMat = mat(skin.beak, Math.max(0.35, roughness - 0.2), metalness);
  const wingMat = mat(skin.wing, roughness, metalness);
  const eyeWhiteMat = mat(0xffffff, 0.25, 0.0);
  const eyeMat = mat(skin.eye, 0.2, 0.2);
  const legMat = mat(skin.beak, 0.55, 0.0);

  // ---- Body (boat-shaped, wider at the chest, tapering to tail) ----
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(1, 32, 24),
    bodyMat
  );
  body.scale.set(1.7, 1.05, 1.1);
  body.position.set(0.05, 1.1, 0);
  body.castShadow = true;
  body.receiveShadow = true;
  root.add(body);

  // Belly — flatter underside (subtle lighter patch)
  const belly = new THREE.Mesh(
    new THREE.SphereGeometry(0.95, 24, 16),
    mat(lighten(skin.body, 0.1), roughness, metalness)
  );
  belly.scale.set(1.4, 0.45, 1.0);
  belly.position.set(0.15, 0.55, 0);
  root.add(belly);

  // Rump / back hump (gives the classic duck silhouette)
  const rump = new THREE.Mesh(
    new THREE.SphereGeometry(0.72, 20, 16),
    bodyMat
  );
  rump.scale.set(1.2, 0.75, 0.95);
  rump.position.set(-0.7, 1.45, 0);
  rump.castShadow = true;
  root.add(rump);

  // Breast patch (mallard-only)
  if (skin.breast) {
    const breast = new THREE.Mesh(
      new THREE.SphereGeometry(0.6, 20, 16),
      mat(skin.breast, roughness)
    );
    breast.scale.set(1.0, 0.9, 0.9);
    breast.position.set(0.9, 1.1, 0);
    breast.castShadow = true;
    root.add(breast);
  }

  // ---- Neck ----
  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.34, 0.46, 0.9, 20),
    headMat
  );
  neck.rotation.z = -0.55;
  neck.position.set(1.0, 1.75, 0);
  neck.castShadow = true;
  root.add(neck);

  // White neck ring for mallards
  if (skin.neckRing) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.38, 0.09, 12, 24),
      mat(0xf5f5f5, 0.5)
    );
    ring.rotation.x = Math.PI / 2;
    ring.rotation.z = -0.55;
    ring.position.set(1.15, 1.95, 0);
    root.add(ring);
  }

  // ---- Head ----
  const head = new THREE.Group();
  head.position.set(1.45, 2.25, 0);
  root.add(head);

  const skull = new THREE.Mesh(
    new THREE.SphereGeometry(0.72, 28, 22),
    headMat
  );
  skull.scale.set(1.0, 0.95, 0.95);
  skull.castShadow = true;
  head.add(skull);

  // Forehead highlight (subtle second sphere with lighter material)
  const foreheadCol = lighten(skin.head ?? skin.body, 0.12);
  const forehead = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 20, 16),
    mat(foreheadCol, roughness)
  );
  forehead.position.set(0.1, 0.22, 0);
  forehead.scale.set(0.9, 0.7, 0.9);
  head.add(forehead);

  // Beak — flat mallard-style spatula (wide, flat, rounded tip).
  // Upper mandible: flattened scaled sphere rather than a cone.
  const beakUpper = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 24, 18),
    beakMat
  );
  beakUpper.scale.set(1.7, 0.28, 0.95);
  beakUpper.position.set(0.82, 0.0, 0);
  beakUpper.castShadow = true;
  head.add(beakUpper);

  // Lower mandible slightly smaller and darker
  const beakLower = new THREE.Mesh(
    new THREE.SphereGeometry(0.45, 22, 16),
    mat(darken(skin.beak, 0.18), 0.55)
  );
  beakLower.scale.set(1.55, 0.18, 0.85);
  beakLower.position.set(0.78, -0.14, 0);
  head.add(beakLower);

  // Dark "nail" at the tip of the bill (mallards have this)
  const nail = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 14, 12),
    mat(darken(skin.beak, 0.4), 0.4)
  );
  nail.scale.set(1.1, 0.35, 0.7);
  nail.position.set(1.6, -0.03, 0);
  head.add(nail);

  // Thin seam line between upper and lower bill
  const seam = new THREE.Mesh(
    new THREE.BoxGeometry(0.85, 0.02, 0.8),
    mat(darken(skin.beak, 0.5), 0.6)
  );
  seam.position.set(0.95, -0.08, 0);
  head.add(seam);

  // Nostrils
  const nostril = new THREE.Mesh(
    new THREE.SphereGeometry(0.04, 8, 6),
    mat(0x1a0f05, 0.8)
  );
  nostril.position.set(0.95, 0.04, 0.14);
  head.add(nostril);
  const nostril2 = nostril.clone();
  nostril2.position.z = -0.14;
  head.add(nostril2);

  // Eyes — each is a small group with a white sclera and a dark pupil.
  const eyeZ = 0.44;
  for (const zSign of [1, -1]) {
    const eyeGroup = new THREE.Group();
    eyeGroup.position.set(0.28, 0.25, eyeZ * zSign);
    head.add(eyeGroup);
    const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 12), eyeWhiteMat);
    eyeGroup.add(sclera);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 10), eyeMat);
    pupil.position.set(0.08, 0, 0.06 * zSign);
    eyeGroup.add(pupil);
  }

  // ---- Wings (base shape + layered primary feathers) ----
  const wingGeom = new THREE.SphereGeometry(0.75, 22, 16);
  const leftWing = new THREE.Group();
  leftWing.name = "leftWing";
  const leftWingBase = new THREE.Mesh(wingGeom, wingMat);
  leftWingBase.scale.set(1.45, 0.32, 0.7);
  leftWingBase.castShadow = true;
  leftWing.add(leftWingBase);
  // Primary flight feathers — 4 overlapping plates at the tip
  const featherMat = mat(darken(skin.wing, 0.18), roughness);
  for (let i = 0; i < 4; i++) {
    const feather = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 12, 10),
      featherMat
    );
    feather.scale.set(1.3, 0.12, 0.45);
    feather.position.set(-0.4 - i * 0.18, -0.05, 0.15 + i * 0.04);
    feather.rotation.y = 0.15;
    feather.rotation.z = -0.3 - i * 0.08;
    leftWing.add(feather);
  }
  // Covert feather layer on top of the wing
  const covert = new THREE.Mesh(
    new THREE.SphereGeometry(0.55, 18, 14),
    mat(lighten(skin.wing, 0.05), roughness)
  );
  covert.scale.set(1.15, 0.14, 0.5);
  covert.position.set(0.25, 0.18, 0);
  leftWing.add(covert);
  leftWing.position.set(-0.05, 1.4, 0.95);
  leftWing.rotation.x = -0.15;
  leftWing.rotation.z = -0.1;
  root.add(leftWing);

  const rightWing = leftWing.clone();
  rightWing.position.z = -0.95;
  rightWing.rotation.x = 0.15;
  rightWing.scale.z = -1; // mirror along Z
  rightWing.name = "rightWing";
  root.add(rightWing);

  // Mallard speculum bars on each wing
  if (skinId === "mallard") {
    for (const side of [1, -1]) {
      const spec = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 0.08, 0.05),
        mat(0x2e5bbd, 0.4)
      );
      spec.position.set(-0.1, 1.4, side * 1.25);
      root.add(spec);
    }
  }

  // ---- Tail — pointed and slightly upswept ----
  const tail = new THREE.Mesh(
    new THREE.ConeGeometry(0.45, 1.1, 18),
    bodyMat
  );
  tail.rotation.z = Math.PI / 2 + 0.25;
  tail.scale.set(1, 0.45, 1);
  tail.position.set(-1.7, 1.55, 0);
  tail.castShadow = true;
  root.add(tail);
  // Darker tail tip band
  const tailTip = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 12, 10),
    mat(darken(skin.body, 0.25), roughness)
  );
  tailTip.scale.set(0.9, 0.55, 1);
  tailTip.position.set(-2.05, 1.65, 0);
  root.add(tailTip);

  // Mallard curled tail feather
  if (skinId === "mallard") {
    const curl = new THREE.Mesh(
      new THREE.TorusGeometry(0.12, 0.04, 8, 20, Math.PI),
      mat(0x0b0b0b, 0.7)
    );
    curl.rotation.y = Math.PI / 2;
    curl.position.set(-1.85, 1.55, 0);
    root.add(curl);
  }

  // ---- Legs & feet ----
  const legGroup = new THREE.Group();
  legGroup.name = "legs";
  root.add(legGroup);

  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.12, 0.7, 10),
      legMat
    );
    leg.position.set(0, 0.55, side * 0.4);
    leg.castShadow = true;
    leg.userData.side = side;
    leg.name = "leg" + side;
    legGroup.add(leg);

    // Foot — flat, webbed-looking
    const foot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.28, 0.1, 14),
      legMat
    );
    foot.scale.set(1.1, 1.0, 1.4);
    foot.position.set(0.15, 0.2, side * 0.4);
    foot.name = "foot" + side;
    legGroup.add(foot);
  }

  // ---- Skin-specific accessories ----
  addAccessory(root, head, leftWing, rightWing, skin);

  // Store references for animation.
  root.userData = {
    skinId,
    head,
    leftWing,
    rightWing,
    legGroup,
    body,
    radius: 1.5, // horizontal collider radius
  };

  return root;
}

function addAccessory(root, head, leftWing, rightWing, skin) {
  const acc = skin.accessory;
  if (!acc) return;

  if (acc === "crown") {
    const crown = new THREE.Group();
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.6, 0.6, 0.14, 16, 1, true),
      mat(0xfbbf24, 0.35, 0.7)
    );
    crown.add(base);
    for (let i = 0; i < 6; i++) {
      const spike = new THREE.Mesh(
        new THREE.ConeGeometry(0.12, 0.3, 6),
        mat(0xfbbf24, 0.35, 0.7)
      );
      const a = (i / 6) * Math.PI * 2;
      spike.position.set(Math.cos(a) * 0.55, 0.2, Math.sin(a) * 0.55);
      crown.add(spike);
      const gem = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 10, 8),
        mat(0xef4444, 0.2, 0.5)
      );
      gem.position.copy(spike.position);
      gem.position.y = 0.35;
      crown.add(gem);
    }
    crown.position.set(0.1, 0.75, 0);
    head.add(crown);
  }

  if (acc === "headband") {
    const band = new THREE.Mesh(
      new THREE.TorusGeometry(0.6, 0.09, 10, 22),
      mat(0x0a0a0a, 0.5)
    );
    band.rotation.x = Math.PI / 2;
    band.position.set(0.15, 0.28, 0);
    head.add(band);
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.05, 0.4),
      mat(0xffffff, 0.4)
    );
    stripe.position.set(0.35, 0.3, 0);
    head.add(stripe);
    // Dangling tail of the headband
    const tail = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.5, 0.18),
      mat(0x0a0a0a, 0.5)
    );
    tail.position.set(-0.38, 0.05, 0);
    tail.rotation.z = 0.3;
    head.add(tail);
  }

  if (acc === "peel_hood") {
    // Four banana peel strips draping from the top of the head.
    const peelMat = mat(0xfde047, 0.55);
    const peelShade = mat(0xa16207, 0.7);
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.1, 0.25, 8),
      peelShade
    );
    stem.position.set(0.1, 0.85, 0);
    head.add(stem);

    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const strip = new THREE.Mesh(
        new THREE.ConeGeometry(0.22, 1.0, 8, 1, true),
        peelMat
      );
      strip.position.set(
        0.1 + Math.cos(a) * 0.35,
        0.4,
        Math.sin(a) * 0.35
      );
      // Angle each strip outward from the head top.
      strip.lookAt(
        new THREE.Vector3(
          0.1 + Math.cos(a) * 1.0,
          -0.3,
          Math.sin(a) * 1.0
        )
      );
      head.add(strip);
    }
  }

  if (acc === "stitches") {
    // Dark lines across the body as stitches.
    for (let i = 0; i < 6; i++) {
      const stitch = new THREE.Mesh(
        new THREE.BoxGeometry(0.03, 0.16, 0.03),
        mat(0x0a0a0a, 0.9)
      );
      stitch.position.set(-0.5 + i * 0.2, 1.25, 0.95);
      stitch.rotation.z = 0.2 * (i % 2 === 0 ? 1 : -1);
      root.add(stitch);
    }
    // Green ooze drip under beak
    const ooze = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 10, 8),
      mat(0x7fb33a, 0.3)
    );
    ooze.scale.set(1, 1.6, 1);
    ooze.position.set(1.05, 1.55, 0);
    root.add(ooze);
  }

  if (acc === "knife_blood") {
    // Blood splatter spheres on the body and head.
    const bloodMat = mat(0xb00000, 0.4);
    const splats = [
      [0.2, 1.7, 0.8], [0.9, 1.8, 0.4], [-0.4, 1.4, 0.9],
      [-0.2, 1.2, -0.8], [1.3, 2.3, 0.3],
    ];
    for (const [x, y, z] of splats) {
      const s = new THREE.Mesh(
        new THREE.SphereGeometry(0.08 + Math.random() * 0.04, 10, 8),
        bloodMat
      );
      s.position.set(x, y, z);
      s.scale.set(1.2, 0.5, 1.2);
      root.add(s);
    }
    // Dripping blood off beak
    const drip = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 10, 8),
      bloodMat
    );
    drip.scale.set(1, 1.8, 1);
    drip.position.set(1.1, 1.55, 0);
    root.add(drip);

    // Tiny knife held in the right wing.
    const knife = new THREE.Group();
    const blade = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.08, 0.015),
      mat(0xd1d5db, 0.2, 0.9)
    );
    blade.position.x = 0.28;
    knife.add(blade);
    const bloodSmear = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.08, 0.017),
      bloodMat
    );
    bloodSmear.position.x = 0.3;
    knife.add(bloodSmear);
    const handle = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.1, 0.08),
      mat(0x3a1f0a, 0.8)
    );
    handle.position.x = -0.09;
    knife.add(handle);
    const guard = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.15, 0.08),
      mat(0x9ca3af, 0.4, 0.8)
    );
    guard.position.x = 0.02;
    knife.add(guard);

    knife.rotation.z = 0.4;
    knife.position.set(-0.1, 0.25, -0.2);
    rightWing.add(knife);
  }
}

// --- Color helpers ---
function lighten(hex, amt) { return shiftHex(hex, amt); }
function darken(hex, amt) { return shiftHex(hex, -amt); }
function shiftHex(hex, amt) {
  const r = (hex >> 16) & 0xff;
  const g = (hex >> 8) & 0xff;
  const b = hex & 0xff;
  const nr = Math.max(0, Math.min(255, Math.round(r + 255 * amt)));
  const ng = Math.max(0, Math.min(255, Math.round(g + 255 * amt)));
  const nb = Math.max(0, Math.min(255, Math.round(b + 255 * amt)));
  return (nr << 16) | (ng << 8) | nb;
}

/** Play a walking leg-swing + subtle body bob animation. */
export function animateDuckWalk(duck, phase, speed) {
  const legGroup = duck.userData.legGroup;
  if (!legGroup) return;
  for (const child of legGroup.children) {
    const side = child.userData.side;
    if (side === undefined) continue;
    const lift = Math.sin(phase + (side > 0 ? 0 : Math.PI)) * 0.25 * speed;
    child.position.y = 0.55 + Math.max(0, lift);
    child.rotation.z = Math.cos(phase + (side > 0 ? 0 : Math.PI)) * 0.25 * speed;
  }
  duck.userData.body.position.y = 1.15 + Math.abs(Math.sin(phase * 2)) * 0.05 * speed;
  duck.userData.leftWing.rotation.z = -0.1 + Math.sin(phase * 2) * 0.08 * speed;
  duck.userData.rightWing.rotation.z = 0.1 - Math.sin(phase * 2) * 0.08 * speed;
}

/** Slipping: flail limbs and tilt. */
export function animateDuckSlip(duck, phase, intensity) {
  const legGroup = duck.userData.legGroup;
  if (!legGroup) return;
  for (const child of legGroup.children) {
    const side = child.userData.side;
    if (side === undefined) continue;
    child.rotation.z = Math.sin(phase * 12 + side) * 0.9 * intensity;
    child.position.y = 0.55 + Math.abs(Math.sin(phase * 10 + side)) * 0.4;
  }
  duck.userData.leftWing.rotation.z = Math.sin(phase * 14) * 0.7 * intensity;
  duck.userData.rightWing.rotation.z = Math.cos(phase * 14) * 0.7 * intensity;
}
