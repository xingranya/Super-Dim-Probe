// ============================================================
// 手工设计的场景数据 (非随机生成)
// ============================================================

// 建筑物数据 - 在方格角落，远离道路
export interface Building {
  position: [number, number, number];
  size: [number, number, number];
  type: 'highrise' | 'lowrise' | 'factory' | 'house';
  label?: string;
}

export const BUILDINGS: Building[] = [
  // === 左上区块 (商业/办公) - 加密 ===
  { position: [-35, 0, -35], size: [10, 22, 10], type: 'highrise', label: '金融中心' },
  { position: [-50, 0, -35], size: [8, 16, 8], type: 'highrise' },
  { position: [-35, 0, -50], size: [8, 14, 8], type: 'highrise' },
  { position: [-55, 0, -50], size: [6, 10, 6], type: 'lowrise' },
  { position: [-25, 0, -45], size: [6, 8, 6], type: 'lowrise' },
  { position: [-45, 0, -25], size: [9, 28, 9], type: 'highrise' }, // 新增 - 加高
  { position: [-60, 0, -25], size: [8, 12, 8], type: 'lowrise' },   // 新增 - 加大
  
  // === 右上区块 (科技/研发) - 加密 ===
  { position: [35, 0, -35], size: [12, 26, 12], type: 'highrise' },
  { position: [50, 0, -35], size: [9, 19, 9], type: 'highrise', label: '科技大厦' },
  { position: [35, 0, -55], size: [8, 12, 8], type: 'highrise' },
  { position: [55, 0, -50], size: [7, 9, 7], type: 'lowrise' },
  { position: [25, 0, -45], size: [6, 7, 6], type: 'lowrise' },
  { position: [45, 0, -25], size: [10, 32, 10], type: 'highrise' }, // 新增 - 加高
  { position: [60, 0, -25], size: [8, 10, 8], type: 'lowrise' },   // 新增 - 加大
  
  // === 左下区块 (工业/能源) - 加密 ===
  { position: [-35, 0, 35], size: [12, 6, 10], type: 'factory', label: '变电站A' },
  { position: [-55, 0, 35], size: [10, 5, 8], type: 'factory' },
  { position: [-35, 0, 55], size: [8, 8, 8], type: 'factory' },
  { position: [-55, 0, 55], size: [6, 12, 6], type: 'factory' },
  { position: [-25, 0, 45], size: [5, 4, 5], type: 'lowrise' },
  { position: [-45, 0, 25], size: [10, 15, 10], type: 'factory' },   // 新增 - 加大
  { position: [-60, 0, 25], size: [8, 8, 8], type: 'factory' },   // 新增 - 加大
  
  // === 右下区块 (居住/生活) - 加密 ===
  { position: [35, 0, 35], size: [8, 9, 8], type: 'lowrise', label: '居民区' },
  { position: [50, 0, 35], size: [7, 8, 7], type: 'lowrise' },
  { position: [35, 0, 50], size: [6, 6, 6], type: 'house' },
  { position: [50, 0, 50], size: [6, 5, 6], type: 'house' },
  { position: [42, 0, 60], size: [5, 4, 5], type: 'house' },
  { position: [58, 0, 42], size: [5, 4, 5], type: 'house' },
  { position: [25, 0, 45], size: [8, 18, 8], type: 'highrise' },    // 新增 - 改为高层
  { position: [45, 0, 25], size: [8, 14, 8], type: 'lowrise' },    // 新增 - 加高
  
  // === 外围填充 ===
  { position: [-65, 0, 0], size: [6, 5, 6], type: 'lowrise' },
  { position: [65, 0, 0], size: [6, 5, 6], type: 'lowrise' },
  { position: [0, 0, -65], size: [8, 6, 8], type: 'lowrise' },
  { position: [0, 0, 65], size: [8, 6, 8], type: 'factory' },
  
  // === 中央区域附近 (新增四角建筑) ===
  { position: [-15, 0, -15], size: [6, 20, 6], type: 'highrise' },   // 左上角
  { position: [15, 0, -15], size: [6, 22, 6], type: 'highrise' },    // 右上角
  { position: [-15, 0, 15], size: [6, 18, 6], type: 'highrise' },    // 左下角
  { position: [15, 0, 15], size: [6, 16, 6], type: 'lowrise' },      // 右下角
];

// 树木位置 - 沿道路两侧，避开电缆路径
// 电缆路径：绿色十字在 x=3, z=3，蓝色环在 z=±23
// 树冠半径约 2.5m，需保持足够距离
export const TREES: [number, number, number][] = [];
export const TREE_OFFSET = 10; // 树木距道路中心的偏移，远离电缆

