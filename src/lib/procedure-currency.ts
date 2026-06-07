export type ProcedureCurrency = 'EUR' | 'RON';

export const DEFAULT_EUR_TO_RON_RATE = 5.26;

export function toLei(
  amount: number,
  currency: ProcedureCurrency | string = 'EUR',
  rate: number = DEFAULT_EUR_TO_RON_RATE
): number {
  if (currency === 'RON') return amount;
  return amount * rate;
}

export function toEur(
  amount: number,
  currency: ProcedureCurrency | string = 'EUR',
  rate: number = DEFAULT_EUR_TO_RON_RATE
): number {
  if (currency === 'RON') return amount / rate;
  return amount;
}

export function fromLeiToStored(
  leiAmount: number,
  currency: ProcedureCurrency | string = 'EUR',
  rate: number = DEFAULT_EUR_TO_RON_RATE
): number {
  if (currency === 'RON') return leiAmount;
  return leiAmount / rate;
}

export function formatLei(amount: number): string {
  const rounded = Math.round(amount);
  return `${rounded.toLocaleString('ro-RO')} lei`;
}

export function formatEur(amount: number, approximate = false): string {
  const prefix = approximate ? '≈ ' : '';
  return `${prefix}€${amount.toFixed(2)}`;
}
