'use client';

import { useState } from 'react';
import { Send, Paperclip, Image, Mic } from 'lucide-react';
import { useChatStore } from '@/lib/store/chatStore';

export default function ChatInput() {
  const [inputValue, setInputValue] = useState('');
  const { addMessage, setLoading } = useChatStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      // Thêm tin nhắn của người dùng vào store
      addMessage({
        sender: 'user',
        content: inputValue
      });
      
      // Lưu lại input để gửi API
      const userMessage = inputValue;
      setInputValue('');
      
      // Bắt đầu trạng thái loading
      setLoading(true);
      
      try {
        // Gọi API
        const response = await fetch('https://238666ff13c1.ngrok-free.app/webhook/f71d4835-02c9-4462-91a8-22830f4b6f3d/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            sessionId: 'test-session-123', // SessionId cố định để test
            chatInput: userMessage
          })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Xử lý object data nếu có
        let objectData = null;
        if (data.object) {
          try {
            // Loại bỏ phần markdown code block wrapper nếu có
            let objectString = data.object;
            if (objectString.startsWith('```json')) {
              objectString = objectString.substring(7); // Loại bỏ '```json'
            }
            if (objectString.startsWith('```')) {
              objectString = objectString.substring(3); // Loại bỏ '```'
            }
            if (objectString.endsWith('```')) {
              objectString = objectString.substring(0, objectString.length - 3); // Loại bỏ '```'
            }
            // Loại bỏ khoảng trắng đầu và cuối
            objectString = objectString.trim();
            
            // Parse object data từ chuỗi JSON
            objectData = JSON.parse(objectString);
          } catch (parseError) {
            console.error('Error parsing object data:', parseError);
            console.error('Object data string:', data.object);
          }
        }
        
        // Thêm phản hồi từ bot vào store
        addMessage({
          sender: 'bot',
          content: data.output || 'Xin lỗi, tôi không thể xử lý yêu cầu của bạn lúc này.',
          objectData: objectData
        });
      } catch (error) {
        console.error('Error sending message:', error);
        addMessage({
          sender: 'bot',
          content: 'Xin lỗi, đã có lỗi xảy ra khi xử lý yêu cầu của bạn. Vui lòng thử lại sau.'
        });
      } finally {
        // Kết thúc trạng thái loading
        setLoading(false);
      }
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white h-full">
      <form onSubmit={handleSubmit} className="flex items-center gap-2 h-full px-4">
        {/* Các nút công cụ bên trái */}
        <div className="flex items-center gap-1">
          <button 
            type="button" 
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            title="Đính kèm tệp"
          >
            <Paperclip size={20} />
          </button>
          <button 
            type="button" 
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            title="Hình ảnh"
          >
            <Image size={20} />
          </button>
          <button 
            type="button" 
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            title="Ghi âm"
          >
            <Mic size={20} />
          </button>
        </div>
        
        {/* Ô nhập liệu */}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Nhập tin nhắn của bạn..."
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        
        {/* Nút gửi */}
        <button
          type="submit"
          disabled={!inputValue.trim()}
          className="bg-blue-500 text-white rounded-lg p-2 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Gửi tin nhắn"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}