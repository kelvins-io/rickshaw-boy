/**
 * Canvas 拉车小游戏：按住加速，躲避障碍，跑完全程结算收入与体力
 */

import { speakPullEvent, stopVoice } from "./voice.js";

const DIFFICULTY = {
  1: { duration: 20, obstacleRate: 0.016, baseEarn: 12, wind: 0.02 },
  2: { duration: 22, obstacleRate: 0.024, baseEarn: 14, wind: 0.03 },
  3: { duration: 24, obstacleRate: 0.032, baseEarn: 16, wind: 0.045 },
};

const HUTONG_SRC = "assets/hutong-street.jpg";
let hutongImg = null;
let hutongReady = false;

function loadHutong() {
  if (hutongImg || typeof Image === "undefined") return;
  hutongImg = new Image();
  hutongImg.onload = () => {
    hutongReady = true;
  };
  hutongImg.src = HUTONG_SRC;
}

loadHutong();

export function createPullGame(canvas, options = {}) {
  const ctx = canvas.getContext("2d");
  const difficulty = DIFFICULTY[options.difficulty] || DIFFICULTY[1];
  const staminaStart = options.stamina ?? 70;

  let running = false;
  let finished = false;
  let holding = false;
  let laneDir = 0; // -1 up, 1 down
  let t0 = 0;
  let last = 0;
  let distance = 0; // 0..1
  let speed = 0;
  let playerY = 0.55; // lane 0.35..0.75
  let stamina = staminaStart;
  let obstacles = [];
  let scroll = 0;
  let hitFlash = 0;
  let earn = 0;
  let raf = 0;
  let resolveFinish = null;
  let touchStartY = null;
  let nextPushVoice = 0;

  const W = () => canvas.width;
  const H = () => canvas.height;

  function spawnObstacle() {
    const lane = 0.35 + Math.random() * 0.4;
    const kind = Math.random() < 0.55 ? "pit" : "dog";
    obstacles.push({
      x: 1.15 + Math.random() * 0.2,
      y: lane,
      kind,
      w: kind === "pit" ? 0.08 : 0.06,
      h: kind === "pit" ? 0.05 : 0.07,
      alive: true,
    });
  }

  function onDown(e) {
    e.preventDefault();
    holding = true;
    if (e.touches && e.touches[0]) {
      touchStartY = e.touches[0].clientY;
    }
  }
  function onMove(e) {
    if (!e.touches || !e.touches[0] || touchStartY == null) return;
    e.preventDefault();
    const dy = e.touches[0].clientY - touchStartY;
    if (Math.abs(dy) > 12) {
      laneDir = dy > 0 ? 1 : -1;
      touchStartY = e.touches[0].clientY;
    }
  }
  function onUp(e) {
    e.preventDefault();
    holding = false;
    laneDir = 0;
    touchStartY = null;
  }
  function onKey(e) {
    if (e.code === "Space" || e.key === " ") {
      e.preventDefault();
      holding = e.type === "keydown";
    }
    if (e.code === "ArrowUp" || e.key === "w" || e.key === "W") {
      e.preventDefault();
      laneDir = e.type === "keydown" ? -1 : laneDir === -1 ? 0 : laneDir;
    }
    if (e.code === "ArrowDown" || e.key === "s" || e.key === "S") {
      e.preventDefault();
      laneDir = e.type === "keydown" ? 1 : laneDir === 1 ? 0 : laneDir;
    }
  }

  function bind() {
    canvas.addEventListener("mousedown", onDown);
    canvas.addEventListener("mouseup", onUp);
    canvas.addEventListener("mouseleave", onUp);
    canvas.addEventListener("touchstart", onDown, { passive: false });
    canvas.addEventListener("touchmove", onMove, { passive: false });
    canvas.addEventListener("touchend", onUp, { passive: false });
    canvas.addEventListener("touchcancel", onUp, { passive: false });
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);
  }

  function unbind() {
    canvas.removeEventListener("mousedown", onDown);
    canvas.removeEventListener("mouseup", onUp);
    canvas.removeEventListener("mouseleave", onUp);
    canvas.removeEventListener("touchstart", onDown);
    canvas.removeEventListener("touchmove", onMove);
    canvas.removeEventListener("touchend", onUp);
    canvas.removeEventListener("touchcancel", onUp);
    window.removeEventListener("keydown", onKey);
    window.removeEventListener("keyup", onKey);
  }

  function finish(success) {
    if (finished) return;
    finished = true;
    running = false;
    cancelAnimationFrame(raf);
    unbind();
    speakPullEvent(success ? "success" : "fail");

    const progress = distance;
    const staminaDelta = Math.round((stamina - staminaStart) * 0.35) - (success ? 4 : 12);
    const ratio = success ? 1 : Math.max(0.25, progress);
    earn = Math.round(difficulty.baseEarn * ratio * (0.75 + (stamina / 100) * 0.5));
    if (!success) earn = Math.max(2, Math.floor(earn * 0.55));

    const result = {
      success,
      earn,
      staminaDelta,
      progress,
      staminaLeft: Math.max(0, Math.round(stamina)),
    };
    if (resolveFinish) resolveFinish(result);
  }

  function update(dt) {
    if (!running) return;
    const elapsed = (performance.now() - t0) / 1000;
    const targetSpeed = holding ? 0.42 : 0.16;
    speed += (targetSpeed - speed) * Math.min(1, dt * 4);
    speed = Math.max(0.08, speed - difficulty.wind);

    if (holding) {
      stamina -= 9 * dt;
      if (performance.now() >= nextPushVoice) {
        speakPullEvent("push");
        nextPushVoice = performance.now() + 3800 + Math.random() * 1800;
      }
    } else {
      stamina += 2.2 * dt;
    }
    stamina = Math.max(0, Math.min(100, stamina));

    playerY += laneDir * 0.55 * dt;
    if (stamina < 25) {
      playerY += Math.sin(elapsed * 7) * 0.05 * dt;
    }
    playerY = Math.max(0.32, Math.min(0.78, playerY));

    distance += (speed * dt) / difficulty.duration;
    scroll += speed * dt * 2.2;

    if (Math.random() < difficulty.obstacleRate * (1 + distance)) {
      spawnObstacle();
    }

    for (const o of obstacles) {
      o.x -= speed * dt * 0.9;
      if (o.x < -0.2) o.alive = false;

      if (o.alive) {
        const px = 0.18;
        const py = playerY;
        const pw = 0.1;
        const ph = 0.08;
        if (
          px < o.x + o.w &&
          px + pw > o.x &&
          py < o.y + o.h &&
          py + ph > o.y
        ) {
          o.alive = false;
          hitFlash = 0.35;
          speakPullEvent("hit");
          stamina -= o.kind === "dog" ? 14 : 10;
          speed *= 0.45;
          if (stamina <= 0) {
            stamina = 0;
            finish(false);
            return;
          }
        }
      }
    }
    obstacles = obstacles.filter((o) => o.alive);

    if (hitFlash > 0) hitFlash -= dt;

    if (distance >= 1) {
      distance = 1;
      finish(true);
    }

    if (options.onFrame) {
      options.onFrame({
        distance,
        earnPreview: Math.round(difficulty.baseEarn * distance),
        stamina,
        holding,
      });
    }
  }

  function drawHutongBg() {
    const w = W();
    const h = H();
    if (!hutongReady || !hutongImg) {
      ctx.fillStyle = "#2a2e33";
      ctx.fillRect(0, 0, w, h);
      return;
    }

    const img = hutongImg;
    const scale = Math.max(w / img.width, h / img.height) * 1.08;
    const dw = img.width * scale;
    const dh = img.height * scale;
    const parallax = (scroll * 90) % dw;
    const y = (h - dh) * 0.35;

    ctx.drawImage(img, -parallax, y, dw, dh);
    ctx.drawImage(img, -parallax + dw - 1, y, dw, dh);

    // 前景路面遮罩，让车轮落在胡同道上
    const roadTop = h * 0.58;
    const roadGrad = ctx.createLinearGradient(0, roadTop, 0, h);
    roadGrad.addColorStop(0, "rgba(42, 36, 28, 0.15)");
    roadGrad.addColorStop(0.35, "rgba(42, 36, 28, 0.55)");
    roadGrad.addColorStop(1, "rgba(26, 23, 20, 0.82)");
    ctx.fillStyle = roadGrad;
    ctx.fillRect(0, roadTop, w, h - roadTop);

    // 雨雪天压暗
    if (options.difficulty >= 3) {
      ctx.fillStyle = "rgba(30, 40, 55, 0.38)";
      ctx.fillRect(0, 0, w, h);
    } else {
      ctx.fillStyle = "rgba(20, 18, 14, 0.12)";
      ctx.fillRect(0, 0, w, h);
    }

    // 尘土 / 雪
    ctx.fillStyle =
      options.difficulty >= 3 ? "rgba(220,230,240,0.55)" : "rgba(200,180,140,0.28)";
    for (let i = 0; i < 22; i++) {
      const dx = ((scroll * 50 + i * 47) % (w + 20)) - 10;
      const dy = (i * 37 + scroll * 25) % (h * 0.55);
      ctx.fillRect(dx, dy, options.difficulty >= 3 ? 2 : 1.5, options.difficulty >= 3 ? 7 : 1.5);
    }

    // 路面滚动痕迹
    ctx.strokeStyle = "rgba(232, 223, 208, 0.12)";
    ctx.lineWidth = 2;
    const stripeGap = 70;
    const offset = (scroll * 140) % stripeGap;
    for (let x = -stripeGap + offset; x < w + stripeGap; x += stripeGap) {
      ctx.beginPath();
      ctx.moveTo(x, h * 0.78);
      ctx.lineTo(x + 28, h * 0.78);
      ctx.stroke();
    }
  }

  function drawRoad() {
    drawHutongBg();
  }

  function drawPlayer() {
    const w = W();
    const h = H();
    const px = w * 0.18;
    const py = h * playerY;

    // rickshaw body
    ctx.save();
    ctx.translate(px, py);
    if (holding) ctx.rotate(-0.04);

    // wheels
    ctx.strokeStyle = "#1a1714";
    ctx.fillStyle = "#2a2420";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(8, 22, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(58, 24, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // body
    ctx.fillStyle = "#c4a35a";
    ctx.fillRect(18, 0, 40, 16);
    ctx.fillStyle = "#8a5a2a";
    ctx.fillRect(0, 8, 22, 6);

    // runner
    ctx.fillStyle = "#e8dfd0";
    ctx.beginPath();
    ctx.arc(-10, -4, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#3d3832";
    ctx.fillRect(-16, 4, 14, 20);

    ctx.restore();

    if (hitFlash > 0) {
      ctx.fillStyle = `rgba(181, 74, 60, ${hitFlash})`;
      ctx.fillRect(0, 0, w, h);
    }
  }

  function drawObstacles() {
    const w = W();
    const h = H();
    for (const o of obstacles) {
      const x = o.x * w;
      const y = o.y * h;
      if (o.kind === "pit") {
        ctx.fillStyle = "#1a1714";
        ctx.beginPath();
        ctx.ellipse(x, y + 10, o.w * w * 0.7, o.h * h * 0.9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(90, 70, 50, 0.6)";
        ctx.beginPath();
        ctx.ellipse(x, y + 6, o.w * w * 0.5, o.h * h * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // dog
        ctx.fillStyle = "#5c4030";
        ctx.fillRect(x, y, 22, 12);
        ctx.beginPath();
        ctx.arc(x + 22, y + 4, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#1a1714";
        ctx.fillRect(x + 4, y + 12, 4, 8);
        ctx.fillRect(x + 14, y + 12, 4, 8);
      }
    }
  }

  function drawHud() {
    const w = W();
    // progress bar
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(24, 18, w - 48, 8);
    ctx.fillStyle = "#e8a04a";
    ctx.fillRect(24, 18, (w - 48) * distance, 8);

    ctx.fillStyle = "#e8dfd0";
    ctx.font = "14px Noto Serif SC, serif";
    ctx.fillText(
      holding ? "加速中 · ↑↓变道" : "滑行 · 按住加速 · ↑↓/滑动变道",
      24,
      48
    );
  }

  function frame(now) {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt);
    drawRoad();
    drawObstacles();
    drawPlayer();
    drawHud();
    raf = requestAnimationFrame(frame);
  }

  function start() {
    return new Promise((resolve) => {
      resolveFinish = resolve;
      running = true;
      finished = false;
      holding = false;
      distance = 0;
      speed = 0.2;
      playerY = 0.55;
      stamina = staminaStart;
      obstacles = [];
      scroll = 0;
      hitFlash = 0;
      nextPushVoice = performance.now() + 4500;
      t0 = performance.now();
      last = t0;
      bind();
      speakPullEvent("start");
      raf = requestAnimationFrame(frame);
    });
  }

  function destroy() {
    running = false;
    cancelAnimationFrame(raf);
    unbind();
    stopVoice();
  }

  return { start, destroy };
}
