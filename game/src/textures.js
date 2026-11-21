// textures.js — every surface in the 3D observatory that carries a drawing
// is painted here on a 2D canvas and handed to Three.js as a texture: the
// two star charts (whose labels, stars and joined lines are differences),
// the barometer's face (its word and its twelve-o'clock tick are
// differences), the little gauges, the plank floor, the rug's rings, the
// candle flames and the soft glow sprites.
//
// Because a difference can live inside a texture, these makers take the
// difference state as arguments and are called again when it changes; the
// scene swaps the new texture onto the same mesh.

const THREE = window.THREE;

function canvasTexture(width, height, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  draw(ctx, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

// ——— The star charts ———
// Constellation points and lines live in texture space (512 by 300 for the
// star field, with a label band beneath). The scene projects each chart's
// named points back into the panel for the difference anchors.

export const LYRA_POINTS = [[120, 110], [225, 145], [320, 95], [265, 205], [375, 225], [145, 240]];
export const LYRA_LINES = [[0, 1], [1, 2], [2, 3], [3, 5], [2, 4]];
export const CYGNUS_POINTS = [[256, 60], [256, 135], [256, 210], [160, 110], [352, 110], [256, 275]];
export const CYGNUS_LINES = [[0, 1], [1, 2], [3, 1], [1, 4], [2, 5]];

export function makeChartTexture({ label, points, lines, skipStar = -1, skipLine = null }) {
  return canvasTexture(512, 388, (ctx, w, h) => {
    ctx.fillStyle = '#e8d9ae';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(160,130,70,0.25)';
    for (let i = 0; i < 40; i++) {
      ctx.fillRect((i * 173) % w, (i * 269) % h, 22, 3);
    }
    ctx.fillStyle = '#cbb582';
    ctx.fillRect(0, h - 78, w, 78);
    ctx.strokeStyle = 'rgba(90,70,30,0.7)';
    ctx.lineWidth = 3;
    for (const [a, b] of lines) {
      if (skipLine && a === skipLine[0] && b === skipLine[1]) continue;
      ctx.beginPath();
      ctx.moveTo(points[a][0], points[a][1]);
      ctx.lineTo(points[b][0], points[b][1]);
      ctx.stroke();
    }
    points.forEach(([px, py], i) => {
      if (i === skipStar) return;
      ctx.fillStyle = '#2b2013';
      ctx.beginPath();
      ctx.arc(px, py, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(43,32,19,0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px - 15, py);
      ctx.lineTo(px + 15, py);
      ctx.moveTo(px, py - 15);
      ctx.lineTo(px, py + 15);
      ctx.stroke();
    });
    ctx.fillStyle = '#2b2013';
    ctx.font = 'bold 44px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, w / 2, h - 24);
  });
}

// ——— Dials ———

export function makeBarometerTexture({ word = 'FAIR', topTick = true } = {}) {
  return canvasTexture(256, 256, (ctx, w, h) => {
    const c = w / 2;
    ctx.fillStyle = '#e8d9ae';
    ctx.beginPath();
    ctx.arc(c, c, 126, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2b2013';
    ctx.lineWidth = 4;
    for (let i = 0; i < 12; i++) {
      if (i === 0 && !topTick) continue;
      const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(c + Math.cos(a) * 96, c + Math.sin(a) * 96);
      ctx.lineTo(c + Math.cos(a) * 116, c + Math.sin(a) * 116);
      ctx.stroke();
    }
    ctx.fillStyle = '#2b2013';
    ctx.font = 'bold 30px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(word, c, c + 62);
    ctx.font = '17px Georgia, serif';
    ctx.fillText('· BAROMETER ·', c, c - 44);
  });
}

export function makeGaugeTexture() {
  return canvasTexture(128, 128, (ctx, w, h) => {
    const c = w / 2;
    ctx.fillStyle = '#e6ddba';
    ctx.beginPath();
    ctx.arc(c, c, 62, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#232030';
    ctx.lineWidth = 3;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(c + Math.cos(a) * 44, c + Math.sin(a) * 44);
      ctx.lineTo(c + Math.cos(a) * 56, c + Math.sin(a) * 56);
      ctx.stroke();
    }
  });
}

// ——— Floor and rug ———

export function makeFloorTexture() {
  const texture = canvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#3d2a17';
    ctx.fillRect(0, 0, w, h);
    const rows = 6;
    for (let r = 0; r < rows; r++) {
      const y = (r / rows) * h;
      ctx.fillStyle = r % 2 ? '#43301a' : '#392812';
      ctx.fillRect(0, y, w, h / rows - 3);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      for (let g = 0; g < 12; g++) {
        ctx.fillRect((g * 149 + r * 61) % w, y + 8 + ((g * 37) % 60), 60, 2);
      }
      const seam = ((r * 197) % 300) + 60;
      ctx.fillRect(seam, y, 4, h / rows - 3);
    }
  });
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 2);
  return texture;
}

export function makeRugTexture(stripeColor) {
  return canvasTexture(256, 256, (ctx, w, h) => {
    const c = w / 2;
    ctx.fillStyle = '#5f2230';
    ctx.beginPath();
    ctx.arc(c, c, 126, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#c9973f';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(c, c, 112, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = stripeColor;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(c, c, 92, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(233,196,106,0.5)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(c, c, 60, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,0.16)';
    for (let i = 0; i < 26; i++) {
      ctx.fillRect((i * 89) % w, (i * 131) % h, 16, 3);
    }
  });
}

// ——— Sprites: flames, glows, corona rays ———

export function makeFlameTexture() {
  return canvasTexture(128, 160, (ctx, w, h) => {
    const x = w / 2;
    const y = h * 0.52;
    const size = 52;
    const glow = ctx.createRadialGradient(x, y, 2, x, y, size * 1.5);
    glow.addColorStop(0, 'rgba(255,176,84,0.55)');
    glow.addColorStop(1, 'rgba(255,150,50,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
    const flame = ctx.createLinearGradient(x, y - size, x, y + size * 0.7);
    flame.addColorStop(0, '#fff3c4');
    flame.addColorStop(0.55, '#ffb340');
    flame.addColorStop(1, 'rgba(224,106,0,0.9)');
    ctx.fillStyle = flame;
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.quadraticCurveTo(x + size * 0.55, y - size * 0.1, x + size * 0.34, y + size * 0.55);
    ctx.quadraticCurveTo(x, y + size * 0.85, x - size * 0.34, y + size * 0.55);
    ctx.quadraticCurveTo(x - size * 0.55, y - size * 0.1, x, y - size);
    ctx.fill();
  });
}

export function makeGlowTexture() {
  return canvasTexture(128, 128, (ctx, w, h) => {
    const glow = ctx.createRadialGradient(64, 64, 2, 64, 64, 62);
    glow.addColorStop(0, 'rgba(255,255,255,0.9)');
    glow.addColorStop(0.4, 'rgba(255,255,255,0.28)');
    glow.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
  });
}

export function makeRayTexture() {
  return canvasTexture(64, 256, (ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, h, 0, 0);
    grad.addColorStop(0, 'rgba(240,244,255,0.95)');
    grad.addColorStop(1, 'rgba(240,244,255,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(26, h);
    ctx.lineTo(38, h);
    ctx.lineTo(33, 0);
    ctx.lineTo(31, 0);
    ctx.closePath();
    ctx.fill();
  });
}

// The dome's alpha map: white (opaque) everywhere except the black capsule
// of the slit, which the renderer knocks out so the sky shows through.
export function makeDomeAlphaTexture() {
  const texture = canvasTexture(1024, 512, (ctx, w, h) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 52;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(w * 0.615, h * 0.04);
    ctx.lineTo(w * 0.735, h * 0.46);
    ctx.stroke();
  });
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}
