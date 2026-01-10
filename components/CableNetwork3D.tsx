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

// 树木位置 - 沿道路两侧 (稀疏化: 步长 15 -> 30)
const TREES: [number, number, number][] = [];
// 沿Z轴道路 (x=0)
for (let z = -70; z <= 70; z += 30) { // 减少树木
  if (Math.abs(z) < 15) continue; // 避开十字路口范围加大
  TREES.push([-6, 0, z]);
  TREES.push([6, 0, z]);
}
// 沿X轴道路 (z=0)
for (let x = -70; x <= 70; x += 30) { // 减少树木
  if (Math.abs(x) < 15) continue;
  TREES.push([x, 0, -6]);
  TREES.push([x, 0, 6]);
}
// 区域点缀 (减少)
TREES.push([-25, 0, -25]); 
TREES.push([25, 0, -25]);   
TREES.push([-25, 0, 25]);   
TREES.push([25, 0, 25]);      



// 电缆路径 - 网状连续结构
interface CableSegment {
  start: [number, number, number];
  end: [number, number, number];
}

interface CableRoute {
  id: string;
  color: string;
  thickness: number;
  height: number; // 高度层级，用于避免穿模
  segments: CableSegment[];
}

// 电缆布局：沿道路边缘，互不交叉 (加大尺寸)
const ROAD_OFFSET = 3; // 电缆距离道路中心的偏移

const CABLE_ROUTES: CableRoute[] = [
  // ========== 蓝色外环 (110kV) ==========
  {
    id: 'blue-ring-top',
    color: '#4A90D9',
    thickness: 1.2,  // 加大
    height: 0.6,
    segments: [
      { start: [-60, 0.6, -20 - ROAD_OFFSET], end: [60, 0.6, -20 - ROAD_OFFSET] },
    ]
  },
  {
    id: 'blue-ring-bottom',
    color: '#4A90D9',
    thickness: 1.2,
    height: 0.6,
    segments: [
      { start: [-60, 0.6, 20 + ROAD_OFFSET], end: [60, 0.6, 20 + ROAD_OFFSET] },
    ]
  },
  {
    id: 'blue-ring-left',
    color: '#4A90D9',
    thickness: 1.2,
    height: 0.6,
    segments: [
      { start: [-20 - ROAD_OFFSET, 0.6, -20 - ROAD_OFFSET], end: [-20 - ROAD_OFFSET, 0.6, 20 + ROAD_OFFSET] },
    ]
  },
  {
    id: 'blue-ring-right',
    color: '#4A90D9',
    thickness: 1.2,
    height: 0.6,
    segments: [
      { start: [20 + ROAD_OFFSET, 0.6, -20 - ROAD_OFFSET], end: [20 + ROAD_OFFSET, 0.6, 20 + ROAD_OFFSET] },
    ]
  },
  
  // ========== 绿色十字 (35kV) - 高度0.9，在蓝色上方通过 ==========
  {
    id: 'green-cross-h',
    color: '#5CB85C',
    thickness: 1.0,  // 加大
    height: 0.9,
    segments: [
      { start: [-60, 0.9, ROAD_OFFSET], end: [60, 0.9, ROAD_OFFSET] },
    ]
  },
  {
    id: 'green-cross-v',
    color: '#5CB85C',
    thickness: 1.0,
    height: 0.9,
    segments: [
      { start: [ROAD_OFFSET, 0.9, -60], end: [ROAD_OFFSET, 0.9, 60] },
    ]
  },
];

// 传感器 - 在电缆交叉/端点位置
interface Sensor {
  id: string;
  position: [number, number, number];
  name: string;
  status: 'normal' | 'warning' | 'fault';
}

