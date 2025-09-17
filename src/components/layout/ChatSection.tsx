'use client';

import { useRef, useEffect } from 'react';
import ChatMessage from '@/components/ui/ChatMessage';
import { useChatStore } from '@/lib/store/chatStore';
import { useSearch } from './SearchContext';

export default function ChatSection() {
  const { messages, isLoading, clearMessages } = useChatStore();
  const { setSearchTerm } = useSearch();
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  // Hàm để tự động scroll xuống tin nhắn mới nhất
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Gọi scrollToBottom mỗi khi messages thay đổi
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSearch = (searchTerm: string) => {
    setSearchTerm(searchTerm);
  };

  // Hàm để tạo lại sessionId (xóa tin nhắn và tạo session mới)
  const handleClearChat = () => {
    // Xóa sessionId trong sessionStorage để tạo mới
    sessionStorage.removeItem('chatSessionId');
    // Clear messages
    clearMessages();
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 border-r border-gray-200">
      {/* Header của chat section */}
      <div className="border-b border-gray-200 p-4 bg-white flex-shrink-0 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">Trò chuyện</h2>
        <button 
          onClick={handleClearChat}
          className="text-sm text-blue-500 hover:text-blue-700"
          title="Bắt đầu cuộc trò chuyện mới"
        >
          Cuộc trò chuyện mới
        </button>
      </div>
      
      {/* Container cho các tin nhắn */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            sender={message.sender}
            content={message.content}
            timestamp={message.timestamp}
            objectData={message.objectData}
            floor={message.floor}
            apartment={message.apartment}
            onSearch={handleSearch}
          />
        ))}
        {isLoading && (
          <ChatMessage
            sender="bot"
            content=""
            timestamp={new Date()}
            isLoading={true}
          />
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}