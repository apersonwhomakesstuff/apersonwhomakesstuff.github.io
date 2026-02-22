const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const W = canvas.width;
const H = canvas.height;
const GROUND_Y = H - 96;
const TILE = 48;
const SPEED = 370;
const GRAVITY = 2400;
const JUMP_VEL = -860;

const palette = {
  bgA: "#0f1c6e",
  bgB: "#130f5a",
  glow: "#45f5ff",
  floor: "#2ef0e6",
  floorDark: "#127f87",
  cube: "#ffe25d",
  cube2: "#ff9c21",
  spike: "#f5f8ff",
  spikeShadow: "#7e87c6"
};

const player = {
  x: 190,
  y: GROUND_Y - TILE,
  size: TILE,
  vy: 0,
  onGround: true,
  alive: true,
  rotation: 0
};

// Level blocks are in tile units. s=spike, b=block
const pattern = "....s....s...ss...s...b..s...ss....s..b....s....sss.....s...b...s.....ss..s....b....s....s....sss....s....b....s...ss....";
const level = [];
for (let i = 0; i < pattern.length; i += 1) {
  const ch = pattern[i];
  if (ch === "s") {
    level.push({ type: "spike", x: i * TILE + 700, y: GROUND_Y });
  }
  if (ch === "b") {
    level.push({ type: "block", x: i * TILE + 700, y: GROUND_Y - TILE });
  }
}
const levelEnd = pattern.length * TILE + 900;
let distance = 0;
let best = 0;
let runStart = performance.now();

function reset() {
  player.y = GROUND_Y - player.size;
  player.vy = 0;
  player.onGround = true;
  player.alive = true;
  player.rotation = 0;
  distance = 0;
  runStart = performance.now();
}

function jump() {
  if (player.alive && player.onGround) {
    player.vy = JUMP_VEL;
    player.onGround = false;
  } else if (!player.alive) {
    reset();
  }
}

window.addEventListener("keydown", (e) => {
  if (["Space", "ArrowUp", "KeyW"].includes(e.code)) {
    e.preventDefault();
    jump();
  }
});
window.addEventListener("pointerdown", jump);

function rectVsRect(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function rectVsTriangle(rect, triX, triY, width, height) {
  const p1 = { x: triX, y: triY };
  const p2 = { x: triX + width, y: triY };
  const p3 = { x: triX + width / 2, y: triY - height };

  for (let i = 0; i <= 4; i += 1) {
    for (let j = 0; j <= 4; j += 1) {
      const px = rect.x + (rect.w * i) / 4;
      const py = rect.y + (rect.h * j) / 4;
      const area = Math.abs((p1.x * (p2.y - p3.y) + p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y)) / 2);
      const a1 = Math.abs((px * (p2.y - p3.y) + p2.x * (p3.y - py) + p3.x * (py - p2.y)) / 2);
      const a2 = Math.abs((p1.x * (py - p3.y) + px * (p3.y - p1.y) + p3.x * (p1.y - py)) / 2);
      const a3 = Math.abs((p1.x * (p2.y - py) + p2.x * (py - p1.y) + px * (p1.y - p2.y)) / 2);
      if (Math.abs(area - (a1 + a2 + a3)) < 1) return true;
    }
  }
  return false;
}

function update(dt) {
  if (!player.alive) return;

  distance += SPEED * dt;
  player.vy += GRAVITY * dt;
  player.y += player.vy * dt;

  if (!player.onGround) {
    player.rotation += dt * 8;
  }

  if (player.y + player.size >= GROUND_Y) {
    player.y = GROUND_Y - player.size;
    player.vy = 0;
    player.onGround = true;
    player.rotation = Math.round(player.rotation / (Math.PI / 2)) * (Math.PI / 2);
  }

  const rect = { x: player.x + 6, y: player.y + 6, w: player.size - 12, h: player.size - 12 };

  for (const obj of level) {
    const sx = obj.x - distance;
    if (sx < -100 || sx > W + 100) continue;

    if (obj.type === "block") {
      const b = { x: sx, y: obj.y, w: TILE, h: TILE };
      if (rectVsRect(rect, b)) {
        if (player.vy > 0 && player.y + player.size - player.vy * dt <= obj.y) {
          player.y = obj.y - player.size;
          player.vy = 0;
          player.onGround = true;
        } else {
          player.alive = false;
        }
      }
    } else {
      if (rectVsTriangle(rect, sx, obj.y, TILE, TILE)) {
        player.alive = false;
      }
    }
  }

  if (player.y > H + 100) player.alive = false;
  best = Math.max(best, distance);
}

