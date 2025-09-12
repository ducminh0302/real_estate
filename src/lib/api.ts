// API configuration và helper functions
interface ApiConfig {
  baseURL: string;
  timeout: number;
  headers: Record<string, string>;
}

const defaultConfig: ApiConfig = {
  baseURL: '', // Sử dụng relative URLs
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  }
};

// Generic API call function
async function apiCall<T>(
  endpoint: string, 
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: unknown;
    headers?: Record<string, string>;
    timeout?: number;
  } = {}
): Promise<T> {
  const {
    method = 'GET',
    body,
    headers = {},
    timeout = defaultConfig.timeout
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(endpoint, {
      method,
      headers: {
        ...defaultConfig.headers,
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

// Real Estate API functions
export interface RealEstateQuery {
  type?: 'districts' | 'buildings' | 'apartments';
  search?: string;
}

export interface RealEstateData {
  data: unknown[];
  total: number;
  type?: string;
  search?: string;
}

export const realEstateAPI = {
  // Lấy thông tin bất động sản
  getData: async (query?: RealEstateQuery): Promise<RealEstateData> => {
    const params = new URLSearchParams();
    if (query?.type) params.append('type', query.type);
    if (query?.search) params.append('search', query.search);
    
    const endpoint = `/api/real-estate${params.toString() ? `?${params.toString()}` : ''}`;
    return apiCall<RealEstateData>(endpoint);
  },

  // Gửi context bất động sản
  sendContext: async (context: unknown, customHeaders?: Record<string, string>): Promise<unknown> => {
    return apiCall('/api/real-estate', {
      method: 'POST',
      body: context,
      headers: customHeaders,
    });
  },
};

// Error handling utilities
export class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: unknown
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Retry logic for failed requests
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (i === maxRetries) {
        break;
      }

      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }

  throw lastError!;
}

export default {
  realEstateAPI,
  withRetry,
  APIError,
};
