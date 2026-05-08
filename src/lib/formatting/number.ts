export function parseLocaleNumber(value: string): number | null {
  const normalized = value
    .trim()
    .replace(/\s+/g, "")
    .replace(/,/g, ".");

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
}

export function formatLocaleNumber(
  value: number | null,
  options?: Intl.NumberFormatOptions,
): string {
  if (value === null) {
    return "Недоступно";
  }

  return value.toLocaleString("ru-RU", options);
}

