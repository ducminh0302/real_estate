import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface ObjectData {
  zone_name: string | null;
  buildings: string | null;
  apartments: string | null;
}

interface Message {
  id: string;
  sender: 'user' | 'bot';
  content: string;
  timestamp: Date;
  objectData?: ObjectData[];
  floor?: string;
  apartment?: string;
}

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  setLoading: (loading: boolean) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>()(
  devtools((set) => ({
    messages: [
      {
        id: '1',
        sender: 'bot',
        content: 'Chào mừng bạn đến với hệ thống tư vấn bất động sản thông minh! Tôi có thể giúp gì cho bạn hôm nay?',
        timestamp: new Date()
      }
    ],
    isLoading: false,
    
    addMessage: (message) => 
      set((state) => ({
        messages: [
          ...state.messages,
          {
            ...message,
            id: Date.now().toString(),
            timestamp: new Date()
          }
        ]
      })),
      
    setLoading: (loading) => 
      set({ isLoading: loading }),
      
    clearMessages: () => 
      set({
        messages: [
          {
            id: '1',
            sender: 'bot',
            content: 'Chào mừng bạn đến với hệ thống tư vấn bất động sản thông minh! Tôi có thể giúp gì cho bạn hôm nay?',
            timestamp: new Date()
          }
        ]
      })
  }))
);