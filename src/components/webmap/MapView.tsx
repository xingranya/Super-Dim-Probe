import React, { useState, useCallback, useMemo, useRef } from 'react';
import Map, { MapRef } from 'react-map-gl';
import { DeckGL } from '@deck.gl/react';
import type { CablePath, SensorNode, MapNode, MapViewState } from '@/types/map';
import { createCablePathLayer } from './layers/CablePathLayer';
import { createSensorScatterLayer } from './layers/SensorScatterLayer';
import { createRealisticNodeLayer, createPulseAnimationLayer } from './layers/NodeIconLayer';
import MapHUD from './components/MapHUD';
import NodeTooltip from './components/NodeTooltip';
import { generateMockMapData } from './utils/mockData';

export interface CableMapViewerProps {
  cables?: CablePath[];
  sensors?: SensorNode[];
  nodes?: MapNode[];
  mapboxToken: string;
  initialViewState?: Partial<MapViewState>;
  onSensorClick?: (sensor: SensorNode) => void;
  onNodeClick?: (node: MapNode) => void;
  onViewDetails?: (node: MapNode) => void;
  onViewHistory?: (node: MapNode) => void;
  className?: string;
  showHUD?: boolean;
  showPulseEffect?: boolean;
}

const DEFAULT_VIEW_STATE: MapViewState = {
  longitude: 112.192641,
  latitude: 30.3388,
  zoom: 14.7,
  pitch: 10,
  bearing: -8,
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
  const [selectedNode, setSelectedNode] = useState<MapNode | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | undefined>(undefined);

  const mapRef = useRef<MapRef>(null);
  const mockData = useMemo(() => generateMockMapData(), []);

  const cables = propCables || mockData.cables;
  const sensors = propSensors || mockData.sensors;
  const nodes = propNodes || mockData.nodes;

  const handleMapLoad = useCallback(() => {
    setMapLoaded(true);
  }, []);

  const handleMapError = useCallback((event: { error: Error }) => {
    console.error('Map error:', event.error);
    setMapError('地图服务连接失败，请检查网络或 Token 有效性');
  }, []);

  const handleViewStateChange = useCallback((nextViewState: MapViewState) => {
    setViewState(nextViewState);
  }, []);

  const handleNodeClick = useCallback((node: MapNode, context?: { x?: number; y?: number }) => {
    setSelectedNode((current) => current?.id === node.id ? null : node);
    if (context?.x !== undefined && context?.y !== undefined) {
      setTooltipPosition({ x: context.x, y: context.y });
    }
    onNodeClick?.(node);
  }, [onNodeClick]);

  const handleSensorClick = useCallback((sensor: SensorNode) => {
    onSensorClick?.(sensor);
  }, [onSensorClick]);

  const layers = useMemo(() => {
    const allLayers = [];
    allLayers.push(...createCablePathLayer(cables, { zoom: viewState.zoom }));

    if (nodes.length > 0) {
      allLayers.push(...createRealisticNodeLayer(nodes, {
        zoom: viewState.zoom,
        selectedNodeId: selectedNode?.id,
        onClick: handleNodeClick,
      }));

      if (showPulseEffect) {
        allLayers.push(...createPulseAnimationLayer(
          nodes.filter((node) => viewState.zoom >= 14.2 || node.status !== 'normal' || node.nodeType === 'substation')
        ));
      }
    } else if (sensors.length > 0) {
      allLayers.push(createSensorScatterLayer(sensors, handleSensorClick));
    }

    return allLayers;
  }, [cables, handleNodeClick, handleSensorClick, nodes, selectedNode?.id, sensors, showPulseEffect, viewState.zoom]);

  if (!mapboxToken) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#0a0f1a] text-white font-sans">
        <svg className="w-16 h-16 mb-4 text-amber-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h2 className="text-xl font-bold mb-2">地图加载失败</h2>
        <p className="text-white/50 text-center max-w-md">请在 `.env.local` 中配置 `VITE_MAPBOX_TOKEN`</p>
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
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      <Map
        ref={mapRef}
        mapboxAccessToken={mapboxToken}
        mapStyle="mapbox://styles/mapbox/satellite-v9"
        {...viewState}
        onMove={(event) => handleViewStateChange(event.viewState as unknown as MapViewState)}
        onLoad={handleMapLoad}
        onError={handleMapError}
        attributionControl={false}
        style={{ width: '100%', height: '100%' }}
      />

      <div className="absolute inset-0 pointer-events-auto">
        <DeckGL
          viewState={viewState}
          onViewStateChange={({ viewState: nextState }) => handleViewStateChange(nextState as unknown as MapViewState)}
          controller={true}
          layers={layers}
          getCursor={({ isDragging }) => (isDragging ? 'grabbing' : 'grab')}
          style={{ position: 'absolute', top: '0', right: '0', bottom: '0', left: '0', pointerEvents: 'auto' }}
        />
      </div>

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_44%,rgba(7,13,23,0.02)_0%,rgba(7,13,23,0.12)_72%,rgba(3,7,18,0.22)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,10,18,0.08)_0%,rgba(3,10,18,0.01)_28%,rgba(3,10,18,0.04)_72%,rgba(3,10,18,0.10)_100%)]" />
      </div>

      {showHUD && (
        <MapHUD
          nodes={nodes}
          onNodeSelect={(node) => handleNodeClick(node)}
          selectedNodeId={selectedNode?.id}
          zoom={viewState.zoom}
        />
      )}

      {selectedNode && (
        <NodeTooltip
          node={selectedNode}
          position={tooltipPosition}
          onClose={() => setSelectedNode(null)}
          onViewDetails={() => {
            if (onViewDetails) {
              onViewDetails(selectedNode);
            } else if (onSensorClick) {
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
          onViewHistory={() => onViewHistory?.(selectedNode)}
        />
      )}

      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#07111b]/55 z-20">
          <div className="rounded-2xl bg-[#0a0f1a]/86 border border-white/10 px-5 py-4 text-center backdrop-blur-md">
            <div className="mx-auto mb-3 h-10 w-10 rounded-full border-2 border-cyan-300/20 border-t-cyan-300 animate-spin" />
            <span className="text-sm text-white">地图加载中...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CableMapViewer;
