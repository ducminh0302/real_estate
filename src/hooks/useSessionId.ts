import { useState, useEffect } from 'react';

export function generateSessionId(): string {
  // Tạo một sessionId duy nhất dựa trên timestamp và random number
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function useSessionId(): string {
  const [sessionId, setSessionId] = useState<string>('');

  useEffect(() => {
    // Kiểm tra xem có sessionId trong sessionStorage không
    const storedSessionId = sessionStorage.getItem('chatSessionId');
    
    if (storedSessionId) {
      // Nếu có, sử dụng sessionId đã lưu
      setSessionId(storedSessionId);
    } else {
      // Nếu không, tạo mới sessionId và lưu vào sessionStorage
      const newSessionId = generateSessionId();
      sessionStorage.setItem('chatSessionId', newSessionId);
      setSessionId(newSessionId);
    }
  }, []);

  return sessionId;
}