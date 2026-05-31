// In-memory mock store used by useTasks until the real API is wired in.
// Swap function bodies for `tasks.*` calls from `../lib/api` when ready.

import type { Task, TaskStatus, TaskStep } from '../types';

const seed: Task[] = [
  {
    id: '1',
    title: 'Morning standup with team',
    description: null,
    date: '2026-05-28',
    start_time: '09:00',
    duration_minutes: 30,
    status: 'completed',
    color_index: 0,
    tags: ['Work'],
    steps: [
      { id: '1-1', text: "Review yesterday's progress", completed: true,  sort_order: 0 },
      { id: '1-2', text: "Share today's plan",          completed: false, sort_order: 1 },
      { id: '1-3', text: 'Discuss blockers',            completed: false, sort_order: 2 },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Review pull requests',
    description: null,
    date: '2026-05-28',
    start_time: '10:00',
    duration_minutes: 60,
    status: 'in-progress',
    color_index: 0,
    tags: ['Work'],
    steps: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Gym workout',
    description: null,
    date: '2026-05-28 ',
    start_time: '18:00',
    duration_minutes: 60,
    status: 'pending',
    color_index: 2,
    tags: ['Health'],
    steps: [
      { id: '3-1', text: 'Warmup',    completed: false, sort_order: 0 },
      { id: '3-2', text: 'Strength',  completed: false, sort_order: 1 },
      { id: '3-3', text: 'Cool down', completed: false, sort_order: 2 },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

let store: Task[] = [...seed];
let nextId = seed.length + 1;

const delay = (ms = 200) => new Promise(r => setTimeout(r, ms));

export async function fetchTasksByDate(date: string): Promise<Task[]> {
  await delay();
  return store.filter(t => t.date === date);
}

export async function fetchTasksByMonth(year: number, month: number): Promise<Task[]> {
  await delay(100);
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  return store.filter(t => t.date.startsWith(prefix));
}

export async function fetchTask(id: string): Promise<Task | null> {
  await delay(50);
  return store.find(t => t.id === id) ?? null;
}

export async function createTask(input: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task> {
  await delay();
  const id = String(nextId++);
  const task: Task = {
    ...input,
    id,
    steps: (input.steps ?? []).map((s, i) => ({
      ...s,
      id: `${id}-${i}`,
      sort_order: i,
    })),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  store = [...store, task];
  return task;
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<Task> {
  await delay();
  store = store.map(t =>
    t.id === id ? { ...t, ...updates, updated_at: new Date().toISOString() } : t
  );
  return store.find(t => t.id === id)!;
}

export async function deleteTask(id: string): Promise<void> {
  await delay();
  store = store.filter(t => t.id !== id);
}

export async function toggleStep(taskId: string, stepId: string, completed: boolean): Promise<Task> {
  await delay(50);
  store = store.map(t =>
    t.id === taskId
      ? {
          ...t,
          steps: t.steps.map((s: TaskStep) =>
            s.id === stepId ? { ...s, completed } : s
          ),
          updated_at: new Date().toISOString(),
        }
      : t
  );
  return store.find(t => t.id === taskId)!;
}

export async function updateTaskStatus(id: string, status: TaskStatus): Promise<Task> {
  return updateTask(id, { status });
}
