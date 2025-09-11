'use client';

import { useState } from 'react';
import { Send, Loader2, Paperclip, Mic, Image } from 'lucide-react';
import { useChatStore } from '@/lib/store/chatStore';
import { useTabStore } from '@/lib/store/tabStore';

interface ChatInputProps {
  placeholder?: string;
}

export default function ChatInput({ 
  placeholder = "Hỏi về thông tin bất động sản..." 
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const { sendMessage, isLoading, error } = useChatStore();
  const { activeTab } = useTabStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      const userMessage = message.trim();
      setMessage('');

      // Chuẩn bị context từ trạng thái hiện tại
      const context = {
        activeTab,
        timestamp: new Date().toISOString(),
      };

      // Bạn có thể thêm custom headers ở đây nếu cần
      const customHeaders = {
        'X-Client-Version': '1.0.0',
        'X-Request-ID': Date.now().toString(),
        // Thêm các headers khác nếu cần
      };

      // Gọi API thông qua store
      await sendMessage(userMessage, context, customHeaders);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="bg-white h-full flex items-center px-4" style={{ paddingLeft: '66px', paddingRight: '66px' }}> {/* Margin 66px cả hai bên */}
      {/* Error message - floating absolute nếu có */}
      {error && (
        <div className="absolute bottom-16 right-20 rounded-lg bg-red-50 border border-red-200 px-2 py-1 shadow-lg">
          <p className="text-xs text-red-600">⚠️ {error}</p>
        </div>
      )}
      
      {/* Container chính - giờ chiếm toàn bộ không gian còn lại */}
      <div className="flex items-center space-x-3 w-full">
        {/* Chat Input - chiếm phần lớn không gian */}
        <div className="flex-1">
          <form onSubmit={handleSubmit} className="flex items-center space-x-2">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              disabled={isLoading}
              rows={1}
              className="w-full resize-none rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50"
              style={{
                minHeight: '38px',
                maxHeight: '42px'
              }}
            />
          </form>
        </div>
        
        {/* Vùng công cụ - dành chỗ cho các nút tương lai */}
        <div className="flex items-center space-x-2">
          {/* Nút công cụ 1 - Attach file */}
          <button
            type="button"
            disabled={isLoading}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-300 text-neutral-600 transition-colors hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Đính kèm file (Tính năng sắp có)"
          >
            <Paperclip size={16} />
          </button>
          
          {/* Nút công cụ 2 - Voice input */}
          <button
            type="button"
            disabled={isLoading}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-300 text-neutral-600 transition-colors hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Nhập bằng giọng nói (Tính năng sắp có)"
          >
            <Mic size={16} />
          </button>
          
          {/* Nút công cụ 3 - Image input */}
          <button
            type="button"
            disabled={isLoading}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-300 text-neutral-600 transition-colors hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Thêm hình ảnh (Tính năng sắp có)"
          >
            <Image size={16} />
          </button>
        </div>
        
        {/* Nút gửi - mũi tên với màu xanh đậm */}
        <button
          type="submit"
          onClick={handleSubmit}
          disabled={!message.trim() || isLoading}
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          title="Gửi tin nhắn (Enter)"
        >
          {isLoading ? (
            <Loader2 size={18} className="animate-spin text-white" /> 
          ) : (
            <Send size={18} className="text-white" />
          )}
        </button>
      </div>
    </div>
  );
}
