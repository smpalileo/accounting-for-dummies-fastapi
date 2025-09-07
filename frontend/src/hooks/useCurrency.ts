import { useAuth } from '../contexts/AuthContext'
import { formatCurrency, getCurrencySymbol, CurrencyCode } from '../utils/currency'

/**
 * Custom hook to get currency formatting functions based on user's default currency
 */
export function useCurrency() {
  const { user } = useAuth()
  const currencyCode = (user?.default_currency as CurrencyCode) || 'PHP'
  
  return {
    currencyCode,
    format: (amount: number) => formatCurrency(amount, currencyCode),
    symbol: getCurrencySymbol(currencyCode),
    formatWithSymbol: (amount: number) => formatCurrency(amount, currencyCode)
  }
}
