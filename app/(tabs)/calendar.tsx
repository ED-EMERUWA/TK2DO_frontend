import { useMemo, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTasksByMonth } from '../../src/hooks/useTasks';
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
          <View className="flex-row mb-2">
            {DAY_LABELS.map((d, i) => (
              <View key={i} className="flex-1 items-center">
                <Text className="text-muted-foreground text-xs">{d}</Text>
              </View>
            ))}
          </View>

          {isLoading ? (
            <View className="py-12 items-center">
              <ActivityIndicator color="#6366f1" />
            </View>
          ) : (
            <View className="flex-row flex-wrap">
              {cells.map((day, idx) => (
                <View
                  key={idx}
                  className="border border-border/30"
                  style={{ width: `${100 / 7}%`, aspectRatio: 1, padding: 4 }}
                >
                  {day !== null && (
                    <>
                      <Text className="text-foreground text-sm">{day}</Text>
                      <View className="flex-row flex-wrap gap-0.5 mt-1">
                        {(tasksByDay[day] ?? []).slice(0, 4).map(t => (
                          <View
                            key={t.id}
                            className={`w-2 h-2 rounded-full ${COLOR_CLASSES[t.color_index] ?? 'bg-chart-1'}`}
                          />
                        ))}
                      </View>
                    </>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
