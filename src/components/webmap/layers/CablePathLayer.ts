import { PathLayer } from '@deck.gl/layers';
import type { CablePath } from '@/types/map';
import { VOLTAGE_COLORS } from '@/types/map';
import { hexToRgba } from '../utils/geoUtils';

export function createCablePathLayer(cables: CablePath[]) {
  return new PathLayer<CablePath>({
    id: 'cable-paths',
    data: cables,
    getPath: d => d.coordinates,
    getColor: d => {
      if (d.color) {
        return hexToRgba(d.color);
      }
      return hexToRgba(VOLTAGE_COLORS[d.voltageLevel]);
    },
    getWidth: d => d.width ?? 4,
    widthMinPixels: 2,
    widthMaxPixels: 8,
    jointRounded: true,
    capRounded: true,
    pickable: true,
    billboard: false,
    updateTriggers: {
      getColor: [cables.map(c => c.color || c.voltageLevel).join(',')],
    },
  });
}
