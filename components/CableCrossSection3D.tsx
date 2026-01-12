import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
// @ts-ignore
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
// @ts-ignore
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment';
// @ts-ignore
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib';

interface CableCrossSection3DProps {
  temperature: number;
  load: number;
}

// 纹理生成器：生成编织纹理的法线贴图
const generateBraidedNormalMap = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // 填充背景 (平坦法线)
  ctx.fillStyle = '#8080ff';
  ctx.fillRect(0, 0, 512, 512);

  // 绘制编织图案
  for (let y = 0; y < 512; y += 32) {
    for (let x = 0; x < 512; x += 32) {
      const isOdd = (y / 32) % 2 === 0;
      const xOffset = isOdd ? 0 : 16;
      
      // 模拟凸起
      const gradient = ctx.createLinearGradient(x + xOffset, y, x + xOffset + 32, y + 32);
      gradient.addColorStop(0, '#a0a0ff');
      gradient.addColorStop(0.5, '#ffffff');
      gradient.addColorStop(1, '#6060ff');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(x + xOffset, y);
      ctx.lineTo(x + xOffset + 32, y + 16);
      ctx.lineTo(x + xOffset, y + 32);
      ctx.lineTo(x + xOffset - 32, y + 16);
      ctx.fill();
    }
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
};

// 噪点纹理生成器
const generateNoiseMap = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  
  const imgData = ctx.createImageData(256, 256);
  for (let i = 0; i < imgData.data.length; i += 4) {
    const val = 100 + Math.random() * 50;
    imgData.data[i] = val;
    imgData.data[i+1] = val;
    imgData.data[i+2] = val;
    imgData.data[i+3] = 255;
  }
  ctx.putImageData(imgData, 0, 0);
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(5, 2);
  return texture;
}

