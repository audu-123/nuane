import React from 'react';
import { ClipboardList, Target, MessageCircle, Archive } from 'lucide-react';
import type { Page } from '../types';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const navItems: { page: Page; icon: React.ReactNode; label: string }[] = [
  { page: 'queue', icon: <ClipboardList size={20} />, label: '待面试列表' },
  { page: 'scoring', icon: <Target size={20} />, label: '面试打分' },
  { page: 'candidate', icon: <MessageCircle size={20} />, label: '候选人视角' },
  { page: 'archive', icon: <Archive size={20} />, label: '面试记录' },
];

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate }) => {
  return (
    <aside className="w-56 min-h-screen bg-white border-r border-gray-100 flex flex-col shadow-sm">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#0052D9] flex items-center justify-center">
            <span className="text-white text-sm font-bold">暖</span>
          </div>
          <div>
            <div className="text-sm font-bold text-gray-800">暖鹅</div>
            <div className="text-xs text-gray-400">面试反馈智能站</div>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 px-3">
        {navItems.map((item) => {
          const isActive = currentPage === item.page;
          return (
            <button
              key={item.page}
              onClick={() => onNavigate(item.page)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-[#EEF3FF] text-[#0052D9]'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`}
            >
              <span className={isActive ? 'text-[#0052D9]' : 'text-gray-400'}>
                {item.icon}
              </span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#0052D9] to-[#3B82F6] flex items-center justify-center text-xs text-white font-bold">
            面
          </div>
          <div>
            <div className="text-xs font-medium text-gray-700">张三 面试官</div>
            <div className="text-xs text-gray-400">腾讯互娱</div>
          </div>
        </div>
      </div>
    </aside>
  );
};
