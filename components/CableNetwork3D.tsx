import React, { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

/**
 * 3D电缆网络场景 - TranMile风格重构版
 * 重点：清晰的电缆、突出的传感器、专业的展示效果
 */

interface CableNetwork3DProps {
  onSensorClick: (sensorId: string) => void;
  onViewSensorDetail: () => void;
}

// ============================================================
// 手工设计的场景数据 (非随机生成)
// ============================================================

// 建筑物数据 - 在方格角落，远离道路
interface Building {
  position: [number, number, number];
  size: [number, number, number];
  type: 'highrise' | 'lowrise' | 'factory' | 'house';
  label?: string;
}

const BUILDINGS: Building[] = [
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
const TREES: [number, number, number][] = [];
const TREE_OFFSET = 10; // 树木距道路中心的偏移，远离电缆

// 沿Z轴道路 (x=0) - 只放在 x=-10 侧，避开 x=3 的绿色垂直线
for (let z = -70; z <= 70; z += 30) {
  if (Math.abs(z) < 15) continue; // 避开十字路口
  if (Math.abs(z) > 18 && Math.abs(z) < 28) continue; // 避开蓝色环 z=±23
  TREES.push([-TREE_OFFSET, 0, z]); // 只放左侧
}
// 沿X轴道路 (z=0) - 只放在 z=-10 侧，避开 z=3 的绿色水平线
for (let x = -70; x <= 70; x += 30) {
  if (Math.abs(x) < 15) continue;
  TREES.push([x, 0, -TREE_OFFSET]); // 只放上侧
}
// 区域点缀 - 调整位置避开电缆和分支线
TREES.push([-45, 0, -50]); // 左上角，远离branch-nw
TREES.push([55, 0, -50]);  // 右上角，远离branch-ne
TREES.push([-45, 0, 55]);  // 左下角，远离branch-sw
TREES.push([55, 0, 55]);   // 右下角，远离branch-se      



// 电缆路径 - 连续多点结构
interface CablePath {
  id: string;
  color: string;
  thickness: number;
  height: number;
  points: [number, number, number][]; // 连续点序列
  closed?: boolean; // 是否闭合回路
  isGround?: boolean; // 是否为地面管线（无电线杆）
}

// 电缆布局：沿道路边缘，悬空架设
const ROAD_OFFSET = 3;
const CABLE_HEIGHT = 1.5;

const CABLE_ROUTES: CablePath[] = [
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
interface Sensor {
  id: string;
  position: [number, number, number];
  name: string;
  status: 'normal' | 'warning' | 'fault';
}

const SENSORS: Sensor[] = [
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

// ============================================================
// React 组件
// ============================================================

interface CableNetwork3DProps {
  onSensorClick: (id: string) => void;
  onViewSensorDetail: () => void;
  initialCameraState?: { position: [number, number, number]; target: [number, number, number] };
  onCameraChange?: (state: { position: [number, number, number]; target: [number, number, number] }) => void;
}

const CableNetwork3D: React.FC<CableNetwork3DProps> = ({ 
  onSensorClick, 
  onViewSensorDetail,
  initialCameraState,
  onCameraChange
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sensorMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const hoveredRef = useRef<string | null>(null);
  const animIdRef = useRef<number>(0);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // 创建建筑物 (Phase 2 升级版)
  const createBuilding = useCallback((b: Building, scene: THREE.Scene) => {
    const group = new THREE.Group();
    
    // 根据类型设置颜色 (TranMile风格：白色/浅灰主体 + 蓝色细节)
    const typeColors = {
      highrise: { body: '#F8FAFC', window: '#3B82F6', edge: '#94A3B8' },
      lowrise: { body: '#F1F5F9', window: '#60A5FA', edge: '#9CA3AF' },
      factory: { body: '#E2E8F0', window: '#64748B', edge: '#6B7280' },
      house: { body: '#FFFFFF', window: '#93C5FD', edge: '#A1A1AA' },
    };
    const colors = typeColors[b.type];
    
    // 建筑主体
    const bodyGeo = new THREE.BoxGeometry(b.size[0], b.size[1], b.size[2]);
    const bodyMat = new THREE.MeshStandardMaterial({ 
      color: colors.body, 
      roughness: 0.85,
      metalness: 0.05
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(b.position[0], b.size[1] / 2, b.position[2]);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);
    
    // 深色边框线 (强化)
    const edges = new THREE.EdgesGeometry(bodyGeo);
    const edgeMat = new THREE.LineBasicMaterial({ color: colors.edge, linewidth: 2 });
    const edgeLine = new THREE.LineSegments(edges, edgeMat);
    edgeLine.position.copy(body.position);
    group.add(edgeLine);
    
    // 高楼：多层蓝色玻璃窗带
    if (b.type === 'highrise' && b.size[1] > 10) {
      const windowMat = new THREE.MeshStandardMaterial({ 
        color: colors.window, 
        roughness: 0.2, 
        metalness: 0.7,
        envMapIntensity: 1.0
      });
      const floors = Math.floor(b.size[1] / 3);
      for (let i = 1; i < floors; i++) {
        const y = -b.size[1] / 2 + i * 3;
        // 四面窗户
        const winH = 1.2;
        const winDepth = 0.15;
        // 前后窗
        const winFrontGeo = new THREE.BoxGeometry(b.size[0] * 0.85, winH, winDepth);
        const winFront = new THREE.Mesh(winFrontGeo, windowMat);
        winFront.position.set(0, y, b.size[2] / 2 + winDepth / 2);
        body.add(winFront);
        const winBack = new THREE.Mesh(winFrontGeo, windowMat);
        winBack.position.set(0, y, -b.size[2] / 2 - winDepth / 2);
        body.add(winBack);
        // 左右窗
        const winSideGeo = new THREE.BoxGeometry(winDepth, winH, b.size[2] * 0.85);
        const winLeft = new THREE.Mesh(winSideGeo, windowMat);
        winLeft.position.set(-b.size[0] / 2 - winDepth / 2, y, 0);
        body.add(winLeft);
        const winRight = new THREE.Mesh(winSideGeo, windowMat);
        winRight.position.set(b.size[0] / 2 + winDepth / 2, y, 0);
        body.add(winRight);
      }
      // 屋顶设备
      const roofBoxGeo = new THREE.BoxGeometry(b.size[0] * 0.4, 1.5, b.size[2] * 0.4);
      const roofBoxMat = new THREE.MeshStandardMaterial({ color: '#94A3B8' });
      const roofBox = new THREE.Mesh(roofBoxGeo, roofBoxMat);
      roofBox.position.set(b.position[0], b.size[1] + 0.75, b.position[2]);
      group.add(roofBox);
    }
    
    // 矮房/house：蓝色平屋顶
    if (b.type === 'lowrise' || b.type === 'house') {
      const roofGeo = new THREE.BoxGeometry(b.size[0] + 0.3, 0.3, b.size[2] + 0.3);
      const roofMat = new THREE.MeshStandardMaterial({ color: colors.window, roughness: 0.4 });
      const roof = new THREE.Mesh(roofGeo, roofMat);
      roof.position.set(b.position[0], b.size[1] + 0.15, b.position[2]);
      group.add(roof);
    }
    
    // 工厂：烟囱 + 灰色屋顶
    if (b.type === 'factory') {
      // 灰色平屋顶
      const roofGeo = new THREE.BoxGeometry(b.size[0] + 0.2, 0.4, b.size[2] + 0.2);
      const roofMat = new THREE.MeshStandardMaterial({ color: '#64748B' });
      const roof = new THREE.Mesh(roofGeo, roofMat);
      roof.position.set(b.position[0], b.size[1] + 0.2, b.position[2]);
      group.add(roof);
      // 烟囱
      const chimneyGeo = new THREE.CylinderGeometry(0.4, 0.5, 3, 8);
      const chimneyMat = new THREE.MeshStandardMaterial({ color: '#475569' });
      const chimney = new THREE.Mesh(chimneyGeo, chimneyMat);
      chimney.position.set(b.position[0] + b.size[0] * 0.3, b.size[1] + 1.5, b.position[2] + b.size[2] * 0.3);
      group.add(chimney);
    }
    
    scene.add(group);
    return group;
  }, []);

  // 创建树木 (球形树冠风格)
  const createTree = useCallback((position: [number, number, number], scene: THREE.Scene) => {
    const group = new THREE.Group();
    
    // 树干
    const trunkGeo = new THREE.CylinderGeometry(0.4, 0.6, 2, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: '#8B4513', roughness: 0.9 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.set(0, 1, 0);
    trunk.castShadow = true;
    group.add(trunk);
    
    // 树冠 (球形)
    const leavesMat = new THREE.MeshStandardMaterial({ color: '#4ADE80', roughness: 0.8 });
    
    // 主球体
    const sphere1 = new THREE.Mesh(new THREE.SphereGeometry(2.5, 16, 16), leavesMat);
    sphere1.position.set(0, 3.5, 0);
    sphere1.castShadow = true;
    group.add(sphere1);
    
    // 随机小球体增加细节
    const sphere2 = new THREE.Mesh(new THREE.SphereGeometry(1.5, 12, 12), leavesMat);
    sphere2.position.set(1.2, 2.5, 0.8);
    sphere2.castShadow = true;
    group.add(sphere2);

    const sphere3 = new THREE.Mesh(new THREE.SphereGeometry(1.5, 12, 12), leavesMat);
    sphere3.position.set(-1.0, 4.0, -0.8);
    sphere3.castShadow = true;
    group.add(sphere3);
    
    group.position.set(...position);
    
    // 随机旋转和缩放
    group.rotation.y = Math.random() * Math.PI;
    const scale = 0.8 + Math.random() * 0.4;
    group.scale.setScalar(scale);
    
    scene.add(group);
    return group;
  }, []);
  // 创建电缆系统 (多股 + 支架 + 平滑曲线)
  const createCableSystem = useCallback((pathData: CablePath, scene: THREE.Scene) => {
    const points = pathData.points.map(p => new THREE.Vector3(...p));
    // 创建平滑曲线
    // tension=0.1 使得转弯更紧凑，不至于太圆滑导致偏离路线
    const curve = new THREE.CatmullRomCurve3(points, pathData.closed || false, 'catmullrom', 0.1);

    const group = new THREE.Group();

    // === 1. 材质与纹理恢复 (Phase 9 Pro Max 风格) ===

    // 螺旋纹理 (Normal Map)
    const normalCanvas = document.createElement('canvas');
    normalCanvas.width = 256;
    normalCanvas.height = 256;
    const nCtx = normalCanvas.getContext('2d');
    if (nCtx) {
      nCtx.fillStyle = '#8080ff'; // 默认法线颜色
      nCtx.fillRect(0, 0, 256, 256);

      // 绘制螺旋条纹
      for (let i = -100; i < 356; i += 20) {
        nCtx.beginPath();
        nCtx.strokeStyle = '#a0a0ff'; // 凸起
        nCtx.lineWidth = 10;
        nCtx.moveTo(0, i);
        nCtx.lineTo(256, i + 100);
        nCtx.stroke();
      }
    }
    const normalMap = new THREE.CanvasTexture(normalCanvas);
    normalMap.wrapS = THREE.RepeatWrapping;
    normalMap.wrapT = THREE.RepeatWrapping;
    // 根据曲线长度设置重复
    const curveLength = curve.getLength();
    normalMap.repeat.set(1, curveLength / 2);

    // 电缆材质 (恢复为深色工业橡胶 + 物理材质)
    const material = new THREE.MeshPhysicalMaterial({
      color: '#1a1a1a', // 深色工业橡胶 (忽略 pathData.color，保持工业质感)
      roughness: 0.6,
      metalness: 0.1,
      normalMap: normalMap,
      normalScale: new THREE.Vector2(0.5, 0.5),
      clearcoat: 0.3,
      clearcoatRoughness: 0.4,
    });

    // === 2. 生成多股平行电缆 (使用 ExtrudeGeometry) ===
    const r = pathData.thickness; // 半径
    const offset = r * 2.2; // 线缆间距

    // 定义三个圆作为截面 (扁平排列)
    const shape1 = new THREE.Shape();
    shape1.absarc(0, 0, r, 0, Math.PI * 2, false);

    const shape2 = new THREE.Shape();
    shape2.absarc(-offset, 0, r, 0, Math.PI * 2, false);

    const shape3 = new THREE.Shape();
    shape3.absarc(offset, 0, r, 0, Math.PI * 2, false);

    const extrudeSettings = {
      steps: 150, // 增加细分使曲线更平滑
      bevelEnabled: false,
      extrudePath: curve,
    };

    const geometry = new THREE.ExtrudeGeometry([shape1, shape2, shape3], extrudeSettings);

    const cableMesh = new THREE.Mesh(geometry, material);
    cableMesh.castShadow = true;
    group.add(cableMesh);

    // === 3. 添加电线杆 + 固定支架（仅架空线缆）===
    // 地面管线不需要电线杆
    if (!pathData.isGround) {
      const spacing = 15; // 电线杆间距
      const count = Math.floor(curveLength / spacing);

      // 电线杆材质
      const poleMat = new THREE.MeshStandardMaterial({
        color: '#64748B',
        metalness: 0.7,
        roughness: 0.3
      });

      // 支架材质
      const bracketMat = new THREE.MeshStandardMaterial({
        color: '#475569',
        metalness: 0.8,
        roughness: 0.4
      });

      for (let i = 0; i <= count; i++) {
          const t = (i + 0.5) / (count + 1);
          const point = curve.getPointAt(t);
          const tangent = curve.getTangentAt(t);

          // === 电线杆主杆（从地面到电缆高度）===
          const poleHeight = point.y;
          const poleGeo = new THREE.CylinderGeometry(0.12, 0.18, poleHeight, 8);
          const pole = new THREE.Mesh(poleGeo, poleMat);
          pole.position.set(point.x, poleHeight / 2, point.z);
          pole.castShadow = true;
          group.add(pole);

          // === 横臂（支撑电缆的横杆）===
          const armWidth = offset * 4;
          const armGeo = new THREE.BoxGeometry(armWidth, 0.12, 0.12);
          const arm = new THREE.Mesh(armGeo, poleMat);
          arm.position.copy(point);
          arm.lookAt(point.clone().add(tangent));
          arm.castShadow = true;
          group.add(arm);

          // === 顶部支架/卡具 ===
          const bracketGeo = new THREE.BoxGeometry(offset * 3.2, r * 0.8, r * 2);
          const bracket = new THREE.Mesh(bracketGeo, bracketMat);
          bracket.position.copy(point);
          bracket.lookAt(point.clone().add(tangent));
          group.add(bracket);
      }
    }

    scene.add(group);
  }, []);

  // 创建传感器节点 (工业级电缆分支箱)
  const createSensor = useCallback((sensor: Sensor, scene: THREE.Scene) => {
    const group = new THREE.Group();
    // 将组放置在地面 (y=0)，忽略传感器定义的悬空高度，只取xz坐标
    group.position.set(sensor.position[0], 0, sensor.position[2]);

    // 状态颜色映射
    const statusColors = {
      normal: '#10b981',   // 工业绿 (Emerald-500)
      warning: '#f59e0b',  // 警示黄 (Amber-500)
      fault: '#ef4444'     // 故障红 (Red-500)
    };
    const statusColor = statusColors[sensor.status];

    // === 1. 混凝土基座 ===
    const baseGeo = new THREE.BoxGeometry(3, 0.5, 3);
    const baseMat = new THREE.MeshStandardMaterial({
      color: '#57534e', // 石头灰
      roughness: 0.9,
      map: null // 如果有混凝土纹理最好，这里用粗糙材质模拟
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.25;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    // === 2. 工业金属箱体 (主分接箱) ===
    // 高度需覆盖电缆高度 (1.5 ~ 2.0)，箱体设为高 3.2
    const boxHeight = 3.2;
    const boxWidth = 2.4;
    const boxGeo = new THREE.BoxGeometry(boxWidth, boxHeight, boxWidth);
    const boxMat = new THREE.MeshStandardMaterial({
      color: '#334155', // Slate-700 深蓝灰金属
      roughness: 0.4,
      metalness: 0.6,
    });
    const box = new THREE.Mesh(boxGeo, boxMat);
    box.position.y = 0.5 + boxHeight / 2; // 基座之上
    box.castShadow = true;
    box.receiveShadow = true;
    box.userData = { sensorId: sensor.id }; // 点击交互目标
    group.add(box);

    // === 3. 细节：检修门与把手 ===
    const doorGeo = new THREE.BoxGeometry(boxWidth * 0.8, boxHeight * 0.8, 0.1);
    const doorMat = new THREE.MeshStandardMaterial({
      color: '#475569', // Slate-600
      metalness: 0.5,
      roughness: 0.5
    });
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(0, 0.5 + boxHeight / 2, boxWidth / 2 + 0.05); // Z轴正面突出一点
    group.add(door);

    // 门把手
    const handleGeo = new THREE.BoxGeometry(0.1, 0.4, 0.15);
    const handleMat = new THREE.MeshStandardMaterial({ color: '#cbd5e1', metalness: 0.8 });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.set(0.6, 0.5 + boxHeight / 2, boxWidth / 2 + 0.15);
    group.add(handle);

    // === 4. 状态指示灯 (顶部三色塔灯风格) ===
    const lightGroup = new THREE.Group();
    lightGroup.position.set(0, 0.5 + boxHeight, 0);

    // 灯座
    const mountGeo = new THREE.CylinderGeometry(0.4, 0.5, 0.2, 16);
    const mount = new THREE.Mesh(mountGeo, new THREE.MeshStandardMaterial({ color: '#1e293b' }));
    mount.position.y = 0.1;
    lightGroup.add(mount);

    // 发光罩
    const bulbGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.6, 16);
    const bulbMat = new THREE.MeshPhysicalMaterial({
      color: statusColor,
      emissive: statusColor,
      emissiveIntensity: 2.0,
      transmission: 0.5, // 玻璃质感
      thickness: 0.5,
      roughness: 0.1
    });
    const bulb = new THREE.Mesh(bulbGeo, bulbMat);
    bulb.position.y = 0.5;
    bulb.userData = { sensorId: sensor.id };
    lightGroup.add(bulb);

    // 顶部盖帽
    const capGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.1, 16);
    const cap = new THREE.Mesh(capGeo, new THREE.MeshStandardMaterial({ color: '#1e293b' }));
    cap.position.y = 0.85;
    lightGroup.add(cap);

    // 脉冲光环 (保留但缩小，作为状态增强)
    const ringGeo = new THREE.TorusGeometry(0.4, 0.05, 8, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: statusColor, transparent: true, opacity: 0.6 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.5;
    lightGroup.add(ring);

    group.add(lightGroup);

    // === 5. 电缆接入口 (黑色橡胶套管) ===
    // 模拟电缆从侧面插入箱体的密封套管
    const portGeo = new THREE.CylinderGeometry(1.0, 1.0, 0.4, 16);
    const portMat = new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.8 });

    // 四个方向的接口 (前后左右)，高度对应电缆高度(1.5)
    // 注意：group的y=0，所以相对高度就是 1.5
    const portHeight = 1.5;
    const portOffset = boxWidth / 2;

    const ports = [
       { pos: [portOffset, portHeight, 0], rotZ: Math.PI / 2 },  // 右
       { pos: [-portOffset, portHeight, 0], rotZ: Math.PI / 2 }, // 左
       { pos: [0, portHeight, portOffset], rotX: Math.PI / 2 },  // 前
       { pos: [0, portHeight, -portOffset], rotX: Math.PI / 2 }, // 后
    ];

    ports.forEach(p => {
        const port = new THREE.Mesh(portGeo, portMat);
        port.position.set(p.pos[0], p.pos[1], p.pos[2]);
        if (p.rotZ) port.rotation.z = p.rotZ;
        if (p.rotX) port.rotation.x = p.rotX;
        group.add(port);
    });

    // 保存引用
    sensorMeshesRef.current.set(sensor.id, group as any);

    scene.add(group);
    return group;
  }, []);

  // 创建文字标签 (增强版 - 纯净交互)
  const createLabel = useCallback((text: string, position: [number, number, number], scene: THREE.Scene, sensorId?: string) => {
    const div = document.createElement('div');
    // 使用 Flex 布局包含文本
    div.className = 'sensor-label';
    div.style.cssText = `
      background: rgba(15, 23, 42, 0.85);
      color: rgba(255, 255, 255, 0.9);
      padding: 6px 10px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      border: 1px solid rgba(255,255,255,0.1);
      cursor: pointer;
      pointer-events: auto;
      user-select: none;
      backdrop-filter: blur(4px);
    `;
    
    div.textContent = text;

    if (sensorId) {
      // 整个标签点击触发
      div.addEventListener('click', (e) => {
        e.stopPropagation();
        onSensorClick(sensorId);
      });
      // 移除缩放效果，改为简单的亮度变化，避免跳动
      div.addEventListener('mouseenter', () => div.style.background = 'rgba(15, 23, 42, 0.95)');
      div.addEventListener('mouseleave', () => div.style.background = 'rgba(15, 23, 42, 0.85)');
    }
    
    const label = new CSS2DObject(div);
    // 提高标签高度，避免遮挡 (降低高度以适配新设备 15 -> 8)
    label.position.set(position[0], position[1] + 8, position[2]);
    scene.add(label);
    return label;
  }, [onSensorClick]);

  // 初始化场景
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const w = container.clientWidth;
    const h = container.clientHeight;

    // 场景 (恢复明亮白色色调)
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#F8FAFC'); // 明亮白色背景
    sceneRef.current = scene;

    // 相机
    const camera = new THREE.PerspectiveCamera(45, w / h, 1, 500);
    // 使用初始位置或默认位置
    if (initialCameraState) {
      camera.position.set(...initialCameraState.position);
    } else {
      camera.position.set(60, 50, 60);
    }
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 渲染器 (性能优化)
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // 限制像素比
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // Label渲染器
    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(w, h);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0';
    labelRenderer.domElement.style.pointerEvents = 'none';
    container.appendChild(labelRenderer.domElement);

    // 控制器
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.maxPolarAngle = Math.PI / 2.2;
    controls.minDistance = 1;
    controls.maxDistance = 200;
    
    // 使用初始目标点
    if (initialCameraState) {
      controls.target.set(...initialCameraState.target);
      controls.update();
    }
    
    // 监听相机变化并回传
    controls.addEventListener('end', () => {
      if (onCameraChange) {
        onCameraChange({
          position: [camera.position.x, camera.position.y, camera.position.z],
          target: [controls.target.x, controls.target.y, controls.target.z]
        });
      }
    });

    // 光照 (优化)
    scene.add(new THREE.AmbientLight('#ffffff', 0.9));
    const sun = new THREE.DirectionalLight('#ffffff', 1.0);
    sun.position.set(50, 80, 30);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 1024;  // 降低阴影质量
    sun.shadow.mapSize.height = 1024;
    sun.shadow.camera.left = -80;
    sun.shadow.camera.right = 80;
    sun.shadow.camera.top = 80;
    sun.shadow.camera.bottom = -80;
    scene.add(sun);

    // 地面 (明亮浅灰色)
    const groundGeo = new THREE.PlaneGeometry(200, 200);
    const groundMat = new THREE.MeshStandardMaterial({ color: '#E2E8F0', roughness: 0.95 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // 道路 (标准灰色)
    const roadMat = new THREE.MeshStandardMaterial({ color: '#9CA3AF', roughness: 0.85 });
    const lineMat = new THREE.MeshBasicMaterial({ color: '#FBBF24' }); // 黄色标线
    const whiteMat = new THREE.MeshBasicMaterial({ color: '#FFFFFF' });
    
    // === 基础道路层 (统一使用一个大平面避免重叠) ===
    // 主干道 - 十字形状 (用多个不重叠的矩形拼接)
    
    // 中央十字区域
    const crossCenter = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), roadMat);
    crossCenter.rotation.x = -Math.PI / 2;
    crossCenter.position.set(0, 0.02, 0);
    scene.add(crossCenter);
    
    // 左臂 (从中心到左边)
    const roadLeft = new THREE.Mesh(new THREE.PlaneGeometry(80, 8), roadMat);
    roadLeft.rotation.x = -Math.PI / 2;
    roadLeft.position.set(-44, 0.02, 0);
    scene.add(roadLeft);
    
    // 右臂 (从中心到右边)
    const roadRight = new THREE.Mesh(new THREE.PlaneGeometry(80, 8), roadMat);
    roadRight.rotation.x = -Math.PI / 2;
    roadRight.position.set(44, 0.02, 0);
    scene.add(roadRight);
    
    // 上臂
    const roadUp = new THREE.Mesh(new THREE.PlaneGeometry(8, 50), roadMat);
    roadUp.rotation.x = -Math.PI / 2;
    roadUp.position.set(0, 0.02, -29);
    scene.add(roadUp);
    
    // 下臂
    const roadDown = new THREE.Mesh(new THREE.PlaneGeometry(8, 40), roadMat);
    roadDown.rotation.x = -Math.PI / 2;
    roadDown.position.set(0, 0.02, 24);
    scene.add(roadDown);
    
    // === 次干道 (独立不重叠) ===
    // 左侧工业区纵向路
    const roadL = new THREE.Mesh(new THREE.PlaneGeometry(5, 50), roadMat);
    roadL.rotation.x = -Math.PI / 2;
    roadL.position.set(-45, 0.02, 5);
    scene.add(roadL);
    
    // 右侧居民区纵向路
    const roadR = new THREE.Mesh(new THREE.PlaneGeometry(5, 50), roadMat);
    roadR.rotation.x = -Math.PI / 2;
    roadR.position.set(45, 0.02, 5);
    scene.add(roadR);
    
    // 上方横向路 (不与纵向重叠)
    const roadT = new THREE.Mesh(new THREE.PlaneGeometry(35, 5), roadMat);
    roadT.rotation.x = -Math.PI / 2;
    roadT.position.set(-21.5, 0.02, -25);
    scene.add(roadT);
    
    const roadT2 = new THREE.Mesh(new THREE.PlaneGeometry(35, 5), roadMat);
    roadT2.rotation.x = -Math.PI / 2;
    roadT2.position.set(21.5, 0.02, -25);
    scene.add(roadT2);
    
    // 下方横向路
    const roadB = new THREE.Mesh(new THREE.PlaneGeometry(35, 5), roadMat);
    roadB.rotation.x = -Math.PI / 2;
    roadB.position.set(-21.5, 0.02, 30);
    scene.add(roadB);
    
    const roadB2 = new THREE.Mesh(new THREE.PlaneGeometry(35, 5), roadMat);
    roadB2.rotation.x = -Math.PI / 2;
    roadB2.position.set(21.5, 0.02, 30);
    scene.add(roadB2);

    // === 道路标线 (高于道路 0.02 -> 0.05) ===
    // 主路双黄线
    const lineH = new THREE.Mesh(new THREE.PlaneGeometry(160, 0.3), lineMat);
    lineH.rotation.x = -Math.PI / 2;
    lineH.position.set(0, 0.05, 0); // 抬高
    scene.add(lineH);
    
    const lineV = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 160), lineMat);
    lineV.rotation.x = -Math.PI / 2;
    lineV.position.set(0, 0.05, 0); // 抬高
    scene.add(lineV);
    
    // 人行横道 (中央十字路口) - 抬高到 0.06 避免与黄线穿模
    // 人行横道 (中央十字路口) - 修正方向：横穿马路
    // 1. 横穿左右主干道 (位于十字路口上下侧)
    // 位置：Z = +/- 10 (十字路口边缘), X 范围覆盖路宽
    for (let i = -3; i <= 3; i++) {
      // 上侧斑马线 (Z = -10)
      const stripeTop = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 3.5), whiteMat);
      stripeTop.rotation.x = -Math.PI / 2;
      stripeTop.position.set(i * 1.2, 0.06, -10); // 沿X轴排列，位于Z=-10
      scene.add(stripeTop);

      // 下侧斑马线 (Z = 10)
      const stripeBottom = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 3.5), whiteMat);
      stripeBottom.rotation.x = -Math.PI / 2;
      stripeBottom.position.set(i * 1.2, 0.06, 10); // 沿X轴排列，位于Z=10
      scene.add(stripeBottom);
    }

    // 2. 横穿上下主干道 (位于十字路口左右侧)
    // 位置：X = +/- 10 (十字路口边缘), Z 范围覆盖路宽
    for (let i = -3; i <= 3; i++) {
      // 左侧斑马线 (X = -10)
      const stripeLeft = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 0.6), whiteMat);
      stripeLeft.rotation.x = -Math.PI / 2;
      stripeLeft.position.set(-10, 0.06, i * 1.2); // 沿Z轴排列，位于X=-10
      scene.add(stripeLeft);

      // 右侧斑马线 (X = 10)
      const stripeRight = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 0.6), whiteMat);
      stripeRight.rotation.x = -Math.PI / 2;
      stripeRight.position.set(10, 0.06, i * 1.2); // 沿Z轴排列，位于X=10
      scene.add(stripeRight);
    }
    
    // 停止线 - 抬高到 0.06
    const stopLineMat = new THREE.MeshBasicMaterial({ color: '#FFFFFF' });
    const stopLine1 = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 7), stopLineMat);
    stopLine1.rotation.x = -Math.PI / 2;
    stopLine1.position.set(4.5, 0.06, 0); // 抬高到 0.06
    scene.add(stopLine1);
    
    const stopLine2 = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 7), stopLineMat);
    stopLine2.rotation.x = -Math.PI / 2;
    stopLine2.position.set(-4.5, 0.06, 0); // 抬高到 0.06
    scene.add(stopLine2);
    
    const stopLine3 = new THREE.Mesh(new THREE.PlaneGeometry(7, 0.4), stopLineMat);
    stopLine3.rotation.x = -Math.PI / 2;
    stopLine3.position.set(0, 0.06, 4.5); // 抬高到 0.06
    scene.add(stopLine3);
    
    const stopLine4 = new THREE.Mesh(new THREE.PlaneGeometry(7, 0.4), stopLineMat);
    stopLine4.rotation.x = -Math.PI / 2;
    stopLine4.position.set(0, 0.06, -4.5); // 抬高到 0.06
    scene.add(stopLine4);

    // 创建内容
    BUILDINGS.forEach(b => createBuilding(b, scene));
    TREES.forEach(pos => createTree(pos, scene));
    
    CABLE_ROUTES.forEach(route => {
      createCableSystem(route, scene);
    });

    SENSORS.forEach(sensor => {
      createSensor(sensor, scene);
      createLabel(sensor.name, sensor.position, scene, sensor.id);
    });

    // === 区域空中标签 ===
    const areaLabels = [
      { text: '商业区', position: [-40, 30, -35] as [number, number, number] },
      { text: '科技园', position: [40, 30, -35] as [number, number, number] },
      { text: '工业区', position: [-50, 15, 35] as [number, number, number] },
      { text: '居民区', position: [45, 15, 35] as [number, number, number] },
    ];
    
    areaLabels.forEach(area => {
      const div = document.createElement('div');
      div.style.cssText = `
        background: rgba(255, 255, 255, 0.85);
        color: #334155;
        padding: 6px 14px;
        border-radius: 16px;
        font-size: 13px;
        font-weight: 600;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        border: 1px solid #e2e8f0;
        pointer-events: none;
        white-space: nowrap;
      `;
      div.textContent = area.text;
      const label = new CSS2DObject(div);
      label.position.set(...area.position);
      scene.add(label);
    });

    // 动画 (优化)
    const animate = () => {
      animIdRef.current = requestAnimationFrame(animate);
      controls.update();

      // 传感器脉冲动画 (简化)
      const time = Date.now() * 0.002;
      const baseScale = 1 + Math.sin(time) * 0.05;

      sensorMeshesRef.current.forEach((group) => {
        const isHovered = group.userData.sensorId === hoveredRef.current;
        group.scale.setScalar(isHovered ? 1.2 : baseScale);
      });

      renderer.render(scene, camera);
      labelRenderer.render(scene, camera);
    };
    animate();

    // 交互事件
    const handleClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);
      
      // 递归检测 Group 中的所有子对象
      const hits = raycaster.intersectObjects(Array.from(sensorMeshesRef.current.values()), true);
      
      // 查找第一个带有 sensorId 的对象
      const hit = hits.find(h => h.object.userData.sensorId);
      if (hit) {
        onSensorClick(hit.object.userData.sensorId);
      }
    };

    const handleMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);
      
      const hits = raycaster.intersectObjects(Array.from(sensorMeshesRef.current.values()), true);
      const hit = hits.find(h => h.object.userData.sensorId);
      
      if (hit) {
        hoveredRef.current = hit.object.userData.sensorId;
        container.style.cursor = 'pointer';
      } else {
        hoveredRef.current = null;
        container.style.cursor = 'grab';
      }
    };

    container.addEventListener('click', handleClick);
    container.addEventListener('mousemove', handleMove);
    const onResize = () => {
      const nw = container.clientWidth;
      const nh = container.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
      labelRenderer.setSize(nw, nh);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animIdRef.current);
      container.removeEventListener('click', handleClick);
      container.removeEventListener('mousemove', handleMove);
      window.removeEventListener('resize', onResize);
      
      // 清理控制器
      controls.dispose();

      // 简单清理
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      if (container.contains(labelRenderer.domElement)) {
        container.removeChild(labelRenderer.domElement);
      }
    };
  }, [createBuilding, createCableSystem, createSensor, createLabel, onSensorClick]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      
      {/* 顶部信息栏 */}
      <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm shadow-lg rounded-xl p-4 border border-slate-200">
        <h1 className="text-xl font-bold text-slate-800">城市电缆网络监测</h1>
        <div className="flex gap-4 mt-2 text-sm text-slate-600">
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-purple-500 animate-pulse"/>
            正常: {SENSORS.filter(s => s.status === 'normal').length}
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500 animate-pulse"/>
            预警: {SENSORS.filter(s => s.status === 'warning').length}
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"/>
            故障: {SENSORS.filter(s => s.status === 'fault').length}
          </span>
        </div>
      </div>

      {/* 图例 */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm shadow-lg rounded-lg p-3 border border-slate-200">
        <div className="text-xs text-slate-500 font-medium mb-2">电缆类型</div>
        <div className="space-y-1 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <div className="w-5 h-1 rounded" style={{backgroundColor: '#4A90D9'}}/>
            <span>110kV 主干线</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-1 rounded" style={{backgroundColor: '#5CB85C'}}/>
            <span>35kV 联络线</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-1 rounded" style={{backgroundColor: '#F0AD4E'}}/>
            <span>10kV 分支线</span>
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <button
        onClick={onViewSensorDetail}
        className="absolute top-4 right-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-lg transition-all flex items-center gap-2 font-medium"
      >
        🔍 传感器模型视图
      </button>

      {/* 提示 */}
      <div className="absolute bottom-4 right-4 text-xs text-slate-500 bg-white/80 px-3 py-1.5 rounded-lg shadow">
        点击传感器节点查看监测数据
      </div>
    </div>
  );
};

export default CableNetwork3D;
