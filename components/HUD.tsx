import React, { useEffect, useRef } from 'react';
import { SensorData, FaultMode } from '../types';

interface HUDProps {
  data: SensorData;
  mode: FaultMode;
}

const SensorItem: React.FC<{ label: string; value: string; unit: string; active?: boolean }> = ({ label, value, unit, active }) => (
  <div className={`p-2.5 rounded-sm flex flex-col border-l-2 transition-all duration-300 ${active ? 'bg-gradient-to-r from-blue-500/10 to-transparent border-blue-400' : 'bg-black/30 border-transparent'}`}>
    <span className="text-gray-400 text-[10px] font-medium mb-1 uppercase tracking-wider">{label}</span>
    <div className="flex items-baseline">
      <span className="text-gray-100 font-bold font-mono text-sm">{value}</span>
      <span className="text-gray-500 text-[10px] ml-1">{unit}</span>
    </div>
  </div>
);

const HUD: React.FC<HUDProps> = ({ data, mode }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Spectrum visualizer loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameId = 0;
    const draw = () => {
      frameId = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const bars = 40;
      const barWidth = canvas.width / bars;
      
      ctx.fillStyle = '#58a6ff';
      ctx.globalAlpha = 0.5;
      
      for (let i = 0; i < bars; i++) {
        let h = Math.random() * 10;
        
        // Dynamic spectrum based on mode and simulated "signal"
        if (mode === FaultMode.XLPE_TREEING && data.pd > 100) {
           h = Math.random() * 40; 
        } else if (mode === FaultMode.PVC_DAMAGE) {
           const time = Date.now() / 1000;
           h = (Math.sin(i * 0.5 + time * 10) * 0.5 + 0.5) * 30 + 5;
        }

        const x = i * barWidth;
        const y = canvas.height - h;
        ctx.fillRect(x, y, barWidth - 1, h);
      }
    };
    
    draw();
    return () => cancelAnimationFrame(frameId);
  }, [mode, data.pd]); // Re-bind if mode drastically changes pattern logic

  return (
    <div className="absolute top-6 left-6 w-[380px] bg-[#0c1018]/90 border border-blue-400/20 border-l-4 border-l-blue-500 p-6 rounded-sm backdrop-blur-md shadow-2xl z-10 select-none pointer-events-none">
      <h2 className="text-white text-xl font-extrabold tracking-widest m-0 mb-1">SUPER-DIM PROBE</h2>
      <div className="flex justify-between border-b border-white/10 pb-2.5 mb-5 text-[10px] font-semibold text-gray-500 uppercase">
        <span>Engineering Simulation Unit</span>
        <span className="text-green-500">System Normal</span>
      </div>

      {/* Spectrum */}
      <div className="h-[60px] bg-black/60 border border-white/5 mb-4 relative">
        <canvas ref={canvasRef} width={330} height={60} className="w-full h-full" />
      </div>

      {/* Sensor Matrix */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <SensorItem 
          label="PD Level" 
          value={data.pd > 100 ? data.pd.toFixed(0) : '--'} 
          unit="pC" 
          active={mode === FaultMode.XLPE_TREEING} 
        />
        <SensorItem 
          label="Core Temp" 
          value={data.temp.toFixed(1)} 
          unit="°C" 
          active={mode === FaultMode.JOINT_OVERHEAT} 
        />
        <SensorItem 
          label="Vibration" 
          value={data.vib.toFixed(2)} 
          unit="g" 
          active={mode === FaultMode.PVC_DAMAGE} 
        />
        <SensorItem 
          label="Dielectric Loss" 
          value={data.loss.toFixed(2)} 
          unit="%" 
          active={mode === FaultMode.WATER_TREEING} 
        />
      </div>

      <div className="flex justify-between items-center border-t border-white/10 pt-2.5 mt-2.5">
        <span className="bg-gradient-to-br from-purple-700 to-purple-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-lg shadow-purple-500/40">
          GEMINI AI READY
        </span>
        <span className="text-[10px] text-gray-600">IEC 60270 / 60502 COMPLIANT</span>
      </div>
    </div>
  );
};

export default HUD;
