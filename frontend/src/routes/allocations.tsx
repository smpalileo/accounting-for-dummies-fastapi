import { createFileRoute } from '@tanstack/react-router'
import { useGetAllocationsQuery, useGetAccountsQuery, useCreateAllocationMutation, useUpdateAllocationMutation, useDeleteAllocationMutation, useGetAllocationProgressQuery } from '../store/api'
import { useState } from 'react'
import { Allocation } from '../store/api'

export const Route = createFileRoute('/allocations')({
  component: AllocationsPage,
})

function AllocationsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingAllocation, setEditingAllocation] = useState<Allocation | null>(null)
  const [formData, setFormData] = useState({
    account_id: 0,
    name: '',
    allocation_type: 'savings' as Allocation['allocation_type'],
    description: '',
    target_amount: undefined as number | undefined,
    current_amount: 0,
    monthly_target: undefined as number | undefined,
    target_date: undefined as string | undefined,
  })

  const { data: allocations, isLoading } = useGetAllocationsQuery({ is_active: true })
  const { data: accounts } = useGetAccountsQuery({ is_active: true })
  
  const [createAllocation] = useCreateAllocationMutation()
  const [updateAllocation] = useUpdateAllocationMutation()
  const [deleteAllocation] = useDeleteAllocationMutation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const allocationData = {
        ...formData,
        target_date: formData.target_date ? new Date(formData.target_date).toISOString() : undefined,
      }
      
      if (editingAllocation) {
        await updateAllocation({ id: editingAllocation.id, data: allocationData }).unwrap()
        setEditingAllocation(null)
      } else {
        await createAllocation(allocationData).unwrap()
      }
      setFormData({
        account_id: 0,
        name: '',
        allocation_type: 'savings',
        description: '',
        target_amount: undefined,
        current_amount: 0,
        monthly_target: undefined,
        target_date: undefined,
      })
      setIsCreateModalOpen(false)
    } catch (error) {
      console.error('Error saving allocation:', error)
    }
  }

  const handleEdit = (allocation: Allocation) => {
    setEditingAllocation(allocation)
    setFormData({
      account_id: allocation.account_id,
      name: allocation.name,
      allocation_type: allocation.allocation_type,
      description: allocation.description || '',
      target_amount: allocation.target_amount,
      current_amount: allocation.current_amount,
      monthly_target: allocation.monthly_target,
      target_date: allocation.target_date ? new Date(allocation.target_date).toISOString().split('T')[0] : undefined,
    })
    setIsCreateModalOpen(true)
  }

  const handleDelete = async (allocationId: number) => {
    if (confirm('Are you sure you want to delete this allocation?')) {
      try {
        await deleteAllocation(allocationId).unwrap()
      } catch (error) {
        console.error('Error deleting allocation:', error)
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
        <h1 className="text-3xl font-bold text-gray-900">Allocations</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Add Allocation
        </button>
      </div>

      {/* Allocations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allocations?.map((allocation) => {
          const account = accounts?.find(a => a.id === allocation.account_id)
          const progressPercentage = allocation.target_amount 
            ? (allocation.current_amount / allocation.target_amount) * 100 
            : 0
          
          return (
            <div key={allocation.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{allocation.name}</h3>
                  <p className="text-sm text-gray-500 capitalize">{allocation.allocation_type}</p>
                  <p className="text-sm text-gray-600">{account?.name}</p>
                  {allocation.description && (
                    <p className="text-sm text-gray-600 mt-1">{allocation.description}</p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(allocation)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(allocation.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Current:</span>
                  <span className="font-bold">${allocation.current_amount.toFixed(2)}</span>
                </div>
                
                {allocation.target_amount && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Target:</span>
                      <span className="font-medium">${allocation.target_amount.toFixed(2)}</span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                      ></div>
                    </div>
                    
                    <div className="text-center">
                      <span className="text-sm font-medium">{progressPercentage.toFixed(1)}%</span>
                    </div>
                  </>
                )}
                
                {allocation.monthly_target && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monthly Target:</span>
                    <span className="font-medium">${allocation.monthly_target.toFixed(2)}</span>
                  </div>
                )}
                
                {allocation.target_date && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Target Date:</span>
                    <span className="font-medium">{new Date(allocation.target_date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Create/Edit Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              {editingAllocation ? 'Edit Allocation' : 'Create Allocation'}
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
                      {account.name}
                    </option>
                  ))}
                </select>
              </div>
              
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
                <label className="block text-sm font-medium text-gray-700">Allocation Type</label>
                <select
                  value={formData.allocation_type}
                  onChange={(e) => setFormData({ ...formData, allocation_type: e.target.value as Allocation['allocation_type'] })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                >
                  <option value="savings">Savings</option>
                  <option value="budget">Budget</option>
                  <option value="goal">Goal</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Current Amount</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.current_amount}
                  onChange={(e) => setFormData({ ...formData, current_amount: parseFloat(e.target.value) || 0 })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Target Amount (Optional)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.target_amount || ''}
                  onChange={(e) => setFormData({ ...formData, target_amount: parseFloat(e.target.value) || undefined })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Monthly Target (Optional)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.monthly_target || ''}
                  onChange={(e) => setFormData({ ...formData, monthly_target: parseFloat(e.target.value) || undefined })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Target Date (Optional)</label>
                <input
                  type="date"
                  value={formData.target_date || ''}
                  onChange={(e) => setFormData({ ...formData, target_date: e.target.value || undefined })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
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
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                  {editingAllocation ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false)
                    setEditingAllocation(null)
                    setFormData({
                      account_id: 0,
                      name: '',
                      allocation_type: 'savings',
                      description: '',
                      target_amount: undefined,
                      current_amount: 0,
                      monthly_target: undefined,
                      target_date: undefined,
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
