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

function isSameCoordinate(
  pointA: [number, number] | undefined,
  pointB: [number, number] | undefined
): boolean {
  if (!pointA || !pointB) return false;
  return pointA[0] === pointB[0] && pointA[1] === pointB[1];
}

function pushUniqueCoordinate(
  coordinates: [number, number][],
  point: [number, number]
) {
  if (!isSameCoordinate(coordinates[coordinates.length - 1], point)) {
    coordinates.push(point);
  }
}

/**
 * 生成二次贝塞尔曲线插值
 * 用于把折线拐点过渡成更自然的圆角
 */
function generateQuadraticCurve(
  start: [number, number],
  control: [number, number],
  end: [number, number],
  segments: number
): [number, number][] {
  const points: [number, number][] = [];

  for (let index = 0; index <= segments; index++) {
    const t = index / segments;
    const x =
      (1 - t) * (1 - t) * start[0] +
      2 * (1 - t) * t * control[0] +
      t * t * end[0];
    const y =
      (1 - t) * (1 - t) * start[1] +
      2 * (1 - t) * t * control[1] +
      t * t * end[1];
    points.push([x, y]);
  }

  return points;
}

/**
 * 对整条路径做折点圆角化处理
 * 保留道路式折线走向，只柔化拐点而不是整段拉弧
 */
export function smoothEntirePath(
  coordinates: [number, number][],
  curvature: number = 0.18,
  segmentsPerPair: number = 6
): [number, number][] {
  if (coordinates.length <= 2) return coordinates;

  const smoothed: [number, number][] = [coordinates[0]];

  for (let index = 1; index < coordinates.length - 1; index++) {
    const prev = coordinates[index - 1];
    const current = coordinates[index];
    const next = coordinates[index + 1];
    const incomingDistance = haversineDistance(prev, current);
    const outgoingDistance = haversineDistance(current, next);
    const availableRadius = Math.min(incomingDistance, outgoingDistance);
    const roundingRadius = Math.min(
      Math.max(availableRadius * curvature, 10),
      68
    );

    if (availableRadius < 18 || roundingRadius < 8) {
      pushUniqueCoordinate(smoothed, current);
      continue;
    }

    const entryPoint = movePointTowards(current, prev, roundingRadius, 0.35);
    const exitPoint = movePointTowards(current, next, roundingRadius, 0.35);
    const roundedCorner = generateQuadraticCurve(
      entryPoint,
      current,
      exitPoint,
      Math.max(segmentsPerPair, 3)
    );

    roundedCorner.forEach((point) => pushUniqueCoordinate(smoothed, point));
  }

  pushUniqueCoordinate(smoothed, coordinates[coordinates.length - 1]);
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
 * 仅对路径首尾端点做留白裁切
 * 让线缆从节点边缘出发/结束，避免中间节点被裁出明显断口
 */
export function applyNodeClearanceToPath(
  coordinates: [number, number][],
  clearanceMeters: number
): [number, number][] {
  if (coordinates.length <= 1 || clearanceMeters <= 0) {
    return coordinates;
  }

  const cleared = [...coordinates];
  const first = coordinates[0];
  const second = coordinates[1];
  const lastIndex = coordinates.length - 1;
  const last = coordinates[lastIndex];
  const beforeLast = coordinates[lastIndex - 1];

  if (second) {
    cleared[0] = movePointTowards(first, second, clearanceMeters, 0.28);
  }

  if (beforeLast) {
    cleared[lastIndex] = movePointTowards(last, beforeLast, clearanceMeters, 0.28);
  }

  return cleared;
}
