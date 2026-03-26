import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import Map, { type MapRef } from 'react-map-gl';
import type { MapViewState } from '@/types/map';

export interface MapBackgroundProps {
  token: string;
  viewState: MapViewState;
  onViewStateChange: (viewState: MapViewState) => void;
  onLoad?: () => void;
  onError?: (event: { error: Error }) => void;
}

export interface MapBackgroundRef {
  getMap: () => MapRef | null;
}

const MapBackground = forwardRef<MapBackgroundRef, MapBackgroundProps>(
  ({ token, viewState, onViewStateChange, onLoad, onError }, ref) => {
    const mapRef = useRef<MapRef>(null);

    useImperativeHandle(ref, () => ({
      getMap: () => mapRef.current,
    }));

    const handleLoad = () => {
      onLoad?.();
    };

    const handleError = (event: { error: Error }) => {
      onError?.(event);
    };

    return (
      <Map
        ref={mapRef}
        mapboxAccessToken={token}
        mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
        reuseMaps
        {...viewState}
        onMove={evt => onViewStateChange(evt.viewState)}
        onLoad={handleLoad}
        onError={handleError}
        attributionControl={false}
        style={{ width: '100%', height: '100%' }}
      />
    );
  }
);

MapBackground.displayName = 'MapBackground';

export default MapBackground;
