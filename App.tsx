import React, { useState, useCallback, useMemo } from 'react';
import ThreeScene from './components/ThreeScene';
import HUD from './components/HUD';
import { ModeSelector } from './components/Controls';
import SignalFlowDemo from './components/SignalFlowDemo';
import CableNetwork3D from './components/CableNetwork3D';
import SensorDashboard from './components/SensorDashboard';
import PerformanceMonitor from './components/PerformanceMonitor';
import { FaultMode, SensorData } from './types';

/**
 * 应用视图模式
 * - network: 3D电缆网络总览（默认）
 * - dashboard: 传感器监测数据仪表盘
 * - sensorDetail: 传感器3D外观详情（原有ThreeScene）
 * - signalFlow: 信号流演示
 */
type ViewMode = 'network' | 'dashboard' | 'sensorDetail' | 'signalFlow';

const App: React.FC = () => {
  // 视图模式状态
  const [viewMode, setViewMode] = useState<ViewMode>('network');
  const [selectedSensorId, setSelectedSensorId] = useState<string>('J1');

  // 原有状态（传感器3D详情模式使用）
  const [currentMode, setCurrentMode] = useState<FaultMode>(FaultMode.XLPE_TREEING);
  const [isAutoDemo, setIsAutoDemo] = useState(false);
  const [sensorData, setSensorData] = useState<SensorData>({ 
    pd: 0, 
    temp: 25, 
    vib: 0, 
    loss: 0.02,
    voltage: 110.0,
    current: 425.0
  });

  // 相机状态持久化 (必须在条件渲染之前定义)
  const [cameraState, setCameraState] = useState<{ position: [number, number, number]; target: [number, number, number] } | undefined>(undefined);

  const handleCameraChange = useCallback((state: { position: [number, number, number]; target: [number, number, number] }) => {
    setCameraState(state);
  }, []);

  // 传感器数据更新回调
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

  const handleModeChange = useCallback((mode: FaultMode) => {
    setCurrentMode(mode);
  }, []);

  const handleAutoDemo = useCallback((enabled: boolean) => {
    setIsAutoDemo(enabled);
  }, []);

  const handleDemoComplete = useCallback(() => {
    setIsAutoDemo(false);
  }, []);

  // 传感器点击 - 跳转到仪表盘
  const handleSensorClick = useCallback((sensorId: string) => {
    setSelectedSensorId(sensorId);
    setViewMode('dashboard');
  }, []);

  // 查看传感器3D外观详情
  const handleViewSensorDetail = useCallback(() => {
    setViewMode('sensorDetail');
  }, []);

  // 返回电缆网络视图
  const handleBackToNetwork = useCallback(() => {
    setViewMode('network');
  }, []);

  // 信号流演示模式
  if (viewMode === 'signalFlow') {
    return (
      <SignalFlowDemo
        autoPlay={true}
        cycleDuration={20}
        onExit={() => setViewMode('network')}
      />
    );
  }

  // 传感器监测数据仪表盘
  if (viewMode === 'dashboard') {
    return (
      <SensorDashboard
        sensorId={selectedSensorId}
        onBack={handleBackToNetwork}
      />
    );
  }

  // 传感器3D外观详情（原有ThreeScene）
  if (viewMode === 'sensorDetail') {
    return (
      <div className="relative w-full h-screen bg-[#020305] overflow-hidden font-sans">
        {/* 性能监控器 */}
        <PerformanceMonitor enabled={process.env.NODE_ENV !== 'production'} />

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

        {/* 返回按钮 */}
        <button
          onClick={handleBackToNetwork}
          className="absolute top-4 left-4 z-30 px-4 py-2 bg-slate-800/90 border border-slate-700 rounded-lg text-white text-sm font-medium hover:bg-slate-700 transition-colors pointer-events-auto flex items-center gap-2"
        >
          ← 返回电缆网络
        </button>

        <button
          onClick={() => setViewMode('signalFlow')}
          className="absolute bottom-12 right-4 z-30 px-3 py-1.5 bg-cyan-600/20 border border-cyan-500/50 rounded-lg text-cyan-400 text-xs font-bold hover:bg-cyan-600/30 transition-colors pointer-events-auto"
        >
          🎬 GIF 演示
        </button>
      </div>
    );
  }

  // 默认：3D电缆网络视图
  return (
    <div className="relative w-full h-screen bg-[#0f172a] overflow-hidden font-sans">
      <CableNetwork3D 
        onSensorClick={handleSensorClick}
        onViewSensorDetail={handleViewSensorDetail}
        initialCameraState={cameraState}
        onCameraChange={handleCameraChange}
      />
    </div>
  );
};

export default App;