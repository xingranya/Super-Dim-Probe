import { PathLayer } from '@deck.gl/layers';
import type { CablePath } from '@/types/map';
import { VOLTAGE_COLORS } from '@/types/map';
import { hexToRgba, smoothEntirePath } from '../utils/geoUtils';

const LINE_STYLE: Record<string, { color: string; width: number; opacity: number; glow: number }> = {
  '220kV': { color: '#6e8ab2', width: 4.2, opacity: 210, glow: 28 },
  '110kV': { color: '#5c84b1', width: 3.4, opacity: 205, glow: 24 },
  '35kV': { color: '#5f987e', width: 2.3, opacity: 178, glow: 16 },
  '10kV': { color: '#ab8d5c', width: 1.5, opacity: 144, glow: 10 },
};

interface CableLayerOptions {
  zoom: number;
}

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
    _smoothed: smoothEntirePath(cable.coordinates, 0.12, 5),
  }));
  const layers = [];

  const glowLayer = new PathLayer<typeof smoothedCables[0]>({
    id: 'cable-glow',
    data: smoothedCables,
    getPath: d => d._smoothed,
    getColor: d => {
      const style = LINE_STYLE[d.voltageLevel] || LINE_STYLE['110kV'];
      const hex = d.color || style.color || VOLTAGE_COLORS[d.voltageLevel] || '#5c84b1';
      return hexToRgba(hex, style.glow);
    },
    getWidth: d => (LINE_STYLE[d.voltageLevel] || LINE_STYLE['110kV']).width * 1.6,
    widthMinPixels: 1,
    widthMaxPixels: 12,
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
    widthMinPixels: 1,
    widthMaxPixels: 6,
    jointRounded: true,
    capRounded: true,
    pickable: true,
    autoHighlight: true,
    highlightColor: [255, 255, 255, 96],
    billboard: false,
    updateTriggers: {
      getColor: [smoothedCables.map(c => `${c.id}-${c.color || c.voltageLevel}`).join(',')],
    },
  });
  layers.push(mainLayer);

  return layers;
}
