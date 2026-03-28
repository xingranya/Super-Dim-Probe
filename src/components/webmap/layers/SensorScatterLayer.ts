import { ScatterplotLayer } from '@deck.gl/layers';
import type { SensorNode } from '@/types/map';
import { STATUS_COLORS } from '@/types/map';
import { hexToRgba } from '../utils/geoUtils';

export function createSensorScatterLayer(sensors: SensorNode[], onClick?: (sensor: SensorNode) => void) {
  return new ScatterplotLayer<SensorNode>({
    id: 'sensor-points',
    data: sensors,
    getPosition: d => d.position,
    getFillColor: d => hexToRgba(STATUS_COLORS[d.status], 180),
    getRadius: d => d.status === 'fault' ? 12 : 8,
    radiusMinPixels: 6,
    radiusMaxPixels: 20,
    pickable: true,
    autoHighlight: true,
    highlightColor: [255, 255, 255, 100],
    stroked: true,
    getLineColor: d => hexToRgba(STATUS_COLORS[d.status]),
    lineWidthMinPixels: 2,
    onClick: onClick ? ({ object }) => object && onClick(object) : undefined,
    updateTriggers: {
      getFillColor: [sensors.map(s => s.status).join(',')],
      getLineColor: [sensors.map(s => s.status).join(',')],
      getRadius: [sensors.map(s => s.status).join(',')],
    },
  });
}
