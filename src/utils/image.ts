const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function getImageUrl(path?: string | null): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path; 
  }
  return `${API_URL}${path}`; 
}