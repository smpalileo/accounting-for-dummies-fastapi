import { createFileRoute } from '@tanstack/react-router'
import { useGetAccountsQuery, useCreateAccountMutation, useUpdateAccountMutation, useDeleteAccountMutation } from '../store/api'
import { useState } from 'react'
import { Account } from '../store/api'

export const Route = createFileRoute('/accounts')({
  component: AccountsPage,
})

function AccountsPage() {
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Accounts Management</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Add Account
        </button>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts?.map((account) => (
          <div key={account.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">{account.name}</h3>
                <p className="text-sm text-gray-500 capitalize">{account.account_type.replace('_', ' ')}</p>
                {account.description && (
                  <p className="text-sm text-gray-600 mt-1">{account.description}</p>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(account)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(account.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  Delete
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              {editingAccount ? 'Edit Account' : 'Create Account'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Account Type</label>
                <select
                  value={formData.account_type}
                  onChange={(e) => setFormData({ ...formData, account_type: e.target.value as Account['account_type'] })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="checking">Checking</option>
                  <option value="savings">Savings</option>
                  <option value="credit">Credit</option>
                  <option value="cash">Cash</option>
                  <option value="e_wallet">E-Wallet</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Balance</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.balance}
                  onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                />
              </div>
              
              {formData.account_type === 'credit' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Credit Limit</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.credit_limit || ''}
                      onChange={(e) => setFormData({ ...formData, credit_limit: parseFloat(e.target.value) || undefined })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Due Date (Day of Month)</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={formData.due_date || ''}
                      onChange={(e) => setFormData({ ...formData, due_date: parseInt(e.target.value) || undefined })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Billing Cycle Start (Day of Month)</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={formData.billing_cycle_start || ''}
                      onChange={(e) => setFormData({ ...formData, billing_cycle_start: parseInt(e.target.value) || undefined })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </>
              )}
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                  {editingAccount ? 'Update' : 'Create'}
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
