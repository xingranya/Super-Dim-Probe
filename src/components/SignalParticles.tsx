import React, { useEffect, useRef, useMemo } from 'react';

/**
 * 信号粒子流组件
 * 使用 Canvas 渲染从传感器到流程图、流程图到结果面板的动态粒子效果
 */

interface SignalParticlesProps {
  /** 当前动画进度 (0-100) */
  progress: number;
  /** 容器宽度 */
  width: number;
  /** 容器高度 */
  height: number;
  /** 左侧区域宽度比例 (0-1) */
  leftRatio?: number;
  /** 右侧区域宽度比例 (0-1) */
  rightRatio?: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  hue: number;
}

const SignalParticles: React.FC<SignalParticlesProps> = ({
  progress,
  width,
  height,
  leftRatio = 0.25,
  rightRatio = 0.25,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);

  // 计算区域边界
  const regions = useMemo(() => ({
    // 传感器区域右边缘
    sensorRight: width * leftRatio,
    // 流程图区域
    flowLeft: width * leftRatio,
    flowRight: width * (1 - rightRatio),
    // 结果面板区域左边缘
    resultLeft: width * (1 - rightRatio),
    // 中心 Y 坐标
    centerY: height / 2,
  }), [width, height, leftRatio, rightRatio]);

  // 创建粒子
  const createParticle = (sourceX: number, targetX: number, scatter: number = 30): Particle => {
    const y = regions.centerY + (Math.random() - 0.5) * scatter;
    return {
      x: sourceX,
      y,
      vx: 2 + Math.random() * 3,
      vy: (Math.random() - 0.5) * 0.5,
      life: 0,
      maxLife: Math.abs(targetX - sourceX) / 3 + Math.random() * 20,
      size: 2 + Math.random() * 3,
      hue: 180 + Math.random() * 20, // 青色范围
    };
  };

  // 动画循环
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置 Canvas 分辨率
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const animate = () => {
      // 清除画布 - 使用透明清除，不遮挡下层内容
      ctx.clearRect(0, 0, width, height);

      // 根据进度生成粒子
      // 阶段1: 传感器 → 流程图 (progress 5-40)
      if (progress >= 5 && progress <= 50) {
        if (Math.random() > 0.7) {
          particlesRef.current.push(
            createParticle(regions.sensorRight - 20, regions.flowLeft + 100, 40)
          );
        }
      }

      // 阶段2: 流程图 → 结果面板 (progress 70-90)
      if (progress >= 70 && progress <= 95) {
        if (Math.random() > 0.6) {
          particlesRef.current.push(
            createParticle(regions.flowRight - 50, regions.resultLeft + 50, 50)
          );
        }
      }

      // 更新和渲染粒子
      particlesRef.current = particlesRef.current.filter(particle => {
        // 更新位置
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life++;

        // 生命周期结束
        if (particle.life >= particle.maxLife) return false;

        // 计算透明度
        const lifeRatio = particle.life / particle.maxLife;
        const alpha = lifeRatio < 0.2 
          ? lifeRatio * 5 
          : lifeRatio > 0.8 
            ? (1 - lifeRatio) * 5 
            : 1;

        // 绘制粒子
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * (1 - lifeRatio * 0.3), 0, Math.PI * 2);
        
        // 发光效果
        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, particle.size * 2
        );
        gradient.addColorStop(0, `hsla(${particle.hue}, 100%, 70%, ${alpha})`);
        gradient.addColorStop(0.5, `hsla(${particle.hue}, 100%, 50%, ${alpha * 0.5})`);
        gradient.addColorStop(1, `hsla(${particle.hue}, 100%, 50%, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.fill();

        // 核心高亮点
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
        ctx.fill();

        return true;
      });

      // 限制粒子数量
      if (particlesRef.current.length > 100) {
        particlesRef.current = particlesRef.current.slice(-100);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [width, height, progress, regions]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 10,
      }}
    />
  );
};

export default SignalParticles;
