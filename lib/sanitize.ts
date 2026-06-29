export function sanitizeText(input: string | null | undefined): string {
  if (!input) return '';
  
  let cleaned = input.trim();
  
  // Remove HTML tags
  cleaned = cleaned.replace(/<[^>]*>/g, '');
  cleaned = cleaned.replace(/&lt;/g, '').replace(/&gt;/g, '');
  
  // Remove script related keywords
  cleaned = cleaned.replace(/javascript:/gi, '');
  cleaned = cleaned.replace(/onerror=/gi, '');
  cleaned = cleaned.replace(/onload=/gi, '');
  cleaned = cleaned.replace(/<script/gi, '');
  
  // Strip < and > completely
  cleaned = cleaned.replace(/[<>]/g, '');
  
  return cleaned;
}

export function sanitizeOrder(data: any): any {
  if (typeof data !== 'object' || data === null) return data;
  
  const sanitized = { ...data };
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeText(sanitized[key]);
    }
  }
  return sanitized;
}
