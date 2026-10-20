/** Extracts the numeric amount from labels like "$29.99" or "Item total: $39.98". */
export function parseMoney(text: string): number {
  const match = /\$(\d+(?:\.\d{1,2})?)/.exec(text);
  if (!match?.[1]) throw new Error(`No dollar amount found in "${text}"`);
  return Number(match[1]);
}

/** Rounds to cents the way the app does, avoiding floating point drift in assertions. */
export function roundCents(amount: number): number {
  return Math.round(amount * 100) / 100;
}
