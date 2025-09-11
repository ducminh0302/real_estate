'use client';

import { ChatMessage as MessageType } from '@/types';
import { Bot, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface ChatMessageProps {
  message: MessageType;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.sender === 'user';
  const isLoading = message.isLoading;

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className={`
        flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
        ${isUser 
          ? 'bg-primary-500 text-white' 
          : 'bg-neutral-200 text-neutral-700'
        }
      `}>
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>

      {/* Message Content */}
      <div className={`flex-1 max-w-[85%] ${isUser ? 'text-right' : 'text-left'}`}>
        {/* Message Bubble */}
        <div className={`
          inline-block px-4 py-3 rounded-2xl text-sm
          ${isUser 
            ? 'bg-primary-500 text-white rounded-br-md' 
            : 'bg-white border border-neutral-200 text-neutral-900 rounded-bl-md shadow-sm'
          }
          ${isLoading ? 'animate-pulse' : ''}
        `}>
          {isLoading ? (
            <div className="flex items-center gap-1">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"></div>
              </div>
              <span className="text-xs text-neutral-500 ml-2">Đang suy nghĩ...</span>
            </div>
          ) : (
            <div className="whitespace-pre-wrap break-words">
              {message.content}
            </div>
          )}
        </div>

        {/* Timestamp */}
        {!isLoading && (
          <div className={`text-xs text-neutral-500 mt-1 px-1 ${isUser ? 'text-right' : 'text-left'}`}>
            {formatDistanceToNow(message.timestamp, { 
              addSuffix: true,
              locale: vi 
            })}
          </div>
        )}
      </div>
    </div>
  );
}
