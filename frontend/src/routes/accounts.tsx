import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useGetAccountsQuery, useCreateAccountMutation, useUpdateAccountMutation, useDeleteAccountMutation } from '../store/api'
import { useState, useEffect } from 'react'
import { Account } from '../store/api'
import { useAuth } from '../contexts/AuthContext'

export const Route = createFileRoute('/accounts')({
  component: AccountsPage,
})

export function AccountsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const navigate = useNavigate()

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
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    account_type: 'checking' as Account['account_type'],
    balance: 0,
    description: '',
    credit_limit: undefined as number | undefined,
    due_date: undefined as number | undefined,
    billing_cycle_start: undefined as number | undefined,
  })

  const { data: accounts, isLoading } = useGetAccountsQuery({})
  const [createAccount] = useCreateAccountMutation()
  const [updateAccount] = useUpdateAccountMutation()
  const [deleteAccount] = useDeleteAccountMutation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingAccount) {
        await updateAccount({ id: editingAccount.id, data: formData }).unwrap()
        setEditingAccount(null)
      } else {
        await createAccount(formData).unwrap()
      }
      setFormData({
        name: '',
        account_type: 'checking',
        balance: 0,
        description: '',
        credit_limit: undefined,
        due_date: undefined,
        billing_cycle_start: undefined,
      })
      setIsCreateModalOpen(false)
    } catch (error) {
      console.error('Error saving account:', error)
    }
  }

  const handleEdit = (account: Account) => {
    setEditingAccount(account)
    setFormData({
      name: account.name,
      account_type: account.account_type,
      balance: account.balance,
      description: account.description || '',
      credit_limit: account.credit_limit,
      due_date: account.due_date,
      billing_cycle_start: account.billing_cycle_start,
    })
    setIsCreateModalOpen(true)
  }

  const handleDelete = async (accountId: number) => {
    if (confirm('Are you sure you want to delete this account?')) {
      try {
        await deleteAccount(accountId).unwrap()
      } catch (error) {
        console.error('Error deleting account:', error)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading accounts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Accounts Management</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn-primary focus-ring"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Account
        </button>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts?.map((account) => (
          <div key={account.id} className="card p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-start space-x-3">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  account.account_type === 'checking' ? 'bg-blue-100' :
                  account.account_type === 'savings' ? 'bg-green-100' :
                  account.account_type === 'credit' ? 'bg-red-100' :
                  account.account_type === 'cash' ? 'bg-yellow-100' :
                  'bg-purple-100'
                }`}>
                  <svg className={`w-6 h-6 ${
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
                  <h3 className="text-lg font-semibold text-gray-900">{account.name}</h3>
                  <p className="text-sm text-gray-500 capitalize">{account.account_type.replace('_', ' ')}</p>
                  {account.description && (
                    <p className="text-sm text-gray-600 mt-1">{account.description}</p>
                  )}
                </div>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => handleEdit(account)}
                  className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                  title="Edit account"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(account.id)}
                  className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors duration-200"
                  title="Delete account"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Balance:</span>
                <span className={`font-bold ${account.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${account.balance.toFixed(2)}
                </span>
              </div>
              
              {account.account_type === 'credit' && account.credit_limit && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Credit Limit:</span>
                  <span className="font-medium">${account.credit_limit.toFixed(2)}</span>
                </div>
              )}
              
              {account.account_type === 'credit' && account.due_date && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Due Date:</span>
                  <span className="font-medium">{account.due_date}th</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`text-sm ${account.is_active ? 'text-green-600' : 'text-red-600'}`}>
                  {account.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingAccount ? 'Edit Account' : 'Create Account'}
              </h2>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false)
                  setEditingAccount(null)
                  setFormData({
                    name: '',
                    account_type: 'checking',
                    balance: 0,
                    description: '',
                    credit_limit: undefined,
                    due_date: undefined,
                    billing_cycle_start: undefined,
                  })
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label">Account Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field focus-ring"
                  placeholder="Enter account name"
                  required
                />
              </div>
              
              <div>
                <label className="label">Account Type</label>
                <select
                  value={formData.account_type}
                  onChange={(e) => setFormData({ ...formData, account_type: e.target.value as Account['account_type'] })}
                  className="select-field focus-ring"
                >
                  <option value="checking">🏦 Checking</option>
                  <option value="savings">💰 Savings</option>
                  <option value="credit">💳 Credit Card</option>
                  <option value="cash">💵 Cash</option>
                  <option value="e_wallet">📱 E-Wallet</option>
                </select>
              </div>
              
              <div>
                <label className="label">Initial Balance</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.balance}
                    onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
                    className="input-field pl-7 focus-ring"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="label">Description (Optional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field focus-ring resize-none"
                  rows={3}
                  placeholder="Add a description for this account"
                />
              </div>
              
              {formData.account_type === 'credit' && (
                <div className="space-y-4 p-4 bg-red-50 rounded-lg border border-red-200">
                  <h3 className="text-sm font-medium text-red-800">Credit Card Settings</h3>
                  
                  <div>
                    <label className="label">Credit Limit</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.credit_limit || ''}
                        onChange={(e) => setFormData({ ...formData, credit_limit: parseFloat(e.target.value) || undefined })}
                        className="input-field pl-7 focus-ring"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="label">Due Date (Day of Month)</label>
                    <select
                      value={formData.due_date || ''}
                      onChange={(e) => setFormData({ ...formData, due_date: parseInt(e.target.value) || undefined })}
                      className="select-field focus-ring"
                    >
                      <option value="">Select day</option>
                      {Array.from({ length: 31 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>{i + 1}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="label">Billing Cycle Start (Day of Month)</label>
                    <select
                      value={formData.billing_cycle_start || ''}
                      onChange={(e) => setFormData({ ...formData, billing_cycle_start: parseInt(e.target.value) || undefined })}
                      className="select-field focus-ring"
                    >
                      <option value="">Select day</option>
                      {Array.from({ length: 31 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>{i + 1}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
              
              <div className="flex space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  className="flex-1 btn-primary focus-ring"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {editingAccount ? 'Update Account' : 'Create Account'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false)
                    setEditingAccount(null)
                    setFormData({
                      name: '',
                      account_type: 'checking',
                      balance: 0,
                      description: '',
                      credit_limit: undefined,
                      due_date: undefined,
                      billing_cycle_start: undefined,
                    })
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
