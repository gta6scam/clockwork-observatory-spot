// scene-paint.js — turns the 3D observatory into the two panels of a
// round, and draws the marks that play leaves on them.
//
// One WebGL renderer is shared. For each round the scene is built once,
// rendered plain for the left panel ("as it truly is"), then the round's
// twelve differences are applied to the scene graph and it is rendered
// again for the right panel ("as the meddler left it"). Each difference's
// 3D anchor is projected through the same camera into panel pixels, which
// is where the game stamps its markers and tests its clicks — the hunt
// itself never touches the scene.

const THREE = window.THREE;

import { buildObservatory } from './scene3d.js';
import { DIFFERENCES } from './differences.js';

export const PANEL_WIDTH = 600;
export const PANEL_HEIGHT = 640;

let renderer = null;

function ensureRenderer() {
  if (renderer) return renderer;
  renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(PANEL_WIDTH, PANEL_HEIGHT);
  renderer.setPixelRatio(1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.06;
  return renderer;
}

function snapshot() {
  const canvas = document.createElement('canvas');
  canvas.width = PANEL_WIDTH;
  canvas.height = PANEL_HEIGHT;
  canvas.getContext('2d').drawImage(renderer.domElement, 0, 0);
  return canvas;
}

function projectAnchors(observatory) {
  const anchors = new Map();
  const v = new THREE.Vector3();
  for (const [id, object] of observatory.anchors) {
    object.getWorldPosition(v);
    v.project(observatory.camera);
    anchors.set(id, {
      x: (v.x * 0.5 + 0.5) * PANEL_WIDTH,
      y: (0.5 - v.y * 0.5) * PANEL_HEIGHT,
      r: DIFFERENCES[id] ? DIFFERENCES[id].r : 18,
    });
  }
  return anchors;
}

// Render one round's pair of panels. Returns the two snapshot canvases and
// the projected anchor of every difference in the game.
export function renderPanels(phaseName, diffIds) {
  const gl = ensureRenderer();
  const observatory = buildObservatory(phaseName, gl);
  gl.render(observatory.scene, observatory.camera);
  const left = snapshot();
  const anchors = projectAnchors(observatory);
  for (const id of diffIds) observatory.setDifference(id, true);
  gl.render(observatory.scene, observatory.camera);
  const right = snapshot();
  return { left, right, anchors };
}

// The found marker: a brass ring with a soft inner glow and four ticks,
// drawn at scale `pop` (0 to 1 and a breath past it) while it lands, then
// at rest. The same mark is stamped on both panels.
export function drawFoundMarker(ctx, x, y, radius, pop) {
  const scale = pop < 1 ? easeOutBack(pop) : 1;
  const r = radius * scale;
  if (!Number.isFinite(r) || r <= 0) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, pop * 1.6);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,196,80,0.16)';
  ctx.fill();
  ctx.lineWidth = 3.4;
  ctx.strokeStyle = '#ffcf5e';
  ctx.stroke();
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = 'rgba(120,74,8,0.9)';
  ctx.beginPath();
  ctx.arc(x, y, r + 2.6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = '#ffcf5e';
  ctx.lineWidth = 3;
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * (r + 1), y + Math.sin(a) * (r + 1));
    ctx.lineTo(x + Math.cos(a) * (r + 7), y + Math.sin(a) * (r + 7));
    ctx.stroke();
  }
  // A tick at the heart of the ring, so a find reads as CONFIRMED at a
  // glance — the ring says "here", the tick says "done". It rides the same
  // pop scale as the ring, so the two land together.
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const tick = () => {
    ctx.beginPath();
    ctx.moveTo(x - 0.44 * r, y + 0.03 * r);
    ctx.lineTo(x - 0.15 * r, y + 0.33 * r);
    ctx.lineTo(x + 0.47 * r, y - 0.34 * r);
    ctx.stroke();
  };
  ctx.lineWidth = Math.max(2.4, r * 0.17) + 1.8;
  ctx.strokeStyle = 'rgba(120,74,8,0.9)';
  tick();
  ctx.lineWidth = Math.max(2.4, r * 0.17);
  ctx.strokeStyle = '#ffcf5e';
  tick();
  ctx.restore();
}

// The hint: three gentle expanding rings around the hiding place, never a
// hard outline — the player still has to see the thing itself.
export function drawHintPulse(ctx, x, y, radius, t) {
  ctx.save();
  for (let i = 0; i < 3; i++) {
    const phase = (t * 0.7 + i / 3) % 1;
    const r = radius + phase * 34;
    ctx.globalAlpha = (1 - phase) * 0.55;
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = '#8fd8ff';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

// The misclick mark: a red cross that flashes and fades over about a second.
export function drawMissMark(ctx, x, y, age) {
  const alpha = Math.max(0, 1 - age / 0.9);
  const s = 11;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = '#ff5348';
  ctx.lineWidth = 3.6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - s, y - s);
  ctx.lineTo(x + s, y + s);
  ctx.moveTo(x + s, y - s);
  ctx.lineTo(x - s, y + s);
  ctx.stroke();
  ctx.restore();
}

function easeOutBack(t) {
  const c = 1.70158;
  const u = t - 1;
  return 1 + (c + 1) * u * u * u + c * u * u;
}
