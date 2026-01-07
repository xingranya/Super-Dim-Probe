import React, { useState, useCallback } from 'react';
import ThreeScene from './components/ThreeScene';
import HUD from './components/HUD';
import { ModeSelector } from './components/Controls';
import SignalFlowDemo from './components/SignalFlowDemo';

import { FaultMode, SensorData } from './types';

const App: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<FaultMode>(FaultMode.XLPE_TREEING);
  const [isAutoDemo, setIsAutoDemo] = useState(false);
  const [isSignalFlowDemo, setIsSignalFlowDemo] = useState(false);
  const [sensorData, setSensorData] = useState<SensorData>({ 
    pd: 0, 
    temp: 25, 
    vib: 0, 
    loss: 0.02,
    voltage: 110.0,
    current: 425.0
  });

  const handleSensorUpdate = useCallback((data: SensorData) => {
    setSensorData(prevData => {
      const hasSignificantChange = 
        Math.abs(data.temp - prevData.temp) > 0.5 ||
        Math.abs(data.pd - prevData.pd) > 5 ||
        Math.abs(data.voltage - prevData.voltage) > 0.1 ||
        Math.abs(data.current - prevData.current) > 1;
      return hasSignificantChange ? data : prevData;
    });
  }, []);

  const handleModeChange = useCallback((mode: FaultMode) => {
    setCurrentMode(mode);
  }, []);

  const handleAutoDemo = useCallback((enabled: boolean) => {
    setIsAutoDemo(enabled);
  }, []);

  const handleDemoComplete = useCallback(() => {
    setIsAutoDemo(false);
  }, []);

  if (isSignalFlowDemo) {
    return (
      <SignalFlowDemo
        autoPlay={true}
        cycleDuration={20}
        onExit={() => setIsSignalFlowDemo(false)}
      />
    );
  }

  return (
    <div className="relative w-full h-screen bg-[#020305] overflow-hidden font-sans">
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-black/50 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black/50 to-transparent" />
      </div>

      <div className="absolute inset-0 z-[1]">
        <ThreeScene 
          currentMode={currentMode} 
          isScanning={true} 
          isAutoDemo={isAutoDemo}
          onSensorUpdate={handleSensorUpdate}
          onDemoComplete={handleDemoComplete}
        />
      </div>

      <HUD data={sensorData} mode={currentMode} />

      <ModeSelector 
        currentMode={currentMode} 
        onModeChange={handleModeChange}
        onAutoDemo={handleAutoDemo}
        isAutoDemo={isAutoDemo}
      />

      <button
        onClick={() => setIsSignalFlowDemo(true)}
        className="absolute bottom-12 right-4 z-30 px-3 py-1.5 bg-cyan-600/20 border border-cyan-500/50 rounded-lg text-cyan-400 text-xs font-bold hover:bg-cyan-600/30 transition-colors pointer-events-auto"
      >
        🎬 GIF 演示
      </button>
    </div>
  );
};

export default App;