import React, { useState, useCallback } from 'react';
import ThreeScene from './components/ThreeScene';
import HUD from './components/HUD';
import { ModeSelector, ActionButtons } from './components/Controls';
import AIPanel from './components/AIPanel';
import { FaultMode, SensorData } from './types';
import { analyzeFault } from './services/geminiService';

const App: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<FaultMode>(FaultMode.XLPE_TREEING);
  const [isScanning, setIsScanning] = useState(true);
  const [sensorData, setSensorData] = useState<SensorData>({ pd: 0, temp: 0, vib: 0, loss: 0 });
  
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiContent, setAiContent] = useState('');

  const handleSensorUpdate = useCallback((data: SensorData) => {
    setSensorData(data);
  }, []);

  const handleAnalyze = async () => {
    setIsAiPanelOpen(true);
    setAiLoading(true);
    setAiContent('');
    
    // Call Gemini Service
    const result = await analyzeFault(currentMode, sensorData);
    
    setAiLoading(false);
    setAiContent(result);
  };

  return (
    <div className="relative w-full h-screen bg-[#020405] overflow-hidden">
      
      {/* 3D Scene Layer */}
      <ThreeScene 
        currentMode={currentMode} 
        isScanning={isScanning} 
        onSensorUpdate={handleSensorUpdate} 
      />

      {/* UI Overlay Layer */}
      <HUD data={sensorData} mode={currentMode} />

      <AIPanel 
        isOpen={isAiPanelOpen} 
        isLoading={aiLoading} 
        content={aiContent} 
        onClose={() => setIsAiPanelOpen(false)} 
      />

      <ModeSelector 
        currentMode={currentMode} 
        onModeChange={(mode) => {
            setCurrentMode(mode);
            setIsAiPanelOpen(false);
        }} 
      />

      <ActionButtons 
        isScanning={isScanning}
        isAiLoading={aiLoading}
        onToggleScan={() => setIsScanning(prev => !prev)}
        onAnalyze={handleAnalyze}
      />
    </div>
  );
};

export default App;