const SENSORS: Sensor[] = [
  // 蓝色环节点
  { id: 'S1', position: [-20 - ROAD_OFFSET, 0, -20 - ROAD_OFFSET], name: '西北枢纽', status: 'normal' },
  { id: 'S2', position: [20 + ROAD_OFFSET, 0, -20 - ROAD_OFFSET], name: '东北枢纽', status: 'normal' },
  { id: 'S3', position: [-20 - ROAD_OFFSET, 0, 20 + ROAD_OFFSET], name: '西南枢纽', status: 'warning' },
  { id: 'S4', position: [20 + ROAD_OFFSET, 0, 20 + ROAD_OFFSET], name: '东南枢纽', status: 'normal' },
  // 绿色十字中心
  { id: 'S5', position: [ROAD_OFFSET, 0, ROAD_OFFSET], name: '中央配电站', status: 'fault' },
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

  // 创建电缆 (Phase 3 升级版 - 真实材质+细节建模)
  const createCable = useCallback((segment: CableSegment, color: string, thickness: number, scene: THREE.Scene) => {
    const start = new THREE.Vector3(...segment.start);
    const end = new THREE.Vector3(...segment.end);
    const length = start.distanceTo(end);
    const direction = new THREE.Vector3().subVectors(end, start).normalize();
    
    // === 1. 程序化法线贴图纹理 (螺旋线缆纹理) ===
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // 背景
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, 256, 256);
      
      // 螺旋线纹理
      const gradient = ctx.createLinearGradient(0, 0, 256, 0);
      gradient.addColorStop(0, '#505050');
      gradient.addColorStop(0.3, '#a0a0a0');
      gradient.addColorStop(0.5, '#e0e0e0');
      gradient.addColorStop(0.7, '#a0a0a0');
      gradient.addColorStop(1, '#505050');
      
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 8;
      for (let y = -20; y < 280; y += 12) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(256, y + 40);
        ctx.stroke();
      }
    }
    const normalMap = new THREE.CanvasTexture(canvas);
    normalMap.wrapS = THREE.RepeatWrapping;
    normalMap.wrapT = THREE.RepeatWrapping;
    normalMap.repeat.set(1, Math.max(1, length / 8));
    
    // === 2. 电缆主体 (MeshPhysicalMaterial 真实质感) ===
    const geo = new THREE.CylinderGeometry(thickness, thickness, length, 32, 8);
    geo.rotateX(Math.PI / 2);
    
    const mat = new THREE.MeshPhysicalMaterial({
      color: color,
      roughness: 0.45,
      metalness: 0.15,
      normalMap: normalMap,
      normalScale: new THREE.Vector2(0.3, 0.3),
      clearcoat: 0.2,
      clearcoatRoughness: 0.4,
    });
    
    const mesh = new THREE.Mesh(geo, mat);
    const mid = start.clone().add(end).multiplyScalar(0.5);
    mesh.position.copy(mid);
    mesh.lookAt(end);
    mesh.castShadow = true;
    scene.add(mesh);
    
    // === 3. 外层绝缘护套 (半透明) ===
    const sheathGeo = new THREE.CylinderGeometry(thickness * 1.08, thickness * 1.08, length - 0.2, 24, 1);
    sheathGeo.rotateX(Math.PI / 2);
    const sheathMat = new THREE.MeshPhysicalMaterial({
      color: '#111827',
      roughness: 0.7,
      metalness: 0,
      transparent: true,
      opacity: 0.15,
    });
    const sheath = new THREE.Mesh(sheathGeo, sheathMat);
    sheath.position.copy(mid);
    sheath.lookAt(end);
    scene.add(sheath);
    
    // === 4. 接头环 (金属质感) ===
    const ringCount = Math.max(1, Math.floor(length / 10));
    const ringGeo = new THREE.TorusGeometry(thickness * 1.2, thickness * 0.18, 12, 24);
    const ringMat = new THREE.MeshPhysicalMaterial({ 
      color: '#1F2937', 
      roughness: 0.3, 
      metalness: 0.8,
      clearcoat: 0.5
    });
    
    for (let i = 1; i <= ringCount; i++) {
      const t = i / (ringCount + 1);
      const pos = start.clone().lerp(end, t);
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(pos);
      ring.lookAt(end);
      scene.add(ring);
    }
    
    // === 5. 端点球头 (过渡连接) ===
    const capGeo = new THREE.SphereGeometry(thickness * 1.1, 24, 24);
    const capMat = new THREE.MeshPhysicalMaterial({ 
      color: color, 
      roughness: 0.45, 
      metalness: 0.15,
      clearcoat: 0.2
    });
    
    const cap1 = new THREE.Mesh(capGeo, capMat);
    cap1.position.copy(start);
    scene.add(cap1);
    
    const cap2 = new THREE.Mesh(capGeo, capMat);
    cap2.position.copy(end);
    scene.add(cap2);
    
    return mesh;
  }, []);

  // 创建传感器标记 (Phase 4 科技感版: 悬浮光球 + 动态光环 + 地面接线盒)
  const createSensor = useCallback((sensor: Sensor, scene: THREE.Scene) => {
    const group = new THREE.Group();
    const statusColors = {
      normal: '#8B5CF6',  // 紫色
      warning: '#F59E0B', // 黄色
      fault: '#EF4444'    // 红色
    };
    const color = statusColors[sensor.status];
    
    // 1. 地面接线盒 (加大，表示传感器位置)
    const boxGeo = new THREE.BoxGeometry(2.5, 1.2, 2.5);  // 加大
    const boxMat = new THREE.MeshStandardMaterial({ 
      color: '#6B7280', 
      roughness: 0.5, 
      metalness: 0.3 
    });
    const box = new THREE.Mesh(boxGeo, boxMat);
    box.position.set(sensor.position[0], 0.6, sensor.position[2]);
    box.castShadow = true;
    group.add(box);
    
    // 接线盒边框
    const boxEdges = new THREE.EdgesGeometry(boxGeo);
    const boxEdgeMat = new THREE.LineBasicMaterial({ color: color });
    const boxEdgeLine = new THREE.LineSegments(boxEdges, boxEdgeMat);
    boxEdgeLine.position.copy(box.position);
    group.add(boxEdgeLine);
    
    // 接线盒顶部发光条
    const stripGeo = new THREE.BoxGeometry(2.2, 0.15, 2.2);
    const stripMat = new THREE.MeshBasicMaterial({ color: color });
    const strip = new THREE.Mesh(stripGeo, stripMat);
    strip.position.set(sensor.position[0], 1.28, sensor.position[2]);
    group.add(strip);
    
    // 2. 悬浮核心球 (加大) - 提高到更高位置 (高于楼房，约30m)
    const coreGeo = new THREE.SphereGeometry(1.5, 32, 32);  // 再加大
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.5,
      roughness: 0.15,
      metalness: 0.2,
      clearcoat: 0.8
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.set(sensor.position[0], 30.0, sensor.position[2]); // 提高到30.0
    core.userData = { sensorId: sensor.id, sensorName: sensor.name, floatPhase: Math.random() * Math.PI * 2 };
    group.add(core);
    
    // 3. 外层光环 (加大)
    const ringGeo1 = new THREE.TorusGeometry(2.2, 0.08, 16, 64); // 加大
    const ringMat = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.7 });
    const ring1 = new THREE.Mesh(ringGeo1, ringMat);
    ring1.position.copy(core.position);
    ring1.rotation.x = Math.PI / 2;
    ring1.userData.rotateSpeed = 0.02;
    group.add(ring1);
    
    // 4. 内层光环 (加大)
    const ringGeo2 = new THREE.TorusGeometry(1.6, 0.06, 16, 48);
    const ring2 = new THREE.Mesh(ringGeo2, ringMat.clone());
    ring2.position.copy(core.position);
    ring2.rotation.x = Math.PI / 3;
    ring2.rotation.z = Math.PI / 4;
    ring2.userData.rotateSpeed = -0.03;
    group.add(ring2);
    
    // 5. 垂直光柱 (从接线盒到光球，贯穿)
    const beamGeo = new THREE.CylinderGeometry(0.1, 0.2, 29, 8); // 加长到29
    const beamMat = new THREE.MeshBasicMaterial({ 
      color: color, 
      transparent: true, 
      opacity: 0.3 
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.set(sensor.position[0], 15, sensor.position[2]); // 中心点在15
    group.add(beam);
    
    // 保存引用用于交互
    sensorMeshesRef.current.set(sensor.id, core);
    
    scene.add(group);
    return group;
  }, []);

  // 创建文字标签
  const createLabel = useCallback((text: string, position: [number, number, number], scene: THREE.Scene) => {
    const div = document.createElement('div');
    div.style.cssText = `
      background: rgba(139, 92, 246, 0.95);
      color: white;
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      pointer-events: none;
      white-space: nowrap;
    `;
    div.textContent = text;
    
    const label = new CSS2DObject(div);
    label.position.set(position[0], position[1] + 35, position[2]); // 提高到35
    scene.add(label);
    return label;
  }, []);

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

    // 渲染器
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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
    controls.minDistance = 30;
    controls.maxDistance = 150;
    
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

    // 光照 (明亮白色光照)
    scene.add(new THREE.AmbientLight('#ffffff', 0.9));
    const sun = new THREE.DirectionalLight('#ffffff', 1.0);
    sun.position.set(50, 80, 30);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
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
      route.segments.forEach(seg => createCable(seg, route.color, route.thickness, scene));
    });
    
    SENSORS.forEach(sensor => {
      createSensor(sensor, scene);
      createLabel(sensor.name, sensor.position, scene);
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

    // 动画
    const animate = () => {
      animIdRef.current = requestAnimationFrame(animate);
      controls.update();
      
      // 传感器脉冲动画
      const time = Date.now() * 0.002;
      sensorMeshesRef.current.forEach((mesh) => {
        // 脉冲缩放
        const scale = 1 + Math.sin(time) * 0.08;
        if (mesh.userData.sensorId === hoveredRef.current) {
          mesh.scale.setScalar(1.3);
        } else {
          mesh.scale.setScalar(scale);
        }
        
        // 发光强度
        if (mesh.material instanceof THREE.MeshPhysicalMaterial) {
          mesh.material.emissiveIntensity = 0.4 + Math.sin(time * 2) * 0.15;
        }
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
      const hits = raycaster.intersectObjects(Array.from(sensorMeshesRef.current.values()));
      if (hits.length > 0 && hits[0].object.userData.sensorId) {
        onSensorClick(hits[0].object.userData.sensorId);
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
      const hits = raycaster.intersectObjects(Array.from(sensorMeshesRef.current.values()));
      
      if (hits.length > 0 && hits[0].object.userData.sensorId) {
        hoveredRef.current = hits[0].object.userData.sensorId;
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
  }, [createBuilding, createCable, createSensor, createLabel, onSensorClick]);

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
