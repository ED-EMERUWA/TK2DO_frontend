import { View, Text, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTasksByDate, useUpdateTaskStatus } from '../../src/hooks/useTasks';
import { COLOR_CLASSES } from '../../src/types';
import type { TaskStatus } from '../../src/types';

const TODAY = new Date().toISOString().split('T')[0];

const STATUSES: { value: TaskStatus; label: string; color: string }[] = [
  { value: 'pending',     label: 'Pending',     color: '#737373' },
  { value: 'in-progress', label: 'In Progress', color: '#eab308' },
  { value: 'completed',   label: 'Done',        color: '#14b8a6' },
];

export default function StatusScreen() {
  const { data: tasks = [], isLoading } = useTasksByDate(TODAY);
  const updateStatus = useUpdateTaskStatus(TODAY);

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
        <Text className="text-foreground text-2xl font-semibold mb-1">Status</Text>
        <Text className="text-muted-foreground">Update task progress</Text>
      </View>

      <FlatList
        data={tasks}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        ListEmptyComponent={
          <Text className="text-muted-foreground text-center py-12">No tasks for today.</Text>
        }
        renderItem={({ item: task }) => (
          <View className="bg-card border border-border rounded-lg p-4">
            <View className="flex-row items-center gap-3 mb-3">
              <View className={`w-1 h-8 rounded-full ${COLOR_CLASSES[task.color_index] ?? 'bg-chart-1'}`} />
              <View className="flex-1">
                <Text className="text-foreground text-base">{task.title}</Text>
                {task.start_time && (
                  <Text className="text-muted-foreground text-sm">{task.start_time}</Text>
                )}
              </View>
            </View>

            <View className="flex-row gap-2">
              {STATUSES.map(s => {
                const active = task.status === s.value;
                return (
                  <Pressable
                    key={s.value}
                    onPress={() => updateStatus.mutate({ id: task.id, status: s.value })}
                    className={`flex-1 py-2 rounded-lg items-center border ${
                      active ? 'border-primary bg-primary/10' : 'border-border bg-background'
                    }`}
                  >
                    <Text
                      className={active ? 'text-foreground text-sm' : 'text-muted-foreground text-sm'}
                    >
                      {s.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
