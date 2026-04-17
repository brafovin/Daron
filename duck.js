// Duck rendering + presets. Exposes window.DuckArt.

(function () {
  const PRESETS = {
    classic: {
      name: "Classic",
      bodyColor: "#ffd23f",
      beakColor: "#f4861f",
      eyeColor: "#1a1a1a",
      wingColor: "#eab308",
      hat: "none",
    },
    evil: {
      name: "Evil",
      bodyColor: "#2b2b2b",
      beakColor: "#b91c1c",
      eyeColor: "#ff2d2d",
      wingColor: "#111111",
      hat: "top",
    },
    royal: {
      name: "Royal",
      bodyColor: "#f5f5f5",
      beakColor: "#f59e0b",
      eyeColor: "#0f172a",
      wingColor: "#e5e7eb",
      hat: "crown",
    },
    party: {
      name: "Party",
      bodyColor: "#fb7185",
      beakColor: "#facc15",
      eyeColor: "#1e293b",
      wingColor: "#f472b6",
      hat: "party",
    },
    chill: {
      name: "Chill",
      bodyColor: "#93c5fd",
      beakColor: "#f97316",
      eyeColor: "#111",
      wingColor: "#60a5fa",
      hat: "cap",
    },
  };

  // Draw a duck at (x,y) centered, sized by `size` (body width in px),
  // facing `facing` in radians, with optional squash for slip animation.
  function drawDuck(ctx, duck, x, y, facing, state) {
    const s = duck.size / 90; // scale factor
    const squashX = state?.squashX ?? 1;
    const squashY = state?.squashY ?? 1;
    const tilt = state?.tilt ?? 0;
    const walkPhase = state?.walkPhase ?? 0;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(tilt);
    ctx.scale(squashX, squashY);
    // Face left if facing > PI/2 or < -PI/2
    const faceLeft = Math.cos(facing) < 0;
    if (faceLeft) ctx.scale(-1, 1);

    // Shadow
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.ellipse(0, 44 * s, 50 * s, 8 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Legs (walk animation)
    const legSwing = Math.sin(walkPhase) * 6 * s;
    ctx.strokeStyle = duck.beakColor;
    ctx.lineWidth = 5 * s;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-10 * s, 30 * s);
    ctx.lineTo(-10 * s - legSwing, 48 * s);
    ctx.moveTo(12 * s, 30 * s);
    ctx.lineTo(12 * s + legSwing, 48 * s);
    ctx.stroke();
    // Feet
    ctx.fillStyle = duck.beakColor;
    drawFoot(ctx, -10 * s - legSwing, 48 * s, s);
    drawFoot(ctx, 12 * s + legSwing, 48 * s, s);

    // Body
    ctx.fillStyle = duck.bodyColor;
    ctx.strokeStyle = shade(duck.bodyColor, -0.25);
    ctx.lineWidth = 2 * s;
    ctx.beginPath();
    ctx.ellipse(0, 10 * s, 46 * s, 34 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Tail
    ctx.beginPath();
    ctx.moveTo(-40 * s, -2 * s);
    ctx.lineTo(-62 * s, -12 * s);
    ctx.lineTo(-40 * s, 14 * s);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Wing
    ctx.fillStyle = duck.wingColor;
    ctx.strokeStyle = shade(duck.wingColor, -0.25);
    ctx.beginPath();
    ctx.ellipse(-4 * s, 10 * s, 24 * s, 18 * s, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Head
    ctx.fillStyle = duck.bodyColor;
    ctx.strokeStyle = shade(duck.bodyColor, -0.25);
    ctx.beginPath();
    ctx.arc(30 * s, -18 * s, 22 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Beak
    ctx.fillStyle = duck.beakColor;
    ctx.strokeStyle = shade(duck.beakColor, -0.3);
    ctx.beginPath();
    ctx.moveTo(44 * s, -22 * s);
    ctx.quadraticCurveTo(68 * s, -14 * s, 50 * s, -8 * s);
    ctx.quadraticCurveTo(44 * s, -10 * s, 44 * s, -22 * s);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Beak line
    ctx.beginPath();
    ctx.moveTo(46 * s, -14 * s);
    ctx.lineTo(62 * s, -12 * s);
    ctx.stroke();

    // Eye
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(36 * s, -22 * s, 6 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = duck.eyeColor;
    ctx.beginPath();
    ctx.arc(38 * s, -22 * s, 3.2 * s, 0, Math.PI * 2);
    ctx.fill();
    // Eye gleam
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(39 * s, -23 * s, 1 * s, 0, Math.PI * 2);
    ctx.fill();

    // Hat
    drawHat(ctx, duck.hat, s);

    ctx.restore();
  }

  function drawFoot(ctx, x, y, s) {
    ctx.beginPath();
    ctx.moveTo(x - 6 * s, y);
    ctx.lineTo(x + 8 * s, y);
    ctx.lineTo(x + 4 * s, y + 3 * s);
    ctx.lineTo(x - 4 * s, y + 3 * s);
    ctx.closePath();
    ctx.fill();
  }

  function drawHat(ctx, hat, s) {
    if (!hat || hat === "none") return;
    ctx.save();
    ctx.translate(30 * s, -38 * s);
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
      // Backwards brim
      ctx.fillRect(-22 * s, -1 * s, 10 * s, 5 * s);
      ctx.fillStyle = "#dbeafe";
      ctx.fillRect(-4 * s, -14 * s, 8 * s, 3 * s);
    }
    ctx.restore();
  }

  function shade(hex, amt) {
    const c = parseHex(hex);
    const r = clamp(Math.round(c.r + 255 * amt), 0, 255);
    const g = clamp(Math.round(c.g + 255 * amt), 0, 255);
    const b = clamp(Math.round(c.b + 255 * amt), 0, 255);
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
