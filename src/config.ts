// For local dev, we might need the full URL if running on different ports
// For production/cloud where frontend is served by backend, relative path is best
export const API_URL = window.location.port === '8081' 
  ? `http://${window.location.hostname}:3001/api` 
  : '/api';
