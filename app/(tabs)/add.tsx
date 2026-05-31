import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { toast } from 'burnt';
import { useCreateTask } from '../../src/hooks/useTasks';
import { TAG_TO_COLOR_INDEX, COLOR_CLASSES } from '../../src/types';


const TODAY = new Date().toISOString().split('T')[0];
const TAG_OPTIONS = ['Work', 'Personal', 'Health', 'Productivity'];

export default function AddScreen() {
  const router = useRouter();
  const createTask = useCreateTask(TODAY);

  const [title, setTitle]         = useState('');
  const [description, setDesc]    = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration]   = useState('30');
  const [tag, setTag]             = useState('Work');
  const [steps, setSteps]         = useState<string[]>([]);
  const [newStep, setNewStep]     = useState('');

  function reset() {
    setTitle('');
    setDesc('');
    setStartTime('');
    setDuration('30');
    setTag('Work');
    setSteps([]);
    setNewStep('');
  }

  function submit() {
    if (!title.trim()) {
      toast({ title: 'Title is required', preset: 'error' });
      return;
    }
    const mins = parseInt(duration, 10);
    if (!Number.isFinite(mins) || mins < 1 || mins > 1440) {
      toast({ title: 'Duration must be 1–1440 minutes', preset: 'error' });
      return;
    }

    createTask.mutate(
      {
        title: title.trim(),
        description: description.trim() || undefined,
        date: TODAY,
        start_time: startTime.trim() || undefined,
        duration_minutes: mins,
        color_index: TAG_TO_COLOR_INDEX[tag] ?? 4,
        steps: steps.map(text => ({ text })),
        tags: [tag],
      },
      {
        onSuccess: () => {
          reset();
          router.push('/(tabs)/today');
        },
      },
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="px-6 py-5 border-b border-border bg-card">
          <Text className="text-foreground text-2xl font-semibold">New Task</Text>
        </View>

        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, gap: 16 }}>
          <View>
            <Text className="text-muted-foreground text-sm mb-2">Title</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="What needs doing?"
              placeholderTextColor="#737373"
              className="bg-card border border-border rounded-lg px-4 py-3 text-foreground"
            />
          </View>

          <View>
            <Text className="text-muted-foreground text-sm mb-2">Description</Text>
            <TextInput
              value={description}
              onChangeText={setDesc}
              placeholder="Optional"
              placeholderTextColor="#737373"
              multiline
              numberOfLines={3}
              style={{ textAlignVertical: 'top', minHeight: 80 }}
              className="bg-card border border-border rounded-lg px-4 py-3 text-foreground"
            />
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Text className="text-muted-foreground text-sm mb-2">Start (HH:MM)</Text>
              <TextInput
                value={startTime}
                onChangeText={setStartTime}
                placeholder="09:00"
                placeholderTextColor="#737373"
                className="bg-card border border-border rounded-lg px-4 py-3 text-foreground"
              />
            </View>
            <View className="flex-1">
              <Text className="text-muted-foreground text-sm mb-2">Duration (min)</Text>
              <TextInput
                value={duration}
                onChangeText={setDuration}
                keyboardType="numeric"
                placeholder="30"
                placeholderTextColor="#737373"
                className="bg-card border border-border rounded-lg px-4 py-3 text-foreground"
              />
            </View>
          </View>

          <View>
            <Text className="text-muted-foreground text-sm mb-2">Tag</Text>
            <View className="flex-row flex-wrap gap-2">
              {TAG_OPTIONS.map(t => {
                const active = tag === t;
                const dotBg  = COLOR_CLASSES[TAG_TO_COLOR_INDEX[t] ?? 4];
                return (
                  <Pressable
                    key={t}
                    onPress={() => setTag(t)}
                    className={`flex-row items-center gap-2 px-3 py-2 rounded-lg border ${
                      active ? 'border-primary bg-primary/10' : 'border-border bg-card'
                    }`}
                  >
                    <View className={`w-2 h-2 rounded-full ${dotBg}`} />
                    <Text className={active ? 'text-foreground' : 'text-muted-foreground'}>
                      {t}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View>
            <Text className="text-muted-foreground text-sm mb-2">Steps</Text>
            {steps.map((s, i) => (
              <View key={i} className="flex-row items-center gap-2 mb-2">
                <Text className="flex-1 text-foreground bg-card border border-border rounded-lg px-3 py-2">
                  {s}
                </Text>
                <Pressable
                  onPress={() => setSteps(prev => prev.filter((_, idx) => idx !== i))}
                  className="p-2"
                >
                  <Ionicons name="close" size={18} color="#ef4444" />
                </Pressable>
              </View>
            ))}
            <View className="flex-row items-center gap-2">
              <TextInput
                value={newStep}
                onChangeText={setNewStep}
                placeholder="Add step…"
                placeholderTextColor="#737373"
                className="flex-1 bg-card border border-border rounded-lg px-3 py-2 text-foreground"
              />
              <Pressable
                onPress={() => {
                  const s = newStep.trim();
                  if (!s) return;
                  if (steps.length >= 20) {
                    toast({ title: 'Max 20 steps', preset: 'error' });
                    return;
                  }
                  setSteps(prev => [...prev, s]);
                  setNewStep('');
                }}
                className="bg-primary rounded-lg px-3 py-2"
              >
                <Ionicons name="add" size={20} color="#fff" />
              </Pressable>
            </View>
          </View>

          <Pressable
            onPress={submit}
            disabled={createTask.isPending}
            style={({ pressed }) => [{ opacity: pressed || createTask.isPending ? 0.7 : 1 }]}
            className="bg-primary rounded-lg py-3 items-center mt-2"
          >
            <Text className="text-primary-foreground font-semibold">
              {createTask.isPending ? 'Saving…' : 'Create Task'}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
