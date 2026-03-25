import { ScatterplotLayer, IconLayer } from '@deck.gl/layers';
import type { MapNode } from '@/types/map';
import { STATUS_COLORS, NODE_TYPE_SIZES } from '@/types/map';
import { hexToRgba } from '../utils/geoUtils';
import { getNodeIconUrl, NODE_ICON_SIZES, NODE_COLORS, STATUS_COLOR_MAP } from '../utils/iconMapping';

/**
 * 创建真实感节点渲染层 - 使用 IconLayer + SVG 自定义图标
 * 多层叠加: 底层光晕 → 图标主体 → 状态指示灯
 */
export function createRealisticNodeLayer(
  nodes: MapNode[],
  onClick?: (node: MapNode) => void
) {
  const layers = [];

  // 1. 底层 - 柔和辐射光晕 (模拟设备周围的环境光)
  const outerGlowLayer = new ScatterplotLayer<MapNode>({
    id: 'node-outer-glow',
    data: nodes,
    getPosition: d => d.position,
    getFillColor: d => {
      const colors = NODE_COLORS[d.nodeType];
      const rgb = hexToRgba(colors.primary);
      return [rgb[0], rgb[1], rgb[2], 25] as [number, number, number, number];
    },
    getRadius: d => (NODE_TYPE_SIZES[d.nodeType] || 8) * 3.5,
    radiusMinPixels: 16,
    radiusMaxPixels: 70,
    pickable: false,
    updateTriggers: {
      getFillColor: [nodes.map(n => n.nodeType).join(',')],
    },
  });
  layers.push(outerGlowLayer);

  // 2. 中层 - 内层光晕 (增强层次感)
  const innerGlowLayer = new ScatterplotLayer<MapNode>({
    id: 'node-inner-glow',
    data: nodes,
    getPosition: d => d.position,
    getFillColor: d => {
      const colors = NODE_COLORS[d.nodeType];
      const rgb = hexToRgba(colors.glow);
      return [rgb[0], rgb[1], rgb[2], 50] as [number, number, number, number];
    },
    getRadius: d => (NODE_TYPE_SIZES[d.nodeType] || 8) * 2,
    radiusMinPixels: 10,
    radiusMaxPixels: 45,
    pickable: false,
    updateTriggers: {
      getFillColor: [nodes.map(n => n.nodeType).join(',')],
    },
  });
  layers.push(innerGlowLayer);

  // 3. 主体层 - IconLayer 渲染自定义 SVG 图标
  const iconLayer = new IconLayer<MapNode>({
    id: 'node-icon-main',
    data: nodes,
    getPosition: d => d.position,
    getIcon: d => ({
      url: getNodeIconUrl(d.nodeType),
      width: 64,
      height: 64,
      anchorY: 32,
    }),
    getSize: d => NODE_ICON_SIZES[d.nodeType] || 32,
    sizeMinPixels: 20,
    sizeMaxPixels: 64,
    pickable: true,
    autoHighlight: true,
    highlightColor: [255, 255, 255, 80],
    onClick: onClick ? ({ object }) => object && onClick(object) : undefined,
    updateTriggers: {
      getIcon: [nodes.map(n => n.nodeType).join(',')],
      getSize: [nodes.map(n => n.nodeType).join(',')],
    },
  });
  layers.push(iconLayer);

  // 4. 顶层 - 状态指示灯 (小圆点 + 白色外描边)
  const statusIndicator = new ScatterplotLayer<MapNode>({
    id: 'node-status-indicator',
    data: nodes,
    getPosition: d => d.position,
    getFillColor: d => {
      const sc = STATUS_COLOR_MAP[d.status] || STATUS_COLOR_MAP.normal;
      return hexToRgba(sc.fill, 255);
    },
    getRadius: d => {
      if (d.nodeType === 'substation') return 4;
      if (d.nodeType === 'user_station') return 3;
      return 2.5;
    },
    radiusMinPixels: 3,
    radiusMaxPixels: 10,
    pickable: false,
    stroked: true,
    getLineColor: [255, 255, 255, 200],
    lineWidthMinPixels: 1.5,
    updateTriggers: {
      getFillColor: [nodes.map(n => n.status).join(',')],
    },
  });
  layers.push(statusIndicator);

  return layers;
}

