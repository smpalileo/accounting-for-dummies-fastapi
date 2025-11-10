import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { CurrencyCode } from '../utils/currency'

// Types for our API responses
export interface Account {
  id: number
  name: string
  account_type: 'cash' | 'e_wallet' | 'savings' | 'checking' | 'credit'
  balance: number
  currency: CurrencyCode
  description?: string
  credit_limit?: number
  due_date?: number
  billing_cycle_start?: number
  days_until_due_date?: number
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
  period_frequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly'
  period_start?: string
  period_end?: string
  is_active: boolean
  created_at: string
  updated_at?: string
  configuration?: Record<string, unknown>
}

export interface BudgetEntry {
  id: number
  user_id: number
  entry_type: 'income' | 'expense'
  name: string
  description?: string
  amount: number
  currency: CurrencyCode
  cadence: 'monthly' | 'quarterly' | 'semi_annual' | 'annual'
  next_occurrence: string
  lead_time_days: number
  end_mode: 'indefinite' | 'on_date' | 'after_occurrences'
  end_date?: string
  max_occurrences?: number
  account_id?: number
  category_id?: number
  allocation_id?: number
  is_autopay: boolean
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
  currency: CurrencyCode
  projected_amount?: number
  projected_currency?: CurrencyCode
  original_amount?: number
  original_currency?: CurrencyCode
  exchange_rate?: number
  description?: string
  transaction_type: 'debit' | 'credit' | 'transfer'
  transaction_date: string
  posting_date?: string
  receipt_url?: string
  invoice_url?: string
  is_posted: boolean
  is_reconciled: boolean
  is_recurring: boolean
  recurrence_frequency?: 'monthly' | 'quarterly' | 'semi_annual' | 'annual'
  transfer_fee: number
  transfer_from_account_id?: number
  transfer_to_account_id?: number
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

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  has_more: boolean
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

// Custom baseQuery with auth token and debug logging
const rawBaseQuery = fetchBaseQuery({
  baseUrl: '/api/v1',
  prepareHeaders: (headers) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      headers.set('authorization', `Bearer ${token}`)
    }
    return headers
  },
})

const baseQueryWithAuth: typeof rawBaseQuery = async (args, api, extraOptions) => {
  console.log('API Request:', args)
  const result = await rawBaseQuery(args, api, extraOptions)
  console.log('API Response:', result)
  
  // If we get a 401, clear the token and redirect to login
  if (result.error && 'status' in result.error && result.error.status === 401) {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    window.location.href = '/login'
  }
  
  return result
}

