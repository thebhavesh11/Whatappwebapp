// Frontend API configuration
// Use NEXT_PUBLIC_API_URL environment variable, or default to localhost

export const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    // Client-side
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  }
  // Server-side
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
};

export const API_URL = getApiUrl();
