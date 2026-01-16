"use strict";

const player = {
  x: 200,
  y: 300,
  prevY: 300,
  vx: 0,
  vy: 0,
  r: 16,
  onGround: false,
  dir: 1
};

player.swing = {
  theta: 0,  // 角度（ラジアン）
  omega: 0   // 角速度（rad/s）
};

function resetPlayer() {
  // ★14-3：少し高い初期位置（足場の上）
  // 足場：x=120..320, y=320, 上面y=320
  player.x = 200;
  player.y = 300 - player.r; // 足場上
  player.prevY = player.y;

  player.vx = 0;
  player.vy = 0;
  player.onGround = true;
  player.dir = 1;
}

// ★14-3：移動・ジャンプ入力なし（重力＋着地だけ）
function updatePlayerNormal(dt, keys) {
  player.prevY = player.y;

  // 移動
  if (keys.left) {
    player.vx = -MOVE_SPEED;
    player.dir = -1;
  } else if (keys.right) {
    player.vx = MOVE_SPEED;
    player.dir = 1;
  }

  // 重力
  player.vy += GRAVITY * dt;

  // 位置更新
  player.x += player.vx * dt;
  player.y += player.vy * dt;

  player.onGround = false;

  // 地面
  if (player.y + player.r > GROUND_Y) {
    player.y = GROUND_Y - player.r;
    player.vy = 0;
    player.onGround = true;

    player.vx *= 0.85;
  }

  // 足場（上から乗る）
  const platX = 120;
  const platY = 320;
  const platW = 200;

  if (player.vy >= 0) {
    const prevBottom = player.prevY + player.r;
    const currBottom = player.y + player.r;

    const withinX = (player.x > platX && player.x < platX + platW);
    const crossedTop = (prevBottom <= platY && currBottom >= platY);

    if (withinX && crossedTop) {
      player.y = platY - player.r;
      player.vy = 0;
      player.onGround = true;
      player.vx *= 0.85;
    }
  }

  // 画面端（今回はほぼ動かないが保険）
  if (player.x - player.r < 0) player.x = player.r;
  if (player.x + player.r > WORLD_WIDTH) player.x = WORLD_WIDTH - player.r;
}

// フック中（振り子運動：自然に揺れるだけ）
function updatePlayerSwing(dt, keys, wire) {
  player.prevY = player.y;

  const ax = wire.ex;
  const ay = wire.ey;
  const R = wire.length;

  // 重力
  player.vy += GRAVITY * dt;

  // いったん自由落下で更新
  player.x += player.vx * dt;
  player.y += player.vy * dt;

  // アンカー→プレイヤーのベクトルを計算する
  let dx = player.x - ax;
  let dy = player.y - ay;
  let dist = Math.hypot(dx, dy);

  if (dist === 0) {
    dit = 0.0001;
    dx = 0; dy = 1;
  }

  // dx, dyを単位ベクトル成分にする
  dx /= dist;
  dy /= dist;

  // 円周上に戻す
  player.x = ax + dx * R;
  player.y = ay + dy * R;

  // 射影 vr を求めて、ベクトル合成の式から接線方向のベクトル成分を計算する
  const vr = player.vx * dx + player.vy * dy;
  player.vx -= vr * dx;
  player.vy -= vr * dy;

  // スイング
  const swingX = (dy >= 0 ? 1 : -1);

  if (keys.left) {
    player.vx -= swingX * SWING_ACCEL * dt;
  }
  if (keys.right) {
    player.vx += swingX * SWING_ACCEL * dt;
  }
  
  player.onGround = false;
}

function updatePlayerSwingTheta(dt, wire) {
  player.prevY = player.y;

  const ax = wire.ex;
  const ay = wire.ey;
  const R  = wire.length;

  // 角度・角速度
  let theta = player.swing.theta;
  let omega = player.swing.omega;

  // ---- 振り子の運動方程式（簡易）
  // theta'' = -(g/R) * sin(theta)
  // 角速度更新 → 角度更新（オイラー法）
  const alpha = -(GRAVITY / R) * Math.sin(theta);
  omega += alpha * dt;

  // 減衰（任意：揺れを自然に落ち着かせる）
  omega *= 0.995;

  theta += omega * dt;

  // ---- 位置を角度から計算（円周上）
  player.x = ax + R * Math.sin(theta);
  player.y = ay + R * Math.cos(theta);

  // ---- 速度も角度から計算（接線方向）
  // x = ax + R sinθ → vx = R cosθ * ω
  // y = ay + R cosθ → vy = -R sinθ * ω
  player.vx = R * Math.cos(theta) * omega;
  player.vy = -R * Math.sin(theta) * omega;

  // 反映
  player.swing.theta = theta;
  player.swing.omega = omega;

  player.onGround = false;
}

function drawPlayer(ctx) {
  ctx.fillStyle = "#ffb347";
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#000";
  ctx.beginPath();
  ctx.moveTo(player.x, player.y);
  ctx.lineTo(player.x + player.dir * player.r, player.y);
  ctx.stroke();
}
