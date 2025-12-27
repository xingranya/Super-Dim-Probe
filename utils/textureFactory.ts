import * as THREE from 'three';

const createTexture = (width: number, height: number, drawFn: (ctx: CanvasRenderingContext2D, w: number, h: number) => void): THREE.CanvasTexture => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    drawFn(ctx, width, height);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
};

export const createMetalRoughnessMap = () => createTexture(512, 512, (ctx, w, h) => {
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#666'); grad.addColorStop(1, '#888');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
  
  // Scratches
  for (let i = 0; i < 8000; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? '#999' : '#555';
    ctx.fillRect(Math.random() * w, Math.random() * h, Math.random() * 50, 1);
  }
  // Pitting
  for (let i = 0; i < 200; i++) {
    ctx.fillStyle = 'rgba(0,0,0,0.1)'; ctx.beginPath();
    ctx.arc(Math.random() * w, Math.random() * h, Math.random() * 20, 0, Math.PI * 2); ctx.fill();
  }
});

export const createCopperTwistMap = () => createTexture(512, 512, (ctx, w, h) => {
  ctx.fillStyle = '#b87333'; ctx.fillRect(0, 0, w, h);
  ctx.lineWidth = 15; ctx.strokeStyle = '#8a5025';
  for (let i = -h; i < w + h; i += 40) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + h, h); ctx.stroke();
  }
  // Highlights
  ctx.lineWidth = 5; ctx.strokeStyle = '#e6ac7f';
  for (let i = -h; i < w + h; i += 40) {
    ctx.beginPath(); ctx.moveTo(i + 10, 0); ctx.lineTo(i + h + 10, h); ctx.stroke();
  }
});

export const createShieldAlphaMap = () => createTexture(256, 256, (ctx, w, h) => {
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
  const step = 20;
  for (let i = 0; i <= w; i += step) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i - h, h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + h, h); ctx.stroke();
  }
});

export const createPVCBumpMap = () => createTexture(256, 256, (ctx, w, h) => {
  ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 30000; i++) {
    const v = Math.floor(Math.random() * 60) + 100;
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  }
});

export const createScreenGridMap = () => createTexture(256, 128, (ctx, w, h) => {
  ctx.fillStyle = '#001'; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#004400'; ctx.lineWidth = 1;
  for (let i = 0; i < w; i += 20) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke(); }
  for (let i = 0; i < h; i += 20) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke(); }
});

export const createTreeMap = () => createTexture(512, 512, (ctx, w, h) => {
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#00ffff'; ctx.lineWidth = 2; ctx.shadowBlur = 5; ctx.shadowColor = '#00ffff';
  
  const drawBranch = (x: number, y: number, len: number, angle: number, depth: number) => {
    if (depth === 0) return;
    const x2 = x + len * Math.cos(angle);
    const y2 = y + len * Math.sin(angle);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2); ctx.stroke();
    drawBranch(x2, y2, len * 0.7, angle - 0.3 - Math.random() * 0.3, depth - 1);
    drawBranch(x2, y2, len * 0.7, angle + 0.3 + Math.random() * 0.3, depth - 1);
  };
  drawBranch(w / 2, h, 100, -Math.PI / 2, 6);
});

export const createWaterTreeMap = () => createTexture(256, 256, (ctx, w, h) => {
  ctx.fillStyle = '#222'; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 300; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const r = Math.random() * 10 + 2;
    const grd = ctx.createRadialGradient(x, y, 0, x, y, r);
    grd.addColorStop(0, 'rgba(255,255,255,0.4)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
});
