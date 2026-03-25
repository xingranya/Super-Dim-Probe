import type { CablePath, SensorNode, MapNode, SubstationNode, JointNode } from '@/types/map';

// 基础坐标 - 荆州区域
const BASE_COORDS = {
  center: [112.192641, 30.337027] as [number, number],
};

// 生成随机偏移 (模拟真实位置偏差)
function randomOffset(range: number = 1): number {
  return (Math.random() - 0.5) * 2 * range;
}

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
  },
  {
    id: 'sub-north',
    name: '110kV 北郊变电站',
    position: offsetCoord(BASE_COORDS.center, -0.008, 0.010),
    voltageLevel: '110kV',
    status: 'normal',
    capacity: '2×63MVA',
  },
  {
    id: 'sub-east',
    name: '110kV 东开发区站',
    position: offsetCoord(BASE_COORDS.center, 0.012, 0.002),
    voltageLevel: '110kV',
    status: 'normal',
    capacity: '2×50MVA',
  },
  {
    id: 'sub-south',
    name: '110kV 南部工业园站',
    position: offsetCoord(BASE_COORDS.center, 0.005, -0.012),
    voltageLevel: '110kV',
    status: 'warning',
    capacity: '2×63MVA',
  },
  {
    id: 'sub-west',
    name: '110kV 西部新城站',
    position: offsetCoord(BASE_COORDS.center, -0.010, -0.003),
    voltageLevel: '110kV',
    status: 'normal',
    capacity: '2×50MVA',
  },
];

// 15个环网接头 - 分布在变电站之间形成网状
const RING_JOINTS: JointNode[] = [
  // 北部环网
  { id: 'j-n1', name: '#N1 环网柜', position: offsetCoord(BASE_COORDS.center, -0.004, 0.006), status: 'normal', hasGrounding: true },
  { id: 'j-n2', name: '#N2 环网柜', position: offsetCoord(BASE_COORDS.center, -0.006, 0.008), status: 'normal', hasGrounding: false },

  // 东部环网
  { id: 'j-e1', name: '#E1 环网柜', position: offsetCoord(BASE_COORDS.center, 0.006, 0.005), status: 'normal', hasGrounding: true },
  { id: 'j-e2', name: '#E2 环网柜', position: offsetCoord(BASE_COORDS.center, 0.009, 0.003), status: 'normal', hasGrounding: true },
  { id: 'j-e3', name: '#E3 环网柜', position: offsetCoord(BASE_COORDS.center, 0.010, -0.001), status: 'warning', hasGrounding: false },

  // 南部环网
  { id: 'j-s1', name: '#S1 环网柜', position: offsetCoord(BASE_COORDS.center, 0.008, -0.006), status: 'normal', hasGrounding: true },
  { id: 'j-s2', name: '#S2 环网柜', position: offsetCoord(BASE_COORDS.center, 0.003, -0.009), status: 'warning', hasGrounding: true },
  { id: 'j-s3', name: '#S3 环网柜', position: offsetCoord(BASE_COORDS.center, -0.002, -0.010), status: 'normal', hasGrounding: false },

  // 西部环网
  { id: 'j-w1', name: '#W1 环网柜', position: offsetCoord(BASE_COORDS.center, -0.006, -0.002), status: 'normal', hasGrounding: true },
  { id: 'j-w2', name: '#W2 环网柜', position: offsetCoord(BASE_COORDS.center, -0.008, 0.002), status: 'normal', hasGrounding: true },

  // 中心区域
  { id: 'j-c1', name: '#C1 中心环网柜', position: offsetCoord(BASE_COORDS.center, -0.002, 0.003), status: 'normal', hasGrounding: true },
  { id: 'j-c2', name: '#C2 中心环网柜', position: offsetCoord(BASE_COORDS.center, 0.003, 0.002), status: 'normal', hasGrounding: false },
  { id: 'j-c3', name: '#C3 中心环网柜', position: offsetCoord(BASE_COORDS.center, 0.002, -0.002), status: 'normal', hasGrounding: true },

  // 联络线接头
  { id: 'j-l1', name: '#L1 联络柜', position: offsetCoord(BASE_COORDS.center, -0.001, 0.007), status: 'normal', hasGrounding: false },
  { id: 'j-l2', name: '#L2 联络柜', position: offsetCoord(BASE_COORDS.center, 0.007, -0.004), status: 'normal', hasGrounding: true },
];

