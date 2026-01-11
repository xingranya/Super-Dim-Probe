import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
// @ts-ignore
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

interface CableCrossSection3DProps {
  temperature: number;
  load: number;
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
      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
      camera.position.set(5, 3, 5);
      camera.lookAt(0, 0, 0);
      cameraRef.current = camera;

      // Renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      containerRef.current?.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // Controls
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 2.0;

      // Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
      scene.add(ambientLight);
      const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
      dirLight.position.set(5, 10, 7);
      scene.add(dirLight);
      const pointLight = new THREE.PointLight(0x4f46e5, 2, 10);
      pointLight.position.set(0, 0, 0);
      scene.add(pointLight);

      // Cable Layers
      const group = new THREE.Group();
      layersRef.current = [];

      // Conductor
      const l1 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.6, 0.6, 5, 32),
        new THREE.MeshPhysicalMaterial({ color: '#ffdf00', metalness: 1, roughness: 0.3, name: 'Conductor' })
      );
      group.add(l1);
      layersRef.current.push(l1);

      // Insulation
      const l2 = new THREE.Mesh(
        new THREE.CylinderGeometry(1.4, 1.4, 4, 32),
        new THREE.MeshPhysicalMaterial({ 
          color: '#e2e8f0', transmission: 0.4, opacity: 0.6, transparent: true, roughness: 0.1, name: 'Insulation'
        })
      );
      l2.position.y = -0.5;
      group.add(l2);

      // Shield
      const l3 = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 1.5, 3, 32),
        new THREE.MeshStandardMaterial({ color: '#b87333', metalness: 0.8, roughness: 0.4, name: 'Shield' })
      );
      l3.position.y = -1.0;
      group.add(l3);

      // Sheath
      const l4 = new THREE.Mesh(
        new THREE.CylinderGeometry(1.8, 1.8, 2, 32),
        new THREE.MeshPhysicalMaterial({ color: '#1e293b', roughness: 0.6, metalness: 0.1, name: 'Sheath' })
      );
      l4.position.y = -1.5;
      group.add(l4);

      scene.add(group);
      
      group.rotation.z = Math.PI / 6;
      group.rotation.x = Math.PI / 6;

      // Animation Loop
      let frameId: number;
      const animate = () => {
        frameId = requestAnimationFrame(animate);
        controls.update();

        const { temperature, load } = propsRef.current;
        const scale = 1 + Math.sin(Date.now() * 0.005) * 0.01 * (load / 100);
        l1.scale.set(scale, 1, scale);

        if (temperature > 60) {
          (l1.material as THREE.MeshPhysicalMaterial).emissive.setHex(0xff0000);
          (l1.material as THREE.MeshPhysicalMaterial).emissiveIntensity = (temperature - 60) / 100;
        } else {
          (l1.material as THREE.MeshPhysicalMaterial).emissive.setHex(0x000000);
        }

        renderer.render(scene, camera);
      };
      animate();

      // Store cleanup function on the renderer instance for later access if needed, 
      // or just rely on the main cleanup.
      (renderer as any)._cleanup = () => {
        cancelAnimationFrame(frameId);
        controls.dispose();
        renderer.dispose();
      };
    };

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width >= 100 && height >= 100) {
          if (!initRef.current) {
            // 延迟初始化，确保 DOM 稳定
            if (initTimeoutRef.current) {
              clearTimeout(initTimeoutRef.current);
            }
            initTimeoutRef.current = window.setTimeout(() => {
              initScene(width, height);
            }, 100);
          } else if (rendererRef.current && cameraRef.current) {
            // Resize logic - 使用 cameraRef
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