export const accountingApi = createApi({
  reducerPath: 'accountingApi',
  baseQuery: baseQueryWithAuth,
  tagTypes: ['Account', 'Category', 'Transaction', 'Allocation', 'BudgetEntry'],
  endpoints: (builder) => ({
    // Accounts
    getAccounts: builder.query<PaginatedResponse<Account>, { account_type?: string; is_active?: boolean; limit?: number; offset?: number }>({
      query: (params) => ({
        url: 'accounts/',
        params,
      }),
      providesTags: ['Account'],
    }),
    getAccount: builder.query<Account, number>({
      query: (id) => `accounts/${id}`,
      providesTags: ['Account'],
    }),
    createAccount: builder.mutation<Account, Partial<Account>>({
      query: (account) => ({
        url: 'accounts/',
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
        url: 'categories/',
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
        url: 'categories/',
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
    getAllocations: builder.query<PaginatedResponse<Allocation>, { account_id?: number; allocation_type?: string; is_active?: boolean; limit?: number; offset?: number }>({
      query: (params) => ({
        url: 'allocations/',
        params,
      }),
      providesTags: ['Allocation'],
    }),
    getAllocation: builder.query<Allocation, number>({
      query: (id) => `allocations/${id}`,
      providesTags: ['Allocation'],
    }),
    createAllocation: builder.mutation<Allocation, Partial<Allocation>>({
      query: (allocation) => ({
        url: 'allocations/',
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

    // Budget entries
    getBudgetEntries: builder.query<PaginatedResponse<BudgetEntry>, {
      entry_type?: 'income' | 'expense'
      is_active?: boolean
      before?: string
      after?: string
      limit?: number
      offset?: number
    }>({
      query: (params) => ({
        url: 'budget-entries/',
        params,
      }),
      providesTags: ['BudgetEntry'],
    }),
    createBudgetEntry: builder.mutation<BudgetEntry, Partial<BudgetEntry>>({
      query: (entry) => ({
        url: 'budget-entries/',
        method: 'POST',
        body: entry,
      }),
      invalidatesTags: ['BudgetEntry', 'Transaction', 'Allocation'],
    }),
    updateBudgetEntry: builder.mutation<BudgetEntry, { id: number; data: Partial<BudgetEntry> }>({
      query: ({ id, data }) => ({
        url: `budget-entries/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['BudgetEntry', 'Transaction', 'Allocation'],
    }),
    deleteBudgetEntry: builder.mutation<void, number>({
      query: (id) => ({
        url: `budget-entries/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['BudgetEntry', 'Transaction', 'Allocation'],
    }),

    // Transactions
    getTransactions: builder.query<PaginatedResponse<Transaction>, {
      account_ids?: number[];
      category_ids?: number[];
      allocation_id?: number;
      transaction_types?: string[];
      start_date?: string;
      end_date?: string;
      is_reconciled?: boolean;
      search?: string;
      limit?: number;
      offset?: number;
    }>({
      query: (params) => {
        const searchParams = new URLSearchParams()

        if (params?.account_ids?.length) {
          params.account_ids.forEach((id) => searchParams.append('account_ids', String(id)))
        }
        if (params?.category_ids?.length) {
          params.category_ids.forEach((id) => searchParams.append('category_ids', String(id)))
        }
        if (params?.transaction_types?.length) {
          params.transaction_types.forEach((value) => searchParams.append('transaction_types', value))
        }
        if (typeof params?.allocation_id === 'number') {
          searchParams.set('allocation_id', String(params.allocation_id))
        }
        if (params?.start_date) {
          searchParams.set('start_date', params.start_date)
        }
        if (params?.end_date) {
          searchParams.set('end_date', params.end_date)
        }
        if (typeof params?.is_reconciled === 'boolean') {
          searchParams.set('is_reconciled', String(params.is_reconciled))
        }
        if (params?.search) {
          searchParams.set('search', params.search)
        }
        if (typeof params?.limit === 'number') {
          searchParams.set('limit', String(params.limit))
        }
        if (typeof params?.offset === 'number') {
          searchParams.set('offset', String(params.offset))
        }

        return {
          url: 'transactions/',
          params: searchParams,
        }
      },
      providesTags: ['Transaction'],
    }),
    getTransaction: builder.query<Transaction, number>({
      query: (id) => `transactions/${id}`,
      providesTags: ['Transaction'],
    }),
    createTransaction: builder.mutation<Transaction, Partial<Transaction>>({
      query: (transaction) => ({
        url: 'transactions/',
        method: 'POST',
        body: transaction,
      }),
      invalidatesTags: ['Transaction', 'Account', 'Allocation'],
    }),
    updateTransaction: builder.mutation<Transaction, { id: number; data: Partial<Transaction> }>({
      query: ({ id, data }) => ({
        url: `transactions/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Transaction', 'Account', 'Allocation'],
    }),
    deleteTransaction: builder.mutation<void, number>({
      query: (id) => ({
        url: `transactions/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Transaction', 'Account', 'Allocation'],
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
  useLazyGetAccountsQuery,
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
  useLazyGetAllocationsQuery,
  useGetAllocationQuery,
  useCreateAllocationMutation,
  useUpdateAllocationMutation,
  useDeleteAllocationMutation,
  useGetAllocationProgressQuery,
  useGetGoalsSummaryQuery,

  // Budget entry hooks
  useGetBudgetEntriesQuery,
  useLazyGetBudgetEntriesQuery,
  useCreateBudgetEntryMutation,
  useUpdateBudgetEntryMutation,
  useDeleteBudgetEntryMutation,
  
  // Transaction hooks
  useGetTransactionsQuery,
  useLazyGetTransactionsQuery,
  useGetTransactionQuery,
  useCreateTransactionMutation,
  useUpdateTransactionMutation,
  useDeleteTransactionMutation,
  useUploadReceiptMutation,
  useGetTransactionSummaryQuery,
} = accountingApi
