import React from 'react';
import { Routes, Route } from 'react-router-dom';
import VisualizationPage from './pages/VisualizationPage';
import SmartTechApp from './smart-tech/SmartTechApp';

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<VisualizationPage />} />
      <Route path="/smart-tech/*" element={<SmartTechApp />} />
    </Routes>
  );
};

export default App;
