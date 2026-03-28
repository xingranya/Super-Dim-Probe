import type { CablePath, SensorNode } from '@/types/map';

// 荆州市荆州区 - 御沁园附近 (WGS84)
export const JINGZHOU_CENTER: [number, number] = [112.192641, 30.337027];

export const mockCables: CablePath[] = [
  {
    id: 'cable-110kV-1',
    name: '110kV 环网主线',
    voltageLevel: '110kV',
    coordinates: [
      [112.1890, 30.3400],
      [112.1920, 30.3380],
      [112.1950, 30.3360],
      [112.1980, 30.3340],
      [112.2010, 30.3320],
    ],
  },
  {
    id: 'cable-35kV-1',
    name: '35kV 支线',
    voltageLevel: '35kV',
    coordinates: [
      [112.1920, 30.3380],
      [112.1935, 30.3405],
      [112.1955, 30.3420],
    ],
  },
  {
    id: 'cable-10kV-1',
    name: '10kV 配电线路',
    voltageLevel: '10kV',
    coordinates: [
      [112.1950, 30.3360],
      [112.1965, 30.3375],
      [112.1980, 30.3390],
    ],
  },
  {
    id: 'cable-110kV-2',
    name: '110kV 备用线路',
    voltageLevel: '110kV',
    coordinates: [
      [112.1890, 30.3400],
      [112.1870, 30.3370],
      [112.1860, 30.3330],
      [112.1880, 30.3300],
    ],
  },
  {
    id: 'cable-35kV-2',
    name: '35kV 环网支线',
    voltageLevel: '35kV',
    coordinates: [
      [112.1955, 30.3420],
      [112.1980, 30.3405],
      [112.2000, 30.3385],
    ],
  },
];

export const mockSensors: SensorNode[] = [
  {
    id: 'J1-01',
    name: 'J1-01 综合监测站',
    position: [112.1920, 30.3380],
    status: 'normal',
    sensorType: 'integrated',
    readings: { pd: 45, temp: 32.5, voltage: 110.2, current: 425 },
  },
  {
    id: 'J1-02',
    name: 'J1-02 电学监测点',
    position: [112.1950, 30.3360],
    status: 'warning',
    sensorType: 'electric',
    readings: { pd: 156, voltage: 109.8 },
  },
  {
    id: 'J1-03',
    name: 'J1-03 故障定位点',
    position: [112.1980, 30.3340],
    status: 'fault',
    sensorType: 'acoustic',
    readings: { pd: 320, temp: 58.3 },
  },
  {
    id: 'J2-01',
    name: 'J2-01 热学监测点',
    position: [112.1935, 30.3405],
    status: 'normal',
    sensorType: 'thermal',
    readings: { temp: 38.2 },
  },
  {
    id: 'J2-02',
    name: 'J2-02 振动监测点',
    position: [112.1955, 30.3420],
    status: 'normal',
    sensorType: 'vibration',
    readings: { current: 380 },
  },
  {
    id: 'J2-03',
    name: 'J2-03 综合监测站',
    position: [112.1980, 30.3390],
    status: 'warning',
    sensorType: 'integrated',
    readings: { pd: 98, temp: 45.1, voltage: 109.5, current: 520 },
  },
  {
    id: 'J3-01',
    name: 'J3-01 电学监测点',
    position: [112.1890, 30.3400],
    status: 'normal',
    sensorType: 'electric',
    readings: { pd: 32, voltage: 110.0 },
  },
  {
    id: 'J3-02',
    name: 'J3-02 声学监测点',
    position: [112.1870, 30.3370],
    status: 'normal',
    sensorType: 'acoustic',
    readings: { pd: 28 },
  },
  {
    id: 'J3-03',
    name: 'J3-03 故障预警点',
    position: [112.1860, 30.3330],
    status: 'fault',
    sensorType: 'acoustic',
    readings: { pd: 450, temp: 72.5 },
  },
];
