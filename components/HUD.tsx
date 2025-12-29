import React from 'react';
import { SensorData, FaultMode, MODES } from '../types';

interface HUDProps {
  data: SensorData;
  mode: FaultMode;
}

const TelemetryItem: React.FC<{ label: string; value: string; unit: string; alert?: boolean }> = ({ label, value, unit, alert }) => (
  <div className={`bg-slate-900/60 border-r-2 ${alert ? 'border-red-500 bg-red-950/20' : 'border-cyan-500'} p-4 backdrop-blur-md transition-colors duration-500`}>
    <div className="text-[10px] text-cyan-400 font-black uppercase tracking-[0.2em] mb-1">{label}</div>
    <div className="flex items-baseline gap-2">
      <span className="text-3xl font-mono font-bold text-white tabular-nums tracking-tighter">{value}</span>
      <span className="text-xs text-slate-500 font-bold">{unit}</span>
    </div>
  </div>
);

const HUD: React.FC<HUDProps> = ({ data, mode }) => {
  const currentMode = MODES.find(m => m.id === mode);
  const isAlert = data.temp > 80 || (mode === FaultMode.XLPE_TREEING);

  return (
    <div className="absolute inset-0 pointer-events-none p-10 flex flex-col justify-between z-10">
      {/* Upper Dashboard */}
      <div className="flex justify-between items-start">
        <div className="bg-black/80 p-6 border-l-4 border-cyan-500 backdrop-blur-xl">
          <div className="flex items-center gap-4 mb-2">
            <div className={`w-3 h-3 rounded-full ${isAlert ? 'bg-red-500 animate-ping' : 'bg-cyan-500'}`} />
            <h1 className="text-white text-3xl font-black tracking-tighter uppercase leading-none">Node-09 Joint Sentry</h1>
          </div>
          <div className="text-[10px] text-slate-400 font-mono tracking-[0.3em] uppercase">
            Station: High-Voltage Sub / Rack: A-12 / Protocol: MQTT-Over-Secure
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 w-96">
          <TelemetryItem label="Joint Temperature" value={data.temp.toFixed(1)} unit="°C" alert={data.temp > 80} />
          <TelemetryItem label="Active Load" value={data.current.toFixed(1)} unit="Amps" />
          <TelemetryItem label="Grid Voltage" value={data.voltage.toFixed(1)} unit="kV" />
          <TelemetryItem label="Phase Angle" value="120.0" unit="DEG" />
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="flex justify-between items-end">
        <div className="flex flex-col gap-4">
            <div className="bg-cyan-900/20 border-t-2 border-cyan-500 p-6 backdrop-blur-md max-w-sm">
                <div className="text-cyan-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">System Diagnostics</div>
                <div className="text-white text-4xl font-black uppercase tracking-tighter flex items-center gap-4">
                    <span className="text-5xl drop-shadow-[0_0_15px_rgba(0,255,255,0.5)]">{currentMode?.icon}</span>
                    {currentMode?.name}
                </div>
            </div>
            <div className="flex gap-4">
                <div className="px-3 py-1 bg-white/5 border border-white/10 rounded text-[9px] text-white/50 font-bold uppercase tracking-widest">Storage: 94%</div>
                <div className="px-3 py-1 bg-white/5 border border-white/10 rounded text-[9px] text-white/50 font-bold uppercase tracking-widest">Uptime: 1,420H</div>
            </div>
        </div>
        
        <div className="text-right">
            <div className="text-[10px] text-slate-600 font-mono uppercase tracking-[0.1em] mb-1">Authenticated Operator: admin_02</div>
            <div className="text-[12px] text-slate-500 font-mono tracking-tighter">TIMESTAMP: {new Date().toISOString()}</div>
        </div>
      </div>
    </div>
  );
};

export default HUD;