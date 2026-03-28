import React from 'react';
import { Link } from 'react-router-dom';
import { Github, ChevronRight } from 'lucide-react';

const Footer = () => (
  <footer className="bg-slate-900 text-slate-300 pt-16 pb-8">
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        <div>
          <h3 className="text-white text-lg font-bold mb-4">SmartTech</h3>
          <p className="text-sm text-slate-400">
            通过新一代传感器与边缘 AI 解决方案，赋能工业智能，引领数字化转型。
          </p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4">产品中心</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/smart-tech/products" className="hover:text-brand-400">智能传感器</Link></li>
            <li><Link to="/smart-tech/products" className="hover:text-brand-400">边缘计算主机</Link></li>
            <li><Link to="/smart-tech/saas" className="hover:text-brand-400">SaaS 平台</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4">支持与服务</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/smart-tech/services" className="hover:text-brand-400">技术文档</Link></li>
            <li><Link to="/smart-tech/services" className="hover:text-brand-400">API 参考手册</Link></li>
            <li><Link to="/smart-tech/services" className="hover:text-brand-400">联系销售</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4">关注我们</h4>
          <div className="flex space-x-4">
            <button
              type="button"
              aria-label="GitHub 页面暂未配置"
              title="GitHub 页面暂未配置"
              className="app-icon-button rounded-lg hover:bg-slate-800 hover:text-brand-400"
            >
              <Github size={20} />
            </button>
            {/* Add more social icons as needed */}
          </div>
          <div className="mt-4">
            <label htmlFor="footer-newsletter-email" className="text-xs text-slate-500">订阅我们的最新动态</label>
            <div className="flex mt-2">
              <input
                id="footer-newsletter-email"
                type="email"
                placeholder="您的邮箱"
                className="bg-slate-800 text-white text-sm px-3 py-2 rounded-l w-full"
              />
              <button type="button" aria-label="提交邮箱订阅" className="app-icon-button bg-brand-600 px-3 py-2 rounded-r hover:bg-brand-700 text-white">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-800 pt-8 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} SmartTech Solutions Inc. 保留所有权利.
      </div>
    </div>
  </footer>
);

export default Footer;
