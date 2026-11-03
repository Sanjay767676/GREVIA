import { api } from './api';

export const MAX_UPLOAD_MB = 8;
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

// Client-side guard so oversized or non-image files fail fast with a clear
// message instead of a silent server error.
export function validateImage(file: File): string | null {
  if (!file.type.startsWith('image/')) {
    return 'Please choose an image file (PNG, JPG or WebP).';
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    const mb = (file.size / (1024 * 1024)).toFixed(1);
    return `This image is ${mb} MB. The limit is ${MAX_UPLOAD_MB} MB.`;
  }
  return null;
}

export async function uploadImage(file: File, prefix: 'complaint' | 'proof'): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('prefix', prefix);
  const data = await api<{ path: string }>('/api/upload', { method: 'POST', body: fd });
  if (!data.path) throw new Error('The server did not return a file path');
  return data.path;
}