// 8个分支接头 - 连接到用户站
const BRANCH_JOINTS: JointNode[] = [
  { id: 'j-b1', name: '#B1 分支箱', position: offsetCoord(BASE_COORDS.center, 0.004, 0.007), status: 'normal', hasGrounding: true },
  { id: 'j-b2', name: '#B2 分支箱', position: offsetCoord(BASE_COORDS.center, 0.011, 0.005), status: 'normal', hasGrounding: false },
  { id: 'j-b3', name: '#B3 分支箱', position: offsetCoord(BASE_COORDS.center, 0.010, -0.006), status: 'normal', hasGrounding: true },
  { id: 'j-b4', name: '#B4 分支箱', position: offsetCoord(BASE_COORDS.center, 0.001, -0.011), status: 'normal', hasGrounding: false },
  { id: 'j-b5', name: '#B5 分支箱', position: offsetCoord(BASE_COORDS.center, -0.007, -0.006), status: 'normal', hasGrounding: true },
  { id: 'j-b6', name: '#B6 分支箱', position: offsetCoord(BASE_COORDS.center, -0.011, 0.001), status: 'warning', hasGrounding: false },
  { id: 'j-b7', name: '#B7 分支箱', position: offsetCoord(BASE_COORDS.center, -0.005, 0.009), status: 'normal', hasGrounding: true },
  { id: 'j-b8', name: '#B8 分支箱', position: offsetCoord(BASE_COORDS.center, 0.006, -0.008), status: 'normal', hasGrounding: false },
];

// 8个用户站
const USER_STATIONS: MapNode[] = [
  { id: 'usr-1', name: '高新科技产业园', position: offsetCoord(BASE_COORDS.center, 0.013, 0.007), status: 'normal', nodeType: 'user_station' },
  { id: 'usr-2', name: '经济技术开发区', position: offsetCoord(BASE_COORDS.center, 0.014, -0.002), status: 'normal', nodeType: 'user_station' },
  { id: 'usr-3', name: '南部工业园', position: offsetCoord(BASE_COORDS.center, 0.007, -0.013), status: 'normal', nodeType: 'user_station' },
  { id: 'usr-4', name: '滨湖商业中心', position: offsetCoord(BASE_COORDS.center, -0.003, -0.013), status: 'normal', nodeType: 'user_station' },
  { id: 'usr-5', name: '西部住宅新区', position: offsetCoord(BASE_COORDS.center, -0.013, -0.005), status: 'normal', nodeType: 'user_station' },
  { id: 'usr-6', name: '北部物流园', position: offsetCoord(BASE_COORDS.center, -0.012, 0.007), status: 'normal', nodeType: 'user_station' },
  { id: 'usr-7', name: '中部CBD商圈', position: offsetCoord(BASE_COORDS.center, 0.004, 0.004), status: 'warning', nodeType: 'user_station' },
  { id: 'usr-8', name: '东部创新基地', position: offsetCoord(BASE_COORDS.center, 0.012, 0.006), status: 'normal', nodeType: 'user_station' },
];

