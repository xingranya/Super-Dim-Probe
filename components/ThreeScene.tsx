import React, { useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { FaultMode, SensorData } from '../types';
import * as TextureFactory from '../utils/textureFactory';
import * as Shaders from '../utils/shaders';

interface ThreeSceneProps {
  currentMode: FaultMode;
  isScanning: boolean;
  onSensorUpdate: (data: SensorData) => void;
}

const ThreeScene: React.FC<ThreeSceneProps> = ({ currentMode, isScanning, onSensorUpdate }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const screenTexRef = useRef<THREE.CanvasTexture | null>(null);
  const screenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameCountRef = useRef(0);
  const lastUpdateTimeRef = useRef(0);

  const propsRef = useRef({ currentMode, isScanning, onSensorUpdate });
  useEffect(() => { propsRef.current = { currentMode, isScanning, onSensorUpdate }; }, [currentMode, isScanning, onSensorUpdate]);

  useEffect(() => {
    if (!containerRef.current) return;

    // 场景初始化
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020508);
    scene.fog = new THREE.Fog(0x020508, 5, 25);

    // 保存 container 引用到闭包变量，确保 cleanup 时可用
    const container = containerRef.current;
    if (!container) return;

    const camera = new THREE.PerspectiveCamera(35, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(2.5, 2.0, 3.5);

    // 渲染器 - 优化像素比和性能设置
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      powerPreference: "high-performance",
      stencil: false, // 禁用不必要的模板缓冲
      depth: true
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // 限制像素比提升性能
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // 环境贴图
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    // 后处理 - 优化bloom参数减少GPU负载
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight), 
      0.6,  // 降低强度
      0.3,  // 降低半径
      0.85
    );
    composer.addPass(bloomPass);

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 1.5;
    controls.maxDistance = 8;

    // 光照 - 优化后的柔和光照系统
    const mainSpot = new THREE.SpotLight(0xffffff, 80); // 降低主光强度
    mainSpot.position.set(3, 6, 2);
    mainSpot.castShadow = true;
    mainSpot.angle = Math.PI / 4;
    mainSpot.penumbra = 0.5; // 柔和边缘
    scene.add(mainSpot);
    
    // 增强环境光
    scene.add(new THREE.AmbientLight(0x334455, 1.2));
    
    // 添加半球光提供自然过渡
    const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x444444, 0.6);
    scene.add(hemiLight);
    
    // 柔和的补光
    const fillLight = new THREE.PointLight(0x00aaff, 8, 10, 2);
    fillLight.position.set(-2, 1, 3);
    scene.add(fillLight);

    // 地面
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 30),
      new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.9 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    scene.add(ground);

    // 网格线 - 调低位置避免穿模
    const grid = new THREE.GridHelper(20, 40, 0x00ffff, 0x002222);
    grid.position.y = -0.52; // 降低位置避免穿透模型
    (grid.material as THREE.Material).opacity = 0.2; // 降低透明度
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).depthWrite = false; // 防止深度冲突
    scene.add(grid);

    // 电缆
    const cablePath = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-8, 0, 0), new THREE.Vector3(0, 0, 0), new THREE.Vector3(8, 0, 0)
    ]);

    // 铜芯
    const coreMat = new THREE.MeshStandardMaterial({ map: TextureFactory.createHighGlossCopperTexture(), roughness: 0.2, metalness: 0.95, color: 0xcd7f32 });
    coreMat.map!.repeat.set(30, 1);
    scene.add(new THREE.Mesh(new THREE.TubeGeometry(cablePath, 256, 0.06, 32), coreMat));

    // XLPE层
    const xlpeMat = new THREE.MeshPhysicalMaterial({ map: TextureFactory.createXLPETexture(), color: 0x6699cc, roughness: 0.4, transmission: 0.3, transparent: true, opacity: 0.85 });
    xlpeMat.map!.repeat.set(15, 1);
    scene.add(new THREE.Mesh(new THREE.TubeGeometry(cablePath, 256, 0.10, 32), xlpeMat));

    // 屏蔽层
    const shieldMat = new THREE.MeshStandardMaterial({ map: TextureFactory.createBraidMap(), roughness: 0.4, metalness: 0.8, color: 0x888888 });
    shieldMat.map!.repeat.set(50, 4);
    scene.add(new THREE.Mesh(new THREE.TubeGeometry(cablePath, 256, 0.13, 32), shieldMat));

    // 外护套
    const jacketMat = new THREE.MeshStandardMaterial({ map: TextureFactory.createJacketTexture(), roughness: 0.85, color: 0x111111 });
    jacketMat.map!.repeat.set(25, 1);
    const jacket = new THREE.Mesh(new THREE.TubeGeometry(cablePath, 256, 0.18, 32), jacketMat);
    jacket.castShadow = true;
    scene.add(jacket);

    // 接头
    const jointGroup = new THREE.Group();
    scene.add(jointGroup);

    // ========== 六面体传感器环绕模型 ==========
    // 传感器名称和图标颜色
    const sensorFaces = [
      { name: '综合状态监测', icon: '📊', color: 0x00ffff, shortName: 'OVERVIEW' },
      { name: '电学状态分析', icon: '⚡', color: 0x3b82f6, shortName: 'ELECTRIC' },
      { name: '声学状态分析', icon: '🔊', color: 0x8b5cf6, shortName: 'ACOUSTIC' },
      { name: '热学状态分析', icon: '🔥', color: 0xf97316, shortName: 'THERMAL' },
      { name: '振动状态分析', icon: '📳', color: 0x06b6d4, shortName: 'VIBRATION' },
      { name: 'XLPE状态分析', icon: '🔬', color: 0x22c55e, shortName: 'XLPE' }
    ];
    
    /**
     * 绘制传感器屏幕内容 - 宽屏版 (1024x256)
     */
    const drawSensorScreen = (ctx: CanvasRenderingContext2D, faceIndex: number, face: typeof sensorFaces[0]) => {
      const W = 1024, H = 256; // 4:1 比例适配物理尺寸
      const colorHex = `#${face.color.toString(16).padStart(6, '0')}`;
      
      // 背景
      ctx.fillStyle = '#0a0a15';
      ctx.fillRect(0, 0, W, H);
      
      // 边框发光效果
      ctx.strokeStyle = colorHex;
      ctx.lineWidth = 4;
      ctx.strokeRect(4, 4, W - 8, H - 8);
      
      // 左侧标题栏背景 (占据左侧 25% 宽度)
      const gradient = ctx.createLinearGradient(0, 0, W * 0.25, 0);
      gradient.addColorStop(0, colorHex + '66');
      gradient.addColorStop(1, colorHex + '11');
      ctx.fillStyle = gradient;
      ctx.fillRect(4, 4, W * 0.25, H - 8);
      
      // 标题文字和图标 (左侧)
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // 图标
      ctx.font = '80px "Segoe UI Symbol"';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(face.icon, W * 0.125, H * 0.4);
      
      // 标题
      ctx.font = 'bold 28px "Segoe UI", Arial';
      ctx.fillStyle = colorHex;
      ctx.fillText(face.shortName, W * 0.125, H * 0.75);
      
      // 分隔线
      ctx.strokeStyle = colorHex;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(W * 0.25, 20);
      ctx.lineTo(W * 0.25, H - 20);
      ctx.stroke();
      
      // 右侧内容区域 (从 W*0.28 开始)
      const contentX = W * 0.28;
      const contentW = W * 0.70;
      
      // 根据面索引绘制不同内容
      switch (faceIndex) {
        case 0: drawOverviewScreen(ctx, contentX, contentW, H, colorHex); break;
        case 1: drawElectricalScreen(ctx, contentX, contentW, H, colorHex); break;
        case 2: drawAcousticScreen(ctx, contentX, contentW, H, colorHex); break;
        case 3: drawThermalScreen(ctx, contentX, contentW, H, colorHex); break;
        case 4: drawVibrationScreen(ctx, contentX, contentW, H, colorHex); break;
        case 5: drawXLPEScreen(ctx, contentX, contentW, H, colorHex); break;
      }
    };
    
    // 综合状态 - 横向布局
    const drawOverviewScreen = (ctx: CanvasRenderingContext2D, x: number, w: number, h: number, color: string) => {
      // 居中大字健康度
      ctx.textAlign = 'left';
      ctx.fillStyle = color;
      ctx.font = 'bold 90px monospace';
      ctx.fillText('94%', x + 20, 110);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '24px Arial';
      ctx.fillText('SYSTEM HEALTH', x + 20, 150);
      
      // 右侧状态网格
      const statuses = ['ELEC', 'ACOU', 'THER', 'VIBR'];
      const statusColors = ['#22c55e', '#22c55e', '#f59e0b', '#22c55e'];
      
      statuses.forEach((label, i) => {
        const bx = x + 300 + (i % 2) * 160;
        const by = 80 + Math.floor(i / 2) * 80;
        
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(bx, by, 140, 60);
        
        ctx.fillStyle = statusColors[i];
        ctx.beginPath();
        ctx.arc(bx + 30, by + 30, 10, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(label, bx + 50, by + 38);
      });
    };
    
    // 电学监测 - 横向布局
    const drawElectricalScreen = (ctx: CanvasRenderingContext2D, x: number, w: number, h: number, color: string) => {
      // 分三列显示: 电压 | 电流 | 局放
      const colW = w / 3;
      
      // 1. 电压
      ctx.textAlign = 'left';
      ctx.fillStyle = '#aaaaaa';
      ctx.font = '24px Arial';
      ctx.fillText('VOLTAGE', x + 20, 80);
      ctx.fillStyle = color;
      ctx.font = 'bold 50px monospace';
      ctx.fillText('110.5', x + 20, 140);
      ctx.font = '24px Arial';
      ctx.fillText('kV', x + 160, 140);
      
      // 2. 电流
      ctx.fillStyle = '#aaaaaa';
      ctx.fillText('CURRENT', x + colW + 20, 80);
      ctx.fillStyle = color;
      ctx.font = 'bold 50px monospace';
      ctx.fillText('248', x + colW + 20, 140);
      ctx.font = '24px Arial';
      ctx.fillText('A', x + colW + 120, 140);
      
      // 3. 局放
      ctx.fillStyle = '#aaaaaa';
      ctx.fillText('PD LEVEL', x + colW * 2 + 20, 80);
      ctx.fillStyle = '#f59e0b'; // Warn color
      ctx.font = 'bold 50px monospace';
      ctx.fillText('156', x + colW * 2 + 20, 140);
      ctx.font = '24px Arial';
      ctx.fillText('pC', x + colW * 2 + 120, 140);
      
      // 底部条形
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(x + 20, 190, w - 40, 20);
      ctx.fillStyle = color;
      ctx.fillRect(x + 20, 190, (w - 40) * 0.8, 20);
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('POWER FACTOR: 0.92', x + w / 2, 235);
    };
    
    // 声学监测 - 左文字右图表
    const drawAcousticScreen = (ctx: CanvasRenderingContext2D, x: number, w: number, h: number, color: string) => {
      // 左侧数值
      ctx.textAlign = 'left';
      ctx.fillStyle = '#aaaaaa';
      ctx.font = '24px Arial';
      ctx.fillText('PEAK dB', x + 20, 80);
      ctx.fillStyle = color;
      ctx.font = 'bold 60px monospace';
      ctx.fillText('82', x + 20, 140);
      
      ctx.fillStyle = '#aaaaaa';
      ctx.font = '24px Arial';
      ctx.fillText('COUNTS', x + 20, 190);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 30px monospace';
      ctx.fillText('23/min', x + 130, 190);
      
      // 右侧频谱图
      const chartX = x + 250;
      const chartW = w - 280;
      const chartH = 150;
      const chartY = 50;
      
      // 坐标轴
      ctx.strokeStyle = '#333344';
      ctx.beginPath();
      ctx.moveTo(chartX, chartY);
      ctx.lineTo(chartX, chartY + chartH);
      ctx.lineTo(chartX + chartW, chartY + chartH);
      ctx.stroke();
      
      // 频谱条
      const bars = 12;
      const barW = (chartW / bars) - 5;
      for(let i=0; i<bars; i++) {
        const height = Math.random() * chartH * 0.8 + 10;
        ctx.fillStyle = color;
        ctx.fillRect(chartX + i * (barW + 5) + 5, chartY + chartH - height, barW, height);
      }
      ctx.fillStyle = '#aaaaaa';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('FREQUENCY SPECTRUM (kHz)', chartX + chartW/2, chartY + chartH + 25);
    };
    
    // 热学监测 - 横向热力
    const drawThermalScreen = (ctx: CanvasRenderingContext2D, x: number, w: number, h: number, color: string) => {
      // 数值区
      const valW = 200;
      ctx.textAlign = 'left';
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 60px monospace';
      ctx.fillText('58.3°C', x + 20, 110);
      ctx.fillStyle = '#aaaaaa';
      ctx.font = '24px Arial';
      ctx.fillText('MAX TEMP', x + 20, 140);
      
      ctx.fillStyle = color;
      ctx.font = 'bold 40px monospace';
      ctx.fillText('42.8°C', x + 250, 110);
      ctx.fillStyle = '#aaaaaa';
      ctx.font = '20px Arial';
      ctx.fillText('AVG TEMP', x + 250, 140);
      
      // 底部热力条
      const barX = x + 20;
      const barY = 170;
      const barW = w - 40;
      const barH = 40;
      
      const grad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
      grad.addColorStop(0, '#3b82f6');
      grad.addColorStop(0.5, '#22c55e');
      grad.addColorStop(1, '#ef4444');
      
      ctx.fillStyle = grad;
      ctx.fillRect(barX, barY, barW, barH);
      
      // 刻度
      ctx.fillStyle = '#ffffff';
      ctx.font = '14px Arial';
      ctx.textAlign = 'left'; 
      ctx.fillText('20°C', barX, barY + 60);
      ctx.textAlign = 'right';
      ctx.fillText('80°C', barX + barW, barY + 60);
      ctx.textAlign = 'center';
      ctx.fillText('THERMAL DISTRIBUTION', barX + barW/2, barY + 60);
    };
    
    // 振动监测 - 波形图
    const drawVibrationScreen = (ctx: CanvasRenderingContext2D, x: number, w: number, h: number, color: string) => {
      // 左侧数值
      ctx.textAlign = 'left';
      ctx.fillStyle = '#aaaaaa';
      ctx.font = '24px Arial';
      ctx.fillText('RMS mm/s', x + 20, 80);
      ctx.fillStyle = color;
      ctx.font = 'bold 60px monospace';
      ctx.fillText('5.82', x + 20, 140);
      
      // 右侧波形
      const waveX = x + 250;
      const waveW = w - 270;
      const waveY = 128;
      
      ctx.beginPath();
      ctx.strokeStyle = '#333344';
      ctx.lineWidth = 1;
      ctx.moveTo(waveX, waveY);
      ctx.lineTo(waveX + waveW, waveY);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      for(let i=0; i<waveW; i+=2) {
        const val = Math.sin(i * 0.1) * 50 * Math.sin(i * 0.01) + (Math.random()-0.5)*10;
        if(i===0) ctx.moveTo(waveX + i, waveY + val);
        else ctx.lineTo(waveX + i, waveY + val);
      }
      ctx.stroke();
      
      ctx.fillStyle = '#aaaaaa';
      ctx.font = '14px Arial';
      ctx.textAlign = 'right';
      ctx.fillText('TIME DOMAIN', waveX + waveW, 230);
    };
    
    // XLPE - 横向进度
    const drawXLPEScreen = (ctx: CanvasRenderingContext2D, x: number, w: number, h: number, color: string) => {
      // 寿命显示
      ctx.textAlign = 'left';
      ctx.fillStyle = '#aaaaaa';
      ctx.font = '24px Arial';
      ctx.fillText('EST. LIFE', x + 20, 80);
      ctx.fillStyle = color;
      ctx.font = 'bold 60px monospace';
      ctx.fillText('28.5', x + 20, 140);
      ctx.font = '24px Arial';
      ctx.fillText('YEARS', x + 160, 140);
      
      // 健康指数条
      const barX = x + 350;
      const barW = w - 370;
      
      ctx.fillStyle = '#aaaaaa';
      ctx.font = '20px Arial';
      ctx.fillText('HEALTH INDEX', barX, 80);
      
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(barX, 100, barW, 30);
      ctx.fillStyle = color;
      ctx.fillRect(barX, 100, barW * 0.94, 30);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px monospace';
      ctx.fillText('94%', barX + barW * 0.94 + 10, 122);
      
      // 负荷条
      ctx.fillStyle = '#aaaaaa';
      ctx.font = '20px Arial';
      ctx.fillText('LOAD FACTOR', barX, 170);
      
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(barX, 190, barW, 30);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(barX, 190, barW * 0.75, 30);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px monospace';
      ctx.fillText('75%', barX + barW * 0.75 + 10, 212);
    };
    
    
    const sensorGroup = new THREE.Group();
    jointGroup.add(sensorGroup);
    
    // 六边形主体外壳 - 环绕电缆
    const hexRadius = 0.38;  // 六边形外接圆半径
    const hexLength = 0.9;   // 六边形长度（沿电缆方向）
    const holeRadius = 0.20; // 中心孔半径（电缆通过）
    
    // 六边形外壳材质
    const hexMat = new THREE.MeshPhysicalMaterial({ 
      color: 0x1a1a2e,
      roughness: 0.25,
      metalness: 0.9,
      clearcoat: 0.4,
      clearcoatRoughness: 0.1
    });
    
    // 创建六边形外壳（使用六边形圆柱）
    const hexOuterGeo = new THREE.CylinderGeometry(hexRadius, hexRadius, hexLength, 6, 1, false);
    hexOuterGeo.rotateZ(Math.PI / 2); // 让圆柱沿X轴方向（电缆方向）
    const hexOuter = new THREE.Mesh(hexOuterGeo, hexMat);
    hexOuter.castShadow = true;
    sensorGroup.add(hexOuter);
    
    // 内部圆柱孔洞（用于视觉效果，实际电缆会穿过）
    const holeMat = new THREE.MeshStandardMaterial({ 
      color: 0x0a0a0a, 
      roughness: 0.9,
      side: THREE.BackSide
    });
    const holeGeo = new THREE.CylinderGeometry(holeRadius, holeRadius, hexLength + 0.02, 32, 1, true);
    holeGeo.rotateZ(Math.PI / 2);
    const holeMesh = new THREE.Mesh(holeGeo, holeMat);
    sensorGroup.add(holeMesh);
    
    // 为每个面创建屏幕（六边形有6个面）
    const screenCanvases: HTMLCanvasElement[] = [];
    const screenTextures: THREE.CanvasTexture[] = [];
    const screenFaceWidth = hexLength * 0.92;   // 屏幕宽度（沿电缆方向）- 增加到 92%
    const screenFaceHeight = hexRadius * 0.85;  // 屏幕高度 - 增加到 85%
    
    // 六边形面到中心的距离（apothem）- 屏幕需要紧贴在这个距离上
    const faceApothem = hexRadius * Math.cos(Math.PI / 6);
    
    for (let i = 0; i < 6; i++) {
      const face = sensorFaces[i];
      // 六边形的每个面的角度
      // CylinderGeometry 绕Z轴旋转90度后，原来Y轴上的面现在在YZ平面上旋转
      // 面的法向量在 YZ 平面上，每60度一个
      const faceAngle = (i / 6) * Math.PI * 2;
      
      // 屏幕 Canvas
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 256;
      screenCanvases.push(canvas);
      
      // 根据传感器类型绘制专业数据界面
      const ctx = canvas.getContext('2d')!;
      drawSensorScreen(ctx, i, face);
      
      const screenTex = new THREE.CanvasTexture(canvas);
      screenTextures.push(screenTex);
      
      // 屏幕位置：在六边形面的外侧
      // 六边形绕Z轴旋转后，面的法向量在YZ平面上
      const screenY = Math.cos(faceAngle) * (faceApothem + 0.005);
      const screenZ = Math.sin(faceAngle) * (faceApothem + 0.005);
      
      // 屏幕平面
      const screenMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(screenFaceWidth, screenFaceHeight),
        new THREE.MeshBasicMaterial({ map: screenTex, side: THREE.DoubleSide })
      );
      screenMesh.position.set(0, screenY, screenZ);
      // 旋转屏幕让它平贴在面上：
      // 1. 先绕X轴旋转90度让屏幕从XY平面变成XZ平面
      // 2. 再绕X轴旋转faceAngle对齐到对应的六边形面
      screenMesh.rotation.x = Math.PI / 2 + faceAngle;
      
      // 修复屏幕内容倒置和镜像问题
      // 修复屏幕内容倒置和镜像问题
      // 0,1,2,3 面需要翻转180度，4,5 面不需要
      if (i <= 3) {
        screenMesh.rotateZ(Math.PI);
      }
      screenMesh.scale.x = -1; // 解决水平镜像
      
      sensorGroup.add(screenMesh);
      
      // 边框
      const borderMat = new THREE.MeshBasicMaterial({ color: face.color, transparent: true, opacity: 0.9, side: THREE.DoubleSide });
      const borderThickness = 0.012;
      const borderOffset = faceApothem + 0.006;
      
      // 上边框
      const topBorder = new THREE.Mesh(new THREE.PlaneGeometry(screenFaceWidth + 0.02, borderThickness), borderMat);
      const topY = Math.cos(faceAngle) * borderOffset;
      const topZ = Math.sin(faceAngle) * borderOffset;
      topBorder.position.set(0, topY - Math.sin(faceAngle) * (screenFaceHeight / 2 + borderThickness), 
                                 topZ + Math.cos(faceAngle) * (screenFaceHeight / 2 + borderThickness));
      topBorder.rotation.x = Math.PI / 2 + faceAngle;
      sensorGroup.add(topBorder);
      
      // 下边框
      const bottomBorder = new THREE.Mesh(new THREE.PlaneGeometry(screenFaceWidth + 0.02, borderThickness), borderMat);
      bottomBorder.position.set(0, topY + Math.sin(faceAngle) * (screenFaceHeight / 2 + borderThickness), 
                                    topZ - Math.cos(faceAngle) * (screenFaceHeight / 2 + borderThickness));
      bottomBorder.rotation.x = Math.PI / 2 + faceAngle;
      sensorGroup.add(bottomBorder);
      
      // 左边框
      const leftBorder = new THREE.Mesh(new THREE.PlaneGeometry(borderThickness, screenFaceHeight + 0.02), borderMat);
      leftBorder.position.set(-screenFaceWidth / 2 - borderThickness, topY, topZ);
      leftBorder.rotation.x = Math.PI / 2 + faceAngle;
      sensorGroup.add(leftBorder);
      
      // 右边框
      const rightBorder = new THREE.Mesh(new THREE.PlaneGeometry(borderThickness, screenFaceHeight + 0.02), borderMat);
      rightBorder.position.set(screenFaceWidth / 2 + borderThickness, topY, topZ);
      rightBorder.rotation.x = Math.PI / 2 + faceAngle;
      sensorGroup.add(rightBorder);
    }
    
    // 保存主屏幕引用（用于动态更新）
    screenCanvasRef.current = screenCanvases[0]; // 综合状态屏幕
    const mainScreenTex = screenTextures[0];
    screenTexRef.current = mainScreenTex;
    
    // 六边形两端的金属封盖
    const endCapMat = new THREE.MeshPhysicalMaterial({ 
      color: 0x333344, 
      roughness: 0.15, 
      metalness: 0.95,
      clearcoat: 0.5
    });
    
    
    // 天线组件
    const antennaMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.3, metalness: 0.8 });
    const antennaBase = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.05, 16), antennaMat);
    antennaBase.position.set(0, hexRadius + 0.03, 0);
    sensorGroup.add(antennaBase);
    const antennaRod = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.18, 8), antennaMat);
    antennaRod.position.set(0, hexRadius + 0.15, 0);
    sensorGroup.add(antennaRod);
    const antennaTip = new THREE.Mesh(
      new THREE.SphereGeometry(0.02, 16, 16), 
      new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );
    antennaTip.position.set(0, hexRadius + 0.26, 0);
    sensorGroup.add(antennaTip);

    // 故障效果
    const thermalGlow = new THREE.PointLight(0xff3300, 0, 2.0);
    jointGroup.add(thermalGlow);

    const thermalMat = Shaders.createThermalMaterial(0);
    const thermalOverlay = new THREE.Mesh(new THREE.CylinderGeometry(0.265, 0.265, 1.15, 64), thermalMat);
    thermalOverlay.rotation.z = Math.PI / 2;
    thermalOverlay.visible = false;
    jointGroup.add(thermalOverlay);

    const electricTreeMat = Shaders.createElectricTreeMaterial();
    const electricTree = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.6), electricTreeMat);
    electricTree.rotation.y = Math.PI / 2;
    electricTree.visible = false;
    jointGroup.add(electricTree);

    const scanWaveMat = Shaders.createScanWaveMaterial();
    const scanWave = new THREE.Mesh(new THREE.RingGeometry(0.3, 2.5, 64), scanWaveMat);
    scanWave.rotation.x = -Math.PI / 2;
    scanWave.position.y = 0.01;
    scene.add(scanWave);

    const energyFlowMat = Shaders.createEnergyFlowMaterial();
    const energyFlow = new THREE.Mesh(new THREE.TubeGeometry(cablePath, 256, 0.19, 32), energyFlowMat);
    energyFlow.visible = false;
    scene.add(energyFlow);

    // 粒子 - 优化粒子数量
    const particleCount = 150; // 从200降低到150
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const velocities: THREE.Vector3[] = [];
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 0.5;
      positions[i * 3 + 1] = Math.random() * 0.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
      colors[i * 3] = 0; colors[i * 3 + 1] = 0.95; colors[i * 3 + 2] = 1;
      velocities.push(new THREE.Vector3((Math.random() - 0.5) * 0.02, Math.random() * 0.03, (Math.random() - 0.5) * 0.02));
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const particles = new THREE.Points(particleGeo, new THREE.PointsMaterial({ size: 0.02, vertexColors: true, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }));
    particles.visible = false;
    jointGroup.add(particles);

    // 动画
    const clock = new THREE.Clock();
    let animationId: number;
    const UPDATE_SENSOR_INTERVAL = 15; // 每15帧更新一次传感器
    const UPDATE_SCREEN_INTERVAL = 10; // 每10帧更新一次屏幕

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();
      const { currentMode, onSensorUpdate } = propsRef.current;
      frameCountRef.current++;

      let voltage = 110.5 + Math.sin(time * 0.5) * 0.3;
      let current = 428.1 + Math.sin(time * 0.3) * 2;
      let temp = 26.2 + Math.sin(time * 0.1) * 0.5;
      let pd = 0, health = 99.7;

      // 只更新显示的shader uniforms
      thermalMat.uniforms.time.value = time;
      electricTreeMat.uniforms.time.value = time;
      scanWaveMat.uniforms.time.value = time;
      energyFlowMat.uniforms.time.value = time;

      thermalOverlay.visible = false;
      electricTree.visible = false;
      energyFlow.visible = false;
      particles.visible = false;

      switch (currentMode) {
        case FaultMode.JOINT_OVERHEAT:
          temp = 75 + Math.sin(time) * 20;
          thermalGlow.intensity = (temp - 30) / 10;
          thermalOverlay.visible = true;
          thermalMat.uniforms.temperature.value = Math.min(1, (temp - 26) / 80);
          health = 45;
          bloomPass.strength = 1.0; // 降低bloom强度
          break;
        case FaultMode.XLPE_TREEING:
          electricTree.visible = true;
          particles.visible = true;
          electricTreeMat.uniforms.intensity.value = 0.6 + Math.sin(time * 8) * 0.4;
          pd = 150 + Math.sin(time * 10) * 100;
          health = 68;
          bloomPass.strength = 0.8; // 降低bloom强度
          break;
        case FaultMode.PVC_DAMAGE:
          energyFlow.visible = true;
          energyFlowMat.uniforms.flowIntensity.value = 0.5 + Math.sin(time * 2) * 0.3;
          health = 55;
          break;
        case FaultMode.WATER_TREEING:
          energyFlow.visible = true;
          energyFlowMat.uniforms.flowColor.value.setHex(0x8844ff);
          energyFlowMat.uniforms.flowIntensity.value = 0.4;
          health = 72;
          break;
        default:
          thermalGlow.intensity = 0;
          bloomPass.strength = 0.6; // 降低bloom强度
      }

      // 更新粒子 - 仅在可见时更新
      if (particles.visible) {
        const pos = particleGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < particleCount; i++) {
          pos[i * 3] += velocities[i].x;
          pos[i * 3 + 1] += velocities[i].y;
          pos[i * 3 + 2] += velocities[i].z;
          if (pos[i * 3 + 1] > 0.8) { 
            pos[i * 3] = (Math.random() - 0.5) * 0.3; 
            pos[i * 3 + 1] = 0; 
            pos[i * 3 + 2] = (Math.random() - 0.5) * 0.3; 
          }
        }
        particleGeo.attributes.position.needsUpdate = true;
      }

      // LED呼吸 - 优化更新频率
      if (frameCountRef.current % 3 === 0) {
        sensorGroup.children.forEach((c, i) => {
          if (c instanceof THREE.Mesh && c.material instanceof THREE.MeshBasicMaterial && c.geometry instanceof THREE.SphereGeometry) {
            c.material.opacity = 0.5 + Math.sin(time * 3 + i) * 0.5;
          }
        });
      }

      // 天线闪烁 - 优化更新频率
      if (frameCountRef.current % 3 === 0 && antennaTip.material instanceof THREE.MeshBasicMaterial) {
        antennaTip.material.opacity = 0.5 + Math.sin(time * 5) * 0.5;
      }

      // 屏幕更新 - 降低更新频率从每帧到每10帧
      if (frameCountRef.current % UPDATE_SCREEN_INTERVAL === 0) {
        const ctx = screenCanvasRef.current?.getContext('2d');
        if (ctx && screenTexRef.current) {
          ctx.fillStyle = '#010810'; ctx.fillRect(0, 0, 512, 256);
          ctx.strokeStyle = '#00f3ff'; ctx.lineWidth = 4; ctx.strokeRect(6, 6, 500, 244);
          ctx.fillStyle = '#00f3ff'; ctx.font = 'bold 28px monospace'; ctx.fillText('JOINT SENTRY V6.1', 30, 45);
          ctx.font = '22px monospace'; ctx.fillStyle = '#88ccff';
          ctx.fillText(`TEMP: ${temp.toFixed(1)}°C`, 30, 100);
          ctx.fillText(`LOAD: ${current.toFixed(1)}A`, 30, 135);
          ctx.fillText(`VOLT: ${voltage.toFixed(1)}kV`, 30, 170);
          const hc = health > 90 ? '#00ff00' : health > 50 ? '#ffcc00' : '#ff3300';
          ctx.fillStyle = hc; ctx.font = 'bold 26px monospace'; ctx.fillText(`HEALTH: ${health.toFixed(1)}%`, 30, 215);
          screenTexRef.current.needsUpdate = true;
        }
      }

      controls.update();
      composer.render();

      // 传感器数据更新 - 从每10帧降低到每15帧
      if (frameCountRef.current % UPDATE_SENSOR_INTERVAL === 0) {
        onSensorUpdate({ pd, temp, vib: 0, loss: 0, voltage, current });
      }
    };
    animate();

    // 响应式
    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
      composer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      
      // 清理 OrbitControls
      controls.dispose();
      
      // 清理资源防止内存泄漏
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry?.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach(m => m.dispose());
          } else {
            obj.material?.dispose();
          }
        }
      });
      
      // 移除 canvas 元素（修复 React StrictMode 双重挂载问题）
      // 使用闭包变量 container 而不是 containerRef.current
      if (container && renderer.domElement && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      
      renderer.dispose();
      composer.dispose();
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full" />;
};

export default ThreeScene;