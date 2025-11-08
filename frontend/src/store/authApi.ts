import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  default_currency: string
  is_active: boolean
  is_verified: boolean
  created_at: string
  updated_at?: string
  last_login?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  first_name: string
  last_name: string
  default_currency: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

export interface UpdateUserRequest {
  first_name?: string
  last_name?: string
  default_currency?: string
  is_active?: boolean
}

// Custom baseQuery with auth token
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
  const result = await rawBaseQuery(args, api, extraOptions)
  
  // If we get a 401, clear the token and redirect to login
  if (result.error && 'status' in result.error && result.error.status === 401) {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    window.location.href = '/login'
  }
  
  return result
}

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: baseQueryWithAuth,
  tagTypes: ['User'],
  endpoints: (builder) => ({
    // Register new user
    register: builder.mutation<User, RegisterRequest>({
      query: (userData) => ({
        url: 'auth/register',
        method: 'POST',
        body: userData,
      }),
    }),
    
    // Login user
    login: builder.mutation<TokenResponse, LoginRequest>({
      query: (credentials) => ({
        url: 'auth/login',
        method: 'POST',
        body: credentials,
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          localStorage.setItem('access_token', data.access_token)
          // Fetch user data after successful login
          dispatch(authApi.endpoints.getCurrentUser.initiate())
        } catch (error) {
          console.error('Login failed:', error)
        }
      },
    }),
    
    // Get current user
    getCurrentUser: builder.query<User, void>({
      query: () => 'auth/me',
      providesTags: ['User'],
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          localStorage.setItem('user', JSON.stringify(data))
        } catch (error) {
          console.error('Failed to get current user:', error)
        }
      },
    }),
    
    // Update current user
    updateUser: builder.mutation<User, UpdateUserRequest>({
      query: (userData) => ({
        url: 'auth/me',
        method: 'PUT',
        body: userData,
      }),
      invalidatesTags: ['User'],
    }),
    
    // Logout user
    logout: builder.mutation<void, void>({
      query: () => ({
        url: 'auth/logout',
        method: 'POST',
      }),
      async onQueryStarted(_, { dispatch }) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('user')
        // Clear all cached data
        dispatch(authApi.util.resetApiState())
      },
    }),
  }),
})

export const {
  useRegisterMutation,
  useLoginMutation,
  useGetCurrentUserQuery,
  useUpdateUserMutation,
  useLogoutMutation,
} = authApi
