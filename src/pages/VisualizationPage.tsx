import React, { useState, useCallback, useMemo } from 'react';
import ThreeScene from '../components/ThreeScene';
import HUD from '../components/HUD';
import { ModeSelector } from '../components/Controls';
import SignalFlowDemo from '../components/SignalFlowDemo';
import CableNetwork3D from '../components/CableNetwork3D';
import SensorDashboard from '../components/SensorDashboard';
import PerformanceMonitor from '../components/PerformanceMonitor';
import SystemPortal from '../components/SystemPortal';
import CableMapViewer from '../components/webmap/MapView';
import { generateMockMapData } from '../components/webmap/utils/mockData';
import { FaultMode, SensorData } from '../types';
import { mockCables, mockSensors } from '../data/mockGeoData';

/**
 * 应用视图模式
 * - network: 3D电缆网络总览（默认）
 * - dashboard: 传感器监测数据仪表盘
 * - sensorDetail: 传感器3D外观详情（原有ThreeScene）
 * - signalFlow: 信号流演示
 * - webmap: WebGIS卫星地图视图
 */
type ViewMode = 'network' | 'dashboard' | 'sensorDetail' | 'signalFlow' | 'webmap';

const VisualizationPage: React.FC = () => {
  // 视图模式状态
  const [viewMode, setViewMode] = useState<ViewMode>('network');
  const [selectedSensorId, setSelectedSensorId] = useState<string>('J1');
  // 记录上一个视图，用于返回导航
  const [previousView, setPreviousView] = useState<ViewMode>('network');

  // WebGIS地图数据
  const webmapData = useMemo(() => generateMockMapData(), []);

  // 进入页面时设置 body 样式
  React.useEffect(() => {
    // 3D 页面需要隐藏滚动条并禁用默认触摸行为
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    
    return () => {
      // 离开页面时恢复默认样式
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, []);

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

  // 传感器点击 - 跳转到仪表盘（记住上一个视图）
  const handleSensorClick = useCallback((sensorId: string) => {
    setPreviousView(viewMode);
    setSelectedSensorId(sensorId);
    setViewMode('dashboard');
  }, [viewMode]);

  // 查看传感器3D外观详情
  const handleViewSensorDetail = useCallback(() => {
    setPreviousView(viewMode);
    setViewMode('sensorDetail');
  }, []);

  // 返回上一个视图
  const handleBack = useCallback(() => {
    setViewMode(previousView);
  }, [previousView]);

  return (
    <div className="relative w-full h-screen bg-[#0f172a] overflow-hidden font-sans">
      
      {/* 1. 3D电缆网络视图 (Keep-Alive) */}
      <div className={`absolute inset-0 transition-opacity duration-300 ${viewMode === 'network' ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'}`}>
        <CableNetwork3D
          active={viewMode === 'network'} // 仅在可见时渲染
          onSensorClick={handleSensorClick}
          onViewSensorDetail={handleViewSensorDetail}
          initialCameraState={cameraState}
          onCameraChange={handleCameraChange}
        />
        {/* SmartTech 跳转入口 */}
        <SystemPortal />

        {/* WebGIS 切换按钮 - 右上角，智能业务平台左边 */}
        <div className="absolute top-4 right-72 z-40 pointer-events-auto flex gap-2">
          <button
            onClick={() => { setPreviousView(viewMode); setViewMode('webmap'); }}
            className="group relative flex items-center gap-2 px-3 py-2 bg-slate-900/80 border border-emerald-500/30 rounded-lg backdrop-blur-md hover:bg-slate-800/90 hover:border-emerald-400 transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.15)] hover:shadow-[0_0_25px_rgba(16,185,129,0.3)]"
          >
            <svg
              className="w-4 h-4 text-emerald-400 group-hover:text-emerald-300 transition-colors"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <span className="text-xs font-medium text-emerald-300 group-hover:text-emerald-200 transition-colors">
              卫星地图
            </span>
          </button>
        </div>
      </div>

      {/* 2. 信号流演示模式 (按需渲染，因为是模态框且很少用) */}
      {viewMode === 'signalFlow' && (
        <div className="absolute inset-0 z-50 bg-black">
          <SignalFlowDemo
            autoPlay={true}
            cycleDuration={20}
            onExit={handleBack}
          />
        </div>
      )}

      {/* 3. 传感器监测数据仪表盘 (Keep-Alive) */}
      <div className={`absolute inset-0 z-50 bg-slate-900 transition-opacity duration-300 ${viewMode === 'dashboard' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <SensorDashboard
          active={viewMode === 'dashboard'}
          sensorId={selectedSensorId}
          onBack={handleBack}
        />
      </div>

      {/* 4. 传感器3D外观详情 (Keep-Alive) */}
      <div className={`absolute inset-0 z-50 bg-[#020305] transition-opacity duration-300 ${viewMode === 'sensorDetail' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="relative w-full h-full">
          {/* 性能监控器 */}
          <PerformanceMonitor enabled={process.env.NODE_ENV !== 'production'} />

          <div className="absolute inset-0 pointer-events-none z-0">
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-black/50 to-transparent" />
            <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black/50 to-transparent" />
          </div>

          <div className="absolute inset-0 z-[1]">
            <ThreeScene 
              active={viewMode === 'sensorDetail'}
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
            onClick={handleBack}
            className="absolute top-4 left-4 z-30 px-4 py-2 bg-slate-800/90 border border-slate-700 rounded-lg text-white text-sm font-medium hover:bg-slate-700 transition-colors pointer-events-auto flex items-center gap-2"
          >
            ← 返回电缆网络
          </button>

          <button
            onClick={() => { setPreviousView(viewMode); setViewMode('signalFlow'); }}
            className="absolute bottom-12 right-4 z-30 px-3 py-1.5 bg-cyan-600/20 border border-cyan-500/50 rounded-lg text-cyan-400 text-xs font-bold hover:bg-cyan-600/30 transition-colors pointer-events-auto"
          >
            🎬 GIF 演示
          </button>
        </div>
      </div>

      {/* 5. WebGIS 卫星地图视图 */}
      <div className={`absolute inset-0 z-40 bg-slate-900 transition-opacity duration-300 ${viewMode === 'webmap' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <CableMapViewer
          cables={webmapData.cables}
          nodes={webmapData.nodes}
          mapboxToken={import.meta.env.VITE_MAPBOX_TOKEN || ''}
          initialViewState={{ longitude: 112.192641, latitude: 30.3388, zoom: 14.7, pitch: 10, bearing: -8 }}
          onSensorClick={(sensor) => {
            setPreviousView('webmap');
            setSelectedSensorId(sensor.id);
            setViewMode('dashboard');
          }}
          onNodeClick={(node) => {
            // 节点点击显示 tooltip（MapView 内部处理）
          }}
          onViewDetails={(node) => {
            // 从 NodeTooltip "查看详情" 跳转到 SensorDashboard
            setPreviousView('webmap');
            setSelectedSensorId(node.id);
            setViewMode('dashboard');
          }}
        />
      </div>
    </div>
  );
};

export default VisualizationPage;
