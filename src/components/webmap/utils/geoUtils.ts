/**
 * 将十六进制颜色转换为 RGBA 数组
 */
export function hexToRgba(hex: string, alpha: number = 255): [number, number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return [128, 128, 128, alpha];
  }
  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16),
    alpha,
  ];
}

/**
 * 计算两点之间的距离（米）
 */
export function haversineDistance(
  coord1: [number, number],
  coord2: [number, number]
): number {
  const R = 6371000; // 地球半径（米）
  const lat1 = (coord1[1] * Math.PI) / 180;
  const lat2 = (coord2[1] * Math.PI) / 180;
  const deltaLat = ((coord2[1] - coord1[1]) * Math.PI) / 180;
  const deltaLng = ((coord2[0] - coord1[0]) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * 获取线段的总长度（米）
 */
export function getPathLength(coordinates: [number, number][]): number {
  let total = 0;
  for (let i = 0; i < coordinates.length - 1; i++) {
    total += haversineDistance(coordinates[i], coordinates[i + 1]);
  }
  return total;
}

/**
 * 根据缩放级别计算合适的渲染宽度
 */
export function getScaledWidth(baseWidth: number, zoom: number): number {
  const scale = Math.max(0.5, Math.min(2, (zoom - 10) / 5));
  return baseWidth * scale;
}

/**
 * 在两个坐标点之间生成贝塞尔曲线插值路径
 * 模拟电缆沿道路走向的自然弯曲
 */
export function generateCurvedSegment(
  p1: [number, number],
  p2: [number, number],
  curvature: number = 0.3,
  segments: number = 12
): [number, number][] {
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  const dist = Math.sqrt(dx * dx + dy * dy);

  // 短距离不做曲线处理
  if (dist < 0.001) return [p1, p2];

  // 生成垂直于连线方向的控制点偏移
  const midX = (p1[0] + p2[0]) / 2;
  const midY = (p1[1] + p2[1]) / 2;

  // 利用坐标哈希产生确定性的偏移方向，避免每次渲染结果不同
  const hash = Math.abs(Math.sin(p1[0] * 1000 + p2[1] * 2000)) * 2 - 1;
  const perpX = -dy * curvature * hash;
  const perpY = dx * curvature * hash;

  // 二次贝塞尔曲线控制点
  const cpX = midX + perpX;
  const cpY = midY + perpY;

  const points: [number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const x = (1 - t) * (1 - t) * p1[0] + 2 * (1 - t) * t * cpX + t * t * p2[0];
    const y = (1 - t) * (1 - t) * p1[1] + 2 * (1 - t) * t * cpY + t * t * p2[1];
    points.push([x, y]);
  }

  return points;
}

/**
 * 对整条多段路径进行曲线平滑处理
 * 将每段直线转为贝塞尔曲线，拼接成完整路径
 */
export function smoothEntirePath(
  coordinates: [number, number][],
  curvature: number = 0.2,
  segmentsPerPair: number = 10
): [number, number][] {
  if (coordinates.length <= 1) return coordinates;

  const smoothed: [number, number][] = [];
  for (let i = 0; i < coordinates.length - 1; i++) {
    const curved = generateCurvedSegment(
      coordinates[i],
      coordinates[i + 1],
      curvature,
      segmentsPerPair
    );
    // 避免重复添加连接点
    if (i > 0) curved.shift();
    smoothed.push(...curved);
  }

  return smoothed;
}

/**
 * 沿两点连线方向，将起点向终点推进指定米数
 * 用于给节点图标预留可视避让空间，避免线缆直接穿过节点中心
 */
function movePointTowards(
  from: [number, number],
  to: [number, number],
  offsetMeters: number,
  maxRatio: number = 0.42
): [number, number] {
  const segmentDistance = haversineDistance(from, to);
  if (segmentDistance <= 0.01) return from;

  const ratio = Math.min(offsetMeters / segmentDistance, maxRatio);
  return [
    from[0] + (to[0] - from[0]) * ratio,
    from[1] + (to[1] - from[1]) * ratio,
  ];
}

/**
 * 对路径中的节点坐标做“留白裁切”
 * 让线缆从节点边缘出发/进入，而不是直接压过节点图标中心
 */
export function applyNodeClearanceToPath(
  coordinates: [number, number][],
  clearanceMeters: number
): [number, number][] {
  if (coordinates.length <= 1 || clearanceMeters <= 0) {
    return coordinates;
  }

  const cleared: [number, number][] = [];

  for (let index = 0; index < coordinates.length; index++) {
    const current = coordinates[index];
    const prev = coordinates[index - 1];
    const next = coordinates[index + 1];

    if (!prev && next) {
      cleared.push(movePointTowards(current, next, clearanceMeters));
      continue;
    }

    if (prev && !next) {
      cleared.push(movePointTowards(current, prev, clearanceMeters));
      continue;
    }

    if (prev && next) {
      const incomingEdgePoint = movePointTowards(current, prev, clearanceMeters);
      const outgoingEdgePoint = movePointTowards(current, next, clearanceMeters);
      cleared.push(incomingEdgePoint, outgoingEdgePoint);
      continue;
    }

    cleared.push(current);
  }

  return cleared;
}
