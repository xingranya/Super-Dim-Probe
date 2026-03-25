// 电缆路径 - 支持多段线缆
export interface CablePath {
  id: string;
  name: string;                    // 如 "110kV环路"
  voltageLevel: '110kV' | '35kV' | '10kV';
  coordinates: [number, number][]; // [lng, lat] 经纬度数组
  width?: number;                  // 渲染宽度
  color?: string;                  // 覆盖默认颜色
}

// 节点类型枚举
export type NodeType = 'substation' | 'joint' | 'switch_station' | 'user_station' | 'grounding';

// 传感器节点 - 扩展支持多种类型
export interface SensorNode {
  id: string;
  name: string;                    // 如 "J1-01"
  position: [number, number];      // [lng, lat]
  status: 'normal' | 'warning' | 'fault';
  sensorType: 'integrated' | 'electric' | 'acoustic' | 'thermal' | 'vibration';
  nodeType?: NodeType;            // 节点类型 - 用于3D图标区分
  readings?: {
    pd?: number;        // 局部放电 (pC)
    temp?: number;      // 温度 (°C)
    voltage?: number;   // 电压 (kV)
    current?: number;   // 电流 (A)
  };
}

// 变电站节点
export interface SubstationNode {
  id: string;
  name: string;
  position: [number, number];
  voltageLevel: '220kV' | '110kV';
  status: 'normal' | 'warning' | 'fault';
  capacity?: string; // 容量
}

// 接头节点
export interface JointNode {
  id: string;
  name: string;
  position: [number, number];
  status: 'normal' | 'warning' | 'fault';
  hasGrounding?: boolean; // 是否有接地箱
}

// 统一节点接口 (用于渲染层)
export interface MapNode {
  id: string;
  name: string;
  position: [number, number];
  status: 'normal' | 'warning' | 'fault';
  nodeType: NodeType;
  // 可选属性
  voltageLevel?: string;
  sensorType?: string;
  readings?: SensorNode['readings'];
  hasGrounding?: boolean;
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
  '220kV': '#8b5cf6',  // 紫色
  '110kV': '#3b82f6',  // 蓝色
  '35kV': '#22c55e',   // 绿色
  '10kV': '#f97316',   // 橙色
} as const;

// 节点类型颜色映射
export const NODE_TYPE_COLORS = {
  substation: '#3b82f6',    // 蓝色 - 变电站
  joint: '#64748b',         // 灰色 - 接头
  switch_station: '#8b5cf6', // 紫色 - 开关站
  user_station: '#22c55e',   // 绿色 - 用户站
  grounding: '#f59e0b',     // 橙色 - 接地箱
} as const;

// 节点类型尺寸映射
export const NODE_TYPE_SIZES = {
  substation: 16,       // 变电站最大
  switch_station: 12,   // 开关站中等
  joint: 8,             // 接头中等
  user_station: 10,     // 用户站中小
  grounding: 6,        // 接地箱最小
} as const;
