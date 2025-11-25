import { API_CONFIG } from '../config/api';

// 请求拦截器
interface RequestOptions extends RequestInit {
  timeout?: number;
}

// 获取token
const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
}

// 清除token
const clearAuthToken = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('userInfo');
}

// 处理响应
const handleResponse = async (response: Response) => {
  const contentType = response.headers.get('content-type');
  
  if (!response.ok) {
    if (response.status === 401) {
      // 未授权，清除token并跳转到登录页
      clearAuthToken();
      window.location.href = '/login';
      throw new Error('未授权访问');
    }
    
    let errorMessage = '请求失败';
    try {
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || '请求失败';
      } else {
        errorMessage = await response.text();
      }
    } catch (e) {
      errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    }
    
    throw new Error(errorMessage);
  }
  
  try {
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      return await response.text();
    }
  } catch (e) {
    return null;
  }
}

// 创建请求
const createRequest = async (url: string, options: RequestOptions = {}) => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...API_CONFIG.HEADERS,
    ...(options.headers as Record<string, string>),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout || API_CONFIG.TIMEOUT);
  
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}${url}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return await handleResponse(response);
  } catch (error) {
    clearTimeout(timeoutId);
    
    if ((error as Error).name === 'AbortError') {
      throw new Error('请求超时');
    }
    
    throw error;
  }
}

// GET请求
export const get = async (url: string, params?: Record<string, any>, options?: RequestOptions) => {
  let fullUrl = url;
  if (params) {
    const queryString = new URLSearchParams(params).toString();
    fullUrl = `${url}?${queryString}`;
  }
  
  return createRequest(fullUrl, {
    ...options,
    method: 'GET',
  });
}

// POST请求
export const post = async (url: string, data?: any, options?: RequestOptions) => {
  return createRequest(url, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

// PUT请求
export const put = async (url: string, data?: any, options?: RequestOptions) => {
  return createRequest(url, {
    ...options,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
}

// DELETE请求
export const del = async (url: string, options?: RequestOptions) => {
  return createRequest(url, {
    ...options,
    method: 'DELETE',
  });
}

// 上传文件
export const uploadFile = async (url: string, file: File, onProgress?: (progress: number) => void) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const token = getAuthToken();
  const headers: HeadersInit = {};
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    if (onProgress) {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      });
    }
    
    xhr.addEventListener('load', async () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (e) {
          resolve(xhr.responseText);
        }
      } else {
        reject(new Error(`上传失败: ${xhr.statusText}`));
      }
    });
    
    xhr.addEventListener('error', () => {
      reject(new Error('上传失败'));
    });
    
    xhr.addEventListener('timeout', () => {
      reject(new Error('上传超时'));
    });
    
    xhr.timeout = API_CONFIG.TIMEOUT;
    xhr.open('POST', `${API_CONFIG.BASE_URL}${url}`);
    
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }
    
    xhr.send(formData);
  });
}

export default {
  get,
  post,
  put,
  delete: del,
  uploadFile,
};