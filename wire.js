"use strict";

const wire = {
    phase: "none", // none, flying, hooked
    sx: 0, sy: 0,
    ex: 0, ey: 0,
    vx: 0, vy: 0,    // 速度ベクトル
    length: 0
};

function resetWire(){
    wire.phase = "none";
    wire.sx = wire.sy = wire.ex = wire.ey = 0;
    wire.vx = wire.vy = 0;
}

function fireWireFixed(){
    if (wire.phase !== "none") return;

    wire.phase = "flying";
    wire.sx = player.x;
    wire.sy = player.y;
    wire.ex = player.x;
    wire.ey = player.y;

    const angle = 30 * Math.PI / 180;

    const dx = Math.cos(angle);
    const dy = -Math.sin(angle);

    // ワイヤの飛行速度決定
    wire.vx = dx * WIRE_SPEED;
    wire.vy = dy * WIRE_SPEED;
}

function fireWireToMouse(mouseX, mouseY){
    if (wire.phase !== "none") return;

    wire.phase = "flying";
    wire.sx = player.x;
    wire.sy = player.y;
    wire.ex = player.x;
    wire.ey = player.y;

    let dx = mouseX - player.x;
    let dy = mouseY - player.y;
    let len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;
    
    // ワイヤの飛行速度決定
    wire.vx = dx * WIRE_SPEED;
    wire.vy = dy * WIRE_SPEED;
}


function updateWire(dt) {
    if (wire.phase !== "flying") return;

    wire.ex += wire.vx * dt;
    wire.ey += wire.vy * dt;

    const dx = wire.ex - wire.sx;
    const dy = wire.ey - wire.sy;
    const dist = Math.hypot(dx, dy);

    // 天井に届いたらフック
    if (wire.ey <= CEILING_HOOK_Y) {
        wire.phase = "hooked";
        wire.length = Math.hypot(player.x - wire.ex, player.y - wire.ey);
        if (wire.length < 60) wire.length = 60;
        initSwingState(wire);
        return;
    }

    // 射程越え or ワールド外で終了
    if (
        dist > MAX_WIRE_DIST ||
        wire.ex < 0 || wire.ex > WORLD_WIDTH ||
        wire.ey < 0 || wire.ey > WORLD_HEIGHT
    ) {
        resetWire();
    }
}

function initSwingState(wire) {
  const ax = wire.ex, ay = wire.ey;
  const dx = player.x - ax;
  const dy = player.y - ay;

  // θの定義：下向きが 0 になるようにする（振り子っぽくて分かりやすい）
  // dyが下なら正、dxが右なら正
  player.swing.theta = Math.atan2(dx, dy); // ←ここがポイント（sin/cosと整合）
  player.swing.omega = 0;

  // ロープ長
  wire.length = Math.hypot(dx, dy);
}

function drawWire(ctx) {
    if (wire.phase === "none") return;

    ctx.strokeStyle = "#7ef5e1";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(wire.ex, wire.ey);
    ctx.stroke();

    // フック状態の描画
    if (wire.phase === "hooked") {
        ctx.fillStyle = "#36ff80";
        ctx.beginPath();
        ctx.arc(wire.ex, wire.ey, 6, 0, Math.PI * 2 );
        ctx.fill();
    }
}

