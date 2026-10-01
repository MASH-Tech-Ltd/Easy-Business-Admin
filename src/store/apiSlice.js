import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL || '/api/v1',
  credentials: 'include',
});

let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (cb) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (err) => {
  refreshSubscribers.forEach((cb) => cb(err));
  refreshSubscribers = [];
};

const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    const url = typeof args === 'string' ? args : args?.url || '';
    const isAuthEndpoint = url.includes('/auth/');

    if (!isAuthEndpoint) {
      if (!isRefreshing) {
        isRefreshing = true;

        const refreshResult = await rawBaseQuery(
          { url: '/auth/refresh-token', method: 'POST' },
          api,
          extraOptions
        );

        if (refreshResult.data) {
          onRefreshed(null);
          isRefreshing = false;
          result = await rawBaseQuery(args, api, extraOptions);
        } else {
          onRefreshed(refreshResult.error);
          isRefreshing = false;
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      } else {
        await new Promise((resolve) => {
          subscribeTokenRefresh(() => resolve());
        });
        result = await rawBaseQuery(args, api, extraOptions);
      }
    }
  }

  return result;
};

export const adminApi = createApi({
  reducerPath: 'adminApi',
  baseQuery: baseQueryWithReauth,
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
    getVisitorLogs: builder.query({
      query: (params) => ({
        url: '/system/security/visitor-logs',
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
  useGetVisitorLogsQuery,
} = adminApi;
