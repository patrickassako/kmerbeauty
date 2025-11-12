export type CountryCode = 'CM' | 'CI';
export type CurrencyCode = 'XAF' | 'XOF';

export interface Currency {
  code: CurrencyCode;
  symbol: string;
  name: string;
  locale: string;
}

export const CURRENCIES: Record<CurrencyCode, Currency> = {
  XAF: {
    code: 'XAF',
    symbol: 'FCFA',
    name: 'Franc CFA (BEAC)',
    locale: 'fr-CM',
  },
  XOF: {
    code: 'XOF',
    symbol: 'FCFA',
    name: 'Franc CFA (BCEAO)',
    locale: 'fr-CI',
  },
};

export const COUNTRY_CURRENCIES: Record<CountryCode, CurrencyCode> = {
  CM: 'XAF', // Cameroun
  CI: 'XOF', // Côte d'Ivoire
};

/**
 * Format amount to currency string
 * @param amount - Amount to format
 * @param countryCode - Country code (CM or CI)
 * @param showSymbol - Whether to show currency symbol
 * @returns Formatted currency string
 */
export const formatCurrency = (
  amount: number,
  countryCode: CountryCode = 'CM',
  showSymbol: boolean = true
): string => {
  const currencyCode = COUNTRY_CURRENCIES[countryCode];
  const currency = CURRENCIES[currencyCode];

  // Format number with thousands separator
  const formatted = new Intl.NumberFormat(currency.locale, {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

  return showSymbol ? `${formatted} ${currency.symbol}` : formatted;
};

/**
 * Get currency for a country
 */
export const getCurrency = (countryCode: CountryCode): Currency => {
  const currencyCode = COUNTRY_CURRENCIES[countryCode];
  return CURRENCIES[currencyCode];
};
