import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment';
import { FaultMode, SensorData, MODES } from '../types';
import * as TextureFactory from '../utils/textureFactory';

interface ThreeSceneProps {
  currentMode: FaultMode;
  isScanning: boolean;
  onSensorUpdate: (data: SensorData) => void;
}

const ThreeScene: React.FC<ThreeSceneProps> = ({ currentMode, isScanning, onSensorUpdate }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sensorGroupRef = useRef<THREE.Group | null>(null);
  const screenTexRef = useRef<THREE.CanvasTexture | null>(null);
  const screenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const propsRef = useRef({ currentMode, isScanning, onSensorUpdate });
  useEffect(() => { propsRef.current = { currentMode, isScanning, onSensorUpdate }; }, [currentMode, isScanning, onSensorUpdate]);

  useEffect(() => {
    if (!containerRef.current) return;

    // --- SCENE SETUP ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05070a);
    const camera = new THREE.PerspectiveCamera(35, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 100);
    camera.position.set(1.8, 1.5, 2.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // --- LIGHTING ---
    const topLight = new THREE.SpotLight(0xffffff, 100);
    topLight.position.set(0, 5, 0);
    topLight.castShadow = true;
    scene.add(topLight);
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));

    // --- REALISTIC CABLE & JOINT ---
    const cablePath = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-10, 0, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(10, 0, 0)
    ]);

    // 1. Core Cable Jacket
    const jacketMat = new THREE.MeshStandardMaterial({ 
      color: 0x111111, roughness: 0.8, map: TextureFactory.createJacketTexture() 
    });
    jacketMat.map!.repeat.set(20, 1);
    const mainCable = new THREE.Mesh(new THREE.TubeGeometry(cablePath, 128, 0.18, 32, false), jacketMat);
    scene.add(mainCable);

    // 2. The Joint (Connection area - slightly thicker)
    const jointGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.8, 48);
    const jointMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.4, metalness: 0.1 });
    const joint = new THREE.Mesh(jointGeo, jointMat);
    joint.rotation.z = Math.PI / 2;
    scene.add(joint);

    // --- ADVANCED SENSOR (JOINT SENTRY V6) ---
    const sensorGroup = new THREE.Group();
    scene.add(sensorGroup);
    sensorGroupRef.current = sensorGroup;

    const frameMat = new THREE.MeshStandardMaterial({ 
      color: 0x2a2a2a, metalness: 0.9, roughness: 0.2, map: TextureFactory.createMetalRoughnessMap() 
    });

    // Main Collar Body (Hexagonal Industrial Shape)
    const collarGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.5, 6, 1, false);
    const collar = new THREE.Mesh(collarGeo, frameMat);
    collar.rotation.z = Math.PI/2;
    sensorGroup.add(collar);

    // Transparent Inspect Window
    const glassMat = new THREE.MeshPhysicalMaterial({ transmission: 0.95, opacity: 0.2, transparent: true, thickness: 0.05 });
    const windowMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.385, 0.385, 0.12, 32, 1, true), glassMat);
    windowMesh.rotation.z = Math.PI/2;
    sensorGroup.add(windowMesh);

    // Ergonomic Display Console (Tilted)
    const consoleGroup = new THREE.Group();
    consoleGroup.position.set(0, 0.35, 0);
    consoleGroup.rotation.x = -Math.PI / 12; // 15-degree tilt
    sensorGroup.add(consoleGroup);

    const consoleBase = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.12, 0.3), frameMat);
    consoleGroup.add(consoleBase);

    // Curved Screen Integration
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 256;
    screenCanvasRef.current = canvas;
    const screenTex = new THREE.CanvasTexture(canvas);
    screenTexRef.current = screenTex;

    const screenMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.3, 0.2), 
      new THREE.MeshBasicMaterial({ map: screenTex })
    );
    screenMesh.position.set(0, 0.065, 0.02);
    screenMesh.rotation.x = -Math.PI / 2;
    consoleGroup.add(screenMesh);

    // Physical Buttons
    const btnGeo = new THREE.BoxGeometry(0.04, 0.01, 0.02);
    const btnMat = new THREE.MeshStandardMaterial({ color: 0x444444, emissive: 0x00ffff, emissiveIntensity: 0.5 });
    for(let i=-1; i<=1; i++) {
        const btn = new THREE.Mesh(btnGeo, btnMat);
        btn.position.set(i*0.06, 0.065, 0.12);
        btn.rotation.x = -Math.PI/2;
        consoleGroup.add(btn);
    }

    // Cooling Fins (Sides)
    const finGeo = new THREE.BoxGeometry(0.4, 0.01, 0.15);
    for(let i=0; i<5; i++) {
        const finL = new THREE.Mesh(finGeo, frameMat);
        finL.position.set(0, (i-2)*0.03, -0.32);
        sensorGroup.add(finL);
        const finR = new THREE.Mesh(finGeo, frameMat);
        finR.position.set(0, (i-2)*0.03, 0.32);
        sensorGroup.add(finR);
    }

    // Heavy Duty Locking Bolts
    const boltGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.04, 6);
    const boltMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 1 });
    const boltPos = [[0.18, 0.32], [0.18, -0.32], [-0.18, 0.32], [-0.18, -0.32]];
    boltPos.forEach(p => {
        const b = new THREE.Mesh(boltGeo, boltMat);
        b.position.set(p[0], 0, p[1]);
        sensorGroup.add(b);
    });

    // --- FAULT VISUALS ---
    const thermalGlow = new THREE.PointLight(0xff3300, 0, 1.0);
    thermalGlow.position.set(0,0,0);
    scene.add(thermalGlow);

    const treeMat = new THREE.MeshBasicMaterial({ 
      map: TextureFactory.createTreeMap(), transparent: true, opacity: 0, blending: THREE.AdditiveBlending 
    });
    const tree = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.4), treeMat);
    tree.rotation.y = Math.PI/2;
    scene.add(tree);

    // --- ANIMATION ---
    const clock = new THREE.Clock();
    const animate = () => {
      requestAnimationFrame(animate);
      const time = clock.getElapsedTime();
      const { currentMode, onSensorUpdate } = propsRef.current;

      // Logic for telemetry
      let v = 110.5 + Math.random()*0.2;
      let a = 428.1 + Math.random()*1.5;
      let t = 26.2 + Math.random()*0.4;
      let health = 99.7;

      if (currentMode === FaultMode.JOINT_OVERHEAT) {
          t = 75 + Math.sin(time)*20;
          thermalGlow.intensity = (t-30)/15;
          health = 45;
      } else { thermalGlow.intensity = 0; }

      if (currentMode === FaultMode.XLPE_TREEING) {
          tree.material.opacity = 0.4 + Math.sin(time*12)*0.4;
          health = 68;
      } else { tree.material.opacity = 0; }

      // Update Screen
      const ctx = screenCanvasRef.current?.getContext('2d');
      if (ctx && screenTexRef.current) {
        ctx.fillStyle = '#010810'; ctx.fillRect(0,0,512,256);
        ctx.strokeStyle = '#00f3ff'; ctx.lineWidth = 6; ctx.strokeRect(10,10,492,236);
        
        ctx.fillStyle = '#00f3ff';
        ctx.font = 'bold 36px JetBrains Mono';
        ctx.fillText('JOINT SENTRY V6.1', 40, 70);
        
        ctx.font = '28px JetBrains Mono';
        ctx.fillText(`TEMP: ${t.toFixed(1)}°C`, 40, 125);
        ctx.fillText(`LOAD: ${a.toFixed(1)}A`, 40, 175);
        
        const color = health > 90 ? '#00ff00' : (health > 50 ? '#ffcc00' : '#ff3300');
        ctx.fillStyle = color;
        ctx.fillText(`HEALTH: ${health.toFixed(1)}%`, 40, 225);
        
        // Dynamic scan line
        ctx.strokeStyle = '#00f3ff44';
        const scanY = (time * 100) % 230 + 15;
        ctx.beginPath(); ctx.moveTo(20, scanY); ctx.lineTo(492, scanY); ctx.stroke();
        
        screenTexRef.current.needsUpdate = true;
      }

      controls.update();
      renderer.render(scene, camera);
      
      if (renderer.info.render.frame % 10 === 0) {
        onSensorUpdate({ pd: 0, temp: t, vib: 0, loss: 0, voltage: v, current: a });
      }
    };
    animate();

    const handleResize = () => {
      camera.aspect = containerRef.current!.clientWidth / containerRef.current!.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current!.clientWidth, containerRef.current!.clientHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full" />;
};

export default ThreeScene;