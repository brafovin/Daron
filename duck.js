// Duck rendering + presets. Exposes window.DuckArt.
// More realistic mallard-style anatomy, plus overlay "skins" for flavor.

(function () {
  // A preset can optionally define a `skin` overlay for extra decoration
  // (blood splatters, stitches, a banana-peel shell, etc).
  const PRESETS = {
    mallard: {
      name: "Mallard",
      bodyColor: "#7a5a3a",
      beakColor: "#d9a441",
      eyeColor: "#0b0b0b",
      wingColor: "#5a4028",
      headColor: "#1f5b3a",
      neckRing: "#ffffff",
      breastColor: "#6b2f1f",
      skin: "mallard",
      hat: "none",
    },
    rubber: {
      name: "Rubber",
      bodyColor: "#ffd93d",
      beakColor: "#ff8a1e",
      eyeColor: "#0b0b0b",
      wingColor: "#f4b400",
      skin: "rubber",
      hat: "none",
    },
    murder: {
      name: "Murder",
      bodyColor: "#1a1a1a",
      beakColor: "#7a0e0e",
      eyeColor: "#ff1212",
      wingColor: "#0b0b0b",
      headColor: "#141414",
      skin: "murder",
      hat: "none",
    },
    banana: {
      name: "Banana Peel",
      bodyColor: "#fde047",
      beakColor: "#a16207",
      eyeColor: "#1a1a1a",
      wingColor: "#facc15",
      skin: "banana",
      hat: "none",
    },
    zombie: {
      name: "Zombie",
      bodyColor: "#7aa05a",
      beakColor: "#8a6a3a",
      eyeColor: "#f5f5c0",
      wingColor: "#5a7a3a",
      skin: "zombie",
      hat: "none",
    },
    ninja: {
      name: "Ninja",
      bodyColor: "#1f2937",
      beakColor: "#f59e0b",
      eyeColor: "#f8fafc",
      wingColor: "#111827",
      skin: "ninja",
      hat: "none",
    },
    royal: {
      name: "Royal",
      bodyColor: "#f5f5f5",
      beakColor: "#f59e0b",
      eyeColor: "#0f172a",
      wingColor: "#e5e7eb",
      skin: "none",
      hat: "crown",
    },
    party: {
      name: "Party",
      bodyColor: "#fb7185",
      beakColor: "#facc15",
      eyeColor: "#1e293b",
      wingColor: "#f472b6",
      skin: "none",
      hat: "party",
    },
    chill: {
      name: "Chill",
      bodyColor: "#93c5fd",
      beakColor: "#f97316",
      eyeColor: "#111",
      wingColor: "#60a5fa",
      skin: "none",
      hat: "cap",
    },
  };

  // --- Drawing ---------------------------------------------------------------

  function drawDuck(ctx, duck, x, y, facing, state) {
    const s = duck.size / 90;
    const squashX = state?.squashX ?? 1;
    const squashY = state?.squashY ?? 1;
    const tilt = state?.tilt ?? 0;
    const walkPhase = state?.walkPhase ?? 0;
    const slipping = !!state?.slipping;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(tilt);
    ctx.scale(squashX, squashY);
    const faceLeft = Math.cos(facing) < 0;
    if (faceLeft) ctx.scale(-1, 1);

    drawShadow(ctx, s);
    drawLegs(ctx, duck, s, walkPhase, slipping);
    drawBody(ctx, duck, s);
    drawTail(ctx, duck, s);
    drawWing(ctx, duck, s, walkPhase);
    drawNeckAndHead(ctx, duck, s);
    drawBeak(ctx, duck, s);
    drawEye(ctx, duck, s);

    // Skin overlay (blood, banana peel, bandages, etc.)
    drawSkinOverlay(ctx, duck, s, slipping);

    // Hat last so it sits on top.
    drawHat(ctx, duck.hat, s);

    ctx.restore();
  }

  function drawShadow(ctx, s) {
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.ellipse(0, 46 * s, 52 * s, 8 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawLegs(ctx, duck, s, walkPhase, slipping) {
    const swing = slipping
      ? Math.sin(walkPhase * 3) * 14 * s
      : Math.sin(walkPhase) * 6 * s;
    const legColor = duck.beakColor;
    ctx.strokeStyle = shade(legColor, -0.25);
    ctx.lineWidth = 4.5 * s;
    ctx.lineCap = "round";
    // Left leg (back)
    ctx.beginPath();
    ctx.moveTo(-8 * s, 30 * s);
    ctx.lineTo(-8 * s - swing, 46 * s);
    ctx.stroke();
    // Right leg (front)
    ctx.beginPath();
    ctx.moveTo(12 * s, 30 * s);
    ctx.lineTo(12 * s + swing, 46 * s);
    ctx.stroke();
    // Webbed feet
    ctx.fillStyle = legColor;
    ctx.strokeStyle = shade(legColor, -0.35);
    ctx.lineWidth = 1.2 * s;
    drawWebbedFoot(ctx, -8 * s - swing, 46 * s, s);
    drawWebbedFoot(ctx, 12 * s + swing, 46 * s, s);
  }

  function drawWebbedFoot(ctx, x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    // Three webbed toes forming a triangular foot
    ctx.moveTo(-9 * s, 0);
    ctx.quadraticCurveTo(-6 * s, 5 * s, -3 * s, 1 * s);
    ctx.quadraticCurveTo(0, 6 * s, 3 * s, 1 * s);
    ctx.quadraticCurveTo(6 * s, 5 * s, 9 * s, 0);
    ctx.quadraticCurveTo(4 * s, -2 * s, 0, -2 * s);
    ctx.quadraticCurveTo(-4 * s, -2 * s, -9 * s, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawBody(ctx, duck, s) {
    // Breast color for mallards; otherwise body color.
    const bodyMain = duck.bodyColor;
    ctx.save();
    // Main body — slightly angled oval.
    ctx.translate(0, 10 * s);
    ctx.rotate(-0.08);
    ctx.fillStyle = bodyMain;
    ctx.strokeStyle = shade(bodyMain, -0.3);
    ctx.lineWidth = 1.8 * s;
    ctx.beginPath();
    ctx.ellipse(0, 0, 48 * s, 32 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Belly highlight
    const belly = shade(bodyMain, 0.12);
    ctx.fillStyle = belly;
    ctx.beginPath();
    ctx.ellipse(4 * s, 10 * s, 36 * s, 14 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    // Breast patch (for mallards mostly; mild for others)
    if (duck.breastColor) {
      ctx.fillStyle = duck.breastColor;
      ctx.beginPath();
      ctx.ellipse(22 * s, -6 * s, 18 * s, 14 * s, -0.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Subtle feather texture (short arcs across back)
    ctx.strokeStyle = shade(bodyMain, -0.18);
    ctx.lineWidth = 0.8 * s;
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.arc(i * 8 * s, -16 * s, 4 * s, Math.PI, Math.PI * 1.9);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawTail(ctx, duck, s) {
    ctx.save();
    ctx.fillStyle = shade(duck.bodyColor, -0.15);
    ctx.strokeStyle = shade(duck.bodyColor, -0.35);
    ctx.lineWidth = 1.6 * s;
    ctx.beginPath();
    ctx.moveTo(-40 * s, -4 * s);
    ctx.quadraticCurveTo(-62 * s, -14 * s, -58 * s, -2 * s);
    ctx.quadraticCurveTo(-50 * s, 4 * s, -40 * s, 10 * s);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Mallard-style curled tail feather
    if (duck.skin === "mallard") {
      ctx.strokeStyle = "#111";
      ctx.lineWidth = 2 * s;
      ctx.beginPath();
      ctx.moveTo(-46 * s, -8 * s);
      ctx.quadraticCurveTo(-56 * s, -20 * s, -42 * s, -18 * s);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawWing(ctx, duck, s, walkPhase) {
    const flutter = Math.sin(walkPhase * 2) * 1.5 * s;
    ctx.save();
    ctx.translate(-4 * s, 8 * s + flutter);
    ctx.rotate(-0.15);
    const wingBase = duck.wingColor;
    ctx.fillStyle = wingBase;
    ctx.strokeStyle = shade(wingBase, -0.3);
    ctx.lineWidth = 1.6 * s;
    // Wing shape — teardrop
    ctx.beginPath();
    ctx.moveTo(-26 * s, 0);
    ctx.quadraticCurveTo(-10 * s, -18 * s, 18 * s, -8 * s);
    ctx.quadraticCurveTo(22 * s, 8 * s, 4 * s, 16 * s);
    ctx.quadraticCurveTo(-22 * s, 14 * s, -26 * s, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Primary feather layers
    ctx.fillStyle = shade(wingBase, -0.22);
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.ellipse((-18 + i * 8) * s, 8 * s, 4 * s, 9 * s, 0.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Mallard speculum — a blue/purple bar
    if (duck.skin === "mallard") {
      ctx.fillStyle = "#2e5bbd";
      ctx.fillRect(-14 * s, -2 * s, 22 * s, 4 * s);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(-14 * s, -4 * s, 22 * s, 1.5 * s);
      ctx.fillRect(-14 * s, 2 * s, 22 * s, 1.5 * s);
    }
    ctx.restore();
  }

  function drawNeckAndHead(ctx, duck, s) {
    const bodyMain = duck.bodyColor;
    const headColor = duck.headColor || bodyMain;
    // Neck (a tapering trapezoid-ish shape)
    ctx.save();
    ctx.fillStyle = headColor;
    ctx.strokeStyle = shade(headColor, -0.3);
    ctx.lineWidth = 1.6 * s;
    ctx.beginPath();
    ctx.moveTo(18 * s, -6 * s);
    ctx.lineTo(40 * s, -30 * s);
    ctx.lineTo(48 * s, -24 * s);
    ctx.lineTo(28 * s, 4 * s);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Head (egg-shape)
    ctx.beginPath();
    ctx.ellipse(38 * s, -28 * s, 22 * s, 19 * s, -0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Cheek highlight
    ctx.fillStyle = shade(headColor, 0.12);
    ctx.beginPath();
    ctx.ellipse(44 * s, -22 * s, 10 * s, 6 * s, -0.15, 0, Math.PI * 2);
    ctx.fill();

    // White neck ring (mallards)
    if (duck.neckRing) {
      ctx.strokeStyle = duck.neckRing;
      ctx.lineWidth = 4 * s;
      ctx.beginPath();
      ctx.moveTo(22 * s, -4 * s);
      ctx.quadraticCurveTo(32 * s, -12 * s, 42 * s, -8 * s);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawBeak(ctx, duck, s) {
    ctx.save();
    const beak = duck.beakColor;
    ctx.fillStyle = beak;
    ctx.strokeStyle = shade(beak, -0.35);
    ctx.lineWidth = 1.4 * s;
    // Upper bill
    ctx.beginPath();
    ctx.moveTo(48 * s, -30 * s);
    ctx.quadraticCurveTo(74 * s, -26 * s, 72 * s, -18 * s);
    ctx.quadraticCurveTo(62 * s, -14 * s, 50 * s, -18 * s);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Lower bill (slightly darker)
    ctx.fillStyle = shade(beak, -0.15);
    ctx.beginPath();
    ctx.moveTo(50 * s, -18 * s);
    ctx.quadraticCurveTo(66 * s, -14 * s, 70 * s, -16 * s);
    ctx.quadraticCurveTo(60 * s, -10 * s, 50 * s, -14 * s);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Nostril
    ctx.fillStyle = shade(beak, -0.5);
    ctx.beginPath();
    ctx.arc(60 * s, -24 * s, 1.2 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawEye(ctx, duck, s) {
    const murder = duck.skin === "murder";
    // Eye white
    ctx.fillStyle = murder ? "#2a0000" : "#fff";
    ctx.beginPath();
    ctx.arc(44 * s, -30 * s, 5.2 * s, 0, Math.PI * 2);
    ctx.fill();
    // Pupil
    ctx.fillStyle = duck.eyeColor;
    ctx.beginPath();
    ctx.arc(45 * s, -30 * s, murder ? 3.6 * s : 2.8 * s, 0, Math.PI * 2);
    ctx.fill();
    // Gleam
    if (!murder) {
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(46 * s, -31 * s, 0.9 * s, 0, Math.PI * 2);
      ctx.fill();
    }
    // Eyelid line
    ctx.strokeStyle = shade(duck.headColor || duck.bodyColor, -0.4);
    ctx.lineWidth = 1 * s;
    ctx.beginPath();
    ctx.arc(44 * s, -30 * s, 5.6 * s, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
  }

  // --- Skin overlays ---------------------------------------------------------

  function drawSkinOverlay(ctx, duck, s, slipping) {
    const skin = duck.skin;
    if (!skin || skin === "none") return;
    if (skin === "murder") drawMurderOverlay(ctx, s, slipping);
    else if (skin === "banana") drawBananaOverlay(ctx, s);
    else if (skin === "zombie") drawZombieOverlay(ctx, s);
    else if (skin === "ninja") drawNinjaOverlay(ctx, s);
    else if (skin === "rubber") drawRubberOverlay(ctx, s);
    // "mallard" already handled inline (neck ring, speculum, curl)
  }

  function drawMurderOverlay(ctx, s, slipping) {
    // Blood splatters on body
    ctx.save();
    ctx.fillStyle = "#b20000";
    const splats = [
      [-18, -6, 4], [-4, 2, 3], [10, -12, 2.5], [-26, 6, 2],
      [18, 8, 2.8], [-10, 14, 3.2],
    ];
    for (const [x, y, r] of splats) {
      ctx.beginPath();
      ctx.arc(x * s, y * s, r * s, 0, Math.PI * 2);
      ctx.fill();
    }
    // Drip from beak
    ctx.fillStyle = "#d90000";
    ctx.beginPath();
    ctx.moveTo(58 * s, -14 * s);
    ctx.quadraticCurveTo(60 * s, -4 * s, 58 * s, 2 * s);
    ctx.quadraticCurveTo(56 * s, -4 * s, 58 * s, -14 * s);
    ctx.fill();
    // Tiny knife in wing
    ctx.save();
    ctx.translate(2 * s, 4 * s);
    ctx.rotate(-0.4);
    // Blade
    ctx.fillStyle = "#cbd5e1";
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 1 * s;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(26 * s, -2 * s);
    ctx.lineTo(28 * s, 0);
    ctx.lineTo(26 * s, 2 * s);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Blood on blade
    ctx.fillStyle = "#b20000";
    ctx.fillRect(10 * s, -1 * s, 14 * s, 2 * s);
    // Handle
    ctx.fillStyle = "#3f1d0a";
    ctx.fillRect(-8 * s, -3 * s, 8 * s, 6 * s);
    ctx.strokeRect(-8 * s, -3 * s, 8 * s, 6 * s);
    ctx.restore();
    // Angry eyebrow scribble
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2 * s;
    ctx.beginPath();
    ctx.moveTo(40 * s, -38 * s);
    ctx.lineTo(52 * s, -34 * s);
    ctx.stroke();
    if (slipping) {
      // Even when slipping, the knife flies — add a "!"
      ctx.fillStyle = "#fff";
      ctx.font = `bold ${14 * s}px system-ui`;
      ctx.fillText("!", 56 * s, -40 * s);
    }
    ctx.restore();
  }

  function drawBananaOverlay(ctx, s) {
    // A peel draped over the duck's back like a hood/poncho.
    ctx.save();
    ctx.fillStyle = "#fde047";
    ctx.strokeStyle = "#a16207";
    ctx.lineWidth = 1.4 * s;
    // Four peel strips radiating from the top of the head
    ctx.save();
    ctx.translate(36 * s, -42 * s);
    for (let i = 0; i < 4; i++) {
      ctx.save();
      ctx.rotate((i - 1.5) * 0.55);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-4 * s, 18 * s, 0, 30 * s);
      ctx.quadraticCurveTo(4 * s, 18 * s, 0, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    // Stem at top
    ctx.fillStyle = "#713f12";
    ctx.fillRect(-2 * s, -6 * s, 4 * s, 6 * s);
    ctx.restore();
    // Peel patch on the back / body
    ctx.fillStyle = "#facc15";
    ctx.beginPath();
    ctx.ellipse(-8 * s, -8 * s, 24 * s, 10 * s, -0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Brown speckles
    ctx.fillStyle = "#713f12";
    for (const [x, y] of [[-14, -10], [-2, -6], [-20, -4], [6, -10]]) {
      ctx.beginPath();
      ctx.arc(x * s, y * s, 1 * s, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawZombieOverlay(ctx, s) {
    ctx.save();
    // Stitches across body
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 1.3 * s;
    ctx.beginPath();
    ctx.moveTo(-20 * s, 4 * s);
    ctx.lineTo(22 * s, 6 * s);
    ctx.stroke();
    for (let x = -18; x <= 20; x += 4) {
      ctx.beginPath();
      ctx.moveTo(x * s, 2 * s);
      ctx.lineTo(x * s, 10 * s);
      ctx.stroke();
    }
    // Dripping green ooze under beak
    ctx.fillStyle = "#6fa040";
    ctx.beginPath();
    ctx.moveTo(56 * s, -14 * s);
    ctx.quadraticCurveTo(54 * s, -2 * s, 58 * s, 6 * s);
    ctx.quadraticCurveTo(60 * s, -2 * s, 56 * s, -14 * s);
    ctx.fill();
    // Torn wing edge
    ctx.strokeStyle = "#3a4d1a";
    ctx.lineWidth = 1 * s;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo((-18 + i * 6) * s, 20 * s);
      ctx.lineTo((-16 + i * 6) * s, 24 * s);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawNinjaOverlay(ctx, s) {
    ctx.save();
    // Black headband across eyes with white stripe
    ctx.fillStyle = "#0b0b0b";
    ctx.beginPath();
    ctx.moveTo(20 * s, -26 * s);
    ctx.lineTo(60 * s, -34 * s);
    ctx.lineTo(60 * s, -26 * s);
    ctx.lineTo(20 * s, -20 * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(34 * s, -28 * s, 10 * s, 2 * s);
    // Dangling band tail
    ctx.fillStyle = "#0b0b0b";
    ctx.beginPath();
    ctx.moveTo(20 * s, -22 * s);
    ctx.lineTo(6 * s, -10 * s);
    ctx.lineTo(12 * s, -10 * s);
    ctx.lineTo(22 * s, -18 * s);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawRubberOverlay(ctx, s) {
    // Big glossy highlight to sell the plastic look.
    ctx.save();
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(-14 * s, -6 * s, 10 * s, 4 * s, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(30 * s, -36 * s, 5 * s, 2 * s, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // --- Hats ------------------------------------------------------------------

  function drawHat(ctx, hat, s) {
    if (!hat || hat === "none") return;
    ctx.save();
    ctx.translate(36 * s, -46 * s);
    if (hat === "top") {
      ctx.fillStyle = "#111";
      ctx.fillRect(-18 * s, -4 * s, 36 * s, 4 * s);
      ctx.fillRect(-12 * s, -26 * s, 24 * s, 22 * s);
      ctx.fillStyle = "#b91c1c";
      ctx.fillRect(-12 * s, -10 * s, 24 * s, 4 * s);
    } else if (hat === "party") {
      ctx.fillStyle = "#22d3ee";
      ctx.beginPath();
      ctx.moveTo(-14 * s, 0);
      ctx.lineTo(14 * s, 0);
      ctx.lineTo(0, -30 * s);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#fde047";
      ctx.beginPath();
      ctx.arc(0, -30 * s, 4 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#f472b6";
      for (let i = -10; i <= 10; i += 5) {
        ctx.beginPath();
        ctx.arc(i * s, -10 * s + Math.abs(i) * 0.6 * s, 2 * s, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (hat === "crown") {
      ctx.fillStyle = "#fbbf24";
      ctx.strokeStyle = "#b45309";
      ctx.lineWidth = 1.5 * s;
      ctx.beginPath();
      ctx.moveTo(-16 * s, 0);
      ctx.lineTo(-16 * s, -10 * s);
      ctx.lineTo(-8 * s, -4 * s);
      ctx.lineTo(0, -14 * s);
      ctx.lineTo(8 * s, -4 * s);
      ctx.lineTo(16 * s, -10 * s);
      ctx.lineTo(16 * s, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.arc(0, -10 * s, 2.5 * s, 0, Math.PI * 2);
      ctx.fill();
    } else if (hat === "cap") {
      ctx.fillStyle = "#1e40af";
      ctx.beginPath();
      ctx.arc(0, 0, 16 * s, Math.PI, 2 * Math.PI);
      ctx.fill();
      ctx.fillRect(-22 * s, -1 * s, 10 * s, 5 * s);
      ctx.fillStyle = "#dbeafe";
      ctx.fillRect(-4 * s, -14 * s, 8 * s, 3 * s);
    } else if (hat === "peel") {
      // A banana-peel helmet
      ctx.fillStyle = "#fde047";
      ctx.strokeStyle = "#a16207";
      ctx.lineWidth = 1.4 * s;
      for (let i = 0; i < 4; i++) {
        ctx.save();
        ctx.rotate((i - 1.5) * 0.55);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(-4 * s, 12 * s, 0, 22 * s);
        ctx.quadraticCurveTo(4 * s, 12 * s, 0, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
      ctx.fillStyle = "#713f12";
      ctx.fillRect(-2 * s, -6 * s, 4 * s, 6 * s);
    }
    ctx.restore();
  }

  function shade(hex, amt) {
    if (typeof hex !== "string") return hex;
    // Accept hex or rgb() input; fall back to hex parsing.
    let r, g, b;
    if (hex.startsWith("rgb")) {
      const m = hex.match(/\d+/g);
      if (!m) return hex;
      [r, g, b] = m.map((v) => parseInt(v, 10));
    } else {
      const c = parseHex(hex);
      r = c.r; g = c.g; b = c.b;
    }
    r = clamp(Math.round(r + 255 * amt), 0, 255);
    g = clamp(Math.round(g + 255 * amt), 0, 255);
    b = clamp(Math.round(b + 255 * amt), 0, 255);
    return `rgb(${r},${g},${b})`;
  }
  function parseHex(hex) {
    const h = hex.replace("#", "");
    return {
      r: parseInt(h.substring(0, 2), 16),
      g: parseInt(h.substring(2, 4), 16),
      b: parseInt(h.substring(4, 6), 16),
    };
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  window.DuckArt = { drawDuck, PRESETS };
})();
