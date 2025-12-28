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
  voltage: number;
  current: number;
}

export interface ModeConfig {
  id: FaultMode;
  name: string;
  icon: string;
  targetPos: number;
  color: string;
}

export const MODES: ModeConfig[] = [
  { id: FaultMode.XLPE_TREEING, name: "Partial Discharge", icon: "⚡", targetPos: 0.3, color: "#00ffff" },
  { id: FaultMode.PVC_DAMAGE, name: "Structural Integrity", icon: "🛠️", targetPos: 0.7, color: "#ff3333" },
  { id: FaultMode.JOINT_OVERHEAT, name: "Thermal Loading", icon: "🔥", targetPos: 0.5, color: "#ffaa00" },
  { id: FaultMode.WATER_TREEING, name: "Insulation Health", icon: "💧", targetPos: 0.1, color: "#aa55ff" }
];