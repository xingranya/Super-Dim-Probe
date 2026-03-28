import { PathLayer } from '@deck.gl/layers';
import type { CablePath } from '@/types/map';
import { VOLTAGE_COLORS } from '@/types/map';
import { applyNodeClearanceToPath, hexToRgba, smoothEntirePath } from '../utils/geoUtils';

const LINE_STYLE: Record<string, { color: string; width: number; opacity: number; glow: number }> = {
  '220kV': { color: '#b7d3ff', width: 6.9, opacity: 228, glow: 52 },
  '110kV': { color: '#7eb4ff', width: 5.5, opacity: 220, glow: 42 },
  '35kV': { color: '#6fbf9c', width: 3.9, opacity: 198, glow: 24 },
  '10kV': { color: '#b69b6d', width: 2.5, opacity: 146, glow: 10 },
};

interface CableLayerOptions {
  zoom: number;
}

const PATH_CURVATURE_BY_VOLTAGE: Record<string, number> = {
  '220kV': 0.14,
  '110kV': 0.15,
  '35kV': 0.18,
  '10kV': 0.22,
};

const PATH_SEGMENTS_BY_VOLTAGE: Record<string, number> = {
  '220kV': 6,
  '110kV': 6,
  '35kV': 5,
  '10kV': 4,
};

const NODE_CLEARANCE_BY_VOLTAGE: Record<string, number> = {
  // 端点轻微退让，避免直接压在节点中心
  '220kV': 36,
  '110kV': 28,
  '35kV': 18,
  '10kV': 12,
};

const isCableVisible = (cable: CablePath, zoom: number) => {
  const priority = cable.renderPriority || (
    cable.voltageLevel === '110kV' ? 'primary' :
    cable.voltageLevel === '35kV' ? 'secondary' :
    'tertiary'
  );

  if (zoom < 14.2) return priority === 'primary';
  if (zoom < 15.2) return priority !== 'tertiary';
  return true;
};

export function createCablePathLayer(cables: CablePath[], options?: CableLayerOptions) {
  const zoom = options?.zoom ?? 15;
  const visibleCables = cables.filter((cable) => isCableVisible(cable, zoom));
  const smoothedCables = visibleCables.map(cable => ({
    ...cable,
    _smoothed: smoothEntirePath(
      applyNodeClearanceToPath(
        cable.coordinates,
        NODE_CLEARANCE_BY_VOLTAGE[cable.voltageLevel] || NODE_CLEARANCE_BY_VOLTAGE['110kV']
      ),
      PATH_CURVATURE_BY_VOLTAGE[cable.voltageLevel] || PATH_CURVATURE_BY_VOLTAGE['110kV'],
      PATH_SEGMENTS_BY_VOLTAGE[cable.voltageLevel] || PATH_SEGMENTS_BY_VOLTAGE['110kV']
    ),
  }));
  const layers = [];

  const casingLayer = new PathLayer<typeof smoothedCables[0]>({
    id: 'cable-casing',
    data: smoothedCables,
    getPath: (d) => d._smoothed,
    getColor: d => {
      const opacity = d.voltageLevel === '10kV' ? 72 : d.voltageLevel === '35kV' ? 88 : 108;
      return [34, 48, 66, opacity] as [number, number, number, number];
    },
    getWidth: (d) => (LINE_STYLE[d.voltageLevel] || LINE_STYLE['110kV']).width * 1.68,
    widthMinPixels: 3.2,
    widthMaxPixels: 14,
    jointRounded: true,
    capRounded: true,
    pickable: false,
    billboard: false,
  });
  layers.push(casingLayer);

  const glowLayer = new PathLayer<typeof smoothedCables[0]>({
    id: 'cable-glow',
    data: smoothedCables,
    getPath: d => d._smoothed,
    getColor: d => {
      const style = LINE_STYLE[d.voltageLevel] || LINE_STYLE['110kV'];
      const hex = d.color || style.color || VOLTAGE_COLORS[d.voltageLevel] || '#5c84b1';
      return hexToRgba(hex, style.glow);
    },
    getWidth: d => (LINE_STYLE[d.voltageLevel] || LINE_STYLE['110kV']).width * 1.18,
    widthMinPixels: 2.3,
    widthMaxPixels: 13,
    jointRounded: true,
    capRounded: true,
    pickable: false,
    billboard: false,
    updateTriggers: {
      getColor: [smoothedCables.map(c => `${c.id}-${c.color || c.voltageLevel}`).join(',')],
    },
  });
  layers.push(glowLayer);

  const mainLayer = new PathLayer<typeof smoothedCables[0]>({
    id: 'cable-main',
    data: smoothedCables,
    getPath: d => d._smoothed,
    getColor: d => {
      const style = LINE_STYLE[d.voltageLevel] || LINE_STYLE['110kV'];
      const hex = d.color || style.color || VOLTAGE_COLORS[d.voltageLevel] || '#5c84b1';
      return hexToRgba(hex, style.opacity);
    },
    getWidth: d => (LINE_STYLE[d.voltageLevel] || LINE_STYLE['110kV']).width,
    widthMinPixels: 2.2,
    widthMaxPixels: 8,
    jointRounded: true,
    capRounded: true,
    pickable: true,
    autoHighlight: true,
    highlightColor: [232, 240, 255, 72],
    billboard: false,
    updateTriggers: {
      getColor: [smoothedCables.map(c => `${c.id}-${c.color || c.voltageLevel}`).join(',')],
    },
  });
  layers.push(mainLayer);

  return layers;
}
