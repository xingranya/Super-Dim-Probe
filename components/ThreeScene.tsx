import React, { useEffect, useRef } from 'react';
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

  const propsRef = useRef({ currentMode, isScanning, onSensorUpdate });
  useEffect(() => { propsRef.current = { currentMode, isScanning, onSensorUpdate }; }, [currentMode, isScanning, onSensorUpdate]);

  useEffect(() => {
    if (!containerRef.current) return;

    // 场景初始化
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020508);
    scene.fog = new THREE.Fog(0x020508, 5, 25);

    const camera = new THREE.PerspectiveCamera(35, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 100);
    camera.position.set(2.5, 2.0, 3.5);

    // 渲染器
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    containerRef.current.appendChild(renderer.domElement);

    // 环境贴图
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    // 后处理
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.8, 0.4, 0.85);
    composer.addPass(bloomPass);

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 1.5;
    controls.maxDistance = 8;

    // 光照
    const mainSpot = new THREE.SpotLight(0xffffff, 150);
    mainSpot.position.set(3, 6, 2);
    mainSpot.castShadow = true;
    scene.add(mainSpot);
    scene.add(new THREE.AmbientLight(0x112233, 0.5));
    scene.add(new THREE.PointLight(0x00ffff, 20, 0, 2).translateX(-2).translateY(1).translateZ(3));

    // 地面
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 30),
      new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.9 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    scene.add(ground);

    const grid = new THREE.GridHelper(20, 40, 0x00ffff, 0x003333);
    grid.position.y = -0.49;
    (grid.material as THREE.Material).opacity = 0.3;
    (grid.material as THREE.Material).transparent = true;
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

    const jointBody = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 1.2, 64), new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.3 }));
    jointBody.rotation.z = Math.PI / 2;
    jointBody.castShadow = true;
    jointGroup.add(jointBody);

    // 传感器
    const sensorGroup = new THREE.Group();
    sensorGroup.position.y = 0.35;
    jointGroup.add(sensorGroup);

    const sensorMat = new THREE.MeshStandardMaterial({ map: TextureFactory.createMetalRoughnessMap(), color: 0x2a2a2a, metalness: 0.9, roughness: 0.2 });
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.38, 0.4, 6), sensorMat);
    collar.rotation.z = Math.PI / 2;
    sensorGroup.add(collar);

    // LED
    [0x00ff00, 0x00ffff, 0xffaa00].forEach((c, i) => {
      const led = new THREE.Mesh(new THREE.SphereGeometry(0.015, 16, 16), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.9 }));
      led.position.set(0.18, 0.15 - i * 0.05, 0.14);
      sensorGroup.add(led);
    });

    // 控制台
    const consoleGroup = new THREE.Group();
    consoleGroup.position.set(0, 0.28, 0);
    consoleGroup.rotation.x = -Math.PI / 12;
    sensorGroup.add(consoleGroup);
    consoleGroup.add(new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.08, 0.25), sensorMat));

    // 屏幕
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 256;
    screenCanvasRef.current = canvas;
    const screenTex = new THREE.CanvasTexture(canvas);
    screenTexRef.current = screenTex;
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.18), new THREE.MeshBasicMaterial({ map: screenTex }));
    screen.position.set(0, 0.045, 0.01);
    screen.rotation.x = -Math.PI / 2;
    consoleGroup.add(screen);

    // 天线
    const antennaTip = new THREE.Mesh(new THREE.SphereGeometry(0.015, 16, 16), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
    antennaTip.position.set(-0.12, 0.33, 0);
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

    // 粒子
    const particleCount = 200;
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

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();
      const { currentMode, onSensorUpdate } = propsRef.current;

      let voltage = 110.5 + Math.sin(time * 0.5) * 0.3;
      let current = 428.1 + Math.sin(time * 0.3) * 2;
      let temp = 26.2 + Math.sin(time * 0.1) * 0.5;
      let pd = 0, health = 99.7;

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
          bloomPass.strength = 1.2;
          break;
        case FaultMode.XLPE_TREEING:
          electricTree.visible = true;
          particles.visible = true;
          electricTreeMat.uniforms.intensity.value = 0.6 + Math.sin(time * 8) * 0.4;
          pd = 150 + Math.sin(time * 10) * 100;
          health = 68;
          bloomPass.strength = 1.0;
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
          bloomPass.strength = 0.8;
      }

      // 更新粒子
      if (particles.visible) {
        const pos = particleGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < particleCount; i++) {
          pos[i * 3] += velocities[i].x;
          pos[i * 3 + 1] += velocities[i].y;
          pos[i * 3 + 2] += velocities[i].z;
          if (pos[i * 3 + 1] > 0.8) { pos[i * 3] = (Math.random() - 0.5) * 0.3; pos[i * 3 + 1] = 0; pos[i * 3 + 2] = (Math.random() - 0.5) * 0.3; }
        }
        particleGeo.attributes.position.needsUpdate = true;
      }

      // LED呼吸
      sensorGroup.children.forEach((c, i) => {
        if (c instanceof THREE.Mesh && c.material instanceof THREE.MeshBasicMaterial && c.geometry instanceof THREE.SphereGeometry) {
          c.material.opacity = 0.5 + Math.sin(time * 3 + i) * 0.5;
        }
      });

      // 天线闪烁
      if (antennaTip.material instanceof THREE.MeshBasicMaterial) antennaTip.material.opacity = 0.5 + Math.sin(time * 5) * 0.5;

      // 屏幕更新
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

      controls.update();
      composer.render();

      if (renderer.info.render.frame % 10 === 0) onSensorUpdate({ pd, temp, vib: 0, loss: 0, voltage, current });
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
      renderer.dispose();
      composer.dispose();
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full" />;
};

export default ThreeScene;