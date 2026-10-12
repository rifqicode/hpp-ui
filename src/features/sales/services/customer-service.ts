import apiClient from '../../../lib/api-client';
import type {
  Customer,
  CustomerSummary,
  CreateCustomerInput,
  UpdateCustomerInput,
  PaginatedCustomers,
  CustomerDetail,
} from '../types';

export const customerService = {
  getCustomers: async (query?: {
    search?: string;
    page?: number;
    per_page?: number;
  }): Promise<PaginatedCustomers> => {
    const res = await apiClient.get<PaginatedCustomers>('/customers', {
      params: query,
    });
    return res.data;
  },

  getCustomerSummary: async (): Promise<CustomerSummary> => {
    const res = await apiClient.get<CustomerSummary>('/customers/summary');
    return res.data;
  },

  getCustomerById: async (id: string): Promise<CustomerDetail> => {
    const res = await apiClient.get<CustomerDetail>(`/customers/${id}`);
    return res.data;
  },

  createCustomer: async (input: CreateCustomerInput): Promise<Customer> => {
    const res = await apiClient.post<Customer>('/customers', input);
    return res.data;
  },

  updateCustomer: async (
    id: string,
    input: UpdateCustomerInput
  ): Promise<Customer> => {
    const res = await apiClient.put<Customer>(`/customers/${id}`, input);
    return res.data;
  },

  deleteCustomer: async (id: string): Promise<void> => {
    await apiClient.delete(`/customers/${id}`);
  },

  searchCustomerByPhone: async (phone: string): Promise<Customer | null> => {
    if (!phone || phone.trim() === '') return null;
    try {
      const res = await apiClient.get<PaginatedCustomers>('/customers', {
        params: { search: phone.trim(), per_page: 5 },
      });
      const exactMatch = res.data?.data?.find(
        (c) => c.phone.trim() === phone.trim()
      );
      return exactMatch || null;
    } catch {
      return null;
    }
  },
};
