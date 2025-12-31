import * as THREE from 'three';

/**
 * 纹理工厂 - 程序化生成高质量纹理
 * 用于高压电缆接头监测系统的 3D 可视化
 * 带缓存机制防止重复生成
 */

// 全局纹理缓存，避免内存泄漏和重复生成
const textureCache = new Map<string, THREE.CanvasTexture>();

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

// 缓存工厂函数
const getCachedTexture = (key: string, generator: () => THREE.CanvasTexture): THREE.CanvasTexture => {
  if (!textureCache.has(key)) {
    textureCache.set(key, generator());
  }
  return textureCache.get(key)!;
};

// ============================================
// 基础纹理
// ============================================

/**
 * 金属粗糙度贴图 - 用于传感器外壳
 */
export const createMetalRoughnessMap = () => getCachedTexture('metal_roughness', () => createTexture(512, 512, (ctx, w, h) => {
  ctx.fillStyle = '#222'; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#444'; ctx.lineWidth = 1;
  for (let i = 0; i < 500; i++) {
    ctx.beginPath();
    const x = Math.random() * w; const y = Math.random() * h;
    ctx.moveTo(x, y); ctx.lineTo(x + Math.random() * 20, y); ctx.stroke();
  }
}));

/**
 * 铜导线纹理 - 用于电缆芯线
 */
export const createCopperStrandMap = () => getCachedTexture('copper_strand', () => createTexture(512, 512, (ctx, w, h) => {
  // 基础铜色
  const gradient = ctx.createLinearGradient(0, 0, w, h);
  gradient.addColorStop(0, '#b87333');
  gradient.addColorStop(0.5, '#cd8c52');
  gradient.addColorStop(1, '#a66523');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
  
  // 添加金属光泽条纹
  ctx.strokeStyle = '#e6a86c';
  ctx.lineWidth = 2;
  for (let i = 0; i < w; i += 8) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 30, h);
    ctx.stroke();
  }
  
  // 添加阴影条纹
  ctx.strokeStyle = '#6e3d18';
  ctx.lineWidth = 3;
  for (let i = 0; i < w; i += 12) {
    ctx.beginPath();
    ctx.moveTo(i + 4, 0);
    ctx.lineTo(i + 34, h);
    ctx.stroke();
  }
}));

/**
 * 编织层纹理 - 用于屏蔽层
 */
export const createBraidMap = () => getCachedTexture('braid', () => createTexture(256, 256, (ctx, w, h) => {
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h);
  
  // 交叉编织图案
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 3;
  for (let i = -h; i < w; i += 15) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + h, h);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(i + h, 0);
    ctx.lineTo(i, h);
    ctx.stroke();
  }
  
  // 添加金属光泽点
  ctx.fillStyle = '#aaa';
  for (let x = 7; x < w; x += 15) {
    for (let y = 7; y < h; y += 15) {
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}));

/**
 * 电缆外护套纹理 - PVC/PE 材质效果
 */
