export enum FaultMode {
  XLPE_TREEING = 0,
  PVC_DAMAGE = 1,
  JOINT_OVERHEAT = 2,
  WATER_TREEING = 3
}

export interface SensorData {
  pd: number;
  temp: number;
  vib: number;
  loss: number;
}

export interface ModeConfig {
  id: FaultMode;
  name: string;
  icon: string;
  targetPos: number; // 0 to 1 along the path
  color: string; // Hex string for lighting/UI
}

export const MODES: ModeConfig[] = [
  { id: FaultMode.XLPE_TREEING, name: "XLPE Treeing", icon: "⚡", targetPos: 0.3, color: "#00ffff" },
  { id: FaultMode.PVC_DAMAGE, name: "PVC Damage", icon: "🚜", targetPos: 0.7, color: "#ff3333" },
  { id: FaultMode.JOINT_OVERHEAT, name: "Joint Overheat", icon: "🔥", targetPos: 0.5, color: "#ffaa00" },
  { id: FaultMode.WATER_TREEING, name: "Water Aging", icon: "💧", targetPos: -1, color: "#aa55ff" } // -1 means global effect
];
