import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useGetTransactionsQuery, useGetAccountsQuery, useGetCategoriesQuery, useCreateTransactionMutation, useUpdateTransactionMutation, useDeleteTransactionMutation } from '../store/api'
import { useState, useEffect, useMemo } from 'react'
import type { Transaction } from '../store/api'
import { useAuth } from '../contexts/AuthContext'
import { formatCurrency, getCurrencySymbol, CurrencyCode, CURRENCY_CONFIGS } from '../utils/currency'

export const Route = createFileRoute('/transactions')({
  component: TransactionsPage,
})

type TransactionFormState = {
  account_id: number
  category_id?: number
  allocation_id?: number
  amount: number
  currency: CurrencyCode
  projected_amount?: number
  projected_currency?: CurrencyCode
  original_amount?: number
  original_currency?: CurrencyCode
  exchange_rate?: number
  transfer_fee: number
  description: string
  transaction_type: Transaction['transaction_type']
  transaction_date: string
  posting_date?: string
  is_posted: boolean
  is_recurring: boolean
  transfer_from_account_id?: number
  transfer_to_account_id?: number
}

export function TransactionsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const navigate = useNavigate()
  const fallbackCurrency = (user?.default_currency as CurrencyCode) || 'PHP'

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate({ to: '/login' })
    }
  }, [isAuthenticated, authLoading, navigate])

  const createInitialFormState = (overrides: Partial<TransactionFormState> = {}): TransactionFormState => ({
    account_id: 0,
    category_id: undefined,
    allocation_id: undefined,
    amount: 0,
    currency: fallbackCurrency,
    projected_amount: undefined,
    projected_currency: undefined,
    original_amount: undefined,
    original_currency: undefined,
    exchange_rate: undefined,
    transfer_fee: 0,
    description: '',
    transaction_type: 'debit',
    transaction_date: new Date().toISOString().split('T')[0],
    posting_date: undefined,
    is_posted: true,
    is_recurring: false,
    transfer_from_account_id: undefined,
    transfer_to_account_id: undefined,
    ...overrides,
  })

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterAccount, setFilterAccount] = useState<number | ''>('')
  const [filterType, setFilterType] = useState<Transaction['transaction_type'] | ''>('')
  const [formData, setFormData] = useState<TransactionFormState>(() => createInitialFormState())
  const currencyOptions = useMemo(() => Object.keys(CURRENCY_CONFIGS) as CurrencyCode[], [])

  const { data: transactionsData, isLoading: isTransactionsLoading } = useGetTransactionsQuery(
    {},
    { skip: !isAuthenticated }
  )
  const { data: accountsData, isLoading: isAccountsLoading } = useGetAccountsQuery(
    { is_active: true },
    { skip: !isAuthenticated }
  )
  const { data: categoriesData, isLoading: isCategoriesLoading } = useGetCategoriesQuery(
    { is_active: true },
    { skip: !isAuthenticated }
  )
  
  const [createTransaction] = useCreateTransactionMutation()
  const [updateTransaction] = useUpdateTransactionMutation()
  const [deleteTransaction] = useDeleteTransactionMutation()

  const accounts = useMemo(() => accountsData ?? [], [accountsData])
  const categories = useMemo(() => categoriesData ?? [], [categoriesData])
  const transactions = useMemo(() => transactionsData ?? [], [transactionsData])

  const transferDestinationOptions = useMemo(
    () =>
      accounts.filter(
        (account) =>
          account.id !== (formData.transfer_from_account_id ?? formData.account_id) && account.id !== 0
      ),
    [accounts, formData.account_id, formData.transfer_from_account_id]
  )
  const isLoading = isTransactionsLoading || isAccountsLoading || isCategoriesLoading

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect
  }

  const formCurrencySymbol = getCurrencySymbol(formData.currency)
  const resolvedProjectedCurrency = formData.projected_currency ?? formData.currency
  const resolvedOriginalCurrency = formData.original_currency ?? formData.currency
  const projectedCurrencySymbol = getCurrencySymbol(resolvedProjectedCurrency)
  const originalCurrencySymbol = getCurrencySymbol(resolvedOriginalCurrency)

  // Filter transactions based on search and filters
  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false
    const matchesAccount =
      filterAccount === '' ||
      transaction.account_id === filterAccount ||
      transaction.transfer_from_account_id === filterAccount ||
      transaction.transfer_to_account_id === filterAccount
    const matchesType = filterType === '' || transaction.transaction_type === filterType
    
    return matchesSearch && matchesAccount && matchesType
  })

  const handleAccountChange = (value: number) => {
    const accountId = Number.isNaN(value) ? 0 : value
    const nextAccount = accounts.find((account) => account.id === accountId)
    setFormData((prev) => ({
      ...prev,
      account_id: accountId,
      currency: nextAccount ? (nextAccount.currency as CurrencyCode) : fallbackCurrency,
      transfer_from_account_id: prev.transaction_type === 'transfer' ? accountId || prev.transfer_from_account_id : prev.transfer_from_account_id,
    }))
  }

  const handleTypeChange = (nextType: Transaction['transaction_type']) => {
    setFormData((prev) => {
      const base: TransactionFormState = {
        ...prev,
        transaction_type: nextType,
      }
      if (nextType === 'transfer') {
        return {
          ...base,
          category_id: undefined,
          allocation_id: undefined,
          transfer_from_account_id: prev.account_id || prev.transfer_from_account_id,
        }
      }
      return {
        ...base,
        transfer_from_account_id: undefined,
        transfer_to_account_id: undefined,
        transfer_fee: 0,
      }
    })
  }

  const resetForm = () => {
    setFormData(createInitialFormState())
    setEditingTransaction(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const baseCurrency = formData.currency ?? fallbackCurrency
      const hasProjectedAmount = formData.projected_amount !== undefined && !Number.isNaN(formData.projected_amount)
      const hasOriginalAmount = formData.original_amount !== undefined && !Number.isNaN(formData.original_amount)
      const hasExchangeRate = formData.exchange_rate !== undefined && !Number.isNaN(formData.exchange_rate)
      const payload: Record<string, unknown> = {
        ...formData,
        currency: baseCurrency,
        transaction_date: new Date(formData.transaction_date).toISOString(),
        posting_date: formData.posting_date ? new Date(formData.posting_date).toISOString() : undefined,
        transfer_fee: formData.transfer_fee || 0,
        transfer_from_account_id:
          formData.transaction_type === 'transfer'
            ? formData.transfer_from_account_id ?? formData.account_id
            : undefined,
        transfer_to_account_id:
          formData.transaction_type === 'transfer'
            ? formData.transfer_to_account_id
            : undefined,
        category_id: formData.transaction_type === 'transfer' ? undefined : formData.category_id,
        allocation_id: formData.transaction_type === 'transfer' ? undefined : formData.allocation_id,
        projected_amount: hasProjectedAmount ? formData.projected_amount : undefined,
        projected_currency: hasProjectedAmount
          ? formData.projected_currency ?? baseCurrency
          : undefined,
        original_amount: hasOriginalAmount ? formData.original_amount : undefined,
        original_currency: hasOriginalAmount
          ? formData.original_currency ?? baseCurrency
          : undefined,
        exchange_rate: hasExchangeRate ? formData.exchange_rate : undefined,
      }
      if (!payload.transfer_to_account_id) {
        payload.transfer_to_account_id = undefined
      }
      if (!hasExchangeRate) {
        payload.exchange_rate = undefined
      }

      if (editingTransaction) {
        await updateTransaction({ id: editingTransaction.id, data: payload }).unwrap()
        setEditingTransaction(null)
      } else {
        await createTransaction(payload).unwrap()
      }
      resetForm()
      setIsCreateModalOpen(false)
    } catch (error) {
      console.error('Error saving transaction:', error)
    }
  }

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setFormData(
      createInitialFormState({
        account_id: transaction.account_id,
        category_id: transaction.category_id ?? undefined,
        allocation_id: transaction.allocation_id ?? undefined,
        amount: transaction.amount,
        currency: (transaction.currency as CurrencyCode) || fallbackCurrency,
        projected_amount: transaction.projected_amount ?? undefined,
        projected_currency: (transaction.projected_currency as CurrencyCode) ?? undefined,
        original_amount: transaction.original_amount ?? undefined,
        original_currency: (transaction.original_currency as CurrencyCode) ?? undefined,
        exchange_rate: transaction.exchange_rate ?? undefined,
        transfer_fee: transaction.transfer_fee ?? 0,
        description: transaction.description || '',
        transaction_type: transaction.transaction_type,
        transaction_date: new Date(transaction.transaction_date).toISOString().split('T')[0],
        posting_date: transaction.posting_date
          ? new Date(transaction.posting_date).toISOString().split('T')[0]
          : undefined,
        is_posted: transaction.is_posted,
        is_recurring: transaction.is_recurring,
        transfer_from_account_id: transaction.transaction_type === 'transfer'
          ? transaction.transfer_from_account_id ?? transaction.account_id
          : undefined,
        transfer_to_account_id: transaction.transaction_type === 'transfer'
          ? transaction.transfer_to_account_id ?? undefined
          : undefined,
      })
    )
    setIsCreateModalOpen(true)
  }

  const handleDelete = async (transactionId: number) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      try {
        await deleteTransaction(transactionId).unwrap()
      } catch (error) {
        console.error('Error deleting transaction:', error)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading transactions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn-primary focus-ring"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Transaction
        </button>
      </div>

      {/* Search and Filters */}
      <div className="card p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">Search Transactions</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10 focus-ring"
                placeholder="Search by description..."
              />
            </div>
          </div>
          
          <div>
            <label className="label">Filter by Account</label>
            <select
              value={filterAccount}
              onChange={(e) => setFilterAccount(e.target.value === '' ? '' : parseInt(e.target.value))}
              className="select-field focus-ring"
            >
              <option value="">All Accounts</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="label">Filter by Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as Transaction['transaction_type'] | '')}
              className="select-field focus-ring"
            >
              <option value="">All Types</option>
              <option value="credit">Income (Credit)</option>
              <option value="debit">Expense (Debit)</option>
              <option value="transfer">Transfer</option>
            </select>
          </div>
        </div>
        
        {(searchTerm || filterAccount || filterType) && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {filteredTransactions.length} of {transactions?.length || 0} transactions
            </p>
            <button
              onClick={() => {
                setSearchTerm('')
                setFilterAccount('')
                setFilterType('')
              }}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Transactions Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                      <p className="text-lg font-medium">No transactions found</p>
                      <p className="text-sm mt-1">
                        {searchTerm || filterAccount || filterType 
                          ? 'Try adjusting your search or filters' 
                          : 'Start by adding your first transaction'
                        }
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((transaction) => {
                  const primaryAccount = accounts.find((a) => a.id === transaction.account_id)
                  const fromAccount = transaction.transfer_from_account_id
                    ? accounts.find((a) => a.id === transaction.transfer_from_account_id)
                    : undefined
                  const toAccount = transaction.transfer_to_account_id
                    ? accounts.find((a) => a.id === transaction.transfer_to_account_id)
                    : undefined
                  const category = categories.find((c) => c.id === transaction.category_id)
                  const currencyCode = (transaction.currency as CurrencyCode) || fallbackCurrency
                  const amountLabel = formatCurrency(transaction.amount, currencyCode)
                  const projectedLabel =
                    transaction.projected_amount && transaction.projected_currency
                      ? formatCurrency(
                          transaction.projected_amount,
                          transaction.projected_currency as CurrencyCode
                        )
                      : null
                  const transferFeeLabel =
                    transaction.transfer_fee && transaction.transfer_fee > 0
                      ? formatCurrency(transaction.transfer_fee, currencyCode)
                      : null
                  const typeBadgeStyles =
                    transaction.transaction_type === 'credit'
                      ? 'bg-green-100 text-green-800'
                      : transaction.transaction_type === 'debit'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-blue-100 text-blue-800'
                  const amountClass =
                    transaction.transaction_type === 'credit'
                      ? 'text-green-600'
                      : transaction.transaction_type === 'debit'
                      ? 'text-red-600'
                      : 'text-blue-600'

                  return (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(transaction.transaction_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="font-medium">{transaction.description}</div>
                        {transaction.is_recurring && (
                          <div className="text-xs text-purple-600 mt-1">Recurring</div>
                        )}
                        {!transaction.is_posted && (
                          <div className="text-xs text-amber-600 mt-1">Pending posting</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.transaction_type === 'transfer' ? (
                          <div>
                            <div className="font-medium">
                              {fromAccount?.name || primaryAccount?.name || 'From account'}
                            </div>
                            <div className="text-xs text-gray-500">
                              → {toAccount?.name || 'Destination account'}
                            </div>
                          </div>
                        ) : (
                          primaryAccount?.name
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.transaction_type === 'transfer'
                          ? 'Transfer'
                          : category?.name || 'Uncategorized'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${typeBadgeStyles}`}>
                          {transaction.transaction_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              transaction.is_posted ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {transaction.is_posted ? 'Posted' : 'Planned'}
                          </span>
                          {transaction.is_recurring && (
                            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700">
                              Recurring
                            </span>
                          )}
                          {transferFeeLabel && (
                            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-700">
                              Fee {transferFeeLabel}
                            </span>
                          )}
                          {projectedLabel && (
                            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-sky-100 text-sky-700">
                              Projected {projectedLabel}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className={amountClass}>{amountLabel}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(transaction)}
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                            title="Edit transaction"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(transaction.id)}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors duration-200"
                            title="Delete transaction"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-xl shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingTransaction ? 'Edit Transaction' : 'Create Transaction'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {formData.transaction_type === 'transfer'
                    ? 'Move funds between your accounts and optionally include fees.'
                    : 'Log income, expenses, and projections to keep budgets on track.'}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false)
                  resetForm()
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                aria-label="Close transaction modal"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label">
                  {formData.transaction_type === 'transfer' ? 'From Account' : 'Account'}
                </label>
                <select
                  value={formData.account_id || ''}
                  onChange={(e) => handleAccountChange(e.target.value === '' ? 0 : parseInt(e.target.value, 10))}
                  className="select-field focus-ring"
                  required
                >
                  <option value="">Select account</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({formatCurrency(account.balance, account.currency as CurrencyCode)})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  {formData.transaction_type === 'transfer'
                    ? 'Funds will move out of this account.'
                    : 'This is the account where the transaction will be recorded.'}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Currency: {formData.currency} ({formCurrencySymbol})
                </p>
              </div>

              {formData.transaction_type === 'transfer' && (
                <div>
                  <label className="label">To Account</label>
                  <select
                    value={formData.transfer_to_account_id || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        transfer_to_account_id: e.target.value ? parseInt(e.target.value, 10) : undefined,
                      }))
                    }
                    className="select-field focus-ring"
                    required
                  >
                    <option value="">Select destination</option>
                    {transferDestinationOptions.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name} ({formatCurrency(account.balance, account.currency as CurrencyCode)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {formData.transaction_type !== 'transfer' && (
                <div>
                  <label className="label">Category</label>
                  <select
                    value={formData.category_id || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        category_id: e.target.value ? parseInt(e.target.value, 10) : undefined,
                      }))
                    }
                    className="select-field focus-ring"
                  >
                    <option value="">Select category</option>
                    {categories?.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="label">Transaction Type</label>
                <select
                  value={formData.transaction_type}
                  onChange={(e) => handleTypeChange(e.target.value as Transaction['transaction_type'])}
                  className="select-field focus-ring"
                  required
                >
                  <option value="debit">Debit (Expense)</option>
                  <option value="credit">Credit (Income)</option>
                  <option value="transfer">Transfer</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Amount</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 text-sm">
                      {formCurrencySymbol}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.amount || ''}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value)
                        setFormData((prev) => ({
                          ...prev,
                          amount: Number.isNaN(value) ? 0 : value,
                        }))
                      }}
                      className="input-field pl-7 focus-ring"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                {formData.transaction_type === 'transfer' && (
                  <div>
                    <label className="label">Transfer Fee</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 text-sm">
                        {formCurrencySymbol}
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.transfer_fee || ''}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value)
                          setFormData((prev) => ({
                            ...prev,
                            transfer_fee: Number.isNaN(value) ? 0 : value,
                          }))
                        }}
                        className="input-field pl-7 focus-ring"
                        placeholder="0.00"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Automatically deducted from the source account. Default is 0.
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="label">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="input-field focus-ring"
                  placeholder="Add notes about this transaction"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Transaction Date</label>
                  <input
                    type="date"
                    value={formData.transaction_date}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        transaction_date: e.target.value,
                      }))
                    }
                    className="input-field focus-ring"
                    required
                  />
                </div>
                <div>
                  <label className="label">Posting Date (optional)</label>
                  <input
                    type="date"
                    value={formData.posting_date || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        posting_date: e.target.value || undefined,
                      }))
                    }
                    className="input-field focus-ring"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={formData.is_posted}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        is_posted: e.target.checked,
                      }))
                    }
                  />
                  <span>Mark as posted</span>
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={formData.is_recurring}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        is_recurring: e.target.checked,
                      }))
                    }
                  />
                  <span>Recurring payment</span>
                </label>
              </div>

              <details className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <summary className="text-sm font-medium text-gray-700 cursor-pointer">
                  Budget & multi-currency details (optional)
                </summary>
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Projected Amount</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 text-sm">
                          {projectedCurrencySymbol}
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={
                            formData.projected_amount !== undefined ? formData.projected_amount : ''
                          }
                          onChange={(e) => {
                            const value = parseFloat(e.target.value)
                            setFormData((prev) => ({
                              ...prev,
                              projected_amount: Number.isNaN(value) ? undefined : value,
                            }))
                          }}
                          className="input-field pl-7 focus-ring"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="label">Projected Currency</label>
                      <select
                        value={formData.projected_currency ?? ''}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            projected_currency: e.target.value
                              ? (e.target.value as CurrencyCode)
                              : undefined,
                          }))
                        }
                        className="select-field focus-ring"
                      >
                        <option value="">Same as transaction ({formData.currency})</option>
                        {currencyOptions.map((currency) => (
                          <option key={currency} value={currency}>
                            {currency}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="label">Original Amount</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 text-sm">
                          {originalCurrencySymbol}
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={
                            formData.original_amount !== undefined ? formData.original_amount : ''
                          }
                          onChange={(e) => {
                            const value = parseFloat(e.target.value)
                            setFormData((prev) => ({
                              ...prev,
                              original_amount: Number.isNaN(value) ? undefined : value,
                            }))
                          }}
                          className="input-field pl-7 focus-ring"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="label">Original Currency</label>
                      <select
                        value={formData.original_currency ?? ''}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            original_currency: e.target.value
                              ? (e.target.value as CurrencyCode)
                              : undefined,
                          }))
                        }
                        className="select-field focus-ring"
                      >
                        <option value="">Same as transaction ({formData.currency})</option>
                        {currencyOptions.map((currency) => (
                          <option key={currency} value={currency}>
                            {currency}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label">Exchange Rate</label>
                      <input
                        type="number"
                        step="0.0001"
                        min="0"
                        value={
                          formData.exchange_rate !== undefined ? formData.exchange_rate : ''
                        }
                        onChange={(e) => {
                          const value = parseFloat(e.target.value)
                          setFormData((prev) => ({
                            ...prev,
                            exchange_rate: Number.isNaN(value) ? undefined : value,
                          }))
                        }}
                        className="input-field focus-ring"
                        placeholder="1.00"
                      />
                    </div>
                  </div>
                </div>
              </details>

              <div className="flex space-x-3 pt-2">
                <button type="submit" className="flex-1 btn-primary focus-ring">
                  {editingTransaction ? 'Update Transaction' : 'Create Transaction'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false)
                    resetForm()
                  }}
                  className="flex-1 btn-secondary focus-ring"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