// ============ 网状电缆拓扑 ============
export function generateMeshCablePaths(): CablePath[] {
  const cables: CablePath[] = [];

  // 1. 主环网 - 五个核心变电站形成环形
  cables.push({
    id: 'cable-main-ring',
    name: '110kV 主环网',
    voltageLevel: '110kV',
    coordinates: [
      CORE_SUBSTATIONS[0].position,  // 中心站
      RING_JOINTS[10].position,       // C1
      RING_JOINTS[0].position,        // N1
      CORE_SUBSTATIONS[1].position,   // 北郊站
      RING_JOINTS[1].position,        // N2
      RING_JOINTS[13].position,       // L1
      RING_JOINTS[11].position,       // C2
      CORE_SUBSTATIONS[2].position,   // 东开发区站
      RING_JOINTS[2].position,        // E1
      RING_JOINTS[3].position,        // E2
      RING_JOINTS[14].position,       // L2
      RING_JOINTS[6].position,        // S1
      CORE_SUBSTATIONS[3].position,   // 南部工业园站
      RING_JOINTS[7].position,         // S2
      RING_JOINTS[8].position,         // S3
      RING_JOINTS[4].position,         // W1
      CORE_SUBSTATIONS[4].position,   // 西部新城站
      RING_JOINTS[9].position,         // W2
      RING_JOINTS[5].position,         // C3
      CORE_SUBSTATIONS[0].position,   // 回到中心站
    ],
  });

  // 2. 东区辐射网
  cables.push({
    id: 'cable-east-radial',
    name: '东区配电网',
    voltageLevel: '35kV',
    coordinates: [
      CORE_SUBSTATIONS[2].position,  // 东开发区站
      RING_JOINTS[2].position,        // E1
      BRANCH_JOINTS[0].position,       // B1
      USER_STATIONS[0].position,      // 高新科技产业园
    ],
  });

  cables.push({
    id: 'cable-east-branch2',
    name: '东区二线',
    voltageLevel: '35kV',
    coordinates: [
      RING_JOINTS[3].position,        // E2
      BRANCH_JOINTS[1].position,       // B2
      USER_STATIONS[1].position,       // 经济技术开发区
    ],
  });

  // 3. 南区辐射网
  cables.push({
    id: 'cable-south-radial',
    name: '南区配电网',
    voltageLevel: '35kV',
    coordinates: [
      CORE_SUBSTATIONS[3].position,   // 南部工业园站
      RING_JOINTS[6].position,        // S1
      BRANCH_JOINTS[2].position,       // B3
      USER_STATIONS[2].position,       // 南部工业园
    ],
  });

  cables.push({
    id: 'cable-south-branch2',
    name: '南区二线',
    voltageLevel: '35kV',
    coordinates: [
      RING_JOINTS[7].position,        // S2
      USER_STATIONS[6].position,       // 中部CBD商圈
    ],
  });

  // 4. 西区辐射网
  cables.push({
    id: 'cable-west-radial',
    name: '西区配电网',
    voltageLevel: '35kV',
    coordinates: [
      CORE_SUBSTATIONS[4].position,   // 西部新城站
      RING_JOINTS[4].position,        // W1
      BRANCH_JOINTS[4].position,       // B5
      USER_STATIONS[4].position,       // 西部住宅新区
    ],
  });

  // 5. 北区辐射网
  cables.push({
    id: 'cable-north-radial',
    name: '北区配电网',
    voltageLevel: '35kV',
    coordinates: [
      CORE_SUBSTATIONS[1].position,   // 北郊站
      RING_JOINTS[0].position,        // N1
      BRANCH_JOINTS[6].position,       // B7
      USER_STATIONS[5].position,       // 北部物流园
    ],
  });

  // 6. 中心互联线 - 形成网状
  cables.push({
    id: 'cable-center-mesh1',
    name: '中心互联一线',
    voltageLevel: '110kV',
    coordinates: [
      CORE_SUBSTATIONS[0].position,  // 中心站
      RING_JOINTS[12].position,       // C1
      RING_JOINTS[11].position,       // C2
      CORE_SUBSTATIONS[0].position,   // 回到中心站
    ],
  });

  cables.push({
    id: 'cable-center-mesh2',
    name: '中心互联二线',
    voltageLevel: '110kV',
    coordinates: [
      CORE_SUBSTATIONS[0].position,  // 中心站
      RING_JOINTS[12].position,       // C3
      RING_JOINTS[10].position,       // C1
      CORE_SUBSTATIONS[0].position,   // 回到中心站
    ],
  });

  // 7. 220kV电源进线
  cables.push({
    id: 'cable-220kv-in',
    name: '220kV 电源进线',
    voltageLevel: '110kV',
    coordinates: [
      CORE_SUBSTATIONS[0].position,
      CORE_SUBSTATIONS[1].position,
    ],
  });

  // 8. 东部联络线
  cables.push({
    id: 'cable-east-tie',
    name: '东区联络线',
    voltageLevel: '110kV',
    coordinates: [
      RING_JOINTS[4].position,        // E3
      RING_JOINTS[14].position,       // L2
      RING_JOINTS[6].position,        // S1
    ],
  });

  // ============ 新增密集网状联络线 ============

  // 9. 变电站间直连线 (形成核心骨干)
  cables.push({
    id: 'cable-direct-ce',
    name: '中心-东区直连线',
    voltageLevel: '110kV',
    coordinates: [CORE_SUBSTATIONS[0].position, CORE_SUBSTATIONS[2].position],
  });

  cables.push({
    id: 'cable-direct-cs',
    name: '中心-南区直连线',
    voltageLevel: '110kV',
    coordinates: [CORE_SUBSTATIONS[0].position, CORE_SUBSTATIONS[3].position],
  });

  cables.push({
    id: 'cable-direct-cw',
    name: '中心-西区直连线',
    voltageLevel: '110kV',
    coordinates: [CORE_SUBSTATIONS[0].position, CORE_SUBSTATIONS[4].position],
  });

  // 10. 横向联络线 (东-南)
  cables.push({
    id: 'cable-tie-es',
    name: '东南联络线',
    voltageLevel: '35kV',
    coordinates: [
      RING_JOINTS[3].position,  // E2
      BRANCH_JOINTS[2].position, // B3
      RING_JOINTS[5].position,  // S1
    ],
  });

  // 11. 横向联络线 (南-西)
  cables.push({
    id: 'cable-tie-sw',
    name: '南西联络线',
    voltageLevel: '35kV',
    coordinates: [
      RING_JOINTS[7].position,   // S2
      BRANCH_JOINTS[4].position, // B5
    ],
  });

  // 12. 对角联络线 (北-东)
  cables.push({
    id: 'cable-tie-ne',
    name: '北东联络线',
    voltageLevel: '35kV',
    coordinates: [
      RING_JOINTS[0].position,   // N1
      RING_JOINTS[11].position,  // C2
      RING_JOINTS[2].position,   // E1
    ],
  });

  // 13. 用户站间 10kV 分支线
  cables.push({
    id: 'cable-10kv-u12',
    name: '用户站联络一线',
    voltageLevel: '10kV',
    coordinates: [
      USER_STATIONS[0].position,   // 高新科技产业园
      BRANCH_JOINTS[1].position,   // B2
      USER_STATIONS[7].position,   // 东部创新基地
    ],
  });

  cables.push({
    id: 'cable-10kv-u34',
    name: '用户站联络二线',
    voltageLevel: '10kV',
    coordinates: [
      USER_STATIONS[2].position,   // 南部工业园
      BRANCH_JOINTS[7].position,   // B8
      USER_STATIONS[3].position,   // 滨湖商业中心
    ],
  });

  cables.push({
    id: 'cable-10kv-u56',
    name: '用户站联络三线',
    voltageLevel: '10kV',
    coordinates: [
      USER_STATIONS[4].position,   // 西部住宅新区
      BRANCH_JOINTS[5].position,   // B6
      USER_STATIONS[5].position,   // 北部物流园
    ],
  });

  // 14. B7-中心CBD联络
  cables.push({
    id: 'cable-10kv-b7cbd',
    name: 'CBD联络线',
    voltageLevel: '10kV',
    coordinates: [
      BRANCH_JOINTS[6].position,   // B7
      USER_STATIONS[6].position,   // 中部CBD商圈
    ],
  });

  // 15. 南部二号联络线
  cables.push({
    id: 'cable-south-tie2',
    name: '南部联络二线',
    voltageLevel: '35kV',
    coordinates: [
      RING_JOINTS[8].position,   // S3
      BRANCH_JOINTS[3].position, // B4
      USER_STATIONS[3].position, // 滨湖商业中心
    ],
  });

  // 16. 西北联络线
  cables.push({
    id: 'cable-tie-wn',
    name: '西北联络线',
    voltageLevel: '35kV',
    coordinates: [
      RING_JOINTS[9].position,   // W2
      RING_JOINTS[1].position,   // N2
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
      temp: 25 + Math.random() * 25,
      pd: Math.random() * 50,
      voltage: node.voltageLevel ? parseInt(node.voltageLevel) : 110,
      current: 50 + Math.random() * 400,
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
      temp: 25 + Math.random() * 25,
      pd: Math.random() * 50,
    },
  }));
}

// 导出数据供外部使用
export const MOCK_SUBSTATIONS = CORE_SUBSTATIONS;
export const MOCK_RING_JOINTS = RING_JOINTS;
export const MOCK_BRANCH_JOINTS = BRANCH_JOINTS;
export const MOCK_USER_STATIONS = USER_STATIONS;
