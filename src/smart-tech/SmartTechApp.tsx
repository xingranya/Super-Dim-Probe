import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layout Components
import Navbar from './components/Layout/Navbar';
import Footer from './components/Layout/Footer';
import ScrollToTop from './components/Common/ScrollToTop';
import DashboardLayout from './components/Layout/DashboardLayout';

// Pages
import HomePage from './pages/HomePage';
import ProductListPage from './pages/ProductListPage';
import ProductDetailPage from './pages/ProductDetailPage';
import SaaSPage from './pages/SaaSPage';
import ServicesPage from './pages/ServicesPage';
import EcosystemPage from './pages/EcosystemPage';
import LoginPage from './pages/LoginPage';
import PaymentPage from './pages/PaymentPage';
import XLPEMonitoringPage from './pages/dashboard/XLPEMonitoringPage';
import XLPEAnalysisPage from './pages/dashboard/XLPEAnalysisPage';
import ElectricalMonitoringPage from './pages/dashboard/ElectricalMonitoringPage';
import AcousticMonitoringPage from './pages/dashboard/AcousticMonitoringPage';
import ThermalMonitoringPage from './pages/dashboard/ThermalMonitoringPage';
import VibrationMonitoringPage from './pages/dashboard/VibrationMonitoringPage';

/**
 * SmartTech 子应用入口
 * 负责路由配置和布局
 */
const SmartTechApp: React.FC = () => {
  // 确保后台页面可以正常滚动和交互
  React.useEffect(() => {
    document.body.style.overflow = 'auto';
    document.body.style.touchAction = 'auto';
    return () => {
      // 离开后台应用时恢复默认（可选，或交由下一页处理）
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, []);

  return (
    <>
      <ScrollToTop />
      <div className="min-h-screen flex flex-col font-sans bg-gray-50">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="products" element={<ProductListPage />} />
            <Route path="products/:id" element={<ProductDetailPage />} />
            <Route path="saas" element={<SaaSPage />} />
            <Route path="services" element={<ServicesPage />} />
            <Route path="ecosystem" element={<EcosystemPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="payment" element={<PaymentPage />} />
            
            {/* 后台管理路由 */}
            <Route path="dashboard" element={<DashboardLayout />}>
              <Route index element={<Navigate to="monitor" replace />} />
              <Route path="analysis" element={<XLPEAnalysisPage />} />
              <Route path="monitor" element={<XLPEMonitoringPage />} />
              <Route path="electrical" element={<ElectricalMonitoringPage />} />
              <Route path="acoustic" element={<AcousticMonitoringPage />} />
              <Route path="thermal" element={<ThermalMonitoringPage />} />
              <Route path="vibration" element={<VibrationMonitoringPage />} />
              <Route path="devices" element={<div className="p-8 text-center text-slate-500">设备管理模块开发中...</div>} />
              <Route path="users" element={<div className="p-8 text-center text-slate-500">用户管理模块开发中...</div>} />
            </Route>

            {/* 兼容旧路由，重定向到新的后台路径 */}
            <Route path="xlpe-monitoring" element={<Navigate to="dashboard/monitor" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default SmartTechApp;
