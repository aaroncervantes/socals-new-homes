export function nationalDigits(input: string): string {
  const digits = input.replace(/\D/g, "");
  const national = digits.length > 10 && digits.startsWith("1") ? digits.slice(1) : digits;
  return national.slice(0, 10);
}

export function formatUsPhone(input: string): string {
  const digits = nationalDigits(input);
  if (digits.length === 0) return "";
  if (digits.length < 4) return `(${digits}`;
  if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function phoneError(input: string): string | null {
  const digits = nationalDigits(input);
  if (digits.length < 10) return "Enter a complete phone number.";
  if (!/^[2-9]\d{2}[2-9]\d{6}$/.test(digits)) return "Enter a valid US phone number.";
  if (/^(\d)\1{9}$/.test(digits)) return "Enter a valid US phone number.";
  return null;
}

export function toE164(input: string): string | null {
  if (phoneError(input)) return null;
  return `+1${nationalDigits(input)}`;
}
