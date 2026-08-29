export function isValidSpanishPhone(value: string): boolean {
  const cleaned = value.replace(/\s+/g, "");
  return /^(?:\+34|0034)?[6789]\d{8}$/.test(cleaned);
}
