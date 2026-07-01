// ISBN validation + derivation. Pure, deterministic — no network.

/** Strip everything but digits and a trailing X (ISBN-10 check char). */
function clean(raw: string): string {
  return raw.replace(/[^0-9Xx]/g, "").toUpperCase();
}

/** Validate an ISBN-10 checksum. */
export function isValidIsbn10(raw: string): boolean {
  const s = clean(raw);
  if (s.length !== 10) return false;
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    const ch = s[i];
    const val = i === 9 && ch === "X" ? 10 : Number(ch);
    if (Number.isNaN(val)) return false;
    sum += (10 - i) * val;
  }
  return sum % 11 === 0;
}

/** Validate an ISBN-13 checksum. */
export function isValidIsbn13(raw: string): boolean {
  const s = clean(raw);
  if (s.length !== 13 || /[^0-9]/.test(s)) return false;
  let sum = 0;
  for (let i = 0; i < 13; i++) {
    const val = Number(s[i]);
    sum += (i % 2 === 0 ? 1 : 3) * val;
  }
  return sum % 10 === 0;
}

/** Compute the ISBN-13 check digit for the first 12 digits. */
function isbn13CheckDigit(first12: string): string {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += (i % 2 === 0 ? 1 : 3) * Number(first12[i]);
  }
  return String((10 - (sum % 10)) % 10);
}

/**
 * Derive a valid ISBN-13 from a valid ISBN-10 (978 prefix + recomputed check).
 * Returns null if the input ISBN-10 is itself invalid.
 */
export function isbn13FromIsbn10(raw: string): string | null {
  if (!isValidIsbn10(raw)) return null;
  const core = clean(raw).slice(0, 9); // drop the ISBN-10 check char
  const first12 = "978" + core;
  return first12 + isbn13CheckDigit(first12);
}
