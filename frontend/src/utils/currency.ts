// Currency utility functions
export type CurrencyCode = 'PHP' | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'AUD' | 'CAD' | 'CHF' | 'CNY' | 'SGD'

export interface CurrencyConfig {
  symbol: string
  position: 'before' | 'after'
  decimalPlaces: number
  thousandsSeparator: string
  decimalSeparator: string
}

export const CURRENCY_CONFIGS: Record<CurrencyCode, CurrencyConfig> = {
  PHP: {
    symbol: '₱',
    position: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.'
  },
  USD: {
    symbol: '$',
    position: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.'
  },
  EUR: {
    symbol: '€',
    position: 'after',
    decimalPlaces: 2,
    thousandsSeparator: ' ',
    decimalSeparator: ','
  },
  GBP: {
    symbol: '£',
    position: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.'
  },
  JPY: {
    symbol: '¥',
    position: 'before',
    decimalPlaces: 0,
    thousandsSeparator: ',',
    decimalSeparator: '.'
  },
  AUD: {
    symbol: 'A$',
    position: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.'
  },
  CAD: {
    symbol: 'C$',
    position: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.'
  },
  CHF: {
    symbol: 'CHF',
    position: 'after',
    decimalPlaces: 2,
    thousandsSeparator: "'",
    decimalSeparator: '.'
  },
  CNY: {
    symbol: '¥',
    position: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.'
  },
  SGD: {
    symbol: 'S$',
    position: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.'
  }
}

/**
 * Format a number as currency using the specified currency code
 */
export function formatCurrency(amount: number, currencyCode: CurrencyCode): string {
  const config = CURRENCY_CONFIGS[currencyCode]
  
  // Format the number
  const formattedNumber = amount.toLocaleString('en-US', {
    minimumFractionDigits: config.decimalPlaces,
    maximumFractionDigits: config.decimalPlaces,
    useGrouping: true
  })
  
  // Apply currency-specific formatting
  let formatted = formattedNumber
  
  // Replace separators based on currency
  if (config.thousandsSeparator !== ',') {
    formatted = formatted.replace(/,/g, config.thousandsSeparator)
  }
  if (config.decimalSeparator !== '.') {
    formatted = formatted.replace(/\./g, config.decimalSeparator)
  }
  
  // Add currency symbol
  if (config.position === 'before') {
    return `${config.symbol}${formatted}`
  } else {
    return `${formatted} ${config.symbol}`
  }
}

/**
 * Get currency symbol for a given currency code
 */
export function getCurrencySymbol(currencyCode: CurrencyCode): string {
  return CURRENCY_CONFIGS[currencyCode].symbol
}

/**
 * Get currency configuration for a given currency code
 */
export function getCurrencyConfig(currencyCode: CurrencyCode): CurrencyConfig {
  return CURRENCY_CONFIGS[currencyCode]
}
