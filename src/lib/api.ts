const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

async function fetchAuth<T>(url: string, options?: RequestInit): Promise<T> {
 const res = await fetch(`${API_BASE}${url}`, {
 ...options,
 headers: {
 'Content-Type': 'application/json',
 ...options?.headers,
 },
 credentials: 'include',
 });

 if (!res.ok) {
 const error = await res.json().catch(() => ({ error: 'Unknown error' }));
 throw new Error(error.error || `HTTP ${res.status}`);
 }

 return res.json();
}

export const api = {
 items: {
 list: () => fetchAuth('/items'),
 create: (data: any) => fetchAuth('/items', { method: 'POST', body: JSON.stringify(data) }),
 update: (id: string, data: any) => fetchAuth(`/items/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
 delete: (id: string) => fetchAuth(`/items/${id}`, { method: 'DELETE' }),
 },
 categories: {
 list: () => fetchAuth('/categories'),
 create: (data: any) => fetchAuth('/categories', { method: 'POST', body: JSON.stringify(data) }),
 update: (id: string, data: any) => fetchAuth(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
 delete: (id: string) => fetchAuth(`/categories/${id}`, { method: 'DELETE' }),
 },
 locations: {
 list: () => fetchAuth('/locations'),
 create: (data: any) => fetchAuth('/locations', { method: 'POST', body: JSON.stringify(data) }),
 update: (id: string, data: any) => fetchAuth(`/locations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
 delete: (id: string) => fetchAuth(`/locations/${id}`, { method: 'DELETE' }),
 },
 auth: {
 me: () => fetchAuth('/auth/me'),
 updateProfile: (data: any) => fetchAuth('/auth/profile', { method: 'PATCH', body: JSON.stringify(data) }),
 acceptInvitation: (token: string) => fetchAuth('/auth/invitations/accept', { method: 'POST', body: JSON.stringify({ token }) }),
 },
};