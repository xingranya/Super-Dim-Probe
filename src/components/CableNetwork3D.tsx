import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { 
  BUILDINGS, TREES, CABLE_ROUTES, SENSORS, 
  Building, CablePath, Sensor,
  ROAD_OFFSET, CABLE_HEIGHT // 确保常量也被导入
} from '../constants/sceneData';

/**
 * 3D电缆网络场景 - TranMile风格重构版
 * 重点：清晰的电缆、突出的传感器、专业的展示效果
 */

interface CableNetwork3DProps {
  onSensorClick: (sensorId: string) => void;
  onViewSensorDetail: () => void;
}

// ============================================================
// React 组件
// ============================================================

interface CableNetwork3DProps {
  active?: boolean; // 控制渲染循环
  onSensorClick: (id: string) => void;
  onViewSensorDetail: () => void;
  initialCameraState?: { position: [number, number, number]; target: [number, number, number] };
  onCameraChange?: (state: { position: [number, number, number]; target: [number, number, number] }) => void;
}

const CableNetwork3D: React.FC<CableNetwork3DProps> = ({ 
  active = true,
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
  const activeRef = useRef(active);

  // 同步 active 状态
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  // === 材质共享池 (减少对象创建) ===
  const materials = useMemo(() => {
    return {
      // 建筑材质
      highrise: { 
        body: new THREE.MeshStandardMaterial({ color: '#F8FAFC', roughness: 0.85, metalness: 0.05 }),
        window: new THREE.MeshStandardMaterial({ color: '#3B82F6', roughness: 0.2, metalness: 0.7, envMapIntensity: 1.0 }),
        edge: new THREE.LineBasicMaterial({ color: '#94A3B8', linewidth: 2 }),
        roof: new THREE.MeshStandardMaterial({ color: '#94A3B8' }) // 屋顶设备
      },
      lowrise: { 
        body: new THREE.MeshStandardMaterial({ color: '#F1F5F9', roughness: 0.85, metalness: 0.05 }),
        window: new THREE.MeshStandardMaterial({ color: '#60A5FA', roughness: 0.4 }), // 也用作屋顶
        edge: new THREE.LineBasicMaterial({ color: '#9CA3AF', linewidth: 2 })
      },
      factory: { 
        body: new THREE.MeshStandardMaterial({ color: '#E2E8F0', roughness: 0.85, metalness: 0.05 }),
        window: new THREE.MeshStandardMaterial({ color: '#64748B' }), // 屋顶
        chimney: new THREE.MeshStandardMaterial({ color: '#475569' }),
        edge: new THREE.LineBasicMaterial({ color: '#6B7280', linewidth: 2 })
      },
      house: { 
        body: new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.85, metalness: 0.05 }),
        window: new THREE.MeshStandardMaterial({ color: '#93C5FD', roughness: 0.4 }),
        edge: new THREE.LineBasicMaterial({ color: '#A1A1AA', linewidth: 2 })
      },
      // 传感器基础材质
      sensor: {
        base: new THREE.MeshStandardMaterial({ color: '#57534e', roughness: 0.9 }),
        box: new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.4, metalness: 0.6 }),
        door: new THREE.MeshStandardMaterial({ color: '#475569', metalness: 0.5, roughness: 0.5 }),
        handle: new THREE.MeshStandardMaterial({ color: '#cbd5e1', metalness: 0.8 }),
        mount: new THREE.MeshStandardMaterial({ color: '#1e293b' }),
        port: new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.8 })
      },
      // 状态灯材质 (需要发光，且经常变色，这里预创建三种状态)
      lights: {
        normal: new THREE.MeshPhysicalMaterial({ color: '#10b981', emissive: '#10b981', emissiveIntensity: 2.0, transmission: 0.5, thickness: 0.5, roughness: 0.1 }),
        warning: new THREE.MeshPhysicalMaterial({ color: '#f59e0b', emissive: '#f59e0b', emissiveIntensity: 2.0, transmission: 0.5, thickness: 0.5, roughness: 0.1 }),
        fault: new THREE.MeshPhysicalMaterial({ color: '#ef4444', emissive: '#ef4444', emissiveIntensity: 2.0, transmission: 0.5, thickness: 0.5, roughness: 0.1 })
      },
      rings: {
        normal: new THREE.MeshBasicMaterial({ color: '#10b981', transparent: true, opacity: 0.6 }),
        warning: new THREE.MeshBasicMaterial({ color: '#f59e0b', transparent: true, opacity: 0.6 }),
        fault: new THREE.MeshBasicMaterial({ color: '#ef4444', transparent: true, opacity: 0.6 })
      }
    };
  }, []);

  // 创建建筑物 (Phase 2 升级版)
  const createBuilding = useCallback((b: Building, scene: THREE.Scene) => {
    const group = new THREE.Group();
    
    const matSet = materials[b.type];
    
    // 建筑主体
    const bodyGeo = new THREE.BoxGeometry(b.size[0], b.size[1], b.size[2]);
    const body = new THREE.Mesh(bodyGeo, matSet.body); // 使用共享材质
    body.position.set(b.position[0], b.size[1] / 2, b.position[2]);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);
    
    // 深色边框线 (强化)
    const edges = new THREE.EdgesGeometry(bodyGeo);
    const edgeLine = new THREE.LineSegments(edges, matSet.edge); // 使用共享材质
    edgeLine.position.copy(body.position);
    group.add(edgeLine);
    
    // 高楼：多层蓝色玻璃窗带
    if (b.type === 'highrise' && b.size[1] > 10) {
      const windowMat = matSet.window; // 使用共享材质
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
      // @ts-ignore - highrise has roof material
      const roofBox = new THREE.Mesh(roofBoxGeo, matSet.roof);
      roofBox.position.set(b.position[0], b.size[1] + 0.75, b.position[2]);
      group.add(roofBox);
    }
    
    // 矮房/house：蓝色平屋顶
    if (b.type === 'lowrise' || b.type === 'house') {
      const roofGeo = new THREE.BoxGeometry(b.size[0] + 0.3, 0.3, b.size[2] + 0.3);
      const roof = new THREE.Mesh(roofGeo, matSet.window); // 复用window材质作为屋顶
      roof.position.set(b.position[0], b.size[1] + 0.15, b.position[2]);
      group.add(roof);
    }
    
    // 工厂：烟囱 + 灰色屋顶
    if (b.type === 'factory') {
      // 灰色平屋顶
      const roofGeo = new THREE.BoxGeometry(b.size[0] + 0.2, 0.4, b.size[2] + 0.2);
      const roof = new THREE.Mesh(roofGeo, matSet.window); // 工厂的window其实是屋顶色
      roof.position.set(b.position[0], b.size[1] + 0.2, b.position[2]);
      group.add(roof);
      // 烟囱
      const chimneyGeo = new THREE.CylinderGeometry(0.4, 0.5, 3, 8);
      // @ts-ignore - factory has chimney
      const chimney = new THREE.Mesh(chimneyGeo, matSet.chimney);
      chimney.position.set(b.position[0] + b.size[0] * 0.3, b.size[1] + 1.5, b.position[2] + b.size[2] * 0.3);
      group.add(chimney);
    }
    
    scene.add(group);
    return group;
  }, [materials]); // 依赖 materials


  // 创建树木 - InstancedMesh 优化版
  const createTreesInstanced = useCallback((scene: THREE.Scene) => {
    if (TREES.length === 0) return;

    const dummy = new THREE.Object3D();

    // === 1. 树干 InstancedMesh ===
    const trunkGeo = new THREE.CylinderGeometry(0.4, 0.6, 2, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: '#8B4513', roughness: 0.9 });
    const trunkMesh = new THREE.InstancedMesh(trunkGeo, trunkMat, TREES.length);
    trunkMesh.castShadow = true;
    trunkMesh.receiveShadow = true;

    // === 2. 树冠 InstancedMesh (处理每棵树的3个球体) ===
    // 树冠需要 3 倍的实例数量
    const leavesGeo = new THREE.SphereGeometry(1, 12, 12); // 基础半径为1，通过缩放控制大小
    const leavesMat = new THREE.MeshStandardMaterial({ color: '#4ADE80', roughness: 0.8 });
    const leavesMesh = new THREE.InstancedMesh(leavesGeo, leavesMat, TREES.length * 3);
    leavesMesh.castShadow = true;
    leavesMesh.receiveShadow = true;

    let leafIndex = 0;

    TREES.forEach((pos, i) => {
      // 随机旋转和缩放 (保持与原逻辑一致)
      // group.rotation.y = Math.random() * Math.PI;
      // const scale = 0.8 + Math.random() * 0.4;
      const rotationY = Math.random() * Math.PI;
      const scale = 0.8 + Math.random() * 0.4;

      // === 设置树干 ===
      // 原逻辑: trunk.position.set(0, 1, 0); 且 group 整体进行了缩放/旋转/位移
      dummy.position.set(0, 1 * scale, 0); // 相对高度也随整体scale缩放
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(scale, scale, scale); // 树干自身不额外缩放，只受整体scale影响
      
      // 应用整体变换
      // 1. 先旋转
      dummy.rotation.y = rotationY;
      // 2. 再位移到世界坐标 (注意：旋转是绕原点的，所以先应用旋转再位移到世界坐标逻辑上等同于 group 操作)
      // 实际上 Object3D 的变换顺序是 Scale -> Rotation -> Position
      // 所以我们直接设置 dummy 的属性即可
      dummy.position.set(pos[0], 1 * scale, pos[2]); // Y轴修正: 树干中心在1，缩放后世界坐标为 1*scale
      
      dummy.updateMatrix();
      trunkMesh.setMatrixAt(i, dummy.matrix);


      // === 设置树冠 (3个球体) ===
      
      // 球体 1: sphere1.position.set(0, 3.5, 0); radius=2.5
      dummy.position.set(0, 3.5, 0); 
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(2.5, 2.5, 2.5); // 基础半径1 -> 2.5
      
      // 手动模拟 Group 的层级变换: WorldMatrix = ParentWorldMatrix * LocalMatrix
      // 这里比较简单，直接用数学计算位置
      // 旋转后的相对位置:
      // x' = x * cos(theta) + z * sin(theta)
      // z' = -x * sin(theta) + z * cos(theta)
      // 球体1在 (0, 3.5, 0)，旋转后xz不变
      
      dummy.scale.multiplyScalar(scale); // 叠加整体缩放
      dummy.position.multiplyScalar(scale); // 位置也受整体缩放影响
      
      // 应用旋转 (球体1在轴上，旋转无影响位置，只影响旋转角度但球体是对称的)
      // 位移到世界坐标
      dummy.position.x += pos[0];
      dummy.position.z += pos[2];
      
      dummy.updateMatrix();
      leavesMesh.setMatrixAt(leafIndex++, dummy.matrix);

      // 球体 2: sphere2.position.set(1.2, 2.5, 0.8); radius=1.5
      // 需要计算旋转后的偏移
      const x2 = 1.2;
      const y2 = 2.5;
      const z2 = 0.8;
      
      // 旋转
      const cos = Math.cos(rotationY);
      const sin = Math.sin(rotationY);
      const rx2 = x2 * cos + z2 * sin;
      const rz2 = -x2 * sin + z2 * cos;
      
      dummy.position.set(rx2, y2, rz2);
      dummy.position.multiplyScalar(scale); // 整体缩放影响相对位置
      dummy.position.x += pos[0]; // 世界坐标
      dummy.position.z += pos[2];
      
      dummy.scale.set(1.5, 1.5, 1.5); // 基础半径1 -> 1.5
      dummy.scale.multiplyScalar(scale); // 叠加整体缩放
      
      dummy.rotation.set(0, 0, 0); // 球体旋转不重要
      dummy.updateMatrix();
      leavesMesh.setMatrixAt(leafIndex++, dummy.matrix);

      // 球体 3: sphere3.position.set(-1.0, 4.0, -0.8); radius=1.5
      const x3 = -1.0;
      const y3 = 4.0;
      const z3 = -0.8;
      
      const rx3 = x3 * cos + z3 * sin;
      const rz3 = -x3 * sin + z3 * cos;
      
      dummy.position.set(rx3, y3, rz3);
      dummy.position.multiplyScalar(scale);
      dummy.position.x += pos[0];
      dummy.position.z += pos[2];
      
      dummy.scale.set(1.5, 1.5, 1.5);
      dummy.scale.multiplyScalar(scale);
      
      dummy.updateMatrix();
      leavesMesh.setMatrixAt(leafIndex++, dummy.matrix);
    });

    scene.add(trunkMesh);
    scene.add(leavesMesh);

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
      steps: 80, // 优化：150 -> 80，减少顶点数
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

    const m = materials.sensor;

    // === 1. 混凝土基座 ===
    const baseGeo = new THREE.BoxGeometry(3, 0.5, 3);
    const base = new THREE.Mesh(baseGeo, m.base); // 共享
    base.position.y = 0.25;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    // === 2. 工业金属箱体 (主分接箱) ===
    // 高度需覆盖电缆高度 (1.5 ~ 2.0)，箱体设为高 3.2
    const boxHeight = 3.2;
    const boxWidth = 2.4;
    const boxGeo = new THREE.BoxGeometry(boxWidth, boxHeight, boxWidth);
    const box = new THREE.Mesh(boxGeo, m.box); // 共享
    box.position.y = 0.5 + boxHeight / 2; // 基座之上
    box.castShadow = true;
    box.receiveShadow = true;
    box.userData = { sensorId: sensor.id }; // 点击交互目标
    group.add(box);

    // === 3. 细节：检修门与把手 ===
    const doorGeo = new THREE.BoxGeometry(boxWidth * 0.8, boxHeight * 0.8, 0.1);
    const door = new THREE.Mesh(doorGeo, m.door); // 共享
    door.position.set(0, 0.5 + boxHeight / 2, boxWidth / 2 + 0.05); // Z轴正面突出一点
    group.add(door);

    // 门把手
    const handleGeo = new THREE.BoxGeometry(0.1, 0.4, 0.15);
    const handle = new THREE.Mesh(handleGeo, m.handle); // 共享
    handle.position.set(0.6, 0.5 + boxHeight / 2, boxWidth / 2 + 0.15);
    group.add(handle);

    // === 4. 状态指示灯 (顶部三色塔灯风格) ===
    const lightGroup = new THREE.Group();
    lightGroup.position.set(0, 0.5 + boxHeight, 0);

    // 灯座
    const mountGeo = new THREE.CylinderGeometry(0.4, 0.5, 0.2, 16);
    const mount = new THREE.Mesh(mountGeo, m.mount); // 共享
    mount.position.y = 0.1;
    lightGroup.add(mount);

    // 发光罩
    const bulbGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.6, 16);
    const bulb = new THREE.Mesh(bulbGeo, materials.lights[sensor.status]); // 共享
    bulb.position.y = 0.5;
    bulb.userData = { sensorId: sensor.id };
    lightGroup.add(bulb);

    // 顶部盖帽
    const capGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.1, 16);
    const cap = new THREE.Mesh(capGeo, m.mount); // 共享
    cap.position.y = 0.85;
    lightGroup.add(cap);

    // 脉冲光环 (保留但缩小，作为状态增强)
    const ringGeo = new THREE.TorusGeometry(0.4, 0.05, 8, 32);
    const ring = new THREE.Mesh(ringGeo, materials.rings[sensor.status]); // 共享
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.5;
    lightGroup.add(ring);

    group.add(lightGroup);

    // === 5. 电缆接入口 (黑色橡胶套管) ===
    // 模拟电缆从侧面插入箱体的密封套管
    const portGeo = new THREE.CylinderGeometry(1.0, 1.0, 0.4, 16);
    
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
        const port = new THREE.Mesh(portGeo, m.port); // 共享
        port.position.set(p.pos[0], p.pos[1], p.pos[2]);
        if (p.rotZ) port.rotation.z = p.rotZ;
        if (p.rotX) port.rotation.x = p.rotX;
        group.add(port);
    });

    // 保存引用
    sensorMeshesRef.current.set(sensor.id, group as any);

    scene.add(group);
    return group;
  }, [materials]); // 依赖 materials

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

  // 使用 ref 追踪 active 状态，以便在动画循环中访问最新值
  // const activeRef = useRef(active); // Removed duplicate definition
  /* 
  useEffect(() => {
    activeRef.current = active;
    if (active && !animIdRef.current) {
       // ... logic removed as it was buggy
    }
  }, [active]);
  */

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
    createTreesInstanced(scene);
    
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
      
      // 如果不激活，仅更新控制器但不渲染，或者完全跳过
      // 完全跳过渲染可以节省 GPU
      if (!activeRef.current) return; 

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
      if (!activeRef.current) return; // 不激活时不响应点击
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
      if (!activeRef.current) return;
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

      // 深度清理场景资源
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          if (object.geometry) object.geometry.dispose();
          // 注意：现在使用了共享材质，不能盲目 dispose() 所有的 material
          // 但由于我们是在组件卸载时清理，且 materials 对象也是在组件内创建的
          // 所以这里依然可以 dispose，因为 materials 对象本身也会被垃圾回收
          // 但为了安全起见（防止 useMemo 缓存的副作用），React 的最佳实践是
          // 既然材质是在组件内定义的，这里可以不用管它，或者显式清理 materials 对象
          // 不过，Three.js 的 dispose 是清理 GPU 显存，这是必须的。
          // 只要确保没有其他组件实例在使用这些材质即可。
          // 考虑到这是一个单页应用，且 CableNetwork3D 卸载意味着 3D 场景销毁，
          // 所以这里 dispose 是正确的。
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(m => m.dispose());
            } else {
              object.material.dispose();
            }
          }
        }
      });

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      if (container.contains(labelRenderer.domElement)) {
        container.removeChild(labelRenderer.domElement);
      }
    };
  }, [createBuilding, createCableSystem, createSensor, createLabel, createTreesInstanced, onSensorClick]);

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

      {/* 操作按钮 - 移至右下角 */}
      <button
        onClick={onViewSensorDetail}
        className="absolute bottom-4 right-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-lg transition-all flex items-center gap-2 font-medium z-20"
      >
        🔍 传感器模型视图
      </button>

      {/* 提示 - 移至按钮上方 */}
      <div className="absolute bottom-16 right-4 text-xs text-slate-500 bg-white/80 px-3 py-1.5 rounded-lg shadow pointer-events-none">
        点击传感器节点查看监测数据
      </div>
    </div>
  );
};

export default CableNetwork3D;
