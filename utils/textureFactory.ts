import * as THREE from 'three';

const createTexture = (width: number, height: number, drawFn: (ctx: CanvasRenderingContext2D, w: number, h: number) => void): THREE.CanvasTexture => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) drawFn(ctx, width, height);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
};

export const createMetalRoughnessMap = () => createTexture(512, 512, (ctx, w, h) => {
  ctx.fillStyle = '#222'; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#444'; ctx.lineWidth = 1;
  for (let i = 0; i < 500; i++) {
    ctx.beginPath();
    const x = Math.random() * w; const y = Math.random() * h;
    ctx.moveTo(x, y); ctx.lineTo(x + Math.random() * 20, y); ctx.stroke();
  }
});

export const createCopperStrandMap = () => createTexture(512, 512, (ctx, w, h) => {
  ctx.fillStyle = '#b87333'; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#6e3d18'; ctx.lineWidth = 4;
  for (let i = 0; i < w; i += 10) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + 50, h); ctx.stroke();
  }
});

export const createBraidMap = () => createTexture(256, 256, (ctx, w, h) => {
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#888'; ctx.lineWidth = 3;
  for (let i = 0; i < w; i += 15) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + h, h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(i, h); ctx.lineTo(i + h, 0); ctx.stroke();
  }
});

export const createJacketTexture = () => createTexture(512, 512, (ctx, w, h) => {
  ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 10000; i++) {
    const gray = Math.random() * 20;
    ctx.fillStyle = `rgb(${gray},${gray},${gray})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
  }
});

export const createTreeMap = () => createTexture(512, 512, (ctx, w, h) => {
  ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.clearRect(0,0,w,h);
  ctx.strokeStyle = '#00f2ff'; ctx.lineWidth = 3;
  ctx.shadowBlur = 15; ctx.shadowColor = '#00f2ff';
  const drawBranch = (x: number, y: number, len: number, angle: number, depth: number) => {
    if (depth === 0) return;
    const x2 = x + len * Math.cos(angle);
    const y2 = y + len * Math.sin(angle);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2); ctx.stroke();
    drawBranch(x2, y2, len * 0.75, angle - 0.4, depth - 1);
    drawBranch(x2, y2, len * 0.75, angle + 0.4, depth - 1);
  };
  drawBranch(w / 2, h / 2, 80, -Math.PI / 2, 6);
});