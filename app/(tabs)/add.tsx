import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { toast } from 'burnt';
import dayjs from 'dayjs';
import DateTimePicker, {
  useDefaultClassNames,
  type DateType,
} from 'react-native-ui-datepicker';
import { useCreateTask } from '../../src/hooks/useTasks';
import { TAG_TO_COLOR_INDEX, COLOR_CLASSES } from '../../src/types';

const TODAY = new Date().toISOString().split('T')[0];
const TAG_OPTIONS = ['Work', 'Personal', 'Health', 'Productivity'];

export default function AddScreen() {
  const router     = useRouter();
  const createTask = useCreateTask(TODAY);


  const [title, setTitle]         = useState('');
  const [description, setDesc]    = useState('');
  const [date, setDate]           = useState(TODAY);
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration]   = useState('30');
  const [tag, setTag]             = useState('Work');
  const [steps, setSteps]         = useState<string[]>([]);
  const [newStep, setNewStep]     = useState('');

  // ── picker visibility ────────────────────────────────────────────────────
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  // Working value for the time picker — its wheels fire onChange continuously,
  // so we hold the in-progress value and only commit it on "Done".
  const [tmpTime, setTmpTime] = useState<Date>(new Date());

  // ── themed picker classNames (overrides the lib defaults that reference
  //    `accent` tokens this app doesn't define) ───────────────────────────────
  const defaultClassNames = useDefaultClassNames();
  const pickerClassNames = {
    ...defaultClassNames,
    today: 'border border-primary',
    today_label: 'text-primary',
    selected: 'bg-primary',
    selected_label: 'text-primary-foreground',
    selected_month: 'bg-primary',
    selected_month_label: 'text-primary-foreground',
    selected_year: 'bg-primary',
    selected_year_label: 'text-primary-foreground',
    day_label: 'text-foreground',
    month_label: 'text-foreground',
    year_label: 'text-foreground',
    outside_label: 'text-muted-foreground',
    weekday_label: 'text-muted-foreground',
  };

  // ── picker handlers ──────────────────────────────────────────────────────
function onDateChange({ date: picked }: { date: DateType }) {
  const today = dayjs().startOf('day');

  const selected = dayjs(picked).startOf('day');

  // prevent picking past dates
  if (selected.isBefore(today)) {
    toast({ title: 'Cannot select past dates', preset: 'error' });
    return;
  }

  setDate(selected.format('YYYY-MM-DD'));
  setDatePickerOpen(false);
}

  function openTimePicker() {
    setTmpTime(startTime ? dayjs(`1970-01-01T${startTime}`).toDate() : new Date());
    setTimePickerOpen(true);
  }

  function confirmTime() {

    setStartTime(dayjs(tmpTime).format('HH:mm')); // → "09:30"
    setTimePickerOpen(false);
  }

  // ── reset ────────────────────────────────────────────────────────────────
  function reset() {
    setTitle('');
    setDesc('');
    setDate(TODAY);
    setStartTime('');
    setDuration('30');
    setTag('Work');
    setSteps([]);
    setNewStep('');
  }

  // ── submit ───────────────────────────────────────────────────────────────
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

    try {
      createTask.mutate(
      {
        title:            title.trim(),
        description:      description.trim() || undefined,
        date:             date || TODAY,
        start_time:       startTime || undefined,
        duration_minutes: mins,
        color_index:      TAG_TO_COLOR_INDEX[tag] ?? 4,
        steps:            steps.map(text => ({ text })),
        tags:             [tag],
      },
      {
        onSuccess: () => {
          reset();
          router.push('/(tabs)/today');
        },
      },
    );

    } catch (err) {
      console.error('Create task error:', err);
      toast({ title: 'Failed to create task', preset: 'error' });
      return;
    }
  }

  // ── render ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Header */}
        <View className="px-6 py-5 border-b border-border bg-card">
          <Text className="text-foreground text-2xl font-semibold">New Task</Text>
        </View>

        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, gap: 16 }}>

          {/* Title */}
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

          {/* Description */}
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

          
          {/* Steps */} 
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

          {/* Date picker */}
          <View>
            <Text className="text-muted-foreground text-sm mb-2">Date</Text>
            <Pressable
              onPress={() => setDatePickerOpen(true)}
              className="bg-card border border-border rounded-lg px-4 py-3 flex-row items-center justify-between"
            >
              <Text className="text-foreground">{date}</Text>
              <Ionicons name="calendar-outline" size={18} color="#737373" />
            </Pressable>
          </View>

          {/* Start time + Duration */}
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Text className="text-muted-foreground text-sm mb-2">Start time</Text>
              <Pressable
                onPress={openTimePicker}
                className="bg-card border border-border rounded-lg px-4 py-3 flex-row items-center justify-between"
              >
                <Text className={startTime ? 'text-foreground' : 'text-muted-foreground'}>
                  {startTime || '09:00'}
                </Text>
                <Ionicons name="time-outline" size={18} color="#737373" />
              </Pressable>
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

          {/* Tag */}
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


          {/* Submit */}
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

      {/* Date picker modal — rendered outside ScrollView so it overlays correctly */}
      <Modal
        visible={datePickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDatePickerOpen(false)}
      >
        <View className="flex-1 justify-end">
          {/* dimmed backdrop — sibling BEHIND the sheet, tap to dismiss */}
          <Pressable
            onPress={() => setDatePickerOpen(false)}
            className="absolute inset-0 bg-black/60"
          />
          {/* sheet — plain View so the picker owns its own touch responder */}
          <View className="bg-card border-t border-border rounded-t-2xl px-4 pt-4 pb-8">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-foreground text-lg font-semibold">Select date</Text>
              <Pressable onPress={() => setDatePickerOpen(false)} className="p-1">
                <Ionicons name="close" size={22} color="#fafafa" />
              </Pressable>
            </View>
            <DateTimePicker
              mode="single"
              date={dayjs(date)}
              onChange={onDateChange}
              classNames={pickerClassNames}
              components={{
                IconPrev: <Ionicons name="chevron-back" size={20} color="#fafafa" />,
                IconNext: <Ionicons name="chevron-forward" size={20} color="#fafafa" />,
              }}
            />
          </View>
        </View>
      </Modal>

      {/* Time picker modal */}
      <Modal
        visible={timePickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setTimePickerOpen(false)}
      >
        <View className="flex-1 justify-end">
          {/* dimmed backdrop — sibling BEHIND the sheet, tap to dismiss.
              Must NOT wrap the wheel: a scrollable list inside a Pressable
              fights for the touch responder and the wheel won't scroll. */}
          <Pressable
            onPress={() => setTimePickerOpen(false)}
            className="absolute inset-0 bg-black/60"
          />
          {/* sheet — plain View so the hour/minute wheels own their scroll */}
          <View className="bg-card border-t border-border rounded-t-2xl px-4 pt-4 pb-8">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-foreground text-lg font-semibold">Select start time</Text>
              <Pressable onPress={() => setTimePickerOpen(false)} className="p-1">
                <Ionicons name="close" size={22} color="#fafafa" />
              </Pressable>
            </View>
            <DateTimePicker
              mode="single"
              timePicker
              initialView="time"
              hideHeader
              date={tmpTime}
              onChange={({ date: picked }) => setTmpTime(dayjs(picked).toDate())}
              classNames={pickerClassNames}
            />
            <Pressable
              onPress={confirmTime}
              className="bg-primary rounded-lg py-3 items-center mt-4"
            >
              <Text className="text-primary-foreground font-semibold">Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
