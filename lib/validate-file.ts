export async function validateImageFile(file: File): Promise<{ valid: boolean, error?: string }> {
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: 'File tidak valid. Gunakan JPG, PNG, atau WebP maksimal 5MB' };
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'File tidak valid. Gunakan JPG, PNG, atau WebP maksimal 5MB' };
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = (e) => {
      const arr = new Uint8Array(e.target?.result as ArrayBuffer);
      const header = Array.from(arr.subarray(0, 4)).map(byte => byte.toString(16).padStart(2, '0')).join('').toUpperCase();
      
      let isValid = false;

      if (header.startsWith('FFD8FF')) {
        isValid = true;
      } else if (header.startsWith('89504E47')) {
        isValid = true;
      } else if (header.startsWith('52494646')) {
        const format = Array.from(arr.subarray(8, 12)).map(byte => String.fromCharCode(byte)).join('');
        if (format === 'WEBP') {
          isValid = true;
        }
      }

      if (isValid) {
        resolve({ valid: true });
      } else {
        resolve({ valid: false, error: 'File tidak valid. Gunakan JPG, PNG, atau WebP maksimal 5MB' });
      }
    };
    reader.onerror = () => {
      resolve({ valid: false, error: 'Gagal membaca file' });
    };
    
    reader.readAsArrayBuffer(file.slice(0, 12));
  });
}
