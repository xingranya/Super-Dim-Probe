import React, { useState, useCallback, useMemo, useRef } from 'react';
import Map, { MapRef } from 'react-map-gl';
import { DeckGL } from '@deck.gl/react';
import type { MapViewState, CablePath, SensorNode } from '@/types/map';
import { createCablePathLayer } from './layers/CablePathLayer';
import { createSensorScatterLayer } from './layers/SensorScatterLayer';

export interface CableMapViewerProps {
  cables: CablePath[];
  sensors: SensorNode[];
  mapboxToken: string;
  initialViewState?: Partial<MapViewState>;
  onSensorClick?: (sensor: SensorNode) => void;
  className?: string;
}

const DEFAULT_VIEW_STATE: MapViewState = {
  longitude: 112.192641,
  latitude: 30.337027,
  zoom: 15,
  pitch: 0,
  bearing: 0,
};

const CableMapViewer: React.FC<CableMapViewerProps> = ({
  cables,
  sensors,
  mapboxToken,
  initialViewState,
  onSensorClick,
  className = '',
}) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [viewState, setViewState] = useState<MapViewState>({
    ...DEFAULT_VIEW_STATE,
    ...initialViewState,
  });

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

  const getTooltip = useCallback((info: { object?: any }): string | null => {
    if (!info.object) return null;

    const obj = info.object;

    // SensorNode has sensorType property
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

    // CablePath has voltageLevel property
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
    return [
      createCablePathLayer(cables),
      createSensorScatterLayer(sensors, handleSensorClick),
    ];
  }, [cables, sensors, handleSensorClick]);

  if (!mapboxToken) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-900 text-white font-sans">
        <svg className="w-16 h-16 mb-4 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h2 className="text-xl font-bold mb-2">地图加载失败</h2>
        <p className="text-slate-400 text-center max-w-md">
          请在 .env.local 中配置 VITE_MAPBOX_TOKEN
        </p>
      </div>
    );
  }

  if (mapError) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-900 text-white font-sans">
        <svg className="w-16 h-16 mb-4 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4m0 4h.01" />
        </svg>
        <h2 className="text-xl font-bold mb-2">地图加载失败</h2>
        <p className="text-slate-400 text-center max-w-md">{mapError}</p>
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

      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/70 z-20">
          <span className="text-white font-sans">地图加载中...</span>
        </div>
      )}
    </div>
  );
};

export default CableMapViewer;
