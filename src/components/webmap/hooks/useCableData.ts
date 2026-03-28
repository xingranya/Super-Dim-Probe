import { useMemo } from 'react';
import type { CablePath, SensorNode } from '@/types/map';

export function useCableData(cables: CablePath[], sensors: SensorNode[]) {
  const cablesByVoltage = useMemo(() => {
    const grouped: Record<string, CablePath[]> = {
      '110kV': [],
      '35kV': [],
      '10kV': [],
    };
    cables.forEach(cable => {
      if (grouped[cable.voltageLevel]) {
        grouped[cable.voltageLevel].push(cable);
      }
    });
    return grouped;
  }, [cables]);

  const sensorsByStatus = useMemo(() => {
    const grouped: Record<string, SensorNode[]> = {
      normal: [],
      warning: [],
      fault: [],
    };
    sensors.forEach(sensor => {
      if (grouped[sensor.status]) {
        grouped[sensor.status].push(sensor);
      }
    });
    return grouped;
  }, [sensors]);

  const faultCount = useMemo(() => sensors.filter(s => s.status === 'fault').length, [sensors]);
  const warningCount = useMemo(() => sensors.filter(s => s.status === 'warning').length, [sensors]);
  const normalCount = useMemo(() => sensors.filter(s => s.status === 'normal').length, [sensors]);

  return {
    cablesByVoltage,
    sensorsByStatus,
    faultCount,
    warningCount,
    normalCount,
    totalSensors: sensors.length,
    totalCables: cables.length,
  };
}
