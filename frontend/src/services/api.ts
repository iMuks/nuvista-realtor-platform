import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
  ApiResponse, PaginatedResponse, User, Property, Lead,
  DashboardData, PropertyFilters, LeadFilters,
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE,
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' },
      withCredentials: true,
    });

    // Attach JWT token
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle errors globally
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiResponse>) => {
        if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // ── Auth ───────────────────────────────────────────────
  async login(email: string, password: string) {
    const { data } = await this.client.post<ApiResponse<{ token: string }>>('/auth/login', { email, password });
    if (data.data?.token) localStorage.setItem('token', data.data.token);
    return data;
  }

  async register(payload: Record<string, string>) {
    const { data } = await this.client.post<ApiResponse<{ token: string }>>('/auth/register', payload);
    if (data.data?.token) localStorage.setItem('token', data.data.token);
    return data;
  }

  async getMe() {
    const { data } = await this.client.get<ApiResponse<User>>('/auth/me');
    return data.data!;
  }

  logout() {
    localStorage.removeItem('token');
    this.client.post('/auth/logout');
  }

  // ── Dashboard ──────────────────────────────────────────
  async getDashboard() {
    const { data } = await this.client.get<ApiResponse<DashboardData>>('/dashboard');
    return data.data!;
  }

  // ── Properties ─────────────────────────────────────────
  async getProperties(filters?: PropertyFilters) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, val]) => {
        if (val !== undefined && val !== '') params.append(key, String(val));
      });
    }
    const { data } = await this.client.get<PaginatedResponse<Property>>(`/properties?${params}`);
    return data;
  }

  async getProperty(id: string) {
    const { data } = await this.client.get<ApiResponse<Property>>(`/properties/${id}`);
    return data.data!;
  }

  async createProperty(payload: Partial<Property>) {
    const { data } = await this.client.post<ApiResponse<Property>>('/properties', payload);
    return data.data!;
  }

  async updateProperty(id: string, payload: Partial<Property>) {
    const { data } = await this.client.put<ApiResponse<Property>>(`/properties/${id}`, payload);
    return data.data!;
  }

  async deleteProperty(id: string) {
    await this.client.delete(`/properties/${id}`);
  }

  async getMarketStats(city?: string) {
    const params = city ? `?city=${city}` : '';
    const { data } = await this.client.get<ApiResponse<any>>(`/properties/stats/market${params}`);
    return data.data;
  }

  // ── Leads ──────────────────────────────────────────────
  async getLeads(filters?: LeadFilters) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, val]) => {
        if (val !== undefined && val !== '') params.append(key, String(val));
      });
    }
    const { data } = await this.client.get<PaginatedResponse<Lead>>(`/leads?${params}`);
    return data;
  }

  async searchLeadsByLocation(location: string) {
    const { data } = await this.client.get<ApiResponse<Lead[]>>(`/leads/search-by-location?location=${encodeURIComponent(location)}`);
    return data.data!;
  }

  async getLead(id: string) {
    const { data } = await this.client.get<ApiResponse<Lead>>(`/leads/${id}`);
    return data.data!;
  }

  async createLead(payload: Partial<Lead>) {
    const { data } = await this.client.post<ApiResponse<Lead>>('/leads', payload);
    return data.data!;
  }

  async updateLead(id: string, payload: Partial<Lead>) {
    const { data } = await this.client.put<ApiResponse<Lead>>(`/leads/${id}`, payload);
    return data.data!;
  }

  async addLeadNote(id: string, content: string) {
    const { data } = await this.client.post<ApiResponse<Lead>>(`/leads/${id}/notes`, { content });
    return data.data!;
  }

  async getLeadStats() {
    const { data } = await this.client.get<ApiResponse<any>>('/leads/stats/overview');
    return data.data;
  }
}

export const api = new ApiService();
