import { PathLayer } from '@deck.gl/layers';
import type { CablePath } from '@/types/map';
import { VOLTAGE_COLORS } from '@/types/map';
import { hexToRgba, smoothEntirePath } from '../utils/geoUtils';

/**
 * 电缆线宽配置 - 根据电压等级区分
 */
const VOLTAGE_WIDTHS: Record<string, number> = {
  '220kV': 6,
  '110kV': 5,
  '35kV': 3.5,
  '10kV': 2.5,
};

/**
 * 创建电缆路径渲染层 - 自然曲线 + 多层叠加效果
 * 底层发光 + 上层主体线，模拟真实电力线缆的视觉效果
 */
export function createCablePathLayer(cables: CablePath[]) {
  // 对所有电缆路径执行曲线平滑
  const smoothedCables = cables.map(cable => ({
    ...cable,
    _smoothed: smoothEntirePath(cable.coordinates, 0.18, 8),
  }));

  const layers = [];

  // 1. 底层 - 柔和发光线 (比主体线更宽、更透明)
  const glowLayer = new PathLayer<typeof smoothedCables[0]>({
    id: 'cable-glow',
    data: smoothedCables,
    getPath: d => d._smoothed,
    getColor: d => {
      const hex = d.color || VOLTAGE_COLORS[d.voltageLevel] || '#3b82f6';
      return hexToRgba(hex, 40);
    },
    getWidth: d => (VOLTAGE_WIDTHS[d.voltageLevel] || 4) * 2.5,
    widthMinPixels: 4,
    widthMaxPixels: 20,
    jointRounded: true,
    capRounded: true,
    pickable: false,
    billboard: false,
    updateTriggers: {
      getColor: [smoothedCables.map(c => c.color || c.voltageLevel).join(',')],
    },
  });
  layers.push(glowLayer);

  // 2. 主体线 - 实线 (清晰可见的主体路径)
  const mainLayer = new PathLayer<typeof smoothedCables[0]>({
    id: 'cable-main',
    data: smoothedCables,
    getPath: d => d._smoothed,
    getColor: d => {
      const hex = d.color || VOLTAGE_COLORS[d.voltageLevel] || '#3b82f6';
      return hexToRgba(hex, 200);
    },
    getWidth: d => VOLTAGE_WIDTHS[d.voltageLevel] || 4,
    widthMinPixels: 2,
    widthMaxPixels: 8,
    jointRounded: true,
    capRounded: true,
    pickable: true,
    billboard: false,
    updateTriggers: {
      getColor: [smoothedCables.map(c => c.color || c.voltageLevel).join(',')],
    },
  });
  layers.push(mainLayer);

  return layers;
}
