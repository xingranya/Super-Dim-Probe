import type { CablePath, MapNode } from '@/types/map';

export const getCablePriority = (cable: CablePath) => {
  if (cable.renderPriority) return cable.renderPriority;
  if (cable.voltageLevel === '110kV') return 'primary';
  if (cable.voltageLevel === '35kV') return 'secondary';
  return 'tertiary';
};

export const getNodePriority = (node: MapNode) => {
  if (node.renderPriority) return node.renderPriority;
  if (node.status === 'warning' || node.status === 'fault') return 'primary';
  if (node.nodeType === 'substation') return 'primary';
  if (node.nodeType === 'grounding' || node.nodeType === 'joint') return 'secondary';
  return 'tertiary';
};
