import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Activity, 
  Monitor, 
  Settings, 
  Users, 
  Menu, 
  X,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Zap,
  Volume2,
  Thermometer,
  Vibrate
} from 'lucide-react';

const DashboardLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { 
      path: '/smart-tech/dashboard/monitor', 
      label: '综合状态监测', 
      icon: Monitor 
    },
    { 
      path: '/smart-tech/dashboard/electrical', 
      label: '电学状态分析', 
      icon: Zap 
    },
    { 
      path: '/smart-tech/dashboard/acoustic', 
      label: '声学状态分析', 
      icon: Volume2 
    },
    { 
      path: '/smart-tech/dashboard/thermal', 
      label: '热学状态分析', 
      icon: Thermometer 
    },
    { 
      path: '/smart-tech/dashboard/vibration', 
      label: '振动状态分析', 
      icon: Vibrate 
    },
    { 
      path: '/smart-tech/dashboard/analysis', 
      label: 'XLPE状态分析', 
      icon: Activity 
    },
    { 
      path: '/smart-tech/dashboard/devices', 
      label: '设备管理', 
      icon: Settings 
    },
    { 
      path: '/smart-tech/dashboard/users', 
      label: '用户管理', 
      icon: Users 
    }
  ];

  const handleLogout = () => {
    navigate('/smart-tech/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          bg-white border-r border-gray-200 shadow-sm
          transition-all duration-300 ease-in-out
          ${collapsed ? 'w-20' : 'w-64'}
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo Area */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
          {!collapsed && (
            <span className="text-xl font-bold bg-gradient-to-r from-brand-600 to-blue-600 bg-clip-text text-transparent truncate">
              SmartTech Admin
            </span>
          )}
          {collapsed && (
            <div className="w-8 h-8 rounded bg-brand-600 flex items-center justify-center text-white font-bold mx-auto">
              S
            </div>
          )}
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
          <button 
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            <X size={20} />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setMobileMenuOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors
                  ${isActive 
                    ? 'bg-brand-50 text-brand-600 font-medium' 
                    : 'text-slate-600 hover:bg-gray-50 hover:text-slate-900'}
                  ${collapsed ? 'justify-center' : ''}
                `}
                title={collapsed ? item.label : undefined}
              >
                <item.icon size={20} />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className={`
              w-full flex items-center gap-3 px-3 py-3 rounded-lg text-red-500 hover:bg-red-50 transition-colors
              ${collapsed ? 'justify-center' : ''}
            `}
            title={collapsed ? '退出登录' : undefined}
          >
            <LogOut size={20} />
            {!collapsed && <span>退出登录</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8">
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600"
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-4 ml-auto">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold">
                A
              </div>
              <span className="text-sm font-medium text-slate-700 hidden sm:block">管理员</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
