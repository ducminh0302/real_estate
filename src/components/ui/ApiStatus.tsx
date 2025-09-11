'use client';

import { useState, useEffect } from 'react';
import { Settings, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface ApiStatusProps {
  className?: string;
}

type ApiStatus = 'checking' | 'connected' | 'disconnected' | 'mock';

export default function ApiStatus({ className }: ApiStatusProps) {
  const [status, setStatus] = useState<ApiStatus>('checking');
  const [endpoint, setEndpoint] = useState<string>('');

  useEffect(() => {
    checkApiStatus();
  }, []);

  const checkApiStatus = async () => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'API Status Check',
          context: { isStatusCheck: true },
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        // Kiểm tra xem có phải mock response không
        if (data.message?.includes('API mock')) {
          setStatus('mock');
        } else {
          setStatus('connected');
        }
      } else {
        setStatus('disconnected');
      }
    } catch (error) {
      console.error('API status check failed:', error);
      setStatus('disconnected');
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'checking':
        return <AlertCircle size={16} className="text-yellow-500 animate-pulse" />;
      case 'connected':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'disconnected':
        return <XCircle size={16} className="text-red-500" />;
      case 'mock':
        return <Settings size={16} className="text-blue-500" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'checking':
        return 'Đang kiểm tra API...';
      case 'connected':
        return 'API đã kết nối';
      case 'disconnected':
        return 'API không khả dụng';
      case 'mock':
        return 'Đang sử dụng Mock API';
      default:
        return '';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'checking':
        return 'text-yellow-600';
      case 'connected':
        return 'text-green-600';
      case 'disconnected':
        return 'text-red-600';
      case 'mock':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {getStatusIcon()}
      <span className={`text-xs font-medium ${getStatusColor()}`}>
        {getStatusText()}
      </span>
      {status === 'mock' && (
        <button
          onClick={checkApiStatus}
          className="text-xs text-blue-500 hover:text-blue-700 underline"
        >
          Kiểm tra lại
        </button>
      )}
    </div>
  );
}
