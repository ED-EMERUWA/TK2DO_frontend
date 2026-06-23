import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'burnt';
import { taskKeys } from '../lib/queryKeys';
import * as store from '../store/taskStore';
import type { Task, TaskStatus, CreateTaskInput, UpdateTaskInput } from '../types';
import { api } from '../lib/api'
import { enqueue } from '../lib/offlineQueue'




const notify = {
  success: (title: string) => toast({ title, preset: 'done' }),
  error:   (title: string) => toast({ title, preset: 'error' }),
};


// ─── READ: get all tasks ─────────────────────────────────────────────────────
//
// What happens:
//   1. Component mounts, calls useTasks()
//   2. React Query checks cache for key ['tasks']
//   3a. Cache HIT + data is fresh (< staleTime): return cache, no fetch
//   3b. Cache HIT + data is stale: return cache immediately, fetch in background
//   3c. Cache MISS: return { isLoading: true }, then fetch
//   4. On success: cache is updated, all subscribers re-render
//
// Offline: if there's no internet but there's cached data, step 3a/3b runs
// 

export function useTasksByDate(date: string) {

  const tasks = useQuery({
    queryKey: taskKeys.byDate(date),
    // this query fn puts things in the cache
    queryFn:  () => api.tasks.getByDate(date),
    staleTime: 2 * 60 * 1000,
    gcTime:    10 * 60 * 1000,
  });
  console.log('Tasks by date:', tasks);
  return tasks;
  // this is already calling your bacjkend, you just bneed t finsd a way to put it in asyncstorage and handle it

}

export function useTasksByMonth(year: number, month: number) {  
  return useQuery({
    queryKey: taskKeys.byMonth(year, month),
    queryFn:  () => api.tasks.getByMonth(year, month),
    staleTime: 5 * 60 * 1000,
    gcTime:    15 * 60 * 1000,
  });
}

export function useTasks() {
  return useQuery<Task[]>({
    queryKey: taskKeys.all(),
    queryFn:  () => api.tasks.getAll(),
    // placeholderData keeps showing old data while a background refetch runs
    // instead of flashing a loading spinner
    placeholderData: (prev) => prev,
  }
  );}
  

  // ─── READ: single task ───────────────────────────────────────────────────────

export function useTask(id: string) {
  return useQuery<Task>({
    queryKey: taskKeys.detail(id),
    queryFn:  () => api.tasks.get(id),
    enabled:  !!id,
  })
};



// ─── WRITE: create task ──────────────────────────────────────────────────────
//
// Strategy: OPTIMISTIC UPDATE
//
// onMutate  → immediately add task to cache (instant UI response)
// mutationFn → send POST to backend
// onError   → something went wrong, roll back to the snapshot
// onSettled → whether success or fail, refetch to sync with backend truth
//
// If OFFLINE: mutationFn throws a network error.
//             onError fires, we roll back the optimistic update visually.
//             We also push to the offline queue so we can retry on reconnect.

export function useCreateTask(date: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTaskInput) =>
      api.tasks.create({
        title:            input.title,
        description:      input.description ?? null,
        date:             input.date,
        start_time:       input.start_time ,
        duration_minutes: input.duration_minutes,
        status:           'pending' as TaskStatus,
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
        completed:        false,
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

    onError: async (err, input, ctx) => {
      if (ctx?.previous !== undefined) {
        qc.setQueryData(taskKeys.byDate(date), ctx.previous);
      }

      if (err.message.includes('Network request failed') || err.message.includes('fetch')) {

        await enqueue({ type: 'CREATE_TASK', payload:  input  });
      } else {
        notify.error('Failed to create task');
      }
    },

    onSuccess: () => {
      notify.success('Task created');
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: taskKeys.all() });
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
      api.tasks.update(id, { status }),

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
    mutationFn: (id: string) => api.tasks.delete(id),

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
      qc.invalidateQueries({ queryKey: taskKeys.all() });
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
    }) => api.tasks.updateStep( stepId, { completed } ),

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