"use strict";

const GAME_WIDTH = 800;
const GAME_HEIGHT = 450;

const GROUND_Y = 400;
const CEILING_HOOK_Y = 80;

const GRAVITY = 1200;
const MOVE_SPEED = 320;
const JUMP_SPEED = -650;

const WIRE_SPEED = 900;
const MAX_WIRE_DIST = 500;

const SWING_ACCEL = 900;

// 引っ張りジャンプの強さ
const PULL_JUMP_SPEED = 600;

// ===== カメラ＆ワールド（追加） =====
// まずは横スクロール中心。必要なら縦も増やせます。
const WORLD_WIDTH  = 3200;
const WORLD_HEIGHT = 900;

// カメラ追従の滑らかさ（0.05〜0.2あたりで調整）
const CAMERA_LERP = 0.12;

// 進行方向に先読みする距離（px）
const CAMERA_LOOKAHEAD = 180;

// 速度による先読みの強さ（0〜1くらいで調整）
const CAMERA_LOOKAHEAD_BY_VX = 0.25;
