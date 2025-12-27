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
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const frameIdRef = useRef<number>(0);

  // Simulation State Refs
  const simState = useRef({
    treeGrowth: 0,
    jointTemp: 25,
    mechStress: 0,
    waterTreeDensity: 0
  });

  // Props Ref
  const propsRef = useRef({ currentMode, isScanning, onSensorUpdate });
  useEffect(() => {
    propsRef.current = { currentMode, isScanning, onSensorUpdate };
  }, [currentMode, isScanning, onSensorUpdate]);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    
    // 1. Setup Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020405);
    scene.fog = new THREE.FogExp2(0x020405, 0.02);
    
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(2.5, 2.8, 4.5);
    
    // 2. Setup Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap at 2x for performance
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // 3. Environment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

    // 4. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // 5. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const spotLight = new THREE.SpotLight(0xffffff, 1500);
    spotLight.position.set(5, 8, 5);
    spotLight.angle = Math.PI / 4;
    spotLight.penumbra = 0.5;
    spotLight.castShadow = true;
    spotLight.shadow.bias = -0.0001;
    spotLight.shadow.mapSize.width = 2048; 
    spotLight.shadow.mapSize.height = 2048;
    scene.add(spotLight);
    
    const faultLight = new THREE.PointLight(0x000000, 0, 5);
    faultLight.position.set(0, 0.5, 0);
    scene.add(faultLight);
    
    const rimLight = new THREE.PointLight(0x58a6ff, 200);
    rimLight.position.set(-2, 1, -2);
    scene.add(rimLight);

    // 6. Environment Objects
    const grid = new THREE.GridHelper(50, 50, 0x222222, 0x080808);
    scene.add(grid);
    
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 100), 
      new THREE.MeshStandardMaterial({color: 0x050505, roughness: 0.2, metalness: 0.5})
    );
    plane.rotation.x = -Math.PI/2; 
    plane.position.y = -0.01; 
    plane.receiveShadow = true;
    scene.add(plane);

    // 7. Assets
    const textures = {
        metal: TextureFactory.createMetalRoughnessMap(),
        copper: TextureFactory.createCopperTwistMap(),
        shield: TextureFactory.createShieldAlphaMap(),
        pvc: TextureFactory.createPVCBumpMap(),
        screen: TextureFactory.createScreenGridMap(),
        tree: TextureFactory.createTreeMap(),
        waterTree: TextureFactory.createWaterTreeMap(),
    };

    // 8. Cable Construction (High Poly)
    const cableGroup = new THREE.Group(); scene.add(cableGroup);
    const cablePath = new THREE.CatmullRomCurve3([new THREE.Vector3(-4, 0.2, 0), new THREE.Vector3(-1.5, 0.2, 0.5), new THREE.Vector3(1.5, 0.2, -0.5), new THREE.Vector3(4, 0.2, 0)]);
    
    // Increased sampling for smoother curve
    const segments = 400; 
    const radialSegments = 48;
    const frames = cablePath.computeFrenetFrames(segments, false);
    
    // Jacket
    const jacket = new THREE.Mesh(
      new THREE.TubeGeometry(cablePath, segments, 0.25, radialSegments, false), 
      new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8, bumpMap: textures.pvc, bumpScale: 0.02, metalness: 0.1, transparent: true, opacity: 0.95 })
    );
    jacket.castShadow = true; jacket.receiveShadow = true; cableGroup.add(jacket);
    
    // Shield
    const shield = new THREE.Mesh(
      new THREE.TubeGeometry(cablePath, segments, 0.22, radialSegments, false), 
      new THREE.MeshStandardMaterial({ color: 0xaaaaaa, alphaMap: textures.shield, alphaTest: 0.3, transparent: true, side: THREE.DoubleSide, metalness: 0.9 })
    );
    textures.shield.repeat.set(50, 2); cableGroup.add(shield);
    
    // Cores
    const insulationMeshes: THREE.Mesh[] = [];
    const phases = [0, 2.09, 4.18]; const phaseColors = [0xff0000, 0xffff00, 0x0044ff];
    phases.forEach((p, idx) => {
        const pts = [];
        for(let i=0; i<=segments; i++) {
            const u = i/segments; const pos = cablePath.getPointAt(u); const N = frames.normals[i]; const B = frames.binormals[i];
            const angle = p + u * Math.PI * 10;
            const vx = (N.x*Math.cos(angle)+B.x*Math.sin(angle))*0.1;
            const vy = (N.y*Math.cos(angle)+B.y*Math.sin(angle))*0.1;
            const vz = (N.z*Math.cos(angle)+B.z*Math.sin(angle))*0.1;
            pos.add(new THREE.Vector3(vx,vy,vz)); pts.push(pos);
        }
        const subPath = new THREE.CatmullRomCurve3(pts);
        const m = new THREE.MeshPhysicalMaterial({ color: phaseColors[idx], transmission: 0.4, opacity: 0.9, transparent: true, roughness: 0.2, metalness: 0, thickness: 0.5 });
        const tube = new THREE.Mesh(new THREE.TubeGeometry(subPath, segments, 0.06, 16, false), m);
        cableGroup.add(tube); insulationMeshes.push(tube);
        
        const coreMat = new THREE.MeshStandardMaterial({ map: textures.copper, color: 0xffffff, metalness: 0.9, roughness: 0.4 });
        if(coreMat.map) {
            coreMat.map.repeat.set(1, 40); coreMat.map.wrapS = THREE.ClampToEdgeWrapping; coreMat.map.wrapT = THREE.RepeatWrapping;
        }
        cableGroup.add(new THREE.Mesh(new THREE.TubeGeometry(subPath, segments, 0.025, 12, false), coreMat));
    });

    // 9. Probe Construction (Detailed)
    const probeGroup = new THREE.Group(); scene.add(probeGroup);
    
    // Main Body
    const bodyMat = new THREE.MeshStandardMaterial({color:0x2c2c2c, roughness:0.4, metalness:0.8, map: textures.metal});
    const bodyGeo = new THREE.BoxGeometry(0.3, 0.35, 0.75);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.8; body.castShadow = true; probeGroup.add(body);
    
    // Detail: Screws on body corners
    const screwGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.02, 6);
    const screwMat = new THREE.MeshStandardMaterial({color: 0x888888, metalness: 1.0, roughness: 0.3});
    const screwPositions = [
      [0.13, 0.15, 0.35], [-0.13, 0.15, 0.35], [0.13, -0.15, 0.35], [-0.13, -0.15, 0.35], // Front face
      [0.13, 0.15, -0.35], [-0.13, 0.15, -0.35], [0.13, -0.15, -0.35], [-0.13, -0.15, -0.35] // Back face
    ];
    screwPositions.forEach(pos => {
      const screw = new THREE.Mesh(screwGeo, screwMat);
      screw.rotation.x = Math.PI / 2;
      screw.position.set(pos[0], pos[1] + 0.8, pos[2]);
      probeGroup.add(screw);
    });

    // Detail: Side Vents (Cooling fins)
    const ventGeo = new THREE.BoxGeometry(0.01, 0.02, 0.4);
    const ventMat = new THREE.MeshStandardMaterial({color: 0x111111, roughness: 0.8});
    for(let i=0; i<3; i++) {
       // Left side
       const vL = new THREE.Mesh(ventGeo, ventMat);
       vL.position.set(-0.152, 0.8 + (i-1)*0.06, 0);
       probeGroup.add(vL);
       // Right side
       const vR = new THREE.Mesh(ventGeo, ventMat);
       vR.position.set(0.152, 0.8 + (i-1)*0.06, 0);
       probeGroup.add(vR);
    }

    // Grip
    const gripGroup = new THREE.Group();
    gripGroup.position.set(0, 0.55, 0.1);
    gripGroup.rotation.x = Math.PI / 10;
    probeGroup.add(gripGroup);
    
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.55, 32), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9, bumpMap: textures.pvc, bumpScale: 0.05 }));
    gripGroup.add(grip);
    
    // Grip Ribs (Anti-slip)
    for(let i=-3; i<=3; i++) {
        if(Math.abs(i) < 2) continue; // Skip middle for trigger finger
        const rib = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.005, 8, 32), new THREE.MeshStandardMaterial({color: 0x000000, roughness: 1}));
        rib.rotation.x = Math.PI/2;
        rib.position.y = i * 0.06;
        gripGroup.add(rib);
    }

    const trigger = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.08), new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8, metalness: 0.5 }));
    trigger.position.set(0, 0.15, -0.12);
    gripGroup.add(trigger);

    // Screen Assembly
    const screenHolder = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.05), new THREE.MeshStandardMaterial({color:0x2c2c2c, roughness:0.4, metalness:0.8}));
    screenHolder.position.set(0, 0.98, 0.35);
    screenHolder.rotation.x = -Math.PI / 3.5;
    probeGroup.add(screenHolder);
    
    // Rubber Bumper around screen
    const bumper = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.04), new THREE.MeshStandardMaterial({color:0x111111, roughness: 0.9}));
    bumper.position.z = -0.01;
    screenHolder.add(bumper);

    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.24), new THREE.MeshBasicMaterial({ map: textures.screen, color: 0x00ff00 }));
    screen.position.z = 0.03;
    screenHolder.add(screen);

    // Detailed Sensor Head (Honeycomb Array)
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.8, -0.38);
    probeGroup.add(headGroup);
    
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.1, 48), new THREE.MeshStandardMaterial({color:0x2c2c2c, roughness:0.4, metalness:0.8}));
    base.rotation.x = Math.PI/2; headGroup.add(base);
    
    // Sensor Emitters (Honeycomb)
    const emitterGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.02, 16);
    const emitterMat = new THREE.MeshStandardMaterial({color: 0x888888, metalness: 0.5, roughness: 0.2});
    const emitterPositions = [
        [0,0], [0.06, 0], [-0.06, 0], [0.03, 0.05], [-0.03, 0.05], [0.03, -0.05], [-0.03, -0.05]
    ];
    emitterPositions.forEach(pos => {
        const em = new THREE.Mesh(emitterGeo, emitterMat);
        em.rotation.x = Math.PI/2;
        em.position.set(pos[0], pos[1], -0.05);
        headGroup.add(em);
    });

    const coil = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.02, 16, 64), new THREE.MeshStandardMaterial({color:0xcc5500, metalness: 0.8}));
    headGroup.add(coil);
    
    // IR Lens
    const lensHousing = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), new THREE.MeshStandardMaterial({color:0x2c2c2c, roughness:0.4, metalness:0.8}));
    lensHousing.position.set(0, -0.25, 0); headGroup.add(lensHousing);
    const lens = new THREE.Mesh(new THREE.SphereGeometry(0.04, 32, 32), new THREE.MeshPhysicalMaterial({ color: 0x220000, transmission: 0.9, opacity: 1, roughness: 0, metalness: 0.5 }));
    lens.position.set(0, -0.25, -0.05); headGroup.add(lens);

    // Scan Cone
    const coneGeo = new THREE.ConeGeometry(0.4, 1.2, 64, 1, true); coneGeo.translate(0, -0.6, 0);
    const coneMat = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
    const scanCone = new THREE.Mesh(coneGeo, coneMat); scanCone.position.set(0, 0.8, -0.4); scanCone.rotation.x = -Math.PI/2; probeGroup.add(scanCone);

    // 10. Faults
    const pdGroup = new THREE.Group(); pdGroup.position.copy(cablePath.getPointAt(0.3));
    const treePlane = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.3), new THREE.MeshBasicMaterial({ map: textures.tree, transparent: true, opacity: 0, color: 0x00ffff, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
    treePlane.rotation.y = Math.PI/2; pdGroup.add(treePlane); pdGroup.add(treePlane.clone().rotateX(Math.PI/2)); scene.add(pdGroup);
    
    const mechGroup = new THREE.Group(); mechGroup.position.copy(cablePath.getPointAt(0.7));
    const scar = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.2, 32, 1, true), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1.0, metalness: 0.0, transparent: true, opacity: 0 }));
    scar.rotation.z = Math.PI/2; scar.scale.set(1, 0.8, 1); mechGroup.add(scar); scene.add(mechGroup);
    const fiberPulse = new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 16), new THREE.MeshBasicMaterial({color:0x00ff00})); scene.add(fiberPulse); fiberPulse.visible = false;
    
    // Joint with Bolts
    const jointGroup = new THREE.Group(); jointGroup.position.copy(cablePath.getPointAt(0.5)); jointGroup.lookAt(jointGroup.position.clone().add(cablePath.getTangentAt(0.5)));
    const jBody = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.6, 32), new THREE.MeshStandardMaterial({color:0x333333})); jBody.rotation.x = Math.PI/2; jointGroup.add(jBody);
    
    // Flanges
    const flangeGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.05, 32);
    const flangeMat = new THREE.MeshStandardMaterial({color:0x555555, metalness:0.8, roughness: 0.5});
    const f1 = new THREE.Mesh(flangeGeo, flangeMat); f1.rotation.x = Math.PI/2; f1.position.z = 0.28; jointGroup.add(f1);
    const f2 = new THREE.Mesh(flangeGeo, flangeMat); f2.rotation.x = Math.PI/2; f2.position.z = -0.28; jointGroup.add(f2);
    
    // Bolts
    const boltGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.03, 6);
    const boltMat = new THREE.MeshStandardMaterial({color: 0x999999, metalness: 1.0});
    for(let i=0; i<8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const bx = Math.cos(angle) * 0.31;
        const by = Math.sin(angle) * 0.31;
        
        const b1 = new THREE.Mesh(boltGeo, boltMat); b1.rotation.x = Math.PI/2; b1.position.set(bx, by, 0.31); jointGroup.add(b1);
        const b2 = new THREE.Mesh(boltGeo, boltMat); b2.rotation.x = Math.PI/2; b2.position.set(bx, by, -0.31); jointGroup.add(b2);
    }
    scene.add(jointGroup);

    // 11. Animation Loop
    const clock = new THREE.Clock();
    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);
      const dt = clock.getDelta();
      const time = clock.getElapsedTime();
      
      const { currentMode, isScanning, onSensorUpdate } = propsRef.current;
      const targetPos = MODES.find(m => m.id === currentMode)?.targetPos ?? -1;
      const colorHex = MODES.find(m => m.id === currentMode)?.color ?? "#ffffff";

      // Probe Movement
      let t = (Math.sin(time * 0.5) + 1) / 2; 
      if (!isScanning) t = 0.5;
      const pos = cablePath.getPointAt(t);
      const tan = cablePath.getTangentAt(t);
      probeGroup.position.lerp(new THREE.Vector3(pos.x, pos.y + 0.55, pos.z), 0.1);
      probeGroup.lookAt(pos.clone().add(tan));

      // Scan Cone
      scanCone.material.opacity = (Math.sin(time * 8) + 1) / 2 * 0.2;
      scanCone.material.color.set(colorHex);

      // Physics Simulation
      const dist = Math.abs(t - targetPos);
      let pdVal = 10 + Math.random() * 5;
      let tempVal = 25 + Math.random() * 0.5;
      let vibVal = 0.02 + Math.random() * 0.01;
      let lossVal = 0.05;

      // Mode: XLPE Treeing
      if (currentMode === FaultMode.XLPE_TREEING) {
        if (dist < 0.05) {
            simState.current.treeGrowth = Math.min(1, simState.current.treeGrowth + dt * 0.5);
            treePlane.material.opacity = simState.current.treeGrowth * (0.5 + Math.random() * 0.5);
            treePlane.scale.setScalar(0.5 + simState.current.treeGrowth * 0.5);
            pdVal = 200 + simState.current.treeGrowth * 1500 + Math.random() * 300;
            faultLight.color.setHex(0x00ffff);
            faultLight.intensity = simState.current.treeGrowth * 800 * Math.random(); 
        } else {
            treePlane.material.opacity = 0;
            faultLight.intensity = 0;
        }
      } else {
          treePlane.material.opacity = 0;
          simState.current.treeGrowth = 0;
      }

      // Mode: PVC Damage
      if (currentMode === FaultMode.PVC_DAMAGE) {
          if (dist < 0.05) {
            simState.current.mechStress = Math.min(1, simState.current.mechStress + dt * 1.0);
            scar.material.opacity = simState.current.mechStress * 0.9;
            vibVal = 0.5 + simState.current.mechStress * 2.5 + Math.random() * 0.5;
            fiberPulse.visible = true;
            fiberPulse.position.copy(cablePath.getPointAt(0.6 + (time * 2) % 1 * 0.2));
          } else {
            scar.material.opacity = 0;
            fiberPulse.visible = false;
          }
      } else {
          scar.material.opacity = 0;
          fiberPulse.visible = false;
          simState.current.mechStress = 0;
      }

      // Mode: Overheat
      if (currentMode === FaultMode.JOINT_OVERHEAT) {
          if (dist < 0.05) {
              const T_max = 120;
              simState.current.jointTemp = simState.current.jointTemp + (T_max - simState.current.jointTemp) * dt * 0.8;
              tempVal = simState.current.jointTemp;
              if (tempVal > 80) {
                  const ratio = (tempVal - 80) / 40;
                  jBody.material.emissive.setHSL(0.05, 1, ratio * 0.6);
                  faultLight.color.setHex(0xffaa00);
                  faultLight.intensity = ratio * 500; 
              } else {
                  jBody.material.emissive.setHex(0);
                  faultLight.intensity = 0;
              }
          } else {
              jBody.material.emissive.setHex(0);
              if (currentMode === FaultMode.JOINT_OVERHEAT) faultLight.intensity = 0;
          }
      } else {
          jBody.material.emissive.setHex(0);
          simState.current.jointTemp = 25;
      }

      // Mode: Water Tree
      if (currentMode === FaultMode.WATER_TREEING) {
          simState.current.waterTreeDensity = 0.5 + Math.sin(time) * 0.1;
          lossVal = 0.5 + simState.current.waterTreeDensity * 2.0;
          insulationMeshes.forEach(m => {
              const mat = m.material as THREE.MeshPhysicalMaterial;
              mat.map = textures.waterTree;
              mat.color.setHex(0xaaaaaa);
              mat.transmission = 0.2;
              mat.opacity = 0.8 + simState.current.waterTreeDensity * 0.2;
          });
          jacket.material.color.setHex(0x222244);
      } else {
          simState.current.waterTreeDensity = 0;
          jacket.material.color.setHex(0x111111);
          insulationMeshes.forEach((m, i) => {
              const mat = m.material as THREE.MeshPhysicalMaterial;
              mat.map = null;
              mat.color.setHex(phaseColors[i]);
              mat.transmission = 0.4;
              mat.opacity = 0.9;
          });
      }

      if(currentMode !== FaultMode.XLPE_TREEING && currentMode !== FaultMode.JOINT_OVERHEAT) {
          faultLight.intensity = 0;
      }

      controls.update();
      renderer.render(scene, camera);

      if (renderer.info.render.frame % 5 === 0) {
        onSensorUpdate({ pd: pdVal, temp: tempVal, vib: vibVal, loss: lossVal });
      }
    };
    
    animate();

    const handleResize = () => {
        if (!containerRef.current) return;
        const w = containerRef.current.clientWidth;
        const h = containerRef.current.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(frameIdRef.current);
        renderer.dispose();
        pmremGenerator.dispose();
        if (containerRef.current) containerRef.current.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full block" />;
};

export default ThreeScene;