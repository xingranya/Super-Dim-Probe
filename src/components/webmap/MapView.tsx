import React, { useState, useCallback, useMemo, useRef } from 'react';
import Map, { MapRef } from 'react-map-gl';
import { DeckGL } from '@deck.gl/react';
import type { MapViewState, CablePath, SensorNode, MapNode } from '@/types/map';
import { createCablePathLayer } from './layers/CablePathLayer';
import { createSensorScatterLayer } from './layers/SensorScatterLayer';
import { createRealisticNodeLayer, createPulseAnimationLayer } from './layers/NodeIconLayer';
import MapHUD from './components/MapHUD';
import NodeTooltip from './components/NodeTooltip';
import { generateMockMapData } from './utils/mockData';

export interface CableMapViewerProps {
  cables?: CablePath[];
  sensors?: SensorNode[];
  nodes?: MapNode[];        // 统一节点数据
  mapboxToken: string;
  initialViewState?: Partial<MapViewState>;
  onSensorClick?: (sensor: SensorNode) => void;
  onNodeClick?: (node: MapNode) => void;
  onViewDetails?: (node: MapNode) => void;  // 查看详情回调
  onViewHistory?: (node: MapNode) => void;  // 查看历史回调
  className?: string;
  showHUD?: boolean;        // 是否显示HUD
  showPulseEffect?: boolean; // 是否显示脉冲动画
}

const DEFAULT_VIEW_STATE: MapViewState = {
  longitude: 112.192641,
  latitude: 30.337027,
  zoom: 15,
  pitch: 0,     // 恢复垂直俯视视角
  bearing: 0,   // 恢复正北朝上
};

