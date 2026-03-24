import React, { useState, useCallback, useMemo } from 'react';
import MapBackground, { type MapBackgroundRef } from './MapBackground';
import DeckOverlay from './DeckOverlay';
import { useMapViewState } from './hooks/useMapViewState';
import type { CablePath, SensorNode, MapViewState } from '@/types/map';

export interface CableMapViewerProps {
  cables: CablePath[];
  sensors: SensorNode[];
  mapboxToken: string;
  initialViewState?: Partial<MapViewState>;
  onSensorClick?: (sensor: SensorNode) => void;
  className?: string;
}

const MAPBOX_STYLE = {
  errorContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    backgroundColor: '#0f172a',
    color: 'white',
    fontFamily: 'system-ui, sans-serif',
  },
  errorIcon: {
    width: 64,
    height: 64,
    marginBottom: 16,
    color: '#f59e0b',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 600,
    marginBottom: 8,
  },
  errorMessage: {
    color: '#94a3b8',
    textAlign: 'center' as const,
    maxWidth: 400,
  },
  loadingOverlay: {
    position: 'absolute' as const,
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    zIndex: 10,
  },
  loadingText: {
    color: 'white',
    fontFamily: 'system-ui, sans-serif',
  },
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

  const { viewState, onViewStateChange } = useMapViewState(initialViewState);
  const mapRef = React.useRef<MapBackgroundRef>(null);

  const handleMapLoad = useCallback(() => {
    setMapLoaded(true);
  }, []);

  const handleMapError = useCallback((error: Error) => {
    console.error('Map error:', error);
    setMapError('地图服务连接失败，请检查网络或 Token 有效性');
  }, []);

  const handleSensorClick = useCallback((sensor: SensorNode) => {
    onSensorClick?.(sensor);
  }, [onSensorClick]);

  const getTooltip = useCallback((info: { object?: any }): string | null => {
    if (!info.object) return null;

    const obj = info.object;

    // SensorNode has sensorType property (unique to sensors)
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

    // CablePath has voltageLevel property (unique to cables)
    if (obj.voltageLevel) {
      const cable = obj as CablePath;
      return `${cable.name}\n电压等级: ${cable.voltageLevel}\n点击查看详情`;
    }

    // Fallback - show whatever we can
    if (obj.id && obj.name) {
      return `${obj.name} (${obj.id})`;
    }

    return null;
  }, []);

  if (!mapboxToken) {
    return (
      <div style={MAPBOX_STYLE.errorContainer} className={className}>
        <svg style={MAPBOX_STYLE.errorIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h2 style={MAPBOX_STYLE.errorTitle}>地图加载失败</h2>
        <p style={MAPBOX_STYLE.errorMessage}>
          请在 .env.local 中配置 VITE_MAPBOX_TOKEN
        </p>
      </div>
    );
  }

  if (mapError) {
    return (
      <div style={MAPBOX_STYLE.errorContainer} className={className}>
        <svg style={MAPBOX_STYLE.errorIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4m0 4h.01" />
        </svg>
        <h2 style={MAPBOX_STYLE.errorTitle}>地图加载失败</h2>
        <p style={MAPBOX_STYLE.errorMessage}>{mapError}</p>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      <MapBackground
        ref={mapRef}
        token={mapboxToken}
        viewState={viewState}
        onViewStateChange={onViewStateChange}
        onLoad={handleMapLoad}
        onError={handleMapError}
      />
      <DeckOverlay
        viewState={viewState}
        onViewStateChange={onViewStateChange}
        cables={cables}
        sensors={sensors}
        onSensorClick={handleSensorClick}
        getTooltip={getTooltip}
      />
      {!mapLoaded && (
        <div style={MAPBOX_STYLE.loadingOverlay}>
          <span style={MAPBOX_STYLE.loadingText}>地图加载中...</span>
        </div>
      )}
    </div>
  );
};

export default CableMapViewer;
