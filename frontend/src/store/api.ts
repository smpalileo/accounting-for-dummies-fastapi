import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

// Types for our API responses
export interface Account {
  id: number
  name: string
  account_type: 'cash' | 'e_wallet' | 'savings' | 'checking' | 'credit'
  balance: number
  description?: string
  credit_limit?: number
  due_date?: number
  billing_cycle_start?: number
  is_active: boolean
  created_at: string
  updated_at?: string
}

export interface Category {
  id: number
  name: string
  description?: string
  color?: string
  is_expense: boolean
  is_active: boolean
  created_at: string
  updated_at?: string
}

export interface Allocation {
  id: number
  account_id: number
  name: string
  allocation_type: 'savings' | 'budget' | 'goal'
  description?: string
  target_amount?: number
  current_amount: number
  monthly_target?: number
  target_date?: string
  is_active: boolean
  created_at: string
  updated_at?: string
}

export interface Transaction {
  id: number
  account_id: number
  category_id?: number
  allocation_id?: number
  amount: number
  description?: string
  transaction_type: 'debit' | 'credit'
  transaction_date: string
  posting_date?: string
  receipt_url?: string
  invoice_url?: string
  is_reconciled: boolean
  is_recurring: boolean
  created_at: string
  updated_at?: string
}

export interface TransactionSummary {
  period: {
    start_date: string
    end_date: string
  }
  summary: {
    total_income: number
    total_expenses: number
    net_flow: number
    transaction_count: number
  }
  category_breakdown: Record<string, { income: number; expenses: number }>
}

export interface AccountBalance {
  account_id: number
  current_balance: number
  calculated_balance: number
  balance_history: Array<{
    date: string
    balance: number
    transaction_id: number
  }>
}

export interface AllocationProgress {
  allocation_id: number
  current_amount: number
  target_amount?: number
  progress_percentage: number
  monthly_target?: number
  monthly_progress: number
  remaining_amount: number
  target_date?: string
  days_remaining?: number
}

export interface GoalsSummary {
  total_goals: number
  total_target_amount: number
  total_current_amount: number
  total_progress_percentage: number
  goals: Array<{
    id: number
    name: string
    target_amount?: number
    current_amount: number
    progress_percentage: number
    target_date?: string
  }>
}

