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
