// 电缆路径 - 支持多段线缆
export interface CablePath {
  id: string;
  name: string;                    // 如 "110kV环路"
  voltageLevel: '110kV' | '35kV' | '10kV';
  coordinates: [number, number][]; // [lng, lat] 经纬度数组
  width?: number;                  // 渲染宽度
  color?: string;                  // 覆盖默认颜色
}

// 传感器节点
export interface SensorNode {
  id: string;
  name: string;                    // 如 "J1-01"
  position: [number, number];      // [lng, lat]
  status: 'normal' | 'warning' | 'fault';
  sensorType: 'integrated' | 'electric' | 'acoustic' | 'thermal' | 'vibration';
  readings?: {
    pd?: number;        // 局部放电 (pC)
    temp?: number;      // 温度 (°C)
    voltage?: number;   // 电压 (kV)
    current?: number;   // 电流 (A)
  };
}

// Map ViewState - 来自 react-map-gl
export interface MapViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch?: number;
  bearing?: number;
  transitionDuration?: number;
}

// 状态颜色映射
export const STATUS_COLORS = {
  normal: '#22c55e',   // 绿色
  warning: '#f59e0b',   // 橙色
  fault: '#ef4444',     // 红色
} as const;

// 电压等级颜色映射
export const VOLTAGE_COLORS = {
  '110kV': '#3b82f6',  // 蓝色
  '35kV': '#22c55e',   // 绿色
  '10kV': '#f97316',   // 橙色
} as const;
