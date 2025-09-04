import { createFileRoute } from '@tanstack/react-router'
import { useGetAccountsQuery, useGetTransactionsQuery, useGetGoalsSummaryQuery, useGetTransactionSummaryQuery } from '../store/api'
import { useState } from 'react'

export const Route = createFileRoute('/')({
  component: Dashboard,
})

function Dashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month')
  
  const { data: accounts, isLoading: accountsLoading } = useGetAccountsQuery({ is_active: true })
  const { data: transactions, isLoading: transactionsLoading } = useGetTransactionsQuery({})
  const { data: goalsSummary, isLoading: goalsLoading } = useGetGoalsSummaryQuery()
  
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
  const { data: periodSummary, isLoading: summaryLoading } = useGetTransactionSummaryQuery(dateRange)

  if (accountsLoading || transactionsLoading || goalsLoading || summaryLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  const totalBalance = accounts?.reduce((sum, account) => sum + account.balance, 0) || 0
  const recentTransactions = transactions?.slice(0, 5) || []
  const activeAccounts = accounts?.filter(account => account.is_active) || []

  // Calculate credit card due dates
  const creditCards = accounts?.filter(account => account.account_type === 'credit' && account.is_active) || []

  return (
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700">Total Balance</h3>
          <p className={`text-2xl font-bold ${totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${totalBalance.toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700">Active Accounts</h3>
          <p className="text-2xl font-bold text-blue-600">{activeAccounts.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700">Total Transactions</h3>
          <p className="text-2xl font-bold text-purple-600">{transactions?.length || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700">Active Goals</h3>
          <p className="text-2xl font-bold text-orange-600">{goalsSummary?.total_goals || 0}</p>
        </div>
      </div>

      {/* Period Summary */}
      {periodSummary && (
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Period Summary ({selectedPeriod})</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Income</p>
                <p className="text-2xl font-bold text-green-600">${periodSummary.summary.total_income.toFixed(2)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Expenses</p>
                <p className="text-2xl font-bold text-red-600">${periodSummary.summary.total_expenses.toFixed(2)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Net Flow</p>
                <p className={`text-2xl font-bold ${periodSummary.summary.net_flow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${periodSummary.summary.net_flow.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Accounts Overview */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Accounts Overview</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {activeAccounts.map((account) => (
                <div key={account.id} className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{account.name}</p>
                    <p className="text-sm text-gray-500 capitalize">{account.account_type.replace('_', ' ')}</p>
                    {account.account_type === 'credit' && account.credit_limit && (
                      <p className="text-xs text-gray-400">Limit: ${account.credit_limit.toFixed(2)}</p>
                    )}
                  </div>
                  <span className={`font-bold ${account.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${account.balance.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Credit Card Due Dates */}
        {creditCards.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Credit Card Due Dates</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {creditCards.map((card) => {
                  const today = new Date()
                  const dueDate = new Date(today.getFullYear(), today.getMonth(), card.due_date || 1)
                  const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                  
                  return (
                    <div key={card.id} className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{card.name}</p>
                        <p className="text-sm text-gray-500">Due: {card.due_date}th of month</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${daysUntilDue <= 7 ? 'text-red-600' : daysUntilDue <= 14 ? 'text-yellow-600' : 'text-green-600'}`}>
                          {daysUntilDue > 0 ? `${daysUntilDue} days` : 'Overdue'}
                        </p>
                        <p className="text-sm text-gray-500">${Math.abs(card.balance).toFixed(2)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Goals Progress */}
      {goalsSummary && goalsSummary.goals.length > 0 && (
        <div className="bg-white rounded-lg shadow mt-8">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Goals Progress</h2>
            <p className="text-sm text-gray-600">Overall Progress: {goalsSummary.total_progress_percentage.toFixed(1)}%</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {goalsSummary.goals.map((goal) => (
                <div key={goal.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium">{goal.name}</h3>
                    <span className="text-sm font-medium">{goal.progress_percentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${goal.progress_percentage}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500 mt-1">
                    <span>${goal.current_amount.toFixed(2)}</span>
                    <span>${goal.target_amount?.toFixed(2) || 'No target'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow mt-8">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Recent Transactions</h2>
        </div>
        <div className="p-6">
          {recentTransactions.length === 0 ? (
            <p className="text-gray-500">No transactions yet.</p>
          ) : (
            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex justify-between items-center p-4 border rounded">
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    <p className="text-sm text-gray-500">{new Date(transaction.transaction_date).toLocaleDateString()}</p>
                  </div>
                  <span className={`font-bold ${transaction.transaction_type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.transaction_type === 'credit' ? '+' : '-'}${transaction.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
