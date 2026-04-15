export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = Number(value.replace(/,/g, '').trim());
    return Number.isFinite(normalized) ? normalized : fallback;
  }

  return fallback;
}

export function formatNumber(value: unknown, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat('en-NG', options).format(toNumber(value));
}

export function formatMoney(
  value: unknown,
  currency = 'NGN',
  options?: Intl.NumberFormatOptions
): string {
  const symbol = currency === 'USD' ? '$' : '₦';
  const minimumFractionDigits = currency === 'USD' ? 2 : 0;
  const maximumFractionDigits = currency === 'USD' ? 2 : 0;
  const amount = toNumber(value);
  const sign = amount < 0 ? '-' : '';

  return `${sign}${symbol}${formatNumber(Math.abs(amount), {
    minimumFractionDigits,
    maximumFractionDigits,
    ...options,
  })}`;
}