function drawBackground() {
  const t = performance.now() * 0.001;
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, palette.bgA);
  grad.addColorStop(1, palette.bgB);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  for (let i = 0; i < 20; i += 1) {
    const x = ((i * 180 - (distance * 0.3 + t * 40)) % (W + 220)) - 100;
    const y = 70 + ((i * 57) % 260);
    ctx.fillStyle = "#77b2ff22";
    ctx.fillRect(x, y, 120, 12);
  }
}

function drawGround() {
  ctx.fillStyle = palette.floorDark;
  ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);

  for (let x = -((distance % TILE)); x < W + TILE; x += TILE) {
    ctx.fillStyle = palette.floor;
    ctx.fillRect(x, GROUND_Y, TILE - 2, 18);
    ctx.fillStyle = "#ffffff22";
    ctx.fillRect(x + 4, GROUND_Y + 4, TILE - 10, 4);
  }
}

function drawObjects() {
  for (const obj of level) {
    const x = obj.x - distance;
    if (x < -100 || x > W + 100) continue;

    if (obj.type === "block") {
      ctx.fillStyle = "#4df1ff";
      ctx.fillRect(x, obj.y, TILE, TILE);
      ctx.fillStyle = "#0f5ca8";
      ctx.fillRect(x + 6, obj.y + 6, TILE - 12, TILE - 12);
    } else {
      ctx.fillStyle = palette.spikeShadow;
      ctx.beginPath();
      ctx.moveTo(x + 2, obj.y);
      ctx.lineTo(x + TILE - 2, obj.y);
      ctx.lineTo(x + TILE / 2, obj.y - TILE + 2);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = palette.spike;
      ctx.beginPath();
      ctx.moveTo(x + 5, obj.y);
      ctx.lineTo(x + TILE - 5, obj.y);
      ctx.lineTo(x + TILE / 2, obj.y - TILE + 5);
      ctx.closePath();
      ctx.fill();
    }
  }
}

function drawPlayer() {
  ctx.save();
  ctx.translate(player.x + player.size / 2, player.y + player.size / 2);
  ctx.rotate(player.rotation);

  ctx.fillStyle = palette.cube2;
  ctx.fillRect(-player.size / 2, -player.size / 2, player.size, player.size);
  ctx.fillStyle = palette.cube;
  ctx.fillRect(-player.size / 2 + 6, -player.size / 2 + 6, player.size - 12, player.size - 12);

  ctx.fillStyle = "#1f285f";
  ctx.fillRect(-10, -7, 7, 7);
  ctx.fillRect(3, -7, 7, 7);
  ctx.restore();

  if (!player.alive) {
    ctx.strokeStyle = palette.glow;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(player.x + player.size / 2, player.y + player.size / 2, 34, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawUI() {
  const pct = Math.min(100, Math.floor((distance / levelEnd) * 100));
  const bestPct = Math.min(100, Math.floor((best / levelEnd) * 100));

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 24px Trebuchet MS";
  ctx.fillText(`${pct}%`, W - 90, 42);

  ctx.font = "18px Trebuchet MS";
  ctx.fillStyle = "#cdd7ff";
  ctx.fillText(`Best: ${bestPct}%`, 20, 34);

  const barW = W - 40;
  ctx.fillStyle = "#1d2565";
  ctx.fillRect(20, 46, barW, 12);
  ctx.fillStyle = "#6af6ff";
  ctx.fillRect(20, 46, (barW * pct) / 100, 12);

  if (!player.alive) {
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 52px Trebuchet MS";
    ctx.fillText("NEW ATTEMPT?", W / 2, H / 2 - 10);
    ctx.font = "24px Trebuchet MS";
    ctx.fillStyle = "#dbe2ff";
    ctx.fillText("Press Jump to restart", W / 2, H / 2 + 35);
    ctx.textAlign = "start";
  } else if (pct >= 100) {
    player.alive = false;
  }
}

let prev = performance.now();
function frame(now) {
  const dt = Math.min(0.033, (now - prev) / 1000);
  prev = now;

  update(dt);
  drawBackground();
  drawGround();
  drawObjects();
  drawPlayer();
  drawUI();

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
