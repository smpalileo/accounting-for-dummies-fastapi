import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useGetTransactionsQuery, useGetAccountsQuery, useGetCategoriesQuery, useCreateTransactionMutation, useUpdateTransactionMutation, useDeleteTransactionMutation } from '../store/api'
import { useState, useEffect } from 'react'
import { Transaction } from '../store/api'
import { useAuth } from '../contexts/AuthContext'
import { useCurrency } from '../hooks/useCurrency'

export const Route = createFileRoute('/transactions')({
  component: TransactionsPage,
})

export function TransactionsPage() {
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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterAccount, setFilterAccount] = useState<number | ''>('')
  const [filterType, setFilterType] = useState<Transaction['transaction_type'] | ''>('')
  const [formData, setFormData] = useState({
    account_id: 0,
    category_id: undefined as number | undefined,
    allocation_id: undefined as number | undefined,
    amount: 0,
    description: '',
    transaction_type: 'debit' as Transaction['transaction_type'],
    transaction_date: new Date().toISOString().split('T')[0],
    posting_date: undefined as string | undefined,
  })

  const { data: transactions, isLoading } = useGetTransactionsQuery({})
  const { data: accounts } = useGetAccountsQuery({ is_active: true })
  const { data: categories } = useGetCategoriesQuery({ is_active: true })
  
  const [createTransaction] = useCreateTransactionMutation()
  const [updateTransaction] = useUpdateTransactionMutation()
  const [deleteTransaction] = useDeleteTransactionMutation()

  // Filter transactions based on search and filters
  const filteredTransactions = transactions?.filter((transaction) => {
    const matchesSearch = transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false
    const matchesAccount = filterAccount === '' || transaction.account_id === filterAccount
    const matchesType = filterType === '' || transaction.transaction_type === filterType
    
    return matchesSearch && matchesAccount && matchesType
  }) || []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const transactionData = {
        ...formData,
        transaction_date: new Date(formData.transaction_date).toISOString(),
        posting_date: formData.posting_date ? new Date(formData.posting_date).toISOString() : undefined,
      }
      
      if (editingTransaction) {
        await updateTransaction({ id: editingTransaction.id, data: transactionData }).unwrap()
        setEditingTransaction(null)
      } else {
        await createTransaction(transactionData).unwrap()
      }
      setFormData({
        account_id: 0,
        category_id: undefined,
        allocation_id: undefined,
        amount: 0,
        description: '',
        transaction_type: 'debit',
        transaction_date: new Date().toISOString().split('T')[0],
        posting_date: undefined,
      })
      setIsCreateModalOpen(false)
    } catch (error) {
      console.error('Error saving transaction:', error)
    }
  }

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setFormData({
      account_id: transaction.account_id,
      category_id: transaction.category_id,
      allocation_id: transaction.allocation_id,
      amount: transaction.amount,
      description: transaction.description || '',
      transaction_type: transaction.transaction_type,
      transaction_date: new Date(transaction.transaction_date).toISOString().split('T')[0],
      posting_date: transaction.posting_date ? new Date(transaction.posting_date).toISOString().split('T')[0] : undefined,
    })
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
              {accounts?.map((account) => (
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
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
                const account = accounts?.find(a => a.id === transaction.account_id)
                const category = categories?.find(c => c.id === transaction.category_id)
                
                return (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(transaction.transaction_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {account?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {category?.name || 'Uncategorized'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        transaction.transaction_type === 'credit' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {transaction.transaction_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className={transaction.transaction_type === 'credit' ? 'text-green-600' : 'text-red-600'}>
                        {transaction.transaction_type === 'credit' ? '+' : '-'}{format(transaction.amount)}
                      </span>
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
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              {editingTransaction ? 'Edit Transaction' : 'Create Transaction'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Account</label>
                <select
                  value={formData.account_id}
                  onChange={(e) => setFormData({ ...formData, account_id: parseInt(e.target.value) })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                >
                  <option value="">Select Account</option>
                  {accounts?.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({format(account.balance)})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select
                  value={formData.category_id || ''}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Select Category</option>
                  {categories?.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Transaction Type</label>
                <select
                  value={formData.transaction_type}
                  onChange={(e) => setFormData({ ...formData, transaction_type: e.target.value as Transaction['transaction_type'] })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                >
                  <option value="debit">Debit (Expense)</option>
                  <option value="credit">Credit (Income)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Transaction Date</label>
                <input
                  type="date"
                  value={formData.transaction_date}
                  onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Posting Date (Optional)</label>
                <input
                  type="date"
                  value={formData.posting_date || ''}
                  onChange={(e) => setFormData({ ...formData, posting_date: e.target.value || undefined })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                  {editingTransaction ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false)
                    setEditingTransaction(null)
                    setFormData({
                      account_id: 0,
                      category_id: undefined,
                      allocation_id: undefined,
                      amount: 0,
                      description: '',
                      transaction_type: 'debit',
                      transaction_date: new Date().toISOString().split('T')[0],
                      posting_date: undefined,
                    })
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
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
