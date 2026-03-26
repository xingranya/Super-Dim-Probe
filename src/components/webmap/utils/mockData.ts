import type { CablePath, SensorNode, MapNode, SubstationNode, JointNode } from '@/types/map';
import { seededRange } from '@/utils/mockMetrics';

// 基础坐标 - 荆州区域
const BASE_COORDS = {
  center: [112.192641, 30.337027] as [number, number],
};

// 生成带偏移的坐标
function offsetCoord(
  base: [number, number],
  offsetLng: number,
  offsetLat: number
): [number, number] {
  return [base[0] + offsetLng, base[1] + offsetLat];
}

// ============ 真实网状拓扑数据 ============

// 5个核心变电站 - 形成环形结构
const CORE_SUBSTATIONS: SubstationNode[] = [
  {
    id: 'sub-center',
    name: '220kV 城中枢纽站',
    position: offsetCoord(BASE_COORDS.center, 0, 0),
    voltageLevel: '220kV',
    status: 'normal',
    capacity: '3×180MVA',
    renderPriority: 'primary',
  },
  {
    id: 'sub-north',
    name: '110kV 北郊变电站',
    position: offsetCoord(BASE_COORDS.center, -0.008, 0.010),
    voltageLevel: '110kV',
    status: 'normal',
    capacity: '2×63MVA',
    renderPriority: 'primary',
  },
  {
    id: 'sub-east',
    name: '110kV 东开发区站',
    position: offsetCoord(BASE_COORDS.center, 0.012, 0.002),
    voltageLevel: '110kV',
    status: 'normal',
    capacity: '2×50MVA',
    renderPriority: 'primary',
  },
  {
    id: 'sub-south',
    name: '110kV 南部工业园站',
    position: offsetCoord(BASE_COORDS.center, 0.005, -0.012),
    voltageLevel: '110kV',
    status: 'warning',
    capacity: '2×63MVA',
    renderPriority: 'primary',
  },
  {
    id: 'sub-west',
    name: '110kV 西部新城站',
    position: offsetCoord(BASE_COORDS.center, -0.010, -0.003),
    voltageLevel: '110kV',
    status: 'normal',
    capacity: '2×50MVA',
    renderPriority: 'primary',
  },
];

// 8个核心环网接头 - 保留主环与关键联络点
const RING_JOINTS: JointNode[] = [
  { id: 'j-n1', name: '#N1 环网柜', position: offsetCoord(BASE_COORDS.center, -0.004, 0.006), status: 'normal', hasGrounding: true },
  { id: 'j-ne1', name: '#NE1 环网柜', position: offsetCoord(BASE_COORDS.center, 0.005, 0.006), status: 'normal', hasGrounding: false },
  { id: 'j-e1', name: '#E1 环网柜', position: offsetCoord(BASE_COORDS.center, 0.009, 0.002), status: 'normal', hasGrounding: true },
  { id: 'j-s1', name: '#S1 环网柜', position: offsetCoord(BASE_COORDS.center, 0.007, -0.007), status: 'warning', hasGrounding: true },
  { id: 'j-s2', name: '#S2 环网柜', position: offsetCoord(BASE_COORDS.center, 0.002, -0.011), status: 'fault', hasGrounding: true },
  { id: 'j-sw1', name: '#SW1 环网柜', position: offsetCoord(BASE_COORDS.center, -0.006, -0.008), status: 'normal', hasGrounding: false },
  { id: 'j-w1', name: '#W1 环网柜', position: offsetCoord(BASE_COORDS.center, -0.009, -0.002), status: 'normal', hasGrounding: true },
  { id: 'j-c1', name: '#C1 中心环网柜', position: offsetCoord(BASE_COORDS.center, -0.001, 0.001), status: 'normal', hasGrounding: true },
];

// 4个分支接头 - 仅保留主要出线
const BRANCH_JOINTS: JointNode[] = [
  { id: 'j-b1', name: '#B1 分支箱', position: offsetCoord(BASE_COORDS.center, 0.004, 0.008), status: 'normal', hasGrounding: true },
  { id: 'j-b2', name: '#B2 分支箱', position: offsetCoord(BASE_COORDS.center, 0.011, 0.004), status: 'normal', hasGrounding: false },
  { id: 'j-b3', name: '#B3 分支箱', position: offsetCoord(BASE_COORDS.center, -0.006, -0.007), status: 'warning', hasGrounding: true },
  { id: 'j-b4', name: '#B4 分支箱', position: offsetCoord(BASE_COORDS.center, -0.009, 0.005), status: 'normal', hasGrounding: false },
];

