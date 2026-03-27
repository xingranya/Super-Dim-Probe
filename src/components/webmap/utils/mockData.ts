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

// 基于中心点生成道路走廊拐点
const point = (offsetLng: number, offsetLat: number): [number, number] =>
  offsetCoord(BASE_COORDS.center, offsetLng, offsetLat);

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

  // 1. 主环网 - 贴城市走廊组织，避免中心区域放射状直拉
  cables.push({
    id: 'cable-main-ring',
    name: '110kV 主环网',
    voltageLevel: '110kV',
    renderPriority: 'primary',
    coordinates: [
      CORE_SUBSTATIONS[0].position,
      point(-0.0005, 0.0013),
      RING_JOINTS[7].position,
      point(-0.0024, 0.0038),
      RING_JOINTS[0].position,
      point(-0.0060, 0.0082),
      CORE_SUBSTATIONS[1].position,
      point(-0.0037, 0.0078),
      point(0.0006, 0.0073),
      RING_JOINTS[1].position,
      point(0.0080, 0.0054),
      CORE_SUBSTATIONS[2].position,
      point(0.0103, 0.0010),
      point(0.0090, -0.0048),
      RING_JOINTS[3].position,
      point(0.0060, -0.0087),
      CORE_SUBSTATIONS[3].position,
      point(0.0018, -0.0109),
      RING_JOINTS[4].position,
      point(-0.0030, -0.0090),
      RING_JOINTS[5].position,
      point(-0.0082, -0.0060),
      CORE_SUBSTATIONS[4].position,
      point(-0.0090, 0.0004),
      RING_JOINTS[6].position,
      point(-0.0061, 0.0020),
      point(-0.0038, 0.0014),
      RING_JOINTS[7].position,
      CORE_SUBSTATIONS[0].position,
    ],
  });

  // 2. 东区辐射网 - 先沿东北走廊，再分支进入园区
  cables.push({
    id: 'cable-east-radial',
    name: '东区配电网',
    voltageLevel: '35kV',
    renderPriority: 'secondary',
    coordinates: [
      CORE_SUBSTATIONS[2].position,
      point(0.0106, 0.0034),
      BRANCH_JOINTS[1].position,
      point(0.0094, 0.0050),
      point(0.0072, 0.0060),
      BRANCH_JOINTS[0].position,
      point(0.0096, 0.0070),
      USER_STATIONS[0].position,
    ],
  });

  // 3. 南区辐射网 - 贴南侧带状走廊
  cables.push({
    id: 'cable-south-radial',
    name: '南区配电网',
    voltageLevel: '35kV',
    renderPriority: 'secondary',
    coordinates: [
      CORE_SUBSTATIONS[3].position,
      point(0.0044, -0.0113),
      RING_JOINTS[4].position,
      point(0.0012, -0.0102),
      point(-0.0022, -0.0088),
      BRANCH_JOINTS[2].position,
      point(0.0014, -0.0104),
      point(0.0046, -0.0119),
      USER_STATIONS[2].position,
    ],
  });

  cables.push({
    id: 'cable-east-branch2',
    name: '东区二线',
    voltageLevel: '35kV',
    renderPriority: 'secondary',
    coordinates: [
      CORE_SUBSTATIONS[2].position,
      point(0.0110, 0.0035),
      BRANCH_JOINTS[1].position,
      point(0.0122, 0.0020),
      point(0.0130, 0.0002),
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
      CORE_SUBSTATIONS[4].position,
      point(-0.0094, -0.0006),
      RING_JOINTS[6].position,
      point(-0.0098, 0.0024),
      BRANCH_JOINTS[3].position,
      point(-0.0111, 0.0062),
      USER_STATIONS[3].position,
    ],
  });

  // 5. 北区辐射网 - 共享顶部走廊，避免再穿越中心区
  cables.push({
    id: 'cable-north-radial',
    name: '北区配电网',
    voltageLevel: '35kV',
    renderPriority: 'secondary',
    coordinates: [
      CORE_SUBSTATIONS[1].position,
      point(-0.0048, 0.0080),
      RING_JOINTS[0].position,
      point(-0.0008, 0.0074),
      BRANCH_JOINTS[0].position,
      point(0.0088, 0.0071),
      USER_STATIONS[0].position,
    ],
  });

  // 6. 中心互联线 - 顺着中心东向廊道连接，不再闭合成三角形
  cables.push({
    id: 'cable-center-mesh1',
    name: '中心互联一线',
    voltageLevel: '110kV',
    renderPriority: 'primary',
    coordinates: [
      CORE_SUBSTATIONS[0].position,
      point(0.0007, 0.0008),
      RING_JOINTS[7].position,
      point(0.0027, 0.0010),
      point(0.0054, 0.0011),
      RING_JOINTS[2].position,
      point(0.0106, 0.0018),
      CORE_SUBSTATIONS[2].position,
    ],
  });

  cables.push({
    id: 'cable-south-tie',
    name: '南部联络线',
    voltageLevel: '110kV',
    renderPriority: 'secondary',
    coordinates: [
      CORE_SUBSTATIONS[0].position,
      point(0.0006, -0.0012),
      point(0.0014, -0.0040),
      point(0.0032, -0.0063),
      RING_JOINTS[3].position,
      point(0.0059, -0.0091),
      CORE_SUBSTATIONS[3].position,
    ],
  });

  // 7. 220kV电源进线 - 与北向主走廊并束出线
  cables.push({
    id: 'cable-220kv-in',
    name: '220kV 电源进线',
    voltageLevel: '110kV',
    renderPriority: 'primary',
    color: '#bfd8ff',
    coordinates: [
      CORE_SUBSTATIONS[0].position,
      point(-0.0005, 0.0012),
      RING_JOINTS[7].position,
      point(-0.0024, 0.0037),
      RING_JOINTS[0].position,
      point(-0.0056, 0.0082),
      CORE_SUBSTATIONS[1].position,
    ],
  });

  // 8. 东部联络线 - 通过中心东廊和南向折点连接
  cables.push({
    id: 'cable-east-tie',
    name: '东区联络线',
    voltageLevel: '35kV',
    renderPriority: 'secondary',
    coordinates: [
      RING_JOINTS[2].position,
      point(0.0066, 0.0014),
      point(0.0038, 0.0010),
      RING_JOINTS[7].position,
      point(0.0018, -0.0032),
      point(0.0038, -0.0062),
      RING_JOINTS[3].position,
    ],
  });

  // 9. 少量 10kV 末端线 - 仅作弱化的末端联络
  cables.push({
    id: 'cable-10kv-south',
    name: '用户站联络一线',
    voltageLevel: '10kV',
    renderPriority: 'tertiary',
    coordinates: [
      BRANCH_JOINTS[2].position,
      point(-0.0024, -0.0102),
      point(0.0020, -0.0111),
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
      point(-0.0108, 0.0061),
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
