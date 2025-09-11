'use client';

import { useEffect, useState } from 'react';
import ChatHistory from '../chat/ChatHistory';

interface ChatSectionProps {
  className?: string;
}

export default function ChatSection({ className = '' }: ChatSectionProps) {
  const [chatWidth, setChatWidth] = useState(0);
  
  useEffect(() => {
    const updateDimensions = () => {
      if (typeof window === 'undefined') return;
      
      // Tính toán chiều cao available chính xác - header 64px + chat input 80px = 144px
      const reservedHeight = 144;
      const availableHeight = window.innerHeight - reservedHeight;
      
      // Tính width dựa trên chiều cao available thực tế
      const searchWidth = 400;
      const mapAspectRatio = 10567 / 9495;
      const mapWidth = availableHeight * mapAspectRatio;
      const totalInfoWidth = mapWidth + searchWidth;
      const calculatedChatWidth = window.innerWidth - totalInfoWidth - 10;
      setChatWidth(Math.max(300, calculatedChatWidth));
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  return (
    <section 
      className={`border-r border-neutral-200 flex flex-col bg-white h-full ${className}`}
      style={{ width: chatWidth || 300 }}
    >
      {/* Chat Header */}
      <div className="border-b border-neutral-200 bg-white px-4 py-2 flex-shrink-0">
        <h2 className="font-medium text-neutral-900">Trò chuyện</h2>
        <p className="text-sm text-neutral-500">Tư vấn bất động sản thông minh</p>
      </div>

      {/* Chat History - Chiếm hết không gian còn lại */}
      <div className="flex-1 overflow-hidden">
        <ChatHistory />
      </div>
    </section>
  );
}
