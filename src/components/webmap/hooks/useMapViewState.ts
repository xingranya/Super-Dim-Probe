import { useState, useCallback } from 'react';
import type { MapViewState } from '@/types/map';

const DEFAULT_VIEW_STATE: MapViewState = {
  longitude: 121.4737,
  latitude: 31.2304,
  zoom: 14,
  pitch: 0,
  bearing: 0,
};

export function useMapViewState(initialViewState?: Partial<MapViewState>) {
  const [viewState, setViewState] = useState<MapViewState>({
    ...DEFAULT_VIEW_STATE,
    ...initialViewState,
  });

  const onViewStateChange = useCallback(({ viewState: vs }: { viewState: MapViewState }) => {
    setViewState(vs);
  }, []);

  const flyTo = useCallback((target: Partial<MapViewState>, duration: number = 1000) => {
    setViewState(prev => ({
      ...prev,
      ...target,
      transitionDuration: duration,
    }));
  }, []);

  const resetView = useCallback(() => {
    setViewState({
      ...DEFAULT_VIEW_STATE,
      transitionDuration: 1000,
    });
  }, []);

  return {
    viewState,
    setViewState,
    onViewStateChange,
    flyTo,
    resetView,
  };
}