export const createJacketTexture = () => getCachedTexture('jacket', () => createTexture(512, 512, (ctx, w, h) => {
  // 深色基底
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, w, h);
  
  // 添加细微噪点
  for (let i = 0; i < 10000; i++) {
    const gray = Math.random() * 20;
    ctx.fillStyle = `rgb(${gray},${gray},${gray})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
  }
  
  // 添加轻微的纵向纹理
  ctx.strokeStyle = 'rgba(30, 30, 30, 0.3)';
  ctx.lineWidth = 1;
  for (let i = 0; i < w; i += 4) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, h);
    ctx.stroke();
  }
}));

/**
 * 电树纹理 - 用于局部放电可视化
 */
export const createTreeMap = () => getCachedTexture('tree', () => createTexture(512, 512, (ctx, w, h) => {
  ctx.clearRect(0, 0, w, h);
  
  ctx.strokeStyle = '#00f2ff';
  ctx.lineWidth = 3;
  ctx.shadowBlur = 15;
  ctx.shadowColor = '#00f2ff';
  
  const drawBranch = (x: number, y: number, len: number, angle: number, depth: number) => {
    if (depth === 0) return;
    const x2 = x + len * Math.cos(angle);
    const y2 = y + len * Math.sin(angle);
    
    ctx.lineWidth = depth * 0.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    
    // 随机分支角度
    const spread = 0.4 + Math.random() * 0.2;
    drawBranch(x2, y2, len * 0.75, angle - spread, depth - 1);
    drawBranch(x2, y2, len * 0.75, angle + spread, depth - 1);
    
    // 偶尔添加第三个分支
    if (Math.random() > 0.7 && depth > 2) {
      drawBranch(x2, y2, len * 0.5, angle + (Math.random() - 0.5), depth - 2);
    }
  };
  
  drawBranch(w / 2, h / 2, 80, -Math.PI / 2, 7);
}));

// ============================================
// 高级纹理 - 用于增强视觉效果
// ============================================

/**
 * XLPE 绝缘层纹理 - 半透明微孔效果
 */
export const createXLPETexture = () => getCachedTexture('xlpe', () => createTexture(512, 512, (ctx, w, h) => {
  // 半透明蓝色基底
  ctx.fillStyle = 'rgba(100, 150, 220, 0.6)';
  ctx.fillRect(0, 0, w, h);
  
  // 添加微孔效果
  for (let i = 0; i < 300; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const r = Math.random() * 3 + 1;
    
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
    gradient.addColorStop(0, 'rgba(80, 130, 200, 0.8)');
    gradient.addColorStop(1, 'rgba(100, 150, 220, 0.4)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // 添加轻微的光泽
  const gradient = ctx.createLinearGradient(0, 0, w, h);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
  gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.0)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
}));

/**
 * 高光泽铜导体纹理
 */
export const createHighGlossCopperTexture = () => getCachedTexture('high_gloss_copper', () => createTexture(512, 512, (ctx, w, h) => {
  // 渐变铜色
  const gradient = ctx.createLinearGradient(0, 0, w, 0);
  gradient.addColorStop(0, '#cd7f32');
  gradient.addColorStop(0.3, '#e8a860');
  gradient.addColorStop(0.5, '#ffd700');
  gradient.addColorStop(0.7, '#e8a860');
  gradient.addColorStop(1, '#cd7f32');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
  
  // 添加绞线效果
  ctx.strokeStyle = 'rgba(139, 90, 43, 0.5)';
  ctx.lineWidth = 2;
  for (let i = 0; i < h; i += 6) {
    ctx.beginPath();
    for (let x = 0; x < w; x += 4) {
      const y = i + Math.sin((x + i) * 0.1) * 3;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  
  // 高光点
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  for (let i = 0; i < 50; i++) {
    ctx.beginPath();
    ctx.arc(Math.random() * w, Math.random() * h, Math.random() * 5 + 2, 0, Math.PI * 2);
    ctx.fill();
  }
}));

/**
 * 损伤/碳化纹理 - 用于故障可视化
 */
export const createDamageTexture = () => getCachedTexture('damage', () => createTexture(512, 512, (ctx, w, h) => {
  ctx.clearRect(0, 0, w, h);
  
  // 碳化裂纹
  ctx.strokeStyle = 'rgba(50, 30, 20, 0.8)';
  ctx.lineWidth = 4;
  ctx.shadowBlur = 5;
  ctx.shadowColor = 'rgba(255, 100, 0, 0.5)';
  
  const drawCrack = (x: number, y: number, len: number, angle: number, depth: number) => {
    if (depth === 0 || len < 5) return;
    
    const x2 = x + len * Math.cos(angle);
    const y2 = y + len * Math.sin(angle);
    
    ctx.lineWidth = depth;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    
    // 随机分支
    drawCrack(x2, y2, len * 0.7, angle + (Math.random() - 0.5) * 0.8, depth - 1);
    if (Math.random() > 0.5) {
      drawCrack(x2, y2, len * 0.5, angle + (Math.random() - 0.5) * 1.2, depth - 2);
    }
  };
  
  // 从多个点开始绘制裂纹
  for (let i = 0; i < 5; i++) {
    const startX = w * 0.3 + Math.random() * w * 0.4;
    const startY = h * 0.3 + Math.random() * h * 0.4;
    drawCrack(startX, startY, 50 + Math.random() * 30, Math.random() * Math.PI * 2, 5);
  }
  
  // 添加热点
  for (let i = 0; i < 10; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, 20);
    gradient.addColorStop(0, 'rgba(255, 150, 50, 0.6)');
    gradient.addColorStop(0.5, 'rgba(200, 80, 20, 0.3)');
    gradient.addColorStop(1, 'rgba(100, 40, 10, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();
  }
}));

/**
 * 法线贴图生成 - 用于增强表面细节
 */
export const createNormalMap = () => getCachedTexture('normal', () => createTexture(512, 512, (ctx, w, h) => {
  // 中性法线颜色 (128, 128, 255)
  ctx.fillStyle = 'rgb(128, 128, 255)';
  ctx.fillRect(0, 0, w, h);
  
  // 添加噪点扰动
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 20;
    data[i] = Math.max(0, Math.min(255, 128 + noise));     // R
    data[i + 1] = Math.max(0, Math.min(255, 128 + noise)); // G
    // B 保持不变 (255)
  }
  
  ctx.putImageData(imageData, 0, 0);
}));

/**
 * 水树纹理 - 用于绝缘老化可视化
 */
export const createWaterTreeTexture = () => getCachedTexture('water_tree', () => createTexture(512, 512, (ctx, w, h) => {
  ctx.clearRect(0, 0, w, h);
  
  // 绘制水树状分支
  ctx.strokeStyle = 'rgba(100, 200, 255, 0.7)';
  ctx.shadowBlur = 10;
  ctx.shadowColor = 'rgba(100, 200, 255, 0.5)';
  
  const drawWaterTree = (x: number, y: number, size: number, angle: number, depth: number) => {
    if (depth === 0) return;
    
    // 绘制模糊的水滴状分支
    ctx.lineWidth = size;
    ctx.beginPath();
    
    const endX = x + size * 4 * Math.cos(angle);
    const endY = y + size * 4 * Math.sin(angle);
    
    const cp1x = x + size * 2 * Math.cos(angle - 0.3);
    const cp1y = y + size * 2 * Math.sin(angle - 0.3);
    const cp2x = x + size * 3 * Math.cos(angle + 0.3);
    const cp2y = y + size * 3 * Math.sin(angle + 0.3);
    
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
    ctx.stroke();
    
    // 分支
    drawWaterTree(endX, endY, size * 0.7, angle - 0.5, depth - 1);
    drawWaterTree(endX, endY, size * 0.7, angle + 0.5, depth - 1);
  };
  
  drawWaterTree(w / 2, h * 0.8, 8, -Math.PI / 2, 6);
}));

/**
 * 清理纹理缓存 - 用于释放内存
 */
export const clearTextureCache = () => {
  textureCache.forEach(texture => texture.dispose());
  textureCache.clear();
};

/**
 * 能量场纹理 - 用于电场可视化
 */
export const createEnergyFieldTexture = () => getCachedTexture('energy_field', () => createTexture(512, 512, (ctx, w, h) => {
  ctx.fillStyle = 'rgba(0, 0, 0, 0)';
  ctx.clearRect(0, 0, w, h);
  
  // 绘制同心圆场线
  const cx = w / 2;
  const cy = h / 2;
  
  for (let r = 20; r < Math.max(w, h); r += 30) {
    const gradient = ctx.createRadialGradient(cx, cy, r - 5, cx, cy, r + 5);
    gradient.addColorStop(0, 'rgba(0, 243, 255, 0)');
    gradient.addColorStop(0.5, 'rgba(0, 243, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(0, 243, 255, 0)');
    
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  
  // 添加辐射线
  ctx.strokeStyle = 'rgba(0, 243, 255, 0.2)';
  ctx.lineWidth = 1;
  for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 12) {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angle) * w, cy + Math.sin(angle) * h);
    ctx.stroke();
  }
}));