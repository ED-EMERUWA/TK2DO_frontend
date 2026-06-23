import { useMemo, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, ScrollView, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTasksByDate, useTasksByMonth } from '../../src/hooks/useTasks';
import { COLOR_CLASSES } from '../../src/types';

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function startWeekday(year: number, month: number) {
  return new Date(year, month - 1, 1).getDay();
}

export default function CalendarScreen() {
  const today = new Date();
  const [year, setYear]   = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { data: tasks = [], isLoading } = useTasksByMonth(year, month);

  const tasksByDay = useMemo(() => {
    const map: Record<number, typeof tasks> = {};
    tasks.forEach(t => {
      const day = Number(t.date.slice(-2));
      (map[day] = map[day] ?? []).push(t);
    });
    return map;
  }, [tasks]);

  const totalDays = daysInMonth(year, month);
  const offset    = startWeekday(year, month);
  const cells     = [...Array(offset).fill(null), ...Array.from({ length: totalDays }, (_, i) => i + 1)];

  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString('en-US', {
    month: 'long', year: 'numeric',
  });

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else             { setMonth(m => m - 1); }
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else              { setMonth(m => m + 1); }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="px-6 py-5 border-b border-border bg-card flex-row items-center justify-between">
        <Pressable onPress={prevMonth} className="p-2">
          <Ionicons name="chevron-back" size={22} color="#fafafa" />
        </Pressable>
        <Text className="text-foreground text-xl font-semibold">{monthLabel}</Text>
        <Pressable onPress={nextMonth} className="p-2">
          <Ionicons name="chevron-forward" size={22} color="#fafafa" />
        </Pressable>
      </View>

      <ScrollView className="flex-1">
        <View className="p-4">
          <View className="flex-row mb-3">
            {DAY_LABELS.map((d, i) => (
              <View key={i} className="flex-1 items-center">
                <Text className="text-muted-foreground text-base font-medium">{d}</Text>
              </View>
            ))}
          </View>

          {isLoading ? (
            <View className="py-12 items-center">
              <ActivityIndicator color="#6366f1" />
            </View>
          ) : (
            <View className="flex-row flex-wrap">
              {cells.map((day, idx) => {
                const dayTasks = day !== null ? (tasksByDay[day] ?? []) : [];
                const dotTasks = dayTasks.slice(0, 3);          // max 3 dots
                const overflow = dayTasks.length - dotTasks.length;
                return (
                  <Pressable
                    key={idx}
                    disabled={day === null}
                    onPress={() => {
                      if (day === null) return;
                      const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                      setSelectedDate(iso);
                    }}
                    className="border border-border/30"
                    style={{ width: `${100 / 7}%`, minHeight: 84, padding: 8 }}
                  >
                    {day !== null && (
                      <>
                        <Text className="text-foreground text-lg font-medium">{day}</Text>
                        {dayTasks.length > 0 && (
                          <View className="flex-row items-center flex-wrap mt-1.5 gap-1">
                            {dotTasks.map((t, i) => (
                              <View
                                key={i}
                                className={`w-2 h-2 rounded-full ${COLOR_CLASSES[t.color_index] ?? 'bg-chart-5'}`}
                              />
                            ))}
                            {overflow > 0 && (
                              <Text className="text-muted-foreground text-xs font-medium">+{overflow}</Text>
                            )}
                          </View>
                        )}
                      </>
                    )}
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={selectedDate !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedDate(null)}
      >
        {selectedDate && (
          <DayTasksSheet date={selectedDate} onClose={() => setSelectedDate(null)} />
        )}
      </Modal>
    </SafeAreaView>
  );
}

function DayTasksSheet({ date, onClose }: { date: string; onClose: () => void }) {
  const { data: tasks = [], isLoading } = useTasksByDate(date);

  const [year, month, day] = date.split('-').map(Number);

const localDate = new Date(
  year,
  month - 1,
  day,
  12, // noon avoids timezone edge cases
);

const formatted = localDate.toLocaleDateString('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
});

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="px-6 py-5 border-b border-border bg-card flex-row items-center justify-between">
        <Text className="text-foreground text-xl font-semibold">{formatted}</Text>
        <Pressable onPress={onClose} className="p-2">
          <Ionicons name="close" size={22} color="#fafafa" />
        </Pressable>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#6366f1" />
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          ListEmptyComponent={
            <Text className="text-muted-foreground text-center py-12">No tasks for this day.</Text>
          }
          renderItem={({ item: task }) => {
            const colorBg = COLOR_CLASSES[task.color_index] ?? 'bg-chart-1';
            return (
              <View className="bg-card border border-border rounded-lg p-4 flex-row items-start gap-3">
                <View className={`w-1 self-stretch rounded-full ${colorBg}`} />
                <View className="flex-1">
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
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
