// Use environment variable or default to /api for proxy
// In production, this will be handled by the server serving the built files
const BASE_URL = import.meta.env.VITE_API_URL || (
  import.meta.env.MODE === 'production' 
    ? "https://www.odsglobal.net/api" 
    : "/api"
);

// Export the base URL for API calls
export default BASE_URL;

// Helper function to get full API URL
export const getApiUrl = (endpoint: string = '') => {
  const baseUrl = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
};

// Environment check
export const isDevelopment = import.meta.env.VITE_NODE_ENV === 'development';
export const isProduction = import.meta.env.VITE_NODE_ENV === 'production';


