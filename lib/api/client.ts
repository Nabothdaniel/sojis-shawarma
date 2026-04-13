import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper for simple encryption using Web Crypto API
async function encryptSensitive(value: string): Promise<string> {
  try {
    const keyText = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'BAMZY-DEFAULT-KEY-2026';
    const encoder = new TextEncoder();
    
    // PHP uses hash('sha256', $key, true), so we must digest the key text
    const keyHash = await crypto.subtle.digest('SHA-256', encoder.encode(keyText));
    
    const data = encoder.encode(value);
    
    // Convert hashed key to a crypto key
    const keyBuffer = await crypto.subtle.importKey(
      'raw',
      keyHash,
      { name: 'AES-CBC' },
      false,
      ['encrypt']
    );

    const iv = crypto.getRandomValues(new Uint8Array(16));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-CBC', iv },
      keyBuffer,
      data
    );

    // Combine IV and Encrypted data, then base64 encode
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    return btoa(String.fromCharCode(...combined));
  } catch (e) {
    console.error('Encryption failed', e);
    return value; // Fallback to plain text if crypto fails
  }
}

// Request interceptor for attaching token and encrypting sensitive data
apiClient.interceptors.request.use(
  async (config) => {
    if (typeof window !== 'undefined') {
      // 1. Attach Auth Token
      // 1. Attach Auth Token (Session Isolation)
      let token = sessionStorage.getItem('bamzysms-token');
      
      // Fallback to localStorage ONLY for persistent login if desired, 
      // but for isolation, sessionStorage is safer.
      if (!token) {
        token = localStorage.getItem('bamzysms-token');
      }

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // 2. Encrypt sensitive fields (password, pin)
      if (config.data) {
        if (config.data.password) {
          config.data.password = await encryptSensitive(config.data.password);
        }
        if (config.data.pin) {
          config.data.pin = await encryptSensitive(config.data.pin);
        }
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

export default apiClient;
