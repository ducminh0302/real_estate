'use client';

import { useState, useEffect } from 'react';
import ObjectInfoButton from './ObjectInfoButton';

interface ObjectData {
  zone_name: string | null;
  buildings: string | null;
  apartments: string | null;
}

interface ChatMessageProps {
  sender: 'user' | 'bot';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  objectData?: ObjectData[];
  onSearch?: (searchTerm: string) => void;
}

export default function ChatMessage({ 
  sender, 
  content, 
  timestamp, 
  isLoading = false,
  objectData,
  onSearch = () => {}
}: ChatMessageProps) {
  // Nếu là loading state
  if (isLoading) {
    return (
      <div className="flex justify-start">
        <div className="max-w-[80%] rounded-lg p-3 bg-white border border-gray-200 rounded-bl-none">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
          <div className="text-xs mt-1 text-gray-500">
            Đang suy nghĩ, hãy chờ chút...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${sender === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div 
        className={`max-w-[80%] rounded-lg p-3 ${
          sender === 'user' 
            ? 'bg-blue-500 text-white rounded-br-none' 
            : 'bg-white border border-gray-200 rounded-bl-none'
        }`}
      >
        <div className="text-sm whitespace-pre-wrap">{content}</div>
        {objectData && objectData.length > 0 && sender === 'bot' && (
          <ObjectInfoButton 
            data={objectData} 
            onSearch={onSearch} 
          />
        )}
        <div className={`text-xs mt-1 ${sender === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
          {timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}