import { storage } from './storage';
import type {
  AuthResponse,
  CreateTaskInput,
  Task,
  UpdateTaskInput,
  UserProfile,
} from '../types';
//api.ts
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await storage.getToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    await storage.deleteToken();
    throw new ApiError(401, 'Session expired');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.error ?? `HTTP ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const auth = {
  signup: (body: { email: string; password: string; name?: string }) =>
    request<AuthResponse>('/auth/signup', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: { email: string; password: string }) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request<UserProfile>('/auth/me'),
  updateMe: (body: { name?: string }) =>
    request<UserProfile>('/auth/me', { method: 'PATCH', body: JSON.stringify(body) }),
};

export const tasks = {
  getByDate:  (date: string)                => request<Task[]>(`/tasks?date=${date}`),
  getByMonth: (year: number, month: number) => request<Task[]>(`/tasks?year=${year}&month=${month}`),
  get:        (id: string)                  => request<Task>(`/tasks/${id}`),
  create:     (body: CreateTaskInput)       => request<Task>('/tasks', { method: 'POST', body: JSON.stringify(body) }),
  update:     (id: string, body: UpdateTaskInput) =>
    request<Task>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  delete:     (id: string) => request<void>(`/tasks/${id}`, { method: 'DELETE' }),
  updateStep: (stepId: string, body: { completed?: boolean; text?: string; sort_order?: number }) =>
    request(`/tasks/steps/${stepId}`, { method: 'PATCH', body: JSON.stringify(body) }),
};
