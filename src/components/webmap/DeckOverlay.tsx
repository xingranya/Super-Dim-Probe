import React, { useMemo } from 'react';
import { DeckGL } from '@deck.gl/react';
import type { MapViewState, CablePath, SensorNode } from '@/types/map';
import { createCablePathLayer } from './layers/CablePathLayer';
import { createSensorScatterLayer } from './layers/SensorScatterLayer';

export interface DeckOverlayProps {
  viewState: MapViewState;
  onViewStateChange: (viewState: MapViewState) => void;
  cables: CablePath[];
  sensors: SensorNode[];
  onSensorClick?: (sensor: SensorNode) => void;
  getTooltip?: (info: { object?: SensorNode | CablePath }) => string | null;
}

const DeckOverlay: React.FC<DeckOverlayProps> = ({
  viewState,
  onViewStateChange,
  cables,
  sensors,
  onSensorClick,
  getTooltip,
}) => {
  const layers = useMemo(() => {
    return [
      createCablePathLayer(cables),
      createSensorScatterLayer(sensors, onSensorClick),
    ];
  }, [cables, sensors, onSensorClick]);

  const handleTooltip = getTooltip
    ? (info: any) => {
        if (!info.object) return null;
        return getTooltip({ object: info.object }) || null;
      }
    : undefined;

  return (
    <DeckGL
      viewState={viewState}
      onViewStateChange={({ viewState: vs }) => onViewStateChange(vs as MapViewState)}
      controller={false}
      layers={layers}
      getTooltip={handleTooltip}
      style={{ pointerEvents: 'none' }}
    />
  );
};

export default DeckOverlay;