// 1. 沿主干道 (Z轴, x=0) - 稀疏种植 (间距 35)
for (let z = -70; z <= 70; z += 35) { 
  if (Math.abs(z) < 15) continue; // 避开十字路口
  // if (Math.abs(z) > 18 && Math.abs(z) < 28) continue; // 避开蓝色环交叉口 (间距大，不需要这个判断了)

  TREES.push([-TREE_OFFSET, 0, z]); // 左侧
  TREES.push([TREE_OFFSET, 0, z]);  // 右侧
}

// 2. 沿主干道 (X轴, z=0) - 稀疏种植 (间距 35)
for (let x = -70; x <= 70; x += 35) { 
  if (Math.abs(x) < 15) continue;
  
  TREES.push([x, 0, -TREE_OFFSET]); // 上侧
  TREES.push([x, 0, TREE_OFFSET]);  // 下侧
}

// 3. 区域绿化 (在空地增加树丛，增加环境丰富度)
const quadrants = [
  { minX: -65, maxX: -25, minZ: -65, maxZ: -25 }, // 左上
  { minX: 25, maxX: 65, minZ: -65, maxZ: -25 },   // 右上
  { minX: -65, maxX: -25, minZ: 25, maxZ: 65 },   // 左下
  { minX: 25, maxX: 65, minZ: 25, maxZ: 65 },     // 右下
];

quadrants.forEach(q => {
  // 每个区域随机生成 15 棵树，模拟绿化带
  for (let i = 0; i < 15; i++) { 
    const x = q.minX + Math.random() * (q.maxX - q.minX);
    const z = q.minZ + Math.random() * (q.maxZ - q.minZ);
    TREES.push([x, 0, z]);
  }
});

// 区域点缀 - 保留关键点
TREES.push([-45, 0, -50]); 
TREES.push([55, 0, -50]);  
TREES.push([-45, 0, 55]);  
TREES.push([55, 0, 55]);      

// 电缆路径 - 连续多点结构
export interface CablePath {
  id: string;
  color: string;
  thickness: number;
  height: number;
  points: [number, number, number][]; // 连续点序列
  closed?: boolean; // 是否闭合回路
  isGround?: boolean; // 是否为地面管线（无电线杆）
}

// 电缆布局：沿道路边缘，悬空架设
export const ROAD_OFFSET = 3;
export const CABLE_HEIGHT = 1.5;

export const CABLE_ROUTES: CablePath[] = [
  // ========== 蓝色外环 (110kV) - 闭合圆角矩形 ==========
  {
    id: 'blue-ring',
    color: '#4A90D9',
    thickness: 0.4,
    height: CABLE_HEIGHT,
    closed: true,
    points: [
      [-60, CABLE_HEIGHT, -20 - ROAD_OFFSET], // 左上
      [60, CABLE_HEIGHT, -20 - ROAD_OFFSET],  // 右上
      [60, CABLE_HEIGHT, 20 + ROAD_OFFSET],   // 右下
      [-60, CABLE_HEIGHT, 20 + ROAD_OFFSET],  // 左下
    ]
  },
  // ========== 绿色十字 (35kV) - 直线 ==========
  {
    id: 'green-h',
    color: '#5CB85C',
    thickness: 0.3,
    height: CABLE_HEIGHT + 0.8,
    points: [
      [-60, CABLE_HEIGHT + 0.8, ROAD_OFFSET],
      [60, CABLE_HEIGHT + 0.8, ROAD_OFFSET]
    ]
  },
  {
    id: 'green-v',
    color: '#5CB85C',
    thickness: 0.3,
    height: CABLE_HEIGHT + 0.8,
    points: [
      [ROAD_OFFSET, CABLE_HEIGHT + 0.8, -60],
      [ROAD_OFFSET, CABLE_HEIGHT + 0.8, 60]
    ]
  },
  // ========== 橙色分支线 (10kV) - 沿道路L形布线，避开建筑物 ==========
  // 左上商业区支线 - 沿蓝环向左，再向上
  {
    id: 'branch-nw',
    color: '#F0AD4E',
    thickness: 0.25,
    height: 1.8,
    points: [
      [-20 - ROAD_OFFSET, 1.8, -20 - ROAD_OFFSET], // 从蓝环西北角
      [-55, 1.8, -20 - ROAD_OFFSET], // 沿蓝环上边向左
      [-55, 1.8, -45] // 向上延伸到商业区
    ]
  },
  // 右上科技区支线 - 沿蓝环向右，再向上
  {
    id: 'branch-ne',
    color: '#F0AD4E',
    thickness: 0.25,
    height: 1.8,
    points: [
      [20 + ROAD_OFFSET, 1.8, -20 - ROAD_OFFSET], // 从蓝环东北角
      [55, 1.8, -20 - ROAD_OFFSET], // 沿蓝环上边向右
      [55, 1.8, -45] // 向上延伸到科技区
    ]
  },
  // 左下工业区支线 - 沿蓝环向左，再向下
  {
    id: 'branch-sw',
    color: '#F0AD4E',
    thickness: 0.25,
    height: 1.8,
    points: [
      [-20 - ROAD_OFFSET, 1.8, 20 + ROAD_OFFSET], // 从蓝环西南角
      [-55, 1.8, 20 + ROAD_OFFSET], // 沿蓝环下边向左
      [-55, 1.8, 45] // 向下延伸到工业区
    ]
  },
  // 右下居民区支线 - 沿蓝环向右，再向下
  {
    id: 'branch-se',
    color: '#F0AD4E',
    thickness: 0.25,
    height: 1.8,
    points: [
      [20 + ROAD_OFFSET, 1.8, 20 + ROAD_OFFSET], // 从蓝环东南角
      [55, 1.8, 20 + ROAD_OFFSET], // 沿蓝环下边向右
      [55, 1.8, 45] // 向下延伸到居民区
    ]
  },
  // ========== 地面管线 (低压/通信) - L形回旋镖布局 ==========
  // 左上回旋镖
  {
    id: 'ground-nw',
    color: '#78716C',
    thickness: 0.6,
    height: 0.15,
    isGround: true,
    points: [
      [-55, 0.15, -5],
      [-15, 0.15, -5],
      [-15, 0.15, -55]
    ]
  },
  // 右上回旋镖
  {
    id: 'ground-ne',
    color: '#78716C',
    thickness: 0.6,
    height: 0.15,
    isGround: true,
    points: [
      [55, 0.15, -5],
      [15, 0.15, -5],
      [15, 0.15, -55]
    ]
  },
  // 左下回旋镖
  {
    id: 'ground-sw',
    color: '#78716C',
    thickness: 0.6,
    height: 0.15,
    isGround: true,
    points: [
      [-55, 0.15, 8],
      [-15, 0.15, 8],
      [-15, 0.15, 55]
    ]
  },
  // 右下回旋镖
  {
    id: 'ground-se',
    color: '#78716C',
    thickness: 0.6,
    height: 0.15,
    isGround: true,
    points: [
      [55, 0.15, 8],
      [15, 0.15, 8],
      [15, 0.15, 55]
    ]
  }
];

