import { create } from 'zustand';
import { ChatMessage } from '@/types';
import { chatAPI, ChatRequest, withRetry } from '@/lib/api';

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  currentTyping: string;
  error: string | null;
  
  // Actions
  addMessage: (message: Omit<ChatMessage, 'id'>) => void;
  setLoading: (loading: boolean) => void;
  setTyping: (typing: string) => void;
  clearMessages: () => void;
  updateLastMessage: (updates: Partial<ChatMessage>) => void;
  sendMessage: (content: string, context?: unknown, customHeaders?: Record<string, string>) => Promise<void>;
  setError: (error: string | null) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [
    {
      id: 'welcome',
      content: 'Xin chào! Tôi là trợ lý tư vấn bất động sản thông minh. Tôi có thể giúp bạn tìm hiểu thông tin về các căn hộ, vị trí, tiện ích và mọi thứ liên quan đến dự án. Hãy hỏi tôi bất kỳ điều gì bạn muốn biết!',
      sender: 'assistant',
      timestamp: new Date(),
    }
  ],
  isLoading: false,
  currentTyping: '',
  error: null,

  addMessage: (message) => {
    const newMessage: ChatMessage = {
      ...message,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    };
    
    set((state) => ({
      messages: [...state.messages, newMessage]
    }));
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  setTyping: (typing) => {
    set({ currentTyping: typing });
  },

  clearMessages: () => {
    set({ messages: [] });
  },

  updateLastMessage: (updates) => {
    set((state) => {
      const messages = [...state.messages];
      const lastIndex = messages.length - 1;
      if (lastIndex >= 0) {
        messages[lastIndex] = { ...messages[lastIndex], ...updates };
      }
      return { messages };
    });
  },

  setError: (error) => {
    set({ error });
  },

  sendMessage: async (content: string, context?: unknown, customHeaders?: Record<string, string>) => {
    const { addMessage, setLoading, setError } = get();
    
    try {
      setError(null);
      setLoading(true);

      // Thêm tin nhắn của user
      addMessage({
        content,
        sender: 'user',
        timestamp: new Date(),
      });

      // Chuẩn bị request
      const request: ChatRequest = {
        message: content,
        context: context as ChatRequest['context'],
        customHeaders,
      };

      // Gọi API với retry logic
      const response = await withRetry(
        () => chatAPI.sendMessage(request),
        3, // max 3 retries
        1000 // 1 second delay
      );

      // Thêm phản hồi từ assistant
      addMessage({
        content: response.message,
        sender: 'assistant',
        timestamp: new Date(response.timestamp),
      });

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi gửi tin nhắn';
      setError(errorMessage);
      
      // Thêm error message vào chat
      addMessage({
        content: `❌ Lỗi: ${errorMessage}`,
        sender: 'assistant',
        timestamp: new Date(),
      });
    } finally {
      setLoading(false);
    }
  },
}));
