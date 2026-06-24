export function normalizePhone(phone: string): string {
  if (!phone) return phone;
  const cleanPhone = phone.trim();
  if (cleanPhone.startsWith('0')) {
    return '+62' + cleanPhone.slice(1);
  }
  if (cleanPhone.startsWith('62')) {
    return '+' + cleanPhone;
  }
  return cleanPhone;
}
