import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const adminApi = createApi({
  reducerPath: 'adminApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/_content-sync',
    credentials: 'include',
  }),
  // Enable automatic refetching when the user reconnects to the network
  // and when window regains focus.
  refetchOnFocus: true,
  refetchOnReconnect: true,
  refetchOnMountOrArgChange: true,
  
  // Tag types are used to declare what entities are cached, so we can invalidate them if needed
  tagTypes: ['DashboardStats', 'Billing', 'Clients', 'Users', 'SupportTickets'],
  
  endpoints: (builder) => ({
    // Overview / Super Admin Stats
    getSuperAdminStats: builder.query({
      query: () => '/analytics/super-admin-stats',
      providesTags: ['DashboardStats'],
      // Keep unused data around for 5 minutes
      keepUnusedDataFor: 300,
    }),

    // Billing / Subscriptions
    getBillingOverview: builder.query({
      query: () => '/billing/overview',
      providesTags: ['Billing'],
    }),
    getAllSubscriptions: builder.query({
      query: (params) => ({
        url: '/subscriptions/get-all-subscriptions',
        params,
      }),
      providesTags: ['Billing'],
    }),
    
    // Tenants / Clients
    getAllTenants: builder.query({
      query: (params) => ({
        url: '/tenants/get-all-tenants',
        params
      }),
      providesTags: ['Clients'],
    }),

    // Users
    getAllUsers: builder.query({
      query: () => '/users',
      providesTags: ['Users'],
    }),

    // Support
    getAllTickets: builder.query({
      query: (params) => ({
        url: '/support/all-tickets',
        params,
      }),
      providesTags: ['SupportTickets'],
    }),
    getTicketStats: builder.query({
      query: (params) => ({
        url: '/support/ticket-stats',
        params,
      }),
      providesTags: ['SupportTickets'],
    }),

    // Packages & Addons
    getAllPackages: builder.query({
      query: (params) => ({
        url: '/packages/get-all-packages',
        params
      }),
      providesTags: ['Packages'],
    }),
    getAllAddons: builder.query({
      query: () => '/addons',
      providesTags: ['Addons'],
    }),
    getPredefinedAddons: builder.query({
      query: () => '/addons/predefined',
      providesTags: ['Addons'],
    }),
    getAddonRequests: builder.query({
      query: (params) => ({
        url: '/subscriptions/addons/requests',
        params
      }),
      providesTags: ['AddonRequests'],
    }),

    // System
    getDatabaseStats: builder.query({
      query: () => '/system/database',
      providesTags: ['Database'],
    }),
    getSystemHealth: builder.query({
      query: () => '/system/health',
      providesTags: ['Health'],
    }),
    getBlockedIps: builder.query({
      query: (params) => ({
        url: '/system/security/blocked-ips',
        params
      }),
      providesTags: ['Security'],
    }),
    getSecurityLogs: builder.query({
      query: (params) => ({
        url: '/system/security/logs',
        params
      }),
      providesTags: ['Security'],
    }),
  }),
});

export const {
  useGetSuperAdminStatsQuery,
  useGetBillingOverviewQuery,
  useGetAllSubscriptionsQuery,
  useGetAllTenantsQuery,
  useGetAllUsersQuery,
  useGetAllTicketsQuery,
  useGetTicketStatsQuery,
  useGetAllPackagesQuery,
  useGetAllAddonsQuery,
  useGetPredefinedAddonsQuery,
  useGetAddonRequestsQuery,
  useGetDatabaseStatsQuery,
  useGetSystemHealthQuery,
  useGetBlockedIpsQuery,
  useGetSecurityLogsQuery,
} = adminApi;
