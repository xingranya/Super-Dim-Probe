import { ScatterplotLayer, IconLayer, TextLayer } from '@deck.gl/layers';
import type { MapNode } from '@/types/map';
import { NODE_TYPE_SIZES } from '@/types/map';
import { hexToRgba } from '../utils/geoUtils';
import { getNodeIconUrl, NODE_ICON_SIZES, STATUS_COLOR_MAP } from '../utils/iconMapping';

interface NodeClickContext {
  x?: number;
  y?: number;
}

interface NodeLayerOptions {
  zoom: number;
  selectedNodeId?: string | null;
  onClick?: (node: MapNode, context?: NodeClickContext) => void;
}

const isNodeVisible = (node: MapNode, zoom: number) => {
  if (node.status === 'warning' || node.status === 'fault') return true;
  if (node.nodeType === 'substation') return true;
  if (zoom < 14.2) return false;
  if (zoom < 15.2) return node.nodeType === 'grounding' || node.renderPriority !== 'tertiary';
  return true;
};

/**
 * 创建真实感节点渲染层 - 降低装饰性，强化 GIS 分级
 */
export function createRealisticNodeLayer(
  nodes: MapNode[],
  options?: NodeLayerOptions
) {
  const zoom = options?.zoom ?? 15;
  const selectedNodeId = options?.selectedNodeId;
  const onClick = options?.onClick;
  const visibleNodes = nodes.filter((node) => isNodeVisible(node, zoom));
  const highlightedNodes = visibleNodes.filter(
    (node) => node.id === selectedNodeId || node.status === 'warning' || node.status === 'fault' || node.nodeType === 'substation'
  );
  const layers = [];

  const focusHaloLayer = new ScatterplotLayer<MapNode>({
    id: 'node-focus-halo',
    data: highlightedNodes,
    getPosition: d => d.position,
    getFillColor: d => {
      const statusColor = STATUS_COLOR_MAP[d.status] || STATUS_COLOR_MAP.normal;
      const rgb = hexToRgba(statusColor.fill);
      const alpha = d.id === selectedNodeId ? 38 : d.status === 'normal' ? 18 : 28;
      return [rgb[0], rgb[1], rgb[2], alpha] as [number, number, number, number];
    },
    getRadius: d => (NODE_TYPE_SIZES[d.nodeType] || 8) * (d.id === selectedNodeId ? 2.5 : 1.8),
    radiusMinPixels: 14,
    radiusMaxPixels: 48,
    pickable: false,
    updateTriggers: {
      getFillColor: [highlightedNodes.map(n => `${n.id}-${n.status}`).join(',')],
    },
  });
  layers.push(focusHaloLayer);

  const iconBaseLayer = new ScatterplotLayer<MapNode>({
    id: 'node-icon-base',
    data: visibleNodes,
    getPosition: d => d.position,
    getFillColor: d => d.id === selectedNodeId ? [8, 14, 24, 86] : [8, 14, 24, 42],
    getRadius: d => (NODE_TYPE_SIZES[d.nodeType] || 8) * 1.04,
    radiusMinPixels: 12,
    radiusMaxPixels: 28,
    pickable: false,
    stroked: true,
    getLineColor: d => d.id === selectedNodeId ? [255, 255, 255, 112] : [255, 255, 255, 40],
    lineWidthMinPixels: 1,
    updateTriggers: {
      getFillColor: [selectedNodeId],
      getLineColor: [selectedNodeId],
    },
  });
  layers.push(iconBaseLayer);

  const iconLayer = new IconLayer<MapNode>({
    id: 'node-icon-main',
    data: visibleNodes,
    getPosition: d => d.position,
    getIcon: d => ({
      url: getNodeIconUrl(d.nodeType),
      width: 64,
      height: 64,
      anchorY: 32,
    }),
    getSize: d => NODE_ICON_SIZES[d.nodeType] || 32,
    sizeMinPixels: 24,
    sizeMaxPixels: 58,
    pickable: true,
    autoHighlight: true,
    highlightColor: [255, 255, 255, 36],
    onClick: onClick
      ? ({ object, x, y }) => object && onClick(object, { x, y })
      : undefined,
    updateTriggers: {
      getIcon: [visibleNodes.map(n => n.nodeType).join(',')],
      getSize: [visibleNodes.map(n => n.nodeType).join(',')],
    },
  });
  layers.push(iconLayer);

  const statusRingLayer = new ScatterplotLayer<MapNode>({
    id: 'node-status-ring',
    data: visibleNodes,
    getPosition: d => d.position,
    getFillColor: [0, 0, 0, 0],
    getRadius: d => {
      const base = NODE_ICON_SIZES[d.nodeType] || 24;
      return d.nodeType === 'substation' ? base * 0.35 : base * 0.38;
    },
    radiusMinPixels: 8,
    radiusMaxPixels: 22,
    pickable: false,
    stroked: true,
    filled: false,
    getLineColor: d => {
      const sc = STATUS_COLOR_MAP[d.status] || STATUS_COLOR_MAP.normal;
      return hexToRgba(sc.fill, d.status === 'normal' ? 150 : 230);
    },
    lineWidthMinPixels: 1.2,
    updateTriggers: {
      getFillColor: [visibleNodes.map(n => n.status).join(',')],
      getLineColor: [visibleNodes.map(n => n.status).join(',')],
    },
  });
  layers.push(statusRingLayer);

  const statusCenterLayer = new ScatterplotLayer<MapNode>({
    id: 'node-status-core',
    data: visibleNodes.filter((node) => node.status !== 'normal'),
    getPosition: d => d.position,
    getFillColor: d => {
      const sc = STATUS_COLOR_MAP[d.status] || STATUS_COLOR_MAP.normal;
      return hexToRgba(sc.fill, 255);
    },
    getRadius: 3.8,
    radiusMinPixels: 3,
    radiusMaxPixels: 8,
    pickable: false,
    stroked: true,
    getLineColor: [255, 255, 255, 200],
    lineWidthMinPixels: 1,
  });
  layers.push(statusCenterLayer);

  const labelNodes = visibleNodes.filter(
    (node) =>
      node.id === selectedNodeId ||
      node.status === 'warning' ||
      node.status === 'fault' ||
      node.nodeType === 'substation' ||
      (zoom >= 15 && node.renderPriority === 'primary')
  );

  const labelLayer = new TextLayer<MapNode>({
    id: 'node-labels',
    data: labelNodes,
    getPosition: (node) => node.position,
    getText: (node) => node.name,
    getColor: [255, 255, 255, 240],
    getSize: (node) => (node.status === 'fault' || node.status === 'warning' ? 13 : 12),
    sizeMinPixels: 11,
    sizeMaxPixels: 18,
    getPixelOffset: (node) => [0, node.nodeType === 'substation' ? 38 : 32],
    getBackgroundColor: [0, 0, 0, 0],
    backgroundPadding: [0, 0],
    getBorderColor: [0, 0, 0, 0],
    getBorderWidth: 0,
    billboard: true,
    pickable: false,
    characterSet: 'auto',
    fontFamily: 'Noto Sans SC, IBM Plex Sans, sans-serif',
    fontWeight: 600,
  });
  layers.push(labelLayer);

  return layers;
}

/**
 * 创建脉冲动画层 - 告警/故障节点的呼吸光效
 */
export function createPulseAnimationLayer(nodes: MapNode[]) {
  const alertNodes = nodes.filter(
    (node) => isNodeVisible(node, 99) && (node.status === 'warning' || node.status === 'fault')
  );
  const layers = [];

  if (alertNodes.length === 0) return layers;

  // 外圈大范围脉冲
  const outerPulse = new ScatterplotLayer<MapNode>({
    id: 'node-pulse-outer',
    data: alertNodes,
    getPosition: d => d.position,
    getFillColor: [0, 0, 0, 0],
    getRadius: 18,
    radiusMinPixels: 10,
    radiusMaxPixels: 34,
    pickable: false,
    stroked: true,
    getLineColor: d => {
      if (d.status === 'fault') return [232, 93, 117, 120];
      return [230, 162, 60, 96];
    },
    lineWidthMinPixels: 1.5,
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
    getRadius: 10,
    radiusMinPixels: 6,
    radiusMaxPixels: 20,
    pickable: false,
    stroked: true,
    getLineColor: d => {
      if (d.status === 'fault') return [232, 93, 117, 180];
      return [230, 162, 60, 140];
    },
    lineWidthMinPixels: 1.2,
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