const CableMapViewer: React.FC<CableMapViewerProps> = ({
  cables: propCables,
  sensors: propSensors,
  nodes: propNodes,
  mapboxToken,
  initialViewState,
  onSensorClick,
  onNodeClick,
  onViewDetails,
  onViewHistory,
  className = '',
  showHUD = true,
  showPulseEffect = true,
}) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [viewState, setViewState] = useState<MapViewState>({
    ...DEFAULT_VIEW_STATE,
    ...initialViewState,
  });

  // 生成模拟数据
  const mockData = useMemo(() => generateMockMapData(), []);

  // 使用传入数据或模拟数据
  const cables = propCables || mockData.cables;
  const sensors = propSensors || mockData.sensors;
  const nodes = propNodes || mockData.nodes;

  // 选中的节点
  const [selectedNode, setSelectedNode] = useState<MapNode | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const mapRef = useRef<MapRef>(null);

  const handleMapLoad = useCallback(() => {
    setMapLoaded(true);
  }, []);

  const handleMapError = useCallback((error: Error) => {
    console.error('Map error:', error);
    setMapError('地图服务连接失败，请检查网络或 Token 有效性');
  }, []);

  const handleViewStateChange = useCallback(({ viewState: vs }: { viewState: MapViewState }) => {
    setViewState(vs);
  }, []);

  const handleSensorClick = useCallback((sensor: SensorNode) => {
    onSensorClick?.(sensor);
  }, [onSensorClick]);

  const handleNodeClick = useCallback((node: MapNode) => {
    setSelectedNode(node);
    // 将tooltip显示在屏幕中心偏右位置
    setTooltipPosition({ x: window.innerWidth * 0.65, y: window.innerHeight / 2 });
    onNodeClick?.(node);
  }, [onNodeClick]);

  const getTooltip = useCallback((info: { object?: any }): string | null => {
    if (!info.object) return null;

    const obj = info.object;

    // MapNode
    if (obj.nodeType) {
      const node = obj as MapNode;
      return `${node.name}\n状态: ${node.status}\n类型: ${node.nodeType}`;
    }

    // SensorNode
    if (obj.sensorType) {
      const sensor = obj as SensorNode;
      const readings = sensor.readings;
      let tooltip = `${sensor.name}\n状态: ${sensor.status}\n类型: ${sensor.sensorType}`;
      if (readings) {
        if (readings.pd !== undefined) tooltip += `\n局部放电: ${readings.pd} pC`;
        if (readings.temp !== undefined) tooltip += `\n温度: ${readings.temp} °C`;
        if (readings.voltage !== undefined) tooltip += `\n电压: ${readings.voltage} kV`;
        if (readings.current !== undefined) tooltip += `\n电流: ${readings.current} A`;
      }
      return tooltip;
    }

    // CablePath
    if (obj.voltageLevel) {
      const cable = obj as CablePath;
      return `${cable.name}\n电压等级: ${cable.voltageLevel}`;
    }

    // Fallback
    if (obj.id && obj.name) {
      return `${obj.name} (${obj.id})`;
    }

    return null;
  }, []);

  const layers = useMemo(() => {
    const allLayers = [];

    // 电缆路径层 (返回多层)
    allLayers.push(...createCablePathLayer(cables));

    // 如果有统一节点数据，使用新的真实感节点层
    if (nodes && nodes.length > 0) {
      // 真实感节点层 (多层叠加)
      const nodeLayers = createRealisticNodeLayer(nodes, handleNodeClick);
      allLayers.push(...nodeLayers);

      // 脉冲动画层
      if (showPulseEffect) {
        const pulseLayers = createPulseAnimationLayer(nodes);
        allLayers.push(...pulseLayers);
      }
    } else if (sensors && sensors.length > 0) {
      // 兼容旧的传感器散点层
      allLayers.push(createSensorScatterLayer(sensors, handleSensorClick));
    }

    return allLayers;
  }, [cables, sensors, nodes, handleSensorClick, handleNodeClick, showPulseEffect]);

  if (!mapboxToken) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#0a0f1a] text-white font-sans">
        <svg className="w-16 h-16 mb-4 text-[#00d4ff]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h2 className="text-xl font-bold mb-2">地图加载失败</h2>
        <p className="text-white/50 text-center max-w-md">
          请在 .env.local 中配置 VITE_MAPBOX_TOKEN
        </p>
      </div>
    );
  }

  if (mapError) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#0a0f1a] text-white font-sans">
        <svg className="w-16 h-16 mb-4 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4m0 4h.01" />
        </svg>
        <h2 className="text-xl font-bold mb-2">地图加载失败</h2>
        <p className="text-white/50 text-center max-w-md">{mapError}</p>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      <Map
        ref={mapRef}
        mapboxAccessToken={mapboxToken}
        mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
        {...viewState}
        onMove={handleViewStateChange}
        onLoad={handleMapLoad}
        onError={handleMapError}
        attributionControl={false}
        style={{ width: '100%', height: '100%' }}
      >
        <DeckGL
          viewState={viewState}
          onViewStateChange={handleViewStateChange}
          controller={false}
          layers={layers}
          getTooltip={getTooltip}
          style={{ pointerEvents: 'none' }}
        />
      </Map>

      {/* HUD 悬浮监控面板 - 右侧 */}
      {showHUD && (
        <MapHUD
          nodes={nodes}
          onNodeSelect={handleNodeClick}
          selectedNodeId={selectedNode?.id}
        />
      )}

      {/* 节点详情提示 - 右侧浮动 */}
      {selectedNode && (
        <NodeTooltip
          node={selectedNode}
          position={tooltipPosition}
          onClose={() => setSelectedNode(null)}
          onViewDetails={() => {
            // 优先使用外部回调，否则通过 onSensorClick 跳转到 dashboard
            if (onViewDetails) {
              onViewDetails(selectedNode);
            } else if (onSensorClick) {
              // 将 MapNode 转为 SensorNode 格式
              onSensorClick({
                id: selectedNode.id,
                name: selectedNode.name,
                position: selectedNode.position,
                status: selectedNode.status,
                sensorType: 'integrated',
                nodeType: selectedNode.nodeType,
                readings: selectedNode.readings,
              });
            }
            setSelectedNode(null);
          }}
          onViewHistory={() => {
            onViewHistory?.(selectedNode);
          }}
        />
      )}

      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0f1a]/70 z-20">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#00d4ff]/30 border-t-[#00d4ff] rounded-full animate-spin mx-auto mb-4" />
            <span className="text-white font-sans">地图加载中...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CableMapViewer;
