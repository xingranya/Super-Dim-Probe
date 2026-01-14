import React, { useEffect, useRef } from 'react';

// 1. Voltage/Current Waveform (Sine Wave Animation)
export const VoltageWaveform: React.FC<{ color: string }> = ({ color }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let offset = 0;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      
      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = color;
      
      for (let x = 0; x < w; x++) {
        const y = h / 2 + Math.sin((x + offset) * 0.05) * (h / 3);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Add a second, fainter wave for "current" or harmonic
      ctx.beginPath();
      ctx.lineWidth = 1;
      ctx.strokeStyle = color + '50'; // 50% opacity
      for (let x = 0; x < w; x++) {
        const y = h / 2 + Math.sin((x + offset * 1.5) * 0.08) * (h / 4);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      offset += 2;
      animationId = requestAnimationFrame(draw);
    };
    draw();

    return () => cancelAnimationFrame(animationId);
  }, [color]);

  return <canvas ref={canvasRef} width={300} height={60} className="w-full h-full" />;
};

// 2. Magnetic Field Visualization (Rotating Field Lines)
export const MagneticFieldViz: React.FC<{ intensity: number }> = ({ intensity }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let rotation = 0;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      ctx.clearRect(0, 0, w, h);

      // Draw concentric field lines
      for (let r = 10; r < h / 2; r += 10) {
        ctx.beginPath();
        ctx.ellipse(cx, cy, r, r * 0.6, rotation + r * 0.01, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(236, 72, 153, ${1 - r / (h / 2)})`; // Pink fading out
        ctx.stroke();
      }

      // Draw particles moving along lines
      const particleCount = 20;
      for (let i = 0; i < particleCount; i++) {
        const angle = (Date.now() * 0.002 + i * (Math.PI * 2 / particleCount)) % (Math.PI * 2);
        const r = 30 + (i % 3) * 15;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * (r * 0.6);
        
        // Rotate point around center
        const xRot = cx + (x - cx) * Math.cos(rotation) - (y - cy) * Math.sin(rotation);
        const yRot = cy + (x - cx) * Math.sin(rotation) + (y - cy) * Math.cos(rotation);

        ctx.beginPath();
        ctx.arc(xRot, yRot, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#f472b6';
        ctx.fill();
      }

      rotation += 0.01 * (intensity / 100); // Speed based on intensity
      animationId = requestAnimationFrame(draw);
    };
    draw();

    return () => cancelAnimationFrame(animationId);
  }, [intensity]);

  return <canvas ref={canvasRef} width={200} height={150} className="w-full h-full" />;
};

// 3. Vibration Waveform (Noisy Signal)
export const VibrationWaveform: React.FC<{ amplitude: number }> = ({ amplitude }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let offset = 0;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      ctx.beginPath();
      ctx.strokeStyle = '#06b6d4'; // Cyan
      ctx.lineWidth = 1.5;

      for (let x = 0; x < w; x++) {
        // Combine sine waves with random noise
        const noise = (Math.random() - 0.5) * amplitude * 5;
        const y = h / 2 + Math.sin((x + offset) * 0.1) * (amplitude * 2) + noise;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      offset += 5;
      animationId = requestAnimationFrame(draw);
    };
    draw();

    return () => cancelAnimationFrame(animationId);
  }, [amplitude]);

  return <canvas ref={canvasRef} width={300} height={60} className="w-full h-full" />;
};

// 4. Acoustic Spectrum (Bar Chart) - 平滑动画版本
export const AcousticSpectrum: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const bars = 32;
    const barWidth = canvas.width / bars;
    
    // 持久化条形高度数组和目标高度
    const heights = new Array(bars).fill(0).map(() => Math.random() * canvas.height * 0.8);
    const targets = new Array(bars).fill(0).map(() => Math.random() * canvas.height * 0.8);
    let lastTargetUpdate = 0;

    const draw = (timestamp: number) => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      
      // 每 80ms 更新一次目标高度
      if (timestamp - lastTargetUpdate > 80) {
        for (let i = 0; i < bars; i++) {
          targets[i] = Math.random() * h * 0.8;
        }
        lastTargetUpdate = timestamp;
      }

      for (let i = 0; i < bars; i++) {
        // 平滑过渡到目标高度
        heights[i] += (targets[i] - heights[i]) * 0.15;
        
        const height = heights[i];
        const x = i * barWidth;
        
        const gradient = ctx.createLinearGradient(0, h, 0, h - height);
        gradient.addColorStop(0, '#10b981'); // Emerald
        gradient.addColorStop(1, '#34d399');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, h - height, barWidth - 2, height);
      }

      animationId = requestAnimationFrame(draw);
    };
    
    animationId = requestAnimationFrame(draw);

    return () => cancelAnimationFrame(animationId);
  }, []);

  return <canvas ref={canvasRef} width={300} height={60} className="w-full h-full" />;
};

// 5. Thermal Gradient (Heatmap Line)
export const ThermalGradient: React.FC<{ temp: number }> = ({ temp }) => {
  return (
    <div className="w-full h-8 rounded-lg overflow-hidden relative bg-slate-800">
      <div 
        className="absolute inset-0 opacity-80"
        style={{
          background: `linear-gradient(90deg, #3b82f6 0%, #22c55e 40%, #eab308 70%, #ef4444 100%)`
        }}
      />
      <div 
        className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_white] transition-all duration-300"
        style={{ left: `${Math.min(100, Math.max(0, (temp / 100) * 100))}%` }}
      />
      <div className="absolute inset-0 flex justify-between px-2 items-center text-[10px] text-white/80 font-mono">
        <span>0°C</span>
        <span>50°C</span>
        <span>100°C</span>
      </div>
    </div>
  );
};
