'use client';

import { useRef, useEffect } from 'react';
import ChatMessage from '@/components/ui/ChatMessage';
import { useChatStore } from '@/lib/store/chatStore';
import { useSearch } from './SearchContext';

export default function ChatSection() {
  const { messages, isLoading } = useChatStore();
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

  return (
    <div className="flex flex-col h-full bg-gray-50 border-r border-gray-200">
      {/* Header của chat section */}
      <div className="border-b border-gray-200 p-4 bg-white flex-shrink-0">
        <h2 className="text-lg font-semibold text-gray-800">Trò chuyện</h2>
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