/**
 * 创建脉冲动画层 - 告警/故障节点的呼吸光效
 */
export function createPulseAnimationLayer(nodes: MapNode[]) {
  const alertNodes = nodes.filter(n => n.status === 'warning' || n.status === 'fault');
  const layers = [];

  if (alertNodes.length === 0) return layers;

  // 外圈大范围脉冲
  const outerPulse = new ScatterplotLayer<MapNode>({
    id: 'node-pulse-outer',
    data: alertNodes,
    getPosition: d => d.position,
    getFillColor: [0, 0, 0, 0],
    getRadius: 35,
    radiusMinPixels: 18,
    radiusMaxPixels: 70,
    pickable: false,
    stroked: true,
    getLineColor: d => {
      if (d.status === 'fault') return [239, 68, 68, 120];
      return [245, 158, 11, 80];
    },
    lineWidthMinPixels: 2,
    updateTriggers: {
      getLineColor: [alertNodes.map(n => n.status).join(',')],
    },
  });
  layers.push(outerPulse);

  // 内圈脉冲
  const innerPulse = new ScatterplotLayer<MapNode>({
    id: 'node-pulse-inner',
    data: alertNodes,
    getPosition: d => d.position,
    getFillColor: [0, 0, 0, 0],
    getRadius: 20,
    radiusMinPixels: 12,
    radiusMaxPixels: 45,
    pickable: false,
    stroked: true,
    getLineColor: d => {
      if (d.status === 'fault') return [239, 68, 68, 180];
      return [245, 158, 11, 130];
    },
    lineWidthMinPixels: 2,
    updateTriggers: {
      getLineColor: [alertNodes.map(n => n.status).join(',')],
    },
  });
  layers.push(innerPulse);

  return layers;
}

// ============ 兼容旧接口的导出 ============

/** 旧版：创建节点图标层 (供 DeckOverlay 使用) */
export function createNodeIconLayer(
  nodes: MapNode[],
  onClick?: (node: MapNode) => void,
) {
  // 使用 IconLayer 而非旧的 ScatterplotLayer + TextLayer
  return new IconLayer<MapNode>({
    id: 'node-icons-compat',
    data: nodes,
    getPosition: d => d.position,
    getIcon: d => ({
      url: getNodeIconUrl(d.nodeType),
      width: 64,
      height: 64,
      anchorY: 32,
    }),
    getSize: d => NODE_ICON_SIZES[d.nodeType] || 32,
    sizeMinPixels: 20,
    sizeMaxPixels: 64,
    pickable: true,
    autoHighlight: true,
    highlightColor: [255, 255, 255, 80],
    onClick: onClick ? ({ object }) => object && onClick(object) : undefined,
    updateTriggers: {
      getIcon: [nodes.map(n => n.nodeType).join(',')],
    },
  });
}

/** 旧版：创建脉冲层 (供 DeckOverlay 使用) */
export function createPulseLayer(nodes: MapNode[]) {
  const alertNodes = nodes.filter(n => n.status === 'warning' || n.status === 'fault');
  if (alertNodes.length === 0) {
    return new ScatterplotLayer({ id: 'pulse-empty', data: [] });
  }
  return new ScatterplotLayer<MapNode>({
    id: 'node-pulse-compat',
    data: alertNodes,
    getPosition: d => d.position,
    getFillColor: [0, 0, 0, 0],
    getRadius: 25,
    radiusMinPixels: 15,
    radiusMaxPixels: 50,
    pickable: false,
    stroked: true,
    getLineColor: d => {
      if (d.status === 'fault') return [239, 68, 68, 150];
      return [245, 158, 11, 100];
    },
    lineWidthMinPixels: 2,
    updateTriggers: {
      getLineColor: [alertNodes.map(n => n.status).join(',')],
    },
  });
}
