export type TaskStatus = 'pending' | 'in-progress' | 'completed';

export interface TaskStep {
  id: string;
  text: string;
  completed: boolean;
  sort_order: number;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  date: string;
  start_time: string | null;
  duration_minutes: number;
  status: TaskStatus;
  completed:        boolean;   
  color_index: number;
  steps: TaskStep[];
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface CalendarTask {
  id: string;
  title: string;
  date: string;
  status: TaskStatus;
  color_index: number;
}

export interface CreateTaskInput {
  title: string;
  description?: string | null;
  date: string;
  start_time?: string;
  duration_minutes: number;
  color_index?: number;
  steps?: Array<{ text: string }>;
  tags?: string[];
  status?:          TaskStatus;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  date?: string;
  start_time?: string;
  duration_minutes?: number;
  status?: TaskStatus;
  color_index?: number;
  completed?:        boolean;   

  

}

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
}

export interface AuthResponse {
  token: string;
  user: UserProfile;
}

export const COLOR_CLASSES: Record<number, string> = {
  0: 'bg-chart-1',
  1: 'bg-chart-2',
  2: 'bg-chart-3',
  3: 'bg-chart-4',
  4: 'bg-chart-5',
};

export const TAG_TO_COLOR_INDEX: Record<string, number> = {
  Work: 0,
  Personal: 1,
  Health: 2,
  Productivity: 3,
};
