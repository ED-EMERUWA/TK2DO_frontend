import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, FlatList, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { toast } from 'burnt';
import {
  useTasksByDate,
  useDeleteTask,
  useToggleStep,
} from '../../src/hooks/useTasks';
import { COLOR_CLASSES } from '../../src/types';
import type { Task } from '../../src/types';

const TODAY = new Date().toISOString().split('T')[0];

interface TaskTimer {
  taskId: string;
  seconds: number;
  isRunning: boolean;
  initialSeconds: number;
  hasNotified: boolean;
}

function formatTime(s: number): string {
  const neg = s < 0;
  const abs = Math.abs(s);
  const h   = Math.floor(abs / 3600);
  const m   = Math.floor((abs % 3600) / 60);
  const sec = abs % 60;
  const str = h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    : `${m}:${String(sec).padStart(2, '0')}`;
  return neg ? `-${str}` : str;
}

export default function TodayScreen() {
  const { data: tasks = [], isLoading } = useTasksByDate(TODAY);
  const deleteTask = useDeleteTask(TODAY);
  const toggleStep = useToggleStep(TODAY);

  const [timers, setTimers]     = useState<TaskTimer[]>([]);
  const [expandedId, setExpanded] = useState<string | null>(null);
  const prevTimersRef = useRef<TaskTimer[]>([]);

  useEffect(() => {
    setTimers(prev => {
      const existing = new Map(prev.map(t => [t.taskId, t]));
      return tasks.map(t => {
        if (existing.has(t.id)) return existing.get(t.id)!;
        const s = t.duration_minutes * 60;
        return { taskId: t.id, seconds: s, isRunning: false, initialSeconds: s, hasNotified: false };
      });
    });
  }, [tasks]);

  useEffect(() => {
    const id = setInterval(() => {
      setTimers(prev => prev.map(t => t.isRunning ? { ...t, seconds: t.seconds - 1 } : t));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    timers.forEach((timer, i) => {
      const prev = prevTimersRef.current[i];
      if (timer.isRunning && prev && prev.seconds > 0 && timer.seconds <= 0 && !timer.hasNotified) {
        const task = tasks.find(t => t.id === timer.taskId);
        if (task) {
          toast({ title: "Time's up!", message: `${task.title} duration has ended.`, preset: 'done' });
          setTimers(p => p.map(t => t.taskId === timer.taskId ? { ...t, hasNotified: true } : t));
        }
      }
    });
    prevTimersRef.current = timers;
  }, [timers, tasks]);

  const getTimer  = (id: string) => timers.find(t => t.taskId === id);
  const toggleRun = (id: string) =>
    setTimers(p => p.map(t => t.taskId === id ? { ...t, isRunning: !t.isRunning } : t));
  const restart   = (id: string) =>
    setTimers(p => p.map(t =>
      t.taskId === id
        ? { ...t, seconds: t.initialSeconds, isRunning: false, hasNotified: false }
        : t
    ));

  const confirmDelete = (task: Task) => {
    Alert.alert(
      'Delete Task',
      `Are you sure you want to delete "${task.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteTask.mutate(task.id) },
      ],
    );
  };

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#6366f1" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="px-6 py-5 border-b border-border bg-card">
        <Text className="text-foreground text-2xl font-semibold mb-1">Today</Text>
        <Text className="text-muted-foreground">{formattedDate}</Text>
      </View>

      <FlatList
        data={tasks}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        ListEmptyComponent={
          <Text className="text-muted-foreground text-center py-12">No tasks for today.</Text>
        }
        renderItem={({ item: task }) => {
          const timer = getTimer(task.id);
          const isExpanded = expandedId === task.id;
          const colorBg = COLOR_CLASSES[task.color_index] ?? 'bg-chart-1';

          return (
            <View className="bg-card border border-border rounded-lg overflow-hidden">
              <View className="flex-row items-start gap-3 p-4">
                <View className={`w-1 self-stretch rounded-full ${colorBg}`} />

                <Pressable
                  onPress={() => setExpanded(p => p === task.id ? null : task.id)}
                  className="flex-1"
                >
                  <Text className="text-foreground text-base mb-2">{task.title}</Text>
                  <View className="flex-row items-center gap-3">
                    {task.start_time && (
                      <View className="flex-row items-center gap-1">
                        <Ionicons name="time-outline" size={14} color="#737373" />
                        <Text className="text-muted-foreground text-sm">{task.start_time}</Text>
                      </View>
                    )}
                    <Text className="text-muted-foreground text-sm">{task.duration_minutes} min</Text>
                    {task.tags[0] && (
                      <View className="bg-muted px-2 py-0.5 rounded">
                        <Text className="text-muted-foreground text-xs">{task.tags[0]}</Text>
                      </View>
                    )}
                  </View>
                </Pressable>

                {task.steps.length > 0 && (
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#737373"
                  />
                )}

                {(task.steps.length === 0 || !isExpanded) && timer && (
                  <View className="flex-row items-center gap-1">
                    <Text className="text-muted-foreground text-sm min-w-[48px] text-right">
                      {formatTime(timer.seconds)}
                    </Text>
                    <Pressable onPress={() => toggleRun(task.id)} className="p-1">
                      <Ionicons
                        name={timer.isRunning ? 'pause' : 'play'}
                        size={20}
                        color="#6366f1"
                      />
                    </Pressable>
                    <Pressable onPress={() => restart(task.id)} className="p-1">
                      <Ionicons name="refresh" size={20} color="#6366f1" />
                    </Pressable>
                  </View>
                )}

                <Pressable onPress={() => confirmDelete(task)} className="p-1">
                  <Ionicons name="trash-outline" size={20} color="#ef4444" />
                </Pressable>
              </View>

              {task.steps.length > 0 && isExpanded && (
                <View className="px-4 pb-4 pt-2 border-t border-border">
                  {timer && (
                    <View className="flex-row items-center gap-3 mb-3 pb-3 border-b border-border">
                      <Text className="text-foreground text-lg">{formatTime(timer.seconds)}</Text>
                      <Pressable onPress={() => toggleRun(task.id)} className="p-1">
                        <Ionicons
                          name={timer.isRunning ? 'pause' : 'play'}
                          size={22}
                          color="#6366f1"
                        />
                      </Pressable>
                      <Pressable onPress={() => restart(task.id)} className="p-1">
                        <Ionicons name="refresh" size={22} color="#6366f1" />
                      </Pressable>
                    </View>
                  )}
                  <View className="gap-2">
                    {task.steps.map(step => (
                      <Pressable
                        key={step.id}
                        onPress={() =>
                          toggleStep.mutate({
                            taskId: task.id,
                            stepId: step.id,
                            completed: !step.completed,
                          })
                        }
                        className="flex-row items-center gap-3 py-1"
                      >
                        <Ionicons
                          name={step.completed ? 'checkbox' : 'square-outline'}
                          size={20}
                          color={step.completed ? '#6366f1' : '#737373'}
                        />
                        <Text
                          className={
                            step.completed
                              ? 'flex-1 text-muted-foreground line-through'
                              : 'flex-1 text-foreground'
                          }
                        >
                          {step.text}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}
