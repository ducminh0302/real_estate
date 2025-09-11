'use client';

import { FileText, Map, Home } from 'lucide-react';
import { useTabStore } from '@/lib/store/tabStore';
import ApiStatus from '@/components/ui/ApiStatus';

export default function Header() {
  const { activeTab, setActiveTab } = useTabStore();

  const tabs = [
    { id: 'sheet-info', label: 'Thông tin dự án', icon: FileText },
    { id: 'project-map', label: 'Bản đồ', icon: Map },
    { id: 'floor-plans', label: 'Mặt bằng', icon: Home }
  ];

  return (
    <header className="bg-white border-b border-neutral-200 px-6 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-primary-500 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-xs">RE</span>
            </div>
            <h1 className="text-lg font-semibold text-neutral-900">
              Real Estate Chat Interface
            </h1>
          </div>
          
          {/* API Status */}
          <ApiStatus />
        </div>
        
        {/* Tabs moved to header */}
        <nav className="flex">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors
                  ${activeTab === tab.id 
                    ? 'text-primary-600 border-primary-600' 
                    : 'text-neutral-600 border-transparent hover:text-neutral-800 hover:border-neutral-300'}
                `}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
