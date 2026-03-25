import React, { useMemo } from 'react';
import { DeckGL } from '@deck.gl/react';
import type { MapViewState, CablePath, SensorNode, MapNode } from '@/types/map';
import { createCablePathLayer } from './layers/CablePathLayer';
import { createSensorScatterLayer } from './layers/SensorScatterLayer';
import { createNodeIconLayer, createPulseLayer } from './layers/NodeIconLayer';

export interface DeckOverlayProps {
  viewState: MapViewState;
  onViewStateChange: (viewState: MapViewState) => void;
  cables: CablePath[];
  sensors?: SensorNode[];  // 兼容旧接口
  nodes?: MapNode[];        // 新接口 - 统一节点
  onSensorClick?: (sensor: SensorNode) => void;
  onNodeClick?: (node: MapNode) => void;
  getTooltip?: (info: { object?: SensorNode | CablePath | MapNode }) => string | null;
  showPulseEffect?: boolean; // 是否显示脉冲动画
}

const DeckOverlay: React.FC<DeckOverlayProps> = ({
  viewState,
  onViewStateChange,
  cables,
  sensors,
  nodes,
  onSensorClick,
  onNodeClick,
  getTooltip,
  showPulseEffect = true,
}) => {
  const layers = useMemo(() => {
    const allLayers = [];

    // 电缆路径层 (返回多层)
    allLayers.push(...createCablePathLayer(cables));

    // 如果有统一节点数据，使用新的节点层
    if (nodes && nodes.length > 0) {
      allLayers.push(createNodeIconLayer(nodes, onNodeClick));

      // 脉冲动画层 (告警节点)
      if (showPulseEffect) {
        allLayers.push(createPulseLayer(nodes));
      }
    } else if (sensors && sensors.length > 0) {
      // 兼容旧的传感器散点层
      allLayers.push(createSensorScatterLayer(sensors, onSensorClick));
    }

    return allLayers;
  }, [cables, sensors, nodes, onSensorClick, onNodeClick, showPulseEffect]);

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
