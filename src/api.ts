import { Product, EanLookupResult, User, HistoryEntry } from './types';

export const api = {
  // Auth
  login: async (username: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    return res.json();
  },

  getUsers: async (): Promise<User[]> => {
    const res = await fetch('/api/users');
    return res.json();
  },

  createUser: async (user: Partial<User> & { username: string; password?: string; name: string; role: string }): Promise<User> => {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
    return res.json();
  },

  updateUser: async (id: string, user: Partial<User>): Promise<User> => {
    const res = await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
    return res.json();
  },

  deleteUser: async (id: string): Promise<{ success: boolean; error?: string }> => {
    const res = await fetch(`/api/users/${id}`, {
      method: 'DELETE',
    });
    return res.json();
  },

  // Inventory
  getInventory: async (): Promise<Product[]> => {
    const res = await fetch('/api/inventory');
    return res.json();
  },

  addProduct: async (product: Omit<Product, 'id'>, user?: User | null, ticketNumber?: string): Promise<Product> => {
    const res = await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...product, user, ticketNumber }),
    });
    return res.json();
  },

  updateProduct: async (id: string, product: Partial<Product>, user?: User | null, ticketNumber?: string): Promise<Product> => {
    const res = await fetch(`/api/inventory/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...product, user, ticketNumber }),
    });
    return res.json();
  },

  deleteProduct: async (id: string, user?: User | null, ticketNumber?: string): Promise<void> => {
    await fetch(`/api/inventory/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user, ticketNumber }),
    });
  },

  // Stock movements (Withdrawal / Addition with Ticket Number & Audit)
  recordStockMovement: async (
    productId: string,
    delta: number,
    user: User,
    ticketNumber?: string,
    notes?: string
  ): Promise<{ success: boolean; product: Product; historyEntry: HistoryEntry }> => {
    const res = await fetch(`/api/inventory/${productId}/stock-movement`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delta, user, ticketNumber, notes }),
    });
    return res.json();
  },

  // EAN & GTIN Lookup
  lookupEan: async (barcode: string): Promise<EanLookupResult> => {
    const res = await fetch(`/api/ean-lookup?barcode=${encodeURIComponent(barcode)}`);
    return res.json();
  },

  // History & Audit Log
  getHistory: async (filters?: { ticket?: string; userId?: string; action?: string; search?: string }): Promise<HistoryEntry[]> => {
    const params = new URLSearchParams();
    if (filters?.ticket) params.set('ticket', filters.ticket);
    if (filters?.userId) params.set('userId', filters.userId);
    if (filters?.action) params.set('action', filters.action);
    if (filters?.search) params.set('search', filters.search);

    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`/api/history${query}`);
    return res.json();
  },
};

