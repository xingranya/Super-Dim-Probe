import React, { useState, useCallback, useMemo } from 'react';
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

  // 优化：防抖传感器数据更新，减少不必要的重渲染
  const handleSensorUpdate = useCallback((data: SensorData) => {
    setSensorData(prevData => {
      // 只有数据变化超过阈值才更新
      const hasSignificantChange = 
        Math.abs(data.temp - prevData.temp) > 0.5 ||
        Math.abs(data.pd - prevData.pd) > 5 ||
        Math.abs(data.voltage - prevData.voltage) > 0.1 ||
        Math.abs(data.current - prevData.current) > 1;
      
      return hasSignificantChange ? data : prevData;
    });
  }, []);

  // 优化：使用useMemo缓存模式选择器的回调
  const handleModeChange = useCallback((mode: FaultMode) => {
    setCurrentMode(mode);
  }, []);

  return (
    <div className="relative w-full h-screen bg-[#020305] overflow-hidden font-sans">

      
      {/* 美学渐变叠加层 - z-1 确保在3D场景之下 */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-black/50 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black/50 to-transparent" />
      </div>

      {/* 3D 场景 - z-1，接收所有鼠标事件 */}
      <div className="absolute inset-0 z-[1]">
        <ThreeScene 
          currentMode={currentMode} 
          isScanning={true} 
          onSensorUpdate={handleSensorUpdate} 
        />
      </div>

      {/* HUD 叠加层 - z-10，pointer-events-none 确保不阻挡鼠标 */}
      <HUD data={sensorData} mode={currentMode} />

      {/* 控制按钮 - z-20，需要接收点击事件 */}
      <ModeSelector 
        currentMode={currentMode} 
        onModeChange={handleModeChange} 
      />
    </div>
  );
};

export default App;