// 4个用户站 - 保留城市关键负荷点
const USER_STATIONS: MapNode[] = [
  { id: 'usr-1', name: '高新科技产业园', position: offsetCoord(BASE_COORDS.center, 0.013, 0.007), status: 'normal', nodeType: 'user_station', renderPriority: 'secondary' },
  { id: 'usr-2', name: '经济技术开发区', position: offsetCoord(BASE_COORDS.center, 0.014, -0.002), status: 'normal', nodeType: 'user_station', renderPriority: 'secondary' },
  { id: 'usr-3', name: '南部工业园', position: offsetCoord(BASE_COORDS.center, 0.007, -0.013), status: 'warning', nodeType: 'user_station', renderPriority: 'secondary' },
  { id: 'usr-4', name: '北部物流园', position: offsetCoord(BASE_COORDS.center, -0.012, 0.007), status: 'normal', nodeType: 'user_station', renderPriority: 'secondary' },
];

// ============ 网状电缆拓扑 ============
export function generateMeshCablePaths(): CablePath[] {
  const cables: CablePath[] = [];

  // 1. 主环网 - 五个核心变电站形成环形
  cables.push({
    id: 'cable-main-ring',
    name: '110kV 主环网',
    voltageLevel: '110kV',
    renderPriority: 'primary',
    coordinates: [
      CORE_SUBSTATIONS[0].position,  // 中心站
      RING_JOINTS[7].position,        // C1
      RING_JOINTS[0].position,        // N1
      CORE_SUBSTATIONS[1].position,   // 北郊站
      RING_JOINTS[1].position,        // NE1
      CORE_SUBSTATIONS[2].position,   // 东开发区站
      RING_JOINTS[2].position,        // E1
      RING_JOINTS[3].position,        // S1
      CORE_SUBSTATIONS[3].position,   // 南部工业园站
      RING_JOINTS[4].position,        // S2
      RING_JOINTS[5].position,        // SW1
      CORE_SUBSTATIONS[4].position,   // 西部新城站
      RING_JOINTS[6].position,        // W1
      CORE_SUBSTATIONS[0].position,   // 回到中心站
    ],
  });

  // 2. 东区辐射网
  cables.push({
    id: 'cable-east-radial',
    name: '东区配电网',
    voltageLevel: '35kV',
    renderPriority: 'secondary',
    coordinates: [
      CORE_SUBSTATIONS[2].position,  // 东开发区站
      RING_JOINTS[2].position,        // E1
      BRANCH_JOINTS[0].position,      // B1
      USER_STATIONS[0].position,      // 高新科技产业园
    ],
  });

  // 3. 南区辐射网
  cables.push({
    id: 'cable-south-radial',
    name: '南区配电网',
    voltageLevel: '35kV',
    renderPriority: 'secondary',
    coordinates: [
      CORE_SUBSTATIONS[3].position,   // 南部工业园站
      RING_JOINTS[3].position,        // S1
      BRANCH_JOINTS[2].position,      // B3
      USER_STATIONS[2].position,       // 南部工业园
    ],
  });

  cables.push({
    id: 'cable-east-branch2',
    name: '东区二线',
    voltageLevel: '35kV',
    renderPriority: 'secondary',
    coordinates: [
      CORE_SUBSTATIONS[2].position,
      BRANCH_JOINTS[1].position,
      USER_STATIONS[1].position,
    ],
  });

  // 4. 西区辐射网
  cables.push({
    id: 'cable-west-radial',
    name: '西区配电网',
    voltageLevel: '35kV',
    renderPriority: 'secondary',
    coordinates: [
      CORE_SUBSTATIONS[4].position,   // 西部新城站
      RING_JOINTS[6].position,        // W1
      BRANCH_JOINTS[3].position,
      USER_STATIONS[3].position,
    ],
  });

  // 5. 北区辐射网
  cables.push({
    id: 'cable-north-radial',
    name: '北区配电网',
    voltageLevel: '35kV',
    renderPriority: 'secondary',
    coordinates: [
      CORE_SUBSTATIONS[1].position,   // 北郊站
      RING_JOINTS[0].position,        // N1
      BRANCH_JOINTS[0].position,
      USER_STATIONS[0].position,
    ],
  });

  // 6. 中心互联线 - 少量骨干补强
  cables.push({
    id: 'cable-center-mesh1',
    name: '中心互联一线',
    voltageLevel: '110kV',
    renderPriority: 'primary',
    coordinates: [
      CORE_SUBSTATIONS[0].position,  // 中心站
      RING_JOINTS[7].position,       // C1
      RING_JOINTS[2].position,
      CORE_SUBSTATIONS[0].position,   // 回到中心站
    ],
  });

  cables.push({
    id: 'cable-south-tie',
    name: '南部联络线',
    voltageLevel: '110kV',
    renderPriority: 'secondary',
    coordinates: [
      CORE_SUBSTATIONS[0].position,
      RING_JOINTS[3].position,
      CORE_SUBSTATIONS[3].position,
    ],
  });

  // 7. 220kV电源进线
  cables.push({
    id: 'cable-220kv-in',
    name: '220kV 电源进线',
    voltageLevel: '110kV',
    renderPriority: 'primary',
    coordinates: [
      CORE_SUBSTATIONS[0].position,
      CORE_SUBSTATIONS[1].position,
    ],
  });

  // 8. 东部联络线
  cables.push({
    id: 'cable-east-tie',
    name: '东区联络线',
    voltageLevel: '35kV',
    renderPriority: 'secondary',
    coordinates: [
      RING_JOINTS[2].position,
      RING_JOINTS[7].position,
      RING_JOINTS[3].position,
    ],
  });

  // 9. 少量 10kV 末端线
  cables.push({
    id: 'cable-10kv-south',
    name: '用户站联络一线',
    voltageLevel: '10kV',
    renderPriority: 'tertiary',
    coordinates: [
      BRANCH_JOINTS[2].position,
      USER_STATIONS[2].position,
    ],
  });

  cables.push({
    id: 'cable-10kv-north',
    name: '用户站联络二线',
    voltageLevel: '10kV',
    renderPriority: 'tertiary',
    coordinates: [
      BRANCH_JOINTS[3].position,
      USER_STATIONS[3].position,
    ],
  });

  return cables;
}

// ============ 统一节点数据 ============
export function generateMeshNodes(): MapNode[] {
  const nodes: MapNode[] = [];

  // 添加变电站
  CORE_SUBSTATIONS.forEach(sub => {
    nodes.push({
      id: sub.id,
      name: sub.name,
      position: sub.position,
      status: sub.status,
      nodeType: 'substation',
      voltageLevel: sub.voltageLevel,
      renderPriority: 'primary',
    });
  });

  // 添加环网接头
  RING_JOINTS.forEach(joint => {
    nodes.push({
      id: joint.id,
      name: joint.name,
      position: joint.position,
      status: joint.status,
      nodeType: joint.hasGrounding ? 'grounding' : 'joint',
      hasGrounding: joint.hasGrounding,
      renderPriority: joint.status !== 'normal' ? 'primary' : 'secondary',
    });
  });

  // 添加分支接头
  BRANCH_JOINTS.forEach(joint => {
    nodes.push({
      id: joint.id,
      name: joint.name,
      position: joint.position,
      status: joint.status,
      nodeType: joint.hasGrounding ? 'grounding' : 'joint',
      hasGrounding: joint.hasGrounding,
      renderPriority: joint.status !== 'normal' ? 'secondary' : 'tertiary',
    });
  });

  // 添加用户站
  USER_STATIONS.forEach(user => {
    nodes.push({
      id: user.id,
      name: user.name,
      position: user.position,
      status: user.status,
      nodeType: 'user_station',
      renderPriority: user.renderPriority || (user.status !== 'normal' ? 'secondary' : 'tertiary'),
    });
  });

  return nodes;
}

// ============ 生成完整模拟数据 ============
export function generateMockMapData() {
  const cables = generateMeshCablePaths();
  const nodes = generateMeshNodes();

  // 生成传感器数据
  const sensors: SensorNode[] = nodes.map(node => ({
    id: `sensor-${node.id}`,
    name: node.name,
    position: node.position,
      status: node.status,
      sensorType: 'integrated',
      nodeType: node.nodeType,
      readings: {
        temp: seededRange(`${node.id}-temp`, 25, 48, 1),
        pd: seededRange(`${node.id}-pd`, 4, 48, 0),
        voltage: node.voltageLevel ? parseInt(node.voltageLevel, 10) : 110,
        current: seededRange(`${node.id}-current`, 80, 420, 0),
      },
    }));

  return {
    cables,
    sensors,
    nodes,
    substations: CORE_SUBSTATIONS,
    joints: [...RING_JOINTS, ...BRANCH_JOINTS],
    userStations: USER_STATIONS,
    stats: {
      totalNodes: nodes.length,
      totalCables: cables.length,
      normalCount: nodes.filter(n => n.status === 'normal').length,
      warningCount: nodes.filter(n => n.status === 'warning').length,
      faultCount: nodes.filter(n => n.status === 'fault').length,
    },
  };
}

// 兼容旧接口
export function generateSensorNodes(): SensorNode[] {
  const { nodes } = generateMockMapData();
  return nodes.map(node => ({
    id: node.id,
    name: node.name,
      position: node.position,
      status: node.status,
      sensorType: 'integrated',
      nodeType: node.nodeType,
      readings: {
        temp: seededRange(`${node.id}-sensor-temp`, 25, 48, 1),
        pd: seededRange(`${node.id}-sensor-pd`, 4, 48, 0),
      },
    }));
}

// 导出数据供外部使用
export const MOCK_SUBSTATIONS = CORE_SUBSTATIONS;
export const MOCK_RING_JOINTS = RING_JOINTS;
export const MOCK_BRANCH_JOINTS = BRANCH_JOINTS;
export const MOCK_USER_STATIONS = USER_STATIONS;
