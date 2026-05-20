const SPECIAL_SEARCH_CHARACTER_PATTERN = /[\p{Control}\p{Format}\p{Private_Use}\p{Surrogate}]/gu;

export function stripSpecialSearchCharacters(value: string): string {
  return value.replace(SPECIAL_SEARCH_CHARACTER_PATTERN, '');
}

export function normalizeGatherableSearchQuery(value: string): string {
  return stripSpecialSearchCharacters(value).trim().toLowerCase();
}

export function applySanitizedPaste(
  currentValue: string,
  pastedValue: string,
  selectionStart: number | null | undefined,
  selectionEnd: number | null | undefined
): string {
  const start = selectionStart ?? currentValue.length;
  const end = selectionEnd ?? start;
  const sanitizedPaste = stripSpecialSearchCharacters(pastedValue);

  return `${currentValue.slice(0, start)}${sanitizedPaste}${currentValue.slice(end)}`;
}
