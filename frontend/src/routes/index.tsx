import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useGetAccountsQuery, useGetTransactionsQuery, useGetGoalsSummaryQuery, useGetTransactionSummaryQuery, useGetCategoriesQuery } from '../store/api'
import { useState, useEffect } from 'react'
import { Navigation } from '../components/Navigation'
import { useAuth } from '../contexts/AuthContext'
import { useCurrency } from '../hooks/useCurrency'

export const Route = createFileRoute('/')({
  component: Dashboard,
})

export function Dashboard() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const navigate = useNavigate()
  const { format } = useCurrency()

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate({ to: '/login' })
    }
  }, [isAuthenticated, authLoading, navigate])

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
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month')
  
  console.log('Dashboard component rendering...')
  
  const { data: accounts, isLoading: accountsLoading, error: accountsError } = useGetAccountsQuery({ is_active: true })
  const { data: transactions, isLoading: transactionsLoading, error: transactionsError } = useGetTransactionsQuery({})
  const { data: goalsSummary, isLoading: goalsLoading, error: goalsError } = useGetGoalsSummaryQuery()
  const { data: categories, isLoading: categoriesLoading, error: categoriesError } = useGetCategoriesQuery({ is_active: true })
  
  console.log('Dashboard hooks called:', { accountsLoading, transactionsLoading, goalsLoading, categoriesLoading })
  
  // Calculate date range for summary
  const getDateRange = () => {
    const now = new Date()
    const startDate = new Date()
    
    switch (selectedPeriod) {
      case 'week':
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(now.getMonth() - 1)
        break
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1)
        break
    }
    
    return {
      start_date: startDate.toISOString(),
      end_date: now.toISOString()
    }
  }
  
  const dateRange = getDateRange()
  const { data: periodSummary, isLoading: summaryLoading, error: summaryError } = useGetTransactionSummaryQuery(dateRange)

  // Debug: Log errors
  if (accountsError) console.error('Accounts error:', accountsError)
  if (transactionsError) console.error('Transactions error:', transactionsError)
  if (goalsError) console.error('Goals error:', goalsError)
  if (categoriesError) console.error('Categories error:', categoriesError)
  if (summaryError) console.error('Summary error:', summaryError)

  // Show loading only if ALL are loading
  const allLoading = accountsLoading && transactionsLoading && goalsLoading && categoriesLoading && summaryLoading
  
  if (allLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your financial data...</p>
        </div>
      </div>
    )
  }

  // Show error state if any API call failed
  if (accountsError || transactionsError || goalsError || categoriesError || summaryError) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Data</h3>
          <p className="text-gray-600 mb-4">There was an issue loading your financial data.</p>
          <div className="text-sm text-gray-500 space-y-1">
            {accountsError && <p>• Accounts: {(accountsError as any)?.data?.detail || 'Failed to load'}</p>}
            {transactionsError && <p>• Transactions: {(transactionsError as any)?.data?.detail || 'Failed to load'}</p>}
            {goalsError && <p>• Goals: {(goalsError as any)?.data?.detail || 'Failed to load'}</p>}
            {categoriesError && <p>• Categories: {(categoriesError as any)?.data?.detail || 'Failed to load'}</p>}
            {summaryError && <p>• Summary: {(summaryError as any)?.data?.detail || 'Failed to load'}</p>}
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Debug: Log data and states
  console.log('Dashboard states:', { 
    accountsLoading, transactionsLoading, goalsLoading, categoriesLoading, summaryLoading,
    accountsError, transactionsError, goalsError, categoriesError, summaryError,
    accounts: accounts?.length, transactions: transactions?.length, categories: categories?.length, goalsSummary, periodSummary 
  })

  const totalBalance = accounts?.reduce((sum, account) => sum + account.balance, 0) || 0
  const activeAccounts = accounts?.filter(account => account.is_active) || []

  // Helper function to filter transactions by selected period
  const getTransactionsForPeriod = () => {
    if (!transactions) return []
    
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.transaction_date)
      const startDate = new Date(dateRange.start_date)
      const endDate = new Date(dateRange.end_date)
      return transactionDate >= startDate && transactionDate <= endDate
    })
  }

  const periodTransactions = getTransactionsForPeriod()
  const recentTransactions = periodTransactions
    .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())
    .slice(0, 5)

  // Calculate expenditure by category for the selected period
  const getExpenditureByCategory = () => {
    if (!periodTransactions || !categories) return []
    
    const filteredTransactions = periodTransactions.filter(transaction => 
      transaction.transaction_type === 'debit'
    )
    
    const categoryTotals = new Map()
    const categoryTransactions = new Map()
    
    filteredTransactions.forEach(transaction => {
      if (transaction.category_id) {
        const category = categories.find(cat => cat.id === transaction.category_id)
        if (category) {
          const currentTotal = categoryTotals.get(category.id) || 0
          categoryTotals.set(category.id, currentTotal + transaction.amount)
          
          // Store transactions for this category
          if (!categoryTransactions.has(category.id)) {
            categoryTransactions.set(category.id, [])
          }
          categoryTransactions.get(category.id).push(transaction)
        }
      }
    })
    
    return Array.from(categoryTotals.entries())
      .map(([categoryId, total]) => {
        const category = categories.find(cat => cat.id === categoryId)
        const transactions = categoryTransactions.get(categoryId) || []
        
        return {
          id: categoryId,
          name: category?.name || 'Unknown',
          color: category?.color || '#6B7280',
          amount: total,
          transactions: transactions
            .sort((a: any, b: any) => b.amount - a.amount) // Sort by amount descending
            .slice(0, 3) // Top 3 transactions
        }
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5) // Top 5 categories
  }

  const topExpenditureCategories = getExpenditureByCategory()

  // Calculate credit card due dates
  const creditCards = accounts?.filter(account => account.account_type === 'credit' && account.is_active) || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navigation />
      <main className="py-8">
        <div className="fade-in">
          <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Accounting Dashboard</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setSelectedPeriod('week')}
            className={`px-4 py-2 rounded-lg ${selectedPeriod === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Week
          </button>
          <button
            onClick={() => setSelectedPeriod('month')}
            className={`px-4 py-2 rounded-lg ${selectedPeriod === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Month
          </button>
          <button
            onClick={() => setSelectedPeriod('year')}
            className={`px-4 py-2 rounded-lg ${selectedPeriod === 'year' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Year
          </button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">Total Balance</p>
              <p className={`stat-value ${totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {format(totalBalance)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">Total Income ({selectedPeriod})</p>
              <p className="stat-value text-green-600">
                {format(periodSummary?.summary?.total_income || 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">Total Expenditure ({selectedPeriod})</p>
              <p className="stat-value text-red-600">
                {format(periodSummary?.summary?.total_expenses || 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Period Summary */}
      {periodSummary && (
        <div className="card mb-8">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Period Summary ({selectedPeriod})</h2>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{new Date(periodSummary.period.start_date).toLocaleDateString()} - {new Date(periodSummary.period.end_date).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">Income</p>
                <p className="text-2xl font-bold text-green-600">{format(periodSummary.summary.total_income)}</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">Expenses</p>
                <p className="text-2xl font-bold text-red-600">{format(periodSummary.summary.total_expenses)}</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">Net Flow</p>
                <p className={`text-2xl font-bold ${periodSummary.summary.net_flow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {format(periodSummary.summary.net_flow)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Accounts Overview and Credit Card Due Dates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Accounts Overview */}
        <div className="card">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Accounts Overview</h2>
              <span className="badge badge-info">{activeAccounts.length} accounts</span>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {activeAccounts.map((account) => (
                <div key={account.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      account.account_type === 'checking' ? 'bg-blue-100' :
                      account.account_type === 'savings' ? 'bg-green-100' :
                      account.account_type === 'credit' ? 'bg-red-100' :
                      account.account_type === 'cash' ? 'bg-yellow-100' :
                      'bg-purple-100'
                    }`}>
                      <svg className={`w-5 h-5 ${
                        account.account_type === 'checking' ? 'text-blue-600' :
                        account.account_type === 'savings' ? 'text-green-600' :
                        account.account_type === 'credit' ? 'text-red-600' :
                        account.account_type === 'cash' ? 'text-yellow-600' :
                        'text-purple-600'
                      }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{account.name}</p>
                      <p className="text-sm text-gray-500 capitalize">{account.account_type.replace('_', ' ')}</p>
                      {account.account_type === 'credit' && account.credit_limit && (
                        <p className="text-xs text-gray-400">Limit: {format(account.credit_limit)}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`font-bold text-lg ${account.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {format(account.balance)}
                    </span>
                    {account.account_type === 'credit' && account.credit_limit && (
                      <div className="w-20 bg-gray-200 rounded-full h-1.5 mt-1">
                        <div 
                          className="bg-red-500 h-1.5 rounded-full"
                          style={{ width: `${Math.min((Math.abs(account.balance) / account.credit_limit) * 100, 100)}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Credit Card Due Dates */}
        {creditCards.length > 0 && (
          <div className="card">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Credit Card Due Dates</h2>
                <span className="badge badge-warning">{creditCards.length} cards</span>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {creditCards.map((card) => {
                  const today = new Date()
                  const dueDate = new Date(today.getFullYear(), today.getMonth(), card.due_date || 1)
                  const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                  
                  return (
                    <div key={card.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{card.name}</p>
                          <p className="text-sm text-gray-500">Due: {card.due_date}th of month</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold text-lg ${daysUntilDue <= 7 ? 'text-red-600' : daysUntilDue <= 14 ? 'text-yellow-600' : 'text-green-600'}`}>
                          {daysUntilDue > 0 ? `${daysUntilDue} days` : 'Overdue'}
                        </p>
                        <p className="text-sm text-gray-500">{format(Math.abs(card.balance))}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Top Expenditure Categories with Transactions */}
      <div className="card mb-8">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Top Expenditure Categories ({selectedPeriod})</h2>
            <span className="badge badge-info">{topExpenditureCategories.length} categories</span>
          </div>
        </div>
        <div className="p-6">
          {topExpenditureCategories.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">No valid transactions</p>
              <p className="text-sm text-gray-400 mt-1">Try selecting a different time period</p>
            </div>
          ) : (
            <div className="space-y-6">
              {topExpenditureCategories.map((category, index) => {
                const totalExpenditure = topExpenditureCategories.reduce((sum, cat) => sum + cat.amount, 0)
                const percentage = (category.amount / totalExpenditure) * 100
                
                return (
                  <div key={category.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow duration-200">
                    {/* Category Header */}
                    <div className="flex items-center space-x-4 mb-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">#{index + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-gray-900 truncate">{category.name}</p>
                          <p className="text-sm font-bold text-gray-900">{format(category.amount)}</p>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full transition-all duration-500"
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: category.color
                            }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{percentage.toFixed(1)}% of total expenditure</p>
                      </div>
                    </div>
                    
                    {/* Transactions */}
                    {category.transactions.length > 0 && (
                      <div className="ml-12 space-y-2">
                        {category.transactions.map((transaction: any) => (
                          <div key={transaction.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                              <span className="text-sm text-gray-700">{transaction.description}</span>
                            </div>
                            <span className="text-sm font-medium text-gray-900">{format(transaction.amount)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>


      {/* Goals Progress */}
      {goalsSummary && goalsSummary.goals.length > 0 && (
        <div className="card mt-8">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Goals Progress</h2>
                <p className="text-sm text-gray-600">Overall Progress: {goalsSummary.total_progress_percentage.toFixed(1)}%</p>
              </div>
              <div className="text-right">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">{goalsSummary.total_progress_percentage.toFixed(0)}%</span>
                </div>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {goalsSummary.goals.map((goal) => (
                <div key={goal.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow duration-200">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-medium text-gray-900">{goal.name}</h3>
                    <span className="badge badge-info">{goal.progress_percentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(goal.progress_percentage, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span className="font-medium">{format(goal.current_amount)}</span>
                    <span>{format(goal.target_amount || 0)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Period Transactions */}
      <div className="card mt-8">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Transactions ({selectedPeriod})</h2>
            <span className="badge badge-info">{recentTransactions.length} transactions</span>
          </div>
        </div>
        <div className="p-6">
          {recentTransactions.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">No valid transactions</p>
              <p className="text-sm text-gray-400 mt-1">Try selecting a different time period</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      transaction.transaction_type === 'credit' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      <svg className={`w-5 h-5 ${
                        transaction.transaction_type === 'credit' ? 'text-green-600' : 'text-red-600'
                      }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {transaction.transaction_type === 'credit' ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        )}
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{transaction.description}</p>
                      <p className="text-sm text-gray-500">{new Date(transaction.transaction_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`font-bold text-lg ${transaction.transaction_type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.transaction_type === 'credit' ? '+' : '-'}{format(transaction.amount)}
                    </span>
                    <p className="text-xs text-gray-400 capitalize">{transaction.transaction_type}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
          </div>
        </div>
      </main>
    </div>
  )
}
