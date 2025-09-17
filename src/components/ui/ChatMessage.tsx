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
  const [formattedTime, setFormattedTime] = useState<string>('');

  useEffect(() => {
    setFormattedTime(timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }));
  }, [timestamp]);

  // Function để convert markdown formatting
  const formatContent = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>') // Convert **text** to bold
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>') // Convert *text* to italic
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono">$1</code>') // Convert `code` to styled code
      .replace(/^• (.+)$/gm, '<div class="flex items-start gap-2 my-1"><span class="text-blue-500 font-bold">•</span><span>$1</span></div>') // Convert • bullets to styled lists
      .replace(/\n\n/g, '<br><br>') // Convert double line breaks to HTML breaks
      .replace(/\n/g, '<br>'); // Convert single line breaks to HTML breaks
  };

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
        <div 
          className="text-sm whitespace-pre-wrap [&>strong]:font-bold [&>em]:italic [&>code]:bg-gray-100 [&>code]:px-1 [&>code]:py-0.5 [&>code]:rounded [&>code]:text-xs [&>code]:font-mono"
          dangerouslySetInnerHTML={{ __html: formatContent(content) }}
        />
        {objectData && objectData.length > 0 && sender === 'bot' && (
          <ObjectInfoButton 
            data={objectData} 
            onSearch={onSearch} 
          />
        )}
        <div className={`text-xs mt-1 ${sender === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
          {formattedTime}
        </div>
      </div>
    </div>
  );
}
