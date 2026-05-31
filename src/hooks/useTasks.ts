import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'burnt';
import { taskKeys } from '../lib/queryKeys';
import * as store from '../store/taskStore';
import type { Task, TaskStatus, CreateTaskInput, UpdateTaskInput } from '../types';

const notify = {
  success: (title: string) => toast({ title, preset: 'done' }),
  error:   (title: string) => toast({ title, preset: 'error' }),
};

export function useTasksByDate(date: string) {
  return useQuery({
    queryKey: taskKeys.byDate(date),
    queryFn:  () => store.fetchTasksByDate(date),
    staleTime: 2 * 60 * 1000,
    gcTime:    10 * 60 * 1000,
  });
}

export function useTasksByMonth(year: number, month: number) {
  return useQuery({
    queryKey: taskKeys.byMonth(year, month),
    queryFn:  () => store.fetchTasksByMonth(year, month),
    staleTime: 5 * 60 * 1000,
    gcTime:    15 * 60 * 1000,
  });
}

export function useCreateTask(date: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTaskInput) =>
      store.createTask({
        title:            input.title,
        description:      input.description ?? null,
        date:             input.date,
        start_time:       input.start_time ?? null,
        duration_minutes: input.duration_minutes,
        status:           'pending',
        color_index:      input.color_index ?? 0,
        steps:            (input.steps ?? []).map((s, i) => ({
                            id: `temp-${i}`,
                            text: s.text,
                            completed: false,
                            sort_order: i,
                          })),
        tags:             input.tags ?? [],
      }),

    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: taskKeys.byDate(date) });
      const previous = qc.getQueryData<Task[]>(taskKeys.byDate(date));

      const optimistic: Task = {
        id:               `optimistic-${Date.now()}`,
        title:            input.title,
        description:      input.description ?? null,
        date:             input.date,
        start_time:       input.start_time ?? null,
        duration_minutes: input.duration_minutes,
        status:           'pending',
        color_index:      input.color_index ?? 0,
        steps:            (input.steps ?? []).map((s, i) => ({
                            id: `temp-${i}`,
                            text: s.text,
                            completed: false,
                            sort_order: i,
                          })),
        tags:             input.tags ?? [],
        created_at:       new Date().toISOString(),
        updated_at:       new Date().toISOString(),
      };

      qc.setQueryData<Task[]>(taskKeys.byDate(date), old => [...(old ?? []), optimistic]);
      return { previous };
    },

    onError: (_e, _i, ctx) => {
      if (ctx?.previous !== undefined) qc.setQueryData(taskKeys.byDate(date), ctx.previous);
      notify.error('Failed to create task');
    },

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.all });
      notify.success('Task created');
    },
  });
}

export function useUpdateTask(date: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateTaskInput }) =>
      store.updateTask(id, updates),

    onMutate: async ({ id, updates }) => {
      await qc.cancelQueries({ queryKey: taskKeys.byDate(date) });
      const previous = qc.getQueryData<Task[]>(taskKeys.byDate(date));

      qc.setQueryData<Task[]>(taskKeys.byDate(date), old =>
        old?.map(t => t.id === id ? { ...t, ...updates } : t) ?? []
      );

      return { previous };
    },

    onError: (_e, _v, ctx) => {
      if (ctx?.previous !== undefined) qc.setQueryData(taskKeys.byDate(date), ctx.previous);
      notify.error('Failed to update task');
    },

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.byDate(date) });
    },
  });
}

export function useUpdateTaskStatus(date: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      store.updateTaskStatus(id, status),

    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: taskKeys.byDate(date) });
      const previous = qc.getQueryData<Task[]>(taskKeys.byDate(date));

      qc.setQueryData<Task[]>(taskKeys.byDate(date), old =>
        old?.map(t => t.id === id ? { ...t, status } : t) ?? []
      );

      return { previous };
    },

    onError: (_e, _v, ctx) => {
      if (ctx?.previous !== undefined) qc.setQueryData(taskKeys.byDate(date), ctx.previous);
      notify.error('Failed to update status');
    },

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.byDate(date) });
    },
  });
}

export function useDeleteTask(date: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => store.deleteTask(id),

    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: taskKeys.byDate(date) });
      const previous = qc.getQueryData<Task[]>(taskKeys.byDate(date));

      qc.setQueryData<Task[]>(taskKeys.byDate(date), old =>
        old?.filter(t => t.id !== id) ?? []
      );

      return { previous };
    },

    onError: (_e, _i, ctx) => {
      if (ctx?.previous !== undefined) qc.setQueryData(taskKeys.byDate(date), ctx.previous);
      notify.error('Failed to delete task');
    },

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.all });
      notify.success('Task deleted');
    },
  });
}

export function useToggleStep(date: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, stepId, completed }: {
      taskId: string;
      stepId: string;
      completed: boolean;
    }) => store.toggleStep(taskId, stepId, completed),

    onMutate: async ({ taskId, stepId, completed }) => {
      await qc.cancelQueries({ queryKey: taskKeys.byDate(date) });
      const previous = qc.getQueryData<Task[]>(taskKeys.byDate(date));

      qc.setQueryData<Task[]>(taskKeys.byDate(date), old =>
        old?.map(t =>
          t.id === taskId
            ? { ...t, steps: t.steps.map(s => s.id === stepId ? { ...s, completed } : s) }
            : t
        ) ?? []
      );

      return { previous };
    },

    onError: (_e, _v, ctx) => {
      if (ctx?.previous !== undefined) qc.setQueryData(taskKeys.byDate(date), ctx.previous);
      notify.error('Failed to update step');
    },

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.byDate(date) });
    },
  });
}