export const accountingApi = createApi({
  reducerPath: 'accountingApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/v1' }),
  tagTypes: ['Account', 'Category', 'Transaction', 'Allocation'],
  endpoints: (builder) => ({
    // Accounts
    getAccounts: builder.query<Account[], { account_type?: string; is_active?: boolean }>({
      query: (params) => ({
        url: 'accounts',
        params
      }),
      providesTags: ['Account'],
    }),
    getAccount: builder.query<Account, number>({
      query: (id) => `accounts/${id}`,
      providesTags: ['Account'],
    }),
    createAccount: builder.mutation<Account, Partial<Account>>({
      query: (account) => ({
        url: 'accounts',
        method: 'POST',
        body: account,
      }),
      invalidatesTags: ['Account'],
    }),
    updateAccount: builder.mutation<Account, { id: number; data: Partial<Account> }>({
      query: ({ id, data }) => ({
        url: `accounts/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Account'],
    }),
    deleteAccount: builder.mutation<void, number>({
      query: (id) => ({
        url: `accounts/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Account'],
    }),
    getAccountBalance: builder.query<AccountBalance, number>({
      query: (id) => `accounts/${id}/balance`,
      providesTags: ['Account'],
    }),

    // Categories
    getCategories: builder.query<Category[], { is_expense?: boolean; is_active?: boolean }>({
      query: (params) => ({
        url: 'categories',
        params
      }),
      providesTags: ['Category'],
    }),
    getCategory: builder.query<Category, number>({
      query: (id) => `categories/${id}`,
      providesTags: ['Category'],
    }),
    createCategory: builder.mutation<Category, Partial<Category>>({
      query: (category) => ({
        url: 'categories',
        method: 'POST',
        body: category,
      }),
      invalidatesTags: ['Category'],
    }),
    updateCategory: builder.mutation<Category, { id: number; data: Partial<Category> }>({
      query: ({ id, data }) => ({
        url: `categories/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Category'],
    }),
    deleteCategory: builder.mutation<void, number>({
      query: (id) => ({
        url: `categories/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Category'],
    }),

    // Allocations
    getAllocations: builder.query<Allocation[], { account_id?: number; allocation_type?: string; is_active?: boolean }>({
      query: (params) => ({
        url: 'allocations',
        params
      }),
      providesTags: ['Allocation'],
    }),
    getAllocation: builder.query<Allocation, number>({
      query: (id) => `allocations/${id}`,
      providesTags: ['Allocation'],
    }),
    createAllocation: builder.mutation<Allocation, Partial<Allocation>>({
      query: (allocation) => ({
        url: 'allocations',
        method: 'POST',
        body: allocation,
      }),
      invalidatesTags: ['Allocation'],
    }),
    updateAllocation: builder.mutation<Allocation, { id: number; data: Partial<Allocation> }>({
      query: ({ id, data }) => ({
        url: `allocations/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Allocation'],
    }),
    deleteAllocation: builder.mutation<void, number>({
      query: (id) => ({
        url: `allocations/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Allocation'],
    }),
    getAllocationProgress: builder.query<AllocationProgress, number>({
      query: (id) => `allocations/${id}/progress`,
      providesTags: ['Allocation'],
    }),
    getGoalsSummary: builder.query<GoalsSummary, void>({
      query: () => 'allocations/summary/goals',
      providesTags: ['Allocation'],
    }),

    // Transactions
    getTransactions: builder.query<Transaction[], {
      account_id?: number;
      category_id?: number;
      allocation_id?: number;
      transaction_type?: string;
      start_date?: string;
      end_date?: string;
      is_reconciled?: boolean;
    }>({
      query: (params) => ({
        url: 'transactions',
        params
      }),
      providesTags: ['Transaction'],
    }),
    getTransaction: builder.query<Transaction, number>({
      query: (id) => `transactions/${id}`,
      providesTags: ['Transaction'],
    }),
    createTransaction: builder.mutation<Transaction, Partial<Transaction>>({
      query: (transaction) => ({
        url: 'transactions',
        method: 'POST',
        body: transaction,
      }),
      invalidatesTags: ['Transaction', 'Account'],
    }),
    updateTransaction: builder.mutation<Transaction, { id: number; data: Partial<Transaction> }>({
      query: ({ id, data }) => ({
        url: `transactions/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Transaction', 'Account'],
    }),
    deleteTransaction: builder.mutation<void, number>({
      query: (id) => ({
        url: `transactions/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Transaction', 'Account'],
    }),
    uploadReceipt: builder.mutation<{ message: string; file_url: string }, { transaction_id: number; file: File }>({
      query: ({ transaction_id, file }) => {
        const formData = new FormData()
        formData.append('file', file)
        return {
          url: `transactions/${transaction_id}/upload-receipt`,
          method: 'POST',
          body: formData,
        }
      },
      invalidatesTags: ['Transaction'],
    }),
    getTransactionSummary: builder.query<TransactionSummary, { start_date: string; end_date: string; account_id?: number }>({
      query: (params) => ({
        url: 'transactions/summary/period',
        params
      }),
      providesTags: ['Transaction'],
    }),
  }),
})

export const {
  // Account hooks
  useGetAccountsQuery,
  useGetAccountQuery,
  useCreateAccountMutation,
  useUpdateAccountMutation,
  useDeleteAccountMutation,
  useGetAccountBalanceQuery,
  
  // Category hooks
  useGetCategoriesQuery,
  useGetCategoryQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  
  // Allocation hooks
  useGetAllocationsQuery,
  useGetAllocationQuery,
  useCreateAllocationMutation,
  useUpdateAllocationMutation,
  useDeleteAllocationMutation,
  useGetAllocationProgressQuery,
  useGetGoalsSummaryQuery,
  
  // Transaction hooks
  useGetTransactionsQuery,
  useGetTransactionQuery,
  useCreateTransactionMutation,
  useUpdateTransactionMutation,
  useDeleteTransactionMutation,
  useUploadReceiptMutation,
  useGetTransactionSummaryQuery,
} = accountingApi
