// Big Duck Chase — main game loop

(function () {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;

  const timeEl = document.getElementById("time");
  const bananasEl = document.getElementById("bananas");
  const slipsEl = document.getElementById("slips");
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlay-title");
  const overlaySub = document.getElementById("overlay-sub");
  const restartBtn = document.getElementById("restart-btn");

  // Duck config, updated live from the panel.
  const duck = {
    x: W * 0.2,
    y: H * 0.5,
    vx: 0,
    vy: 0,
    size: 90,
    speed: 180, // px/sec toward the player
    facing: 0,
    walkPhase: 0,
    slipTimer: 0,
    slipDir: 1,
    spin: 0,
    stunTimer: 0,
    bodyColor: "#ffd23f",
    beakColor: "#f4861f",
    eyeColor: "#1a1a1a",
    wingColor: "#eab308",
    headColor: null,
    neckRing: null,
    breastColor: null,
    hat: "none",
    skin: "none",
    name: "Sir Quackington",
  };

  // Player (a little human stick figure).
  const player = {
    x: W * 0.75,
    y: H * 0.55,
    r: 14,
    speed: 260, // px/sec
    facing: Math.PI,
  };

  const bananas = [];      // thrown bananas in flight
  const banPeels = [];     // peels on the ground (trick traps)
  const particles = [];    // feathers, stars
  const floatTexts = [];   // "Oof!", "Quack!" etc

  let startTime = 0;
  let elapsed = 0;
  let bananaCount = 5;
  let slipsCount = 0;
  let running = true;
  let lastBananaRefill = 0;

  // Input
  const keys = new Set();
  window.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    keys.add(k);
    if (k === " " || k === "spacebar") {
      e.preventDefault();
      throwBananaTowardMouse();
    }
    if (k === "r") reset();
  });
  window.addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));

  let mouse = { x: W / 2, y: H / 2 };
  canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * W;
    mouse.y = ((e.clientY - rect.top) / rect.height) * H;
  });
  canvas.addEventListener("mousedown", (e) => {
    e.preventDefault();
    throwBananaTowardMouse();
  });
  canvas.addEventListener("touchstart", (e) => {
    const t = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((t.clientX - rect.left) / rect.width) * W;
    mouse.y = ((t.clientY - rect.top) / rect.height) * H;
    throwBananaTowardMouse();
    e.preventDefault();
  }, { passive: false });

  restartBtn.addEventListener("click", reset);

  // Panel wiring
  const panel = {
    presets: document.getElementById("presets"),
    bodyColor: document.getElementById("bodyColor"),
    headColor: document.getElementById("headColor"),
    beakColor: document.getElementById("beakColor"),
    eyeColor: document.getElementById("eyeColor"),
    wingColor: document.getElementById("wingColor"),
    size: document.getElementById("size"),
    sizeVal: document.getElementById("sizeVal"),
    speed: document.getElementById("speed"),
    speedVal: document.getElementById("speedVal"),
    skin: document.getElementById("skin"),
    hat: document.getElementById("hat"),
    duckName: document.getElementById("duckName"),
  };

  function buildPresetButtons() {
    const presets = window.DuckArt.PRESETS;
    panel.presets.innerHTML = "";
    Object.entries(presets).forEach(([key, p]) => {
      const btn = document.createElement("button");
      btn.className = "preset-btn";
      btn.textContent = p.name;
      btn.addEventListener("click", () => applyPreset(key));
      panel.presets.appendChild(btn);
    });
  }

  // Preset-only attributes that aren't color pickers (neck ring, breast patch)
  // are remembered here so a preset's mallard-specific details survive when
  // the user tweaks the color pickers afterwards.
  let presetExtras = { headColor: null, neckRing: null, breastColor: null };

  function applyPreset(key) {
    const p = window.DuckArt.PRESETS[key];
    if (!p) return;
    panel.bodyColor.value = p.bodyColor;
    panel.headColor.value = p.headColor || p.bodyColor;
    panel.beakColor.value = p.beakColor;
    panel.eyeColor.value = p.eyeColor;
    panel.wingColor.value = p.wingColor;
    panel.hat.value = p.hat || "none";
    panel.skin.value = p.skin || "none";
    presetExtras = {
      headColor: p.headColor || null,
      neckRing: p.neckRing || null,
      breastColor: p.breastColor || null,
    };
    syncDuckFromPanel();
    [...panel.presets.children].forEach((c) =>
      c.classList.toggle("active", c.textContent === p.name)
    );
  }

  function syncDuckFromPanel() {
    duck.bodyColor = panel.bodyColor.value;
    duck.headColor = panel.headColor.value;
    duck.beakColor = panel.beakColor.value;
    duck.eyeColor = panel.eyeColor.value;
    duck.wingColor = panel.wingColor.value;
    duck.size = parseInt(panel.size.value, 10);
    duck.speed = parseInt(panel.speed.value, 10);
    duck.hat = panel.hat.value;
    duck.skin = panel.skin.value;
    // Neck ring / breast patch only apply for mallard-ish ducks; keep them
    // available if the user is still on a preset that uses them.
    duck.neckRing = duck.skin === "mallard" ? (presetExtras.neckRing || "#ffffff") : null;
    duck.breastColor = duck.skin === "mallard" ? (presetExtras.breastColor || "#6b2f1f") : null;
    duck.name = panel.duckName.value || "Duck";
    panel.sizeVal.textContent = duck.size;
    panel.speedVal.textContent = (duck.speed / 100).toFixed(1);
  }

  [
    panel.bodyColor, panel.headColor, panel.beakColor, panel.eyeColor,
    panel.wingColor, panel.size, panel.speed, panel.skin, panel.hat,
    panel.duckName,
  ].forEach((el) => el.addEventListener("input", syncDuckFromPanel));

  buildPresetButtons();
  applyPreset("mallard");
  syncDuckFromPanel();

  function throwBananaTowardMouse() {
    if (!running) return;
    if (bananaCount <= 0) {
      addFloatText(player.x, player.y - 20, "Out of bananas!", "#ef4444");
      return;
    }
    bananaCount--;
    bananasEl.textContent = bananaCount;
    const dx = mouse.x - player.x;
    const dy = mouse.y - player.y;
    const len = Math.max(1, Math.hypot(dx, dy));
    const speed = 560;
    bananas.push({
      x: player.x,
      y: player.y - 4,
      vx: (dx / len) * speed,
      vy: (dy / len) * speed - 140, // slight arc
      rot: 0,
      vrot: 12,
      life: 1.6,
      landed: false,
    });
  }

  function addFloatText(x, y, text, color) {
    floatTexts.push({ x, y, text, color: color || "#fff", life: 1.2, age: 0 });
  }

  function spawnFeathers(x, y, n, color) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 60 + Math.random() * 160;
      particles.push({
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 80,
        life: 0.8 + Math.random() * 0.6,
        age: 0,
        color: color || "#fff7b0",
        size: 3 + Math.random() * 3,
        kind: "feather",
      });
    }
  }
  function spawnStars(x, y) {
    for (let i = 0; i < 6; i++) {
      particles.push({
        x, y, vx: 0, vy: 0,
        life: 0.9, age: 0,
        angle: (i / 6) * Math.PI * 2,
        radius: 22 + Math.random() * 6,
        size: 6, kind: "star", color: "#fde047",
      });
    }
  }

  function reset() {
    duck.x = W * 0.2; duck.y = H * 0.5;
    duck.vx = duck.vy = 0;
    duck.slipTimer = duck.stunTimer = duck.spin = 0;
    player.x = W * 0.75; player.y = H * 0.55;
    bananas.length = 0;
    banPeels.length = 0;
    particles.length = 0;
    floatTexts.length = 0;
    bananaCount = 5;
    slipsCount = 0;
    elapsed = 0;
    startTime = performance.now();
    running = true;
    overlay.classList.add("hidden");
    bananasEl.textContent = bananaCount;
    slipsEl.textContent = slipsCount;
    timeEl.textContent = "0.0";
  }

  function gameOver() {
    running = false;
    overlayTitle.textContent = `${duck.name} got you!`;
    overlaySub.textContent =
      `You survived ${elapsed.toFixed(1)}s and caused ${slipsCount} slip${slipsCount === 1 ? "" : "s"}.`;
    overlay.classList.remove("hidden");
  }

  // Main loop
  let last = performance.now();
  startTime = last;
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (running) {
      elapsed = (now - startTime) / 1000;
      timeEl.textContent = elapsed.toFixed(1);
      // Refill a banana every 4 seconds, up to 5.
      if (now - lastBananaRefill > 4000 && bananaCount < 5) {
        bananaCount++;
        bananasEl.textContent = bananaCount;
        lastBananaRefill = now;
      }
      update(dt);
    }
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  function update(dt) {
    // Player movement
    let mx = 0, my = 0;
    if (keys.has("arrowleft") || keys.has("a")) mx -= 1;
    if (keys.has("arrowright") || keys.has("d")) mx += 1;
    if (keys.has("arrowup") || keys.has("w")) my -= 1;
    if (keys.has("arrowdown") || keys.has("s")) my += 1;
    if (mx || my) {
      const l = Math.hypot(mx, my);
      mx /= l; my /= l;
      player.facing = Math.atan2(my, mx);
    }
    player.x = clamp(player.x + mx * player.speed * dt, player.r, W - player.r);
    player.y = clamp(player.y + my * player.speed * dt, player.r, H - player.r);

    // Duck AI
    if (duck.stunTimer > 0) {
      duck.stunTimer -= dt;
      duck.spin += dt * 10 * duck.slipDir;
      // Slide while slipping
      duck.x += duck.vx * dt;
      duck.y += duck.vy * dt;
      duck.vx *= 0.96;
      duck.vy *= 0.96;
    } else if (duck.slipTimer > 0) {
      // Slipping animation - duck slides backwards, flailing
      duck.slipTimer -= dt;
      duck.x += duck.vx * dt;
      duck.y += duck.vy * dt;
      duck.vx *= 0.92;
      duck.vy *= 0.92;
      duck.spin += dt * 14 * duck.slipDir;
      if (duck.slipTimer <= 0) {
        duck.stunTimer = 1.0;
        spawnStars(duck.x, duck.y - duck.size * 0.3);
        addFloatText(duck.x, duck.y - duck.size * 0.6, "Quack?!", "#fde047");
      }
    } else {
      // Chase the player
      const dx = player.x - duck.x;
      const dy = player.y - duck.y;
      const len = Math.max(1, Math.hypot(dx, dy));
      duck.vx = (dx / len) * duck.speed;
      duck.vy = (dy / len) * duck.speed;
      duck.x += duck.vx * dt;
      duck.y += duck.vy * dt;
      duck.facing = Math.atan2(dy, dx);
      duck.walkPhase += dt * (4 + duck.speed / 60);
      duck.spin *= 0.85;

      // Check peel collisions
      for (const peel of banPeels) {
        if (peel.used) continue;
        const pd = Math.hypot(duck.x - peel.x, duck.y - peel.y);
        if (pd < duck.size * 0.55) {
          triggerSlip(peel);
          peel.used = true;
        }
      }
    }

    // Keep duck on screen
    duck.x = clamp(duck.x, 40, W - 40);
    duck.y = clamp(duck.y, 40, H - 40);

    // Catch test
    const caughtDist = Math.hypot(duck.x - player.x, duck.y - player.y);
    const catchR = duck.size * 0.5 + player.r;
    if (duck.stunTimer <= 0 && duck.slipTimer <= 0 && caughtDist < catchR) {
      spawnFeathers(player.x, player.y, 20, "#fff7b0");
      gameOver();
    }

    // Update bananas in flight
    for (const b of bananas) {
      b.vy += 520 * dt; // gravity
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.rot += b.vrot * dt;
      b.life -= dt;
      // Hit ground?
      if (!b.landed && b.y >= H - 18) {
        b.y = H - 18;
        b.landed = true;
        banPeels.push({ x: b.x, y: b.y, used: false, age: 0 });
        b.life = 0;
      }
      // Direct hit on duck?
      const dd = Math.hypot(b.x - duck.x, b.y - duck.y);
      if (!b.landed && dd < duck.size * 0.45) {
        triggerSlip({ x: duck.x, y: duck.y });
        b.life = 0;
        spawnFeathers(duck.x, duck.y, 10, duck.bodyColor);
      }
    }
    for (let i = bananas.length - 1; i >= 0; i--) {
      if (bananas[i].life <= 0) bananas.splice(i, 1);
    }

    // Peels age out
    for (const p of banPeels) p.age += dt;
    for (let i = banPeels.length - 1; i >= 0; i--) {
      if (banPeels[i].used || banPeels[i].age > 10) banPeels.splice(i, 1);
    }

    // Particles
    for (const p of particles) {
      p.age += dt;
      if (p.kind === "feather") {
        p.vy += 120 * dt;
        p.vx *= 0.98;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      if (particles[i].age > particles[i].life) particles.splice(i, 1);
    }

    // Float texts
    for (const t of floatTexts) {
      t.age += dt;
      t.y -= 30 * dt;
    }
    for (let i = floatTexts.length - 1; i >= 0; i--) {
      if (floatTexts[i].age > floatTexts[i].life) floatTexts.splice(i, 1);
    }
  }

  function triggerSlip(origin) {
    // Slide away from player in a silly direction
    const ax = duck.x - (origin.x || duck.x);
    const ay = duck.y - (origin.y || duck.y);
    const len = Math.max(1, Math.hypot(ax, ay));
    const slideSpeed = 380;
    duck.vx = (ax / len) * slideSpeed + (Math.random() - 0.5) * 120;
    duck.vy = (ay / len) * slideSpeed - 160;
    duck.slipTimer = 0.8;
    duck.slipDir = Math.random() < 0.5 ? -1 : 1;
    slipsCount++;
    slipsEl.textContent = slipsCount;
    spawnFeathers(duck.x, duck.y, 12, duck.bodyColor);
    const cries = ["QUAAACK!", "Whoa!", "Oof!", "Wak?!", "Aaah!"];
    addFloatText(duck.x, duck.y - duck.size * 0.6,
      cries[Math.floor(Math.random() * cries.length)], "#fff");
  }

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  // ---- DRAW ----
  function draw() {
    // Ground + sky gradient handled by CSS background; draw grass tufts
    ctx.clearRect(0, 0, W, H);
    drawScene();

    // Peels
    for (const p of banPeels) drawPeel(ctx, p.x, p.y, p.age);

    // Bananas in flight
    for (const b of bananas) drawBanana(ctx, b.x, b.y, b.rot);

    // Particles
    for (const p of particles) drawParticle(ctx, p);

    // Player
    drawPlayer(ctx, player);

    // Duck
    const slipping = duck.slipTimer > 0 || duck.stunTimer > 0;
    const slipState = {
      squashX: duck.slipTimer > 0 ? 1.25 : duck.stunTimer > 0 ? 1.1 : 1,
      squashY: duck.slipTimer > 0 ? 0.75 : duck.stunTimer > 0 ? 0.9 : 1,
      tilt: duck.spin * 0.3,
      walkPhase: duck.walkPhase,
      slipping,
    };
    window.DuckArt.drawDuck(ctx, duck, duck.x, duck.y, duck.facing, slipState);

    // Name label
    ctx.save();
    ctx.font = "bold 13px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillText(duck.name, duck.x + 1, duck.y - duck.size * 0.75 + 1);
    ctx.fillStyle = "#fff";
    ctx.fillText(duck.name, duck.x, duck.y - duck.size * 0.75);
    ctx.restore();

    // Float texts
    for (const t of floatTexts) {
      const a = 1 - t.age / t.life;
      ctx.save();
      ctx.globalAlpha = Math.max(0, a);
      ctx.font = "bold 16px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillText(t.text, t.x + 1, t.y + 1);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);
      ctx.restore();
    }

    // Aim line
    if (running) {
      ctx.save();
      ctx.setLineDash([5, 6]);
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.beginPath();
      ctx.moveTo(player.x, player.y);
      ctx.lineTo(mouse.x, mouse.y);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawScene() {
    // Clouds
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    for (const c of clouds) {
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, c.r * 1.6, c.r, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Grass tufts
    ctx.save();
    ctx.strokeStyle = "#4d8a2b";
    ctx.lineWidth = 2;
    for (const g of grass) {
      ctx.beginPath();
      ctx.moveTo(g.x, g.y);
      ctx.lineTo(g.x - 3, g.y - 8);
      ctx.moveTo(g.x, g.y);
      ctx.lineTo(g.x + 3, g.y - 8);
      ctx.moveTo(g.x, g.y);
      ctx.lineTo(g.x, g.y - 10);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawPlayer(ctx, p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    // Shadow
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.ellipse(0, 20, 14, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    // Body
    ctx.fillStyle = "#2563eb";
    ctx.fillRect(-8, -6, 16, 20);
    // Head
    ctx.fillStyle = "#f3d7b2";
    ctx.beginPath();
    ctx.arc(0, -14, 9, 0, Math.PI * 2);
    ctx.fill();
    // Hair
    ctx.fillStyle = "#3b2e1a";
    ctx.beginPath();
    ctx.arc(0, -18, 9, Math.PI, 2 * Math.PI);
    ctx.fill();
    // Legs
    ctx.fillStyle = "#1e3a8a";
    ctx.fillRect(-7, 14, 5, 10);
    ctx.fillRect(2, 14, 5, 10);
    // Arms
    ctx.fillStyle = "#f3d7b2";
    ctx.fillRect(-12, -4, 4, 12);
    ctx.fillRect(8, -4, 4, 12);
    ctx.restore();
  }

  function drawBanana(ctx, x, y, rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.fillStyle = "#fde047";
    ctx.strokeStyle = "#a16207";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-14, 2);
    ctx.quadraticCurveTo(0, -14, 14, 2);
    ctx.quadraticCurveTo(0, 10, -14, 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#854d0e";
    ctx.fillRect(-16, 0, 3, 3);
    ctx.fillRect(13, 0, 3, 3);
    ctx.restore();
  }

  function drawPeel(ctx, x, y, age) {
    const wiggle = Math.sin(age * 6) * 1.5;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(wiggle * 0.05);
    // Shadow
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.ellipse(0, 6, 18, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#facc15";
    ctx.strokeStyle = "#a16207";
    ctx.lineWidth = 1.5;
    // 4 peel strips
    for (let i = 0; i < 4; i++) {
      ctx.save();
      ctx.rotate((i / 4) * Math.PI * 2 + 0.1);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(6, -8, 14, -2);
      ctx.quadraticCurveTo(8, 2, 0, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    ctx.fillStyle = "#fef9c3";
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawParticle(ctx, p) {
    if (p.kind === "feather") {
      const a = 1 - p.age / p.life;
      ctx.save();
      ctx.globalAlpha = Math.max(0, a);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, p.size, p.size * 0.5, p.age * 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (p.kind === "star") {
      const a = 1 - p.age / p.life;
      const r = p.radius + Math.sin(p.age * 14) * 3;
      const ang = p.angle + p.age * 6;
      const x = duck.x + Math.cos(ang) * r;
      const y = duck.y - duck.size * 0.5 + Math.sin(ang) * r * 0.4;
      ctx.save();
      ctx.globalAlpha = Math.max(0, a);
      ctx.fillStyle = p.color;
      drawStar(ctx, x, y, 5, p.size, p.size * 0.4);
      ctx.restore();
    }
  }

  function drawStar(ctx, cx, cy, spikes, outer, inner) {
    let rot = -Math.PI / 2;
    const step = Math.PI / spikes;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(rot) * outer, cy + Math.sin(rot) * outer);
    for (let i = 0; i < spikes; i++) {
      rot += step;
      ctx.lineTo(cx + Math.cos(rot) * inner, cy + Math.sin(rot) * inner);
      rot += step;
      ctx.lineTo(cx + Math.cos(rot) * outer, cy + Math.sin(rot) * outer);
    }
    ctx.closePath();
    ctx.fill();
  }

  // Decorative clouds and grass
  const clouds = [];
  for (let i = 0; i < 5; i++) {
    clouds.push({
      x: Math.random() * W,
      y: 30 + Math.random() * 120,
      r: 16 + Math.random() * 18,
    });
  }
  const grass = [];
  for (let i = 0; i < 60; i++) {
    grass.push({
      x: Math.random() * W,
      y: H * 0.55 + 6 + Math.random() * (H * 0.43),
    });
  }

  // Start fresh
  reset();
})();
