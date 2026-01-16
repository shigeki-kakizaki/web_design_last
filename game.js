"use strict";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

const keys = { left: false, right: false };

const mouse = { x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 };
let lastTime = 0;

// ===== カメラ（追加） =====
const camera = { x: 0, y: 0 };

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

// function updateCamera() {
//   // プレイヤーを画面中央に置く
//   const targetX = player.x - GAME_WIDTH / 2;
//   const targetY = player.y - GAME_HEIGHT / 2;

//   // スムージング
//   camera.x += (targetX - camera.x) * CAMERA_LERP;
//   camera.y += (targetY - camera.y) * CAMERA_LERP;

//   // ワールド外にカメラが出ないようにクランプ
//   camera.x = clamp(camera.x, 0, WORLD_WIDTH - GAME_WIDTH);
//   camera.y = clamp(camera.y, 0, WORLD_HEIGHT - GAME_HEIGHT);
// }

function updateCamera() {
  // ===== 横だけ追従（縦固定） =====
  camera.y = 0;

  // ===== look-ahead（先読み） =====
  // dir は -1 / 1 を想定（止まってる時でも最後の向きを使える）
  const dir = (player.dir === 0 ? 1 : player.dir);

  // 速度で先読み量を調整（速いほど先を見る）
  const speedFactor = Math.min(1, Math.abs(player.vx) / MOVE_SPEED);
  const look = dir * CAMERA_LOOKAHEAD * (0.3 + CAMERA_LOOKAHEAD_BY_VX * speedFactor);
  // 0.3 は「止まってても少し先を見る」分（好みで 0〜0.5）

  const targetX = (player.x + look) - GAME_WIDTH / 2;

  // スムーズ追従
  camera.x += (targetX - camera.x) * CAMERA_LERP;

  // ワールド外に出ないようにクランプ
  camera.x = clamp(camera.x, 0, WORLD_WIDTH - GAME_WIDTH);
}


function handleKeyDown(e) {
  switch (e.key) {
    case "ArrowLeft":
      keys.left = true;
      player.dir = -1;
      break;
    case "ArrowRight":
      keys.right = true;
      player.dir = 1;
      break;
    case " ":
      // 13-6：フック中 Space で引っ張りジャンプ（解除を伴う）
      if (wire.phase === "hooked") {
        pullJumpFromWire();
      } else if (player.onGround) {
        player.vy = JUMP_SPEED;
        player.onGround = false;
      }
      break;
    case "x":
    case "X":
      resetWire();
      break;
  }
}

function handleKeyUp(e) {
  switch (e.key) {
    case "ArrowLeft":
      keys.left = false;
      break;
    case "ArrowRight":
      keys.right = false;
      break;
  }
}

function handleMouseMove(e) {
  const rect = canvas.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
}

function handleMouseDown(e) {
  if (e.button === 0) {
    // ★重要：画面座標 → ワールド座標に変換
    const worldMouseX = mouse.x + camera.x;
    const worldMouseY = mouse.y + camera.y;
    fireWireToMouse(worldMouseX, worldMouseY);
  }
}

document.addEventListener("keydown", handleKeyDown);
document.addEventListener("keyup", handleKeyUp);
canvas.addEventListener("mousemove", handleMouseMove);
canvas.addEventListener("mousedown", handleMouseDown);

function pullJumpFromWire() {
  if (wire.phase !== "hooked") return;

  const ax = wire.ex;
  const ay = wire.ey;

  // プレイヤー→アンカー方向（ワイヤ方向）
  let dx = ax - player.x;
  let dy = ay - player.y;
  let dist = Math.hypot(dx, dy);

  if (dist === 0) {
    dist = 0.0001;
    dx = 0;
    dy = -1;
  }

  dx /= dist;
  dy /= dist;

  player.vx += dx * PULL_JUMP_SPEED;
  player.vy += dy * PULL_JUMP_SPEED;

  // 引っ張りジャンプは解除を伴う
  resetWire();
}

function update(dt) {
  updateWire(dt);

  // Playerの位置更新
  if (wire.phase === "hooked") {
    updatePlayerSwing(dt, keys, wire);
  } else {
    updatePlayerNormal(dt, keys);
  }

  // ★カメラ更新（追加）
  updateCamera();
}

// ===== ワールド描画（camera.translate前提） =====
function drawWorld() {
  // 天井（ワールド全体に引く）
  ctx.strokeStyle = "#444";
  ctx.beginPath();
  ctx.moveTo(0, CEILING_HOOK_Y);
  ctx.lineTo(WORLD_WIDTH, CEILING_HOOK_Y);
  ctx.stroke();

  // 地面（ワールド全体）
  ctx.fillStyle = "#30384a";
  ctx.fillRect(0, GROUND_Y, WORLD_WIDTH, WORLD_HEIGHT - GROUND_Y);

  // 足場：ひとまず複数置くとスクロールが楽しい
  ctx.fillStyle = "#3b465e";
  ctx.fillRect(120, 320, 200, 20);
  ctx.fillRect(600, 260, 220, 20);
  ctx.fillRect(1100, 300, 240, 20);
  ctx.fillRect(1700, 240, 260, 20);
  ctx.fillRect(2300, 310, 240, 20);
}

function drawHUD() {
  ctx.fillStyle = "#fff";
  ctx.font = "14px system-ui";
  ctx.fillText("左クリック: マウス方向にワイヤ発射", 20, 24);
  ctx.fillText("矢印左右: 移動 / Space: ジャンプ（フック中は引っ張りジャンプ）", 20, 44);
  ctx.fillText(`camera=(${camera.x.toFixed(0)}, ${camera.y.toFixed(0)})`, 20, 64);
}

function draw() {
  // ① 画面クリア（スクリーン座標）
  ctx.fillStyle = "#151a28";
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  // ② ワールド→スクリーン変換
  ctx.save();
  ctx.translate(-camera.x, -camera.y);

  // ③ ワールドを描画
  drawWorld();
  drawWire(ctx);
  drawPlayer(ctx);

  ctx.restore();

  // ④ HUDは固定（スクリーン座標）
  drawHUD();
}

function loop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  const dt = (timestamp - lastTime) / 1000;
  lastTime = timestamp;

  update(dt);
  draw();

  requestAnimationFrame(loop);
}

resetPlayer();
resetWire();
requestAnimationFrame(loop);