// 传感器 - 在电缆交叉/端点位置
export interface Sensor {
  id: string;
  position: [number, number, number];
  name: string;
  status: 'normal' | 'warning' | 'fault';
}

export const SENSORS: Sensor[] = [
  // 蓝色环节点 - 位于电缆高度
  { id: 'S1', position: [-20 - ROAD_OFFSET, CABLE_HEIGHT, -20 - ROAD_OFFSET], name: '西北枢纽', status: 'normal' },
  { id: 'S2', position: [20 + ROAD_OFFSET, CABLE_HEIGHT, -20 - ROAD_OFFSET], name: '东北枢纽', status: 'normal' },
  { id: 'S3', position: [-20 - ROAD_OFFSET, CABLE_HEIGHT, 20 + ROAD_OFFSET], name: '西南枢纽', status: 'warning' },
  { id: 'S4', position: [20 + ROAD_OFFSET, CABLE_HEIGHT, 20 + ROAD_OFFSET], name: '东南枢纽', status: 'normal' },
  // 绿色十字中心
  { id: 'S5', position: [ROAD_OFFSET, CABLE_HEIGHT + 0.5, ROAD_OFFSET], name: '中央配电站', status: 'fault' },
  // 蓝环与绿色十字交叉点
  { id: 'S6', position: [ROAD_OFFSET, CABLE_HEIGHT, -20 - ROAD_OFFSET], name: '北侧交汇点', status: 'normal' },
  { id: 'S7', position: [ROAD_OFFSET, CABLE_HEIGHT, 20 + ROAD_OFFSET], name: '南侧交汇点', status: 'normal' },
  { id: 'S8', position: [-60, CABLE_HEIGHT + 0.8, ROAD_OFFSET], name: '西侧端点', status: 'normal' },
  { id: 'S9', position: [60, CABLE_HEIGHT + 0.8, ROAD_OFFSET], name: '东侧端点', status: 'warning' },
  // 地面管线L形拐点
  { id: 'S10', position: [-15, 0.15, -5], name: '西北管沟', status: 'normal' },
  { id: 'S11', position: [15, 0.15, -5], name: '东北管沟', status: 'normal' },
  { id: 'S12', position: [-15, 0.15, 8], name: '西南管沟', status: 'normal' },
  { id: 'S13', position: [15, 0.15, 8], name: '东南管沟', status: 'normal' },
];
