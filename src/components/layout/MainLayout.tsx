'use client';

import Header from './Header';
import ChatSection from './ChatSection';
import InfoSection from './InfoSection';
import ChatInput from '../chat/ChatInput';
import ChatHistory from '../chat/ChatHistory';

export default function MainLayout() {
  return (
    <div className="main-grid bg-white">
      {/* Header */}
      <Header />
      
      {/* Main Content - chứa chat section và info section, chiều cao cố định */}
      <main className="flex overflow-hidden main-content">
        {/* Chat Section - bên trái, nhưng KHÔNG bao gồm chat input */}
        <div className="border-r border-neutral-200 flex flex-col bg-white h-full" style={{ width: '400px' }}>
          {/* Chat Header */}
          <div className="border-b border-neutral-200 bg-white px-4 py-2 flex-shrink-0">
            <h2 className="font-medium text-neutral-900">Trò chuyện</h2>
            <p className="text-sm text-neutral-500">Tư vấn bất động sản thông minh</p>
          </div>

          {/* Chat History - chiếm hết không gian, KHÔNG bao gồm input */}
          <div className="flex-1 overflow-hidden">
            <ChatHistory />
          </div>
        </div>
        
        {/* Info Section - bên phải, chiều cao cố định từ header đến cuối */}
        <div className="flex-1 h-full">
          <InfoSection />
        </div>
      </main>
      
      {/* Chat Input - riêng biệt ở dưới cùng, span toàn bộ chiều rộng */}
      <div className="bg-white border-t border-neutral-200" style={{ height: '66px' }}>
        <div className="h-full w-full">
          <ChatInput />
        </div>
      </div>
    </div>
  );
}