const CableCrossSection3D: React.FC<CableCrossSection3DProps> = ({ temperature, load }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const layersRef = useRef<THREE.Mesh[]>([]);
  const initRef = useRef(false); // 防止 StrictMode 双重初始化
  const initTimeoutRef = useRef<number | null>(null);

  // Use a ref to store latest props for the animation loop to access
  const propsRef = useRef({ temperature, load });
  useEffect(() => {
    propsRef.current = { temperature, load };
  }, [temperature, load]);

  // Init Scene with ResizeObserver and delayed initialization
  useEffect(() => {
    if (!containerRef.current) return;

    const initScene = (width: number, height: number) => {
      if (initRef.current || rendererRef.current) return;
      // 确保尺寸有效
      if (width < 100 || height < 100) return;
      
      initRef.current = true;

      // 清理容器
      while (containerRef.current?.firstChild) {
        containerRef.current.removeChild(containerRef.current.firstChild);
      }

      // Scene
      const scene = new THREE.Scene();
      scene.background = null;
      sceneRef.current = scene;

      // Camera
      const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
      camera.position.set(8, 5, 8); // 调整视角，更具透视感
      camera.lookAt(0, 0, 0);
      cameraRef.current = camera;

      // Renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, logarithmicDepthBuffer: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping; // 电影级色调映射
      renderer.toneMappingExposure = 1.2;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      containerRef.current?.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // Environment (IBL) - 关键：使用环境光照亮金属材质
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      pmremGenerator.compileEquirectangularShader();
      const roomEnvironment = new RoomEnvironment();
      scene.environment = pmremGenerator.fromScene(roomEnvironment).texture;
      // scene.background = scene.environment; // Optional: show environment background

      // Controls
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 1.0; // 减慢旋转速度，便于观察细节
      controls.minDistance = 2;
      controls.maxDistance = 20;

      // Lighting (辅助光)
      // 主光 - 暖色调模拟室内光
      const spotLight = new THREE.SpotLight(0xfff0dd, 5);
      spotLight.position.set(5, 8, 5);
      spotLight.angle = Math.PI / 4;
      spotLight.penumbra = 0.5;
      spotLight.castShadow = true;
      spotLight.shadow.bias = -0.0001;
      scene.add(spotLight);

      // 补光 - 冷色调
      const fillLight = new THREE.PointLight(0xddeeff, 2);
      fillLight.position.set(-5, 3, -5);
      scene.add(fillLight);

      // 轮廓光 - 突出边缘
      const rimLight = new THREE.SpotLight(0x4f46e5, 5);
      rimLight.position.set(-5, 5, 5);
      rimLight.lookAt(0, 0, 0);
      scene.add(rimLight);

      // === Cable Construction ===
      const group = new THREE.Group();
      layersRef.current = [];

      // 1. Conductor (多股绞合铜线)
      const conductorGroup = new THREE.Group();
      const copperMaterial = new THREE.MeshPhysicalMaterial({
        color: '#ffb347', // 更真实的铜色
        metalness: 1.0,
        roughness: 0.25,
        clearcoat: 0.5,
        clearcoatRoughness: 0.1,
        emissive: '#ff5500',
        emissiveIntensity: 0,
        name: 'Copper'
      });

      // 中心股
      const strandGeo = new THREE.CylinderGeometry(0.18, 0.18, 5.5, 16);
      const centerStrand = new THREE.Mesh(strandGeo, copperMaterial);
      centerStrand.castShadow = true;
      conductorGroup.add(centerStrand);

      // 外围 6 股螺旋
      const strandCount = 6;
      const strandRadius = 0.36; // 0.18 * 2
      for (let i = 0; i < strandCount; i++) {
        const angle = (i / strandCount) * Math.PI * 2;
        // 使用 TubeGeometry 模拟螺旋
        const path = new THREE.CatmullRomCurve3([
          new THREE.Vector3(Math.cos(angle) * strandRadius, -2.75, Math.sin(angle) * strandRadius),
          new THREE.Vector3(Math.cos(angle + Math.PI) * strandRadius, 0, Math.sin(angle + Math.PI) * strandRadius),
          new THREE.Vector3(Math.cos(angle + Math.PI * 2) * strandRadius, 2.75, Math.sin(angle + Math.PI * 2) * strandRadius),
        ]);
        const tubeGeo = new THREE.TubeGeometry(path, 64, 0.18, 12, false);
        const strand = new THREE.Mesh(tubeGeo, copperMaterial);
        strand.castShadow = true;
        conductorGroup.add(strand);
      }
      group.add(conductorGroup);
      // @ts-ignore
      layersRef.current.push(conductorGroup); // 将整个组作为导体层引用

      // 2. Inner Semi-conductive Layer (内半导电层 - 黑色光滑)
      const innerSemiGeo = new THREE.CylinderGeometry(0.65, 0.65, 5.2, 64);
      const innerSemiMat = new THREE.MeshStandardMaterial({
        color: '#111111',
        roughness: 0.4,
        metalness: 0.1
      });
      const innerSemi = new THREE.Mesh(innerSemiGeo, innerSemiMat);
      innerSemi.position.y = -0.15; // 稍微偏移，露出导体
      innerSemi.castShadow = true;
      group.add(innerSemi);

      // 3. Insulation (XLPE - 绝缘层 - 半透明乳白色)
      const insulationGeo = new THREE.CylinderGeometry(1.4, 1.4, 4.5, 64);
      const insulationMat = new THREE.MeshPhysicalMaterial({ 
        color: '#ffffff', 
        transmission: 0.6, // 透光
        opacity: 0.8, 
        transparent: true, 
        roughness: 0.15, 
        ior: 1.5, // 折射率
        thickness: 1.0, // 模拟厚度
        clearcoat: 0.8,
        side: THREE.DoubleSide
      });
      const insulation = new THREE.Mesh(insulationGeo, insulationMat);
      insulation.position.y = -0.5;
      insulation.castShadow = true;
      insulation.receiveShadow = true;
      group.add(insulation);

      // 4. Outer Semi-conductive Layer (外半导电层)
      const outerSemiGeo = new THREE.CylinderGeometry(1.45, 1.45, 4.0, 64);
      const outerSemi = new THREE.Mesh(outerSemiGeo, innerSemiMat); // 复用材质
      outerSemi.position.y = -0.75;
      group.add(outerSemi);

      // 5. Shield (屏蔽层 - 铜带编织)
      const shieldGeo = new THREE.CylinderGeometry(1.55, 1.55, 3.5, 64);
      const shieldNormalMap = generateBraidedNormalMap();
      const shieldMat = new THREE.MeshStandardMaterial({ 
        color: '#b87333', 
        metalness: 0.9, 
        roughness: 0.5,
        normalMap: shieldNormalMap,
        normalScale: new THREE.Vector2(1, 1)
      });
      const shield = new THREE.Mesh(shieldGeo, shieldMat);
      shield.position.y = -1.0;
      shield.castShadow = true;
      group.add(shield);

      // 6. Armor (铠装层 - 钢带 - 可选，增加工业感)
      const armorGeo = new THREE.CylinderGeometry(1.7, 1.7, 3.0, 64);
      const armorMat = new THREE.MeshStandardMaterial({
        color: '#777777',
        metalness: 0.8,
        roughness: 0.3,
        bumpMap: generateNoiseMap(), // 粗糙表面
        bumpScale: 0.02
      });
      const armor = new THREE.Mesh(armorGeo, armorMat);
      armor.position.y = -1.25;
      armor.receiveShadow = true;
      group.add(armor);

      // 7. Sheath (外护套 - PVC - 哑光黑/红)
      const sheathGeo = new THREE.CylinderGeometry(1.85, 1.85, 2.0, 64);
      const sheathMat = new THREE.MeshPhysicalMaterial({ 
        color: '#1e293b', 
        roughness: 0.7, 
        metalness: 0.1,
        clearcoat: 0.2,
        clearcoatRoughness: 0.4,
        bumpMap: generateNoiseMap(), // 磨砂质感
        bumpScale: 0.05
      });
      const sheath = new THREE.Mesh(sheathGeo, sheathMat);
      sheath.position.y = -1.75;
      sheath.castShadow = true;
      sheath.receiveShadow = true;
      group.add(sheath);

      scene.add(group);
      
      // 整体倾斜展示
      group.rotation.z = Math.PI / 4;
      group.rotation.x = Math.PI / 8;

      // Animation Loop
      let frameId: number;
      const animate = () => {
        frameId = requestAnimationFrame(animate);
        controls.update();

        const { temperature, load } = propsRef.current;
        
        // 负载影响：微弱的“呼吸”效果模拟热胀冷缩/振动
        const pulse = 1 + Math.sin(Date.now() * 0.002) * 0.005 * (load / 100);
        conductorGroup.scale.set(pulse, 1, pulse);

        // 温度影响：导体发红 (自发光)
        if (temperature > 40) {
          // 40度开始变红，100度极红
          const intensity = Math.max(0, (temperature - 40) / 150);
          copperMaterial.emissiveIntensity = intensity;
          
          // 绝缘层稍微变浑浊/发红
          insulationMat.color.setHSL(0, 100, 100 - intensity * 20);
        } else {
          copperMaterial.emissiveIntensity = 0;
          insulationMat.color.setHex(0xffffff);
        }

        renderer.render(scene, camera);
      };
      animate();

      (renderer as any)._cleanup = () => {
        cancelAnimationFrame(frameId);
        controls.dispose();
        renderer.dispose();
        pmremGenerator.dispose();
        roomEnvironment.dispose();
        // 清理几何体和材质
        group.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            obj.geometry.dispose();
            if (Array.isArray(obj.material)) {
              obj.material.forEach((m: any) => m.dispose());
            } else {
              obj.material.dispose();
            }
          }
        });
      };
    };

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width >= 100 && height >= 100) {
          if (!initRef.current) {
            if (initTimeoutRef.current) {
              clearTimeout(initTimeoutRef.current);
            }
            initTimeoutRef.current = window.setTimeout(() => {
              initScene(width, height);
            }, 100);
          } else if (rendererRef.current && cameraRef.current) {
            const renderer = rendererRef.current;
            const camera = cameraRef.current;
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
          }
        }
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
      if (rendererRef.current) {
        if ((rendererRef.current as any)._cleanup) (rendererRef.current as any)._cleanup();
        if (containerRef.current && rendererRef.current.domElement) {
          containerRef.current.removeChild(rendererRef.current.domElement);
        }
        rendererRef.current = null;
      }
      cameraRef.current = null;
      initRef.current = false;
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full min-h-[300px]" />;
};


export default CableCrossSection3D;
