import React, { useState, useCallback } from 'react';
import ThreeScene from './components/ThreeScene';
import HUD from './components/HUD';
import { ModeSelector } from './components/Controls';
import { FaultMode, SensorData } from './types';

const App: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<FaultMode>(FaultMode.XLPE_TREEING);
  const [sensorData, setSensorData] = useState<SensorData>({ 
    pd: 0, 
    temp: 25, 
    vib: 0, 
    loss: 0.02,
    voltage: 110.0,
    current: 425.0
  });

  const handleSensorUpdate = useCallback((data: SensorData) => {
    setSensorData(data);
  }, []);

  return (
    <div className="relative w-full h-screen bg-[#020305] overflow-hidden font-sans">
      {/* 3D 场景 - 最底层，z-index: 0 */}
      <div className="absolute inset-0 z-0">
        <ThreeScene 
          currentMode={currentMode} 
          isScanning={true} 
          onSensorUpdate={handleSensorUpdate} 
        />
      </div>

      {/* HUD 叠加层 - pointer-events-none 确保不阻挡鼠标 */}
      <HUD data={sensorData} mode={currentMode} />

      {/* 控制按钮 - 需要接收点击事件 */}
      <ModeSelector 
        currentMode={currentMode} 
        onModeChange={(mode) => setCurrentMode(mode)} 
      />

      {/* 美学渐变叠加层 - pointer-events-none */}
      <div className="absolute inset-0 pointer-events-none z-20">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-black/50 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black/50 to-transparent" />
      </div>
    </div>
  );
};

export default App;