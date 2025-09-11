'use client';

import { useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';
import { useChatStore } from '@/lib/store/chatStore';

export default function ChatHistory() {
  const { messages, isLoading, currentTyping } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new message arrives
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [messages, isLoading]);

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-neutral-300 scrollbar-track-transparent"
    >
      {/* Messages */}
      {messages.map((message) => (
        <ChatMessage key={message.id} message={message} />
      ))}

      {/* Loading state */}
      {isLoading && (
        <ChatMessage 
          message={{
            id: 'loading',
            content: '',
            sender: 'assistant',
            timestamp: new Date(),
            isLoading: true
          }}
        />
      )}

      {/* Typing indicator */}
      {currentTyping && !isLoading && (
        <div className="flex gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-neutral-200 text-neutral-700 flex items-center justify-center">
            <div className="w-3 h-3 bg-neutral-400 rounded-full animate-pulse"></div>
          </div>
          <div className="flex-1">
            <div className="inline-block px-4 py-3 bg-neutral-100 text-neutral-600 rounded-2xl rounded-bl-md text-sm">
              {currentTyping}
            </div>
          </div>
        </div>
      )}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
}
