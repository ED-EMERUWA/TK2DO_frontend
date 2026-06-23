# Calendar — `calendar.tsx`

## What
A scrollable month grid. Each day cell shows the date number and up to 3 colored dots
(one per task, colored by category) with a `+N` overflow indicator. Tapping a day opens
a full-screen sheet listing that day's tasks.

## Packages / imports
- **`react-native`** — `View`, `Text`, `Pressable`, `ActivityIndicator`, `ScrollView`,
  `Modal`, `FlatList`.
- **`react-native-safe-area-context`** — `SafeAreaView` (notch/home-indicator aware; use
  this, not RN's built-in one).
- **`@expo/vector-icons`** — `Ionicons` (chevrons, close, clock icons).
- **`../../src/hooks/useTasks`** — `useTasksByMonth(year, month)` for the grid,
  `useTasksByDate(date)` for the day sheet. These are React Query hooks; data is cached
  and shared with the Today/Status screens.
- **`../../src/types`** — `COLOR_CLASSES`, the `color_index 0-4 → bg-chart-1..5` map.

No extra dependency was added for this screen — it's all RN core + existing project utils.

## Two components in one file
- **`CalendarScreen`** (default export) — the month grid + month navigation.
- **`DayTasksSheet`** — the modal body shown when a day is tapped. Lives in the same file
  because it's only used here. It does its own `useTasksByDate` fetch for the tapped day.

## Data flow
```
useTasksByMonth(year, month)   → flat array of tasks for the visible month
        │
        ▼
tasksByDay  (useMemo)          → Record<dayNumber, Task[]>
        │                        groups tasks by the day-of-month (t.date.slice(-2))
        ▼
each grid cell reads tasksByDay[day] → renders dots
```
`tasksByDay` is memoized so the grouping only re-runs when `tasks` changes, not on every
render (e.g. when the day-sheet opens/closes).

## Building the grid — the calendar math
This is the part most likely to confuse, so read carefully.

```ts
daysInMonth(year, month)  = new Date(year, month, 0).getDate()
```
**Why `month` (not `month-1`) and day `0`?** JS `Date` months are 0-indexed. Day `0` of
month *N* (1-indexed here) rolls back to the **last day of the previous month** in
0-indexed terms — which is the last day of *our* 1-indexed month. So this returns the
correct day count (28–31). It's a deliberate off-by-one trick, not a bug.

```ts
startWeekday(year, month) = new Date(year, month - 1, 1).getDay()
```
Here `month - 1` converts our 1-indexed month to JS's 0-indexed month. `.getDay()` returns
0 (Sunday) … 6 (Saturday) — the weekday the 1st falls on. This is the **leading blank
count**: how many empty cells to pad before day 1 so the 1st lands in the right column.

```ts
cells = [...Array(offset).fill(null), ...Array.from({length: totalDays}, (_, i) => i + 1)]
```
`offset` nulls (blank leading cells) followed by `1..totalDays`. The grid maps over
`cells`; `null` entries render an empty, `disabled` cell.

> **Important:** `month` in state is **1-indexed** (Jan = 1). Anytime you pass it to a JS
> `Date` constructor you must subtract 1. `daysInMonth` is the one place that intentionally
> does *not*, per the day-`0` trick above.

## The 7-column layout
The grid is a plain `flex-row flex-wrap` `View`, not a `FlatList numColumns`. Each cell is
forced to exactly 1/7 width:
```tsx
style={{ width: `${100 / 7}%`, minHeight: 84, padding: 8 }}
```
- `width: 100/7 %` → 7 cells per row; the 8th wraps to the next line.
- `minHeight: 84` controls cell **height** directly. **To make cells bigger/smaller, edit
  this number** — that's the knob.

> **Gotcha (why not `aspectRatio`?):** an earlier version used `aspectRatio`, but
> `aspectRatio = width / height` and the width is locked to 1/7 of the screen — so
> *raising* the ratio toward `1` actually made cells **shorter**, and the task dots got
> clipped for lack of vertical room. Explicit `minHeight` decouples height from the fixed
> width and is far less surprising. If you ever go back to `aspectRatio`, remember: a value
> **below 1** makes cells taller.

## The dots (task indicator)
```tsx
const dayTasks = day !== null ? (tasksByDay[day] ?? []) : [];
const dotTasks = dayTasks.slice(0, 3);          // cap at 3 dots
const overflow = dayTasks.length - dotTasks.length;
```
- One `w-2 h-2 rounded-full` `View` per task in `dotTasks`, colored by
  `COLOR_CLASSES[t.color_index] ?? 'bg-chart-5'` (fallback = amber / "Other").
- `overflow > 0` → render a `+N` `Text`.
- The row uses `flex-row flex-wrap gap-1` so dots never spill outside the cell.

**To change the cap:** edit the `slice(0, 3)`. **To change colors:** edit `COLOR_CLASSES`
in `src/types/index.ts` (shared across the app — don't fork it here). **To go back to a
number badge:** replace the dots `View` with a pill showing `dayTasks.length`.

## Month navigation
`prevMonth` / `nextMonth` adjust `month`/`year` with wrap-around at the year boundary
(month 1 ↔ 12). Changing `month`/`year` re-runs `useTasksByMonth` → React Query fetches
(or serves cached) tasks for the new month → grid + dots update automatically.

## The day sheet (`DayTasksSheet`)
- Shown via `<Modal presentationStyle="pageSheet">`; `visible` is driven by
  `selectedDate !== null`. Tapping a day sets `selectedDate` to the ISO string
  `YYYY-MM-DD`; the close button / `onRequestClose` sets it back to `null`.
- It fetches with `useTasksByDate(date)` — a **separate** query key from the month query,
  but React Query may already have the day warm from elsewhere.

### Date formatting gotcha (the noon trick)
```ts
const localDate = new Date(year, month - 1, day, 12); // 12 = noon
```
The `12` (noon) is intentional. Constructing at midnight can land on the wrong calendar
day in some timezones after the locale conversion; noon gives a safe margin so
`toLocaleDateString` always shows the intended day. Same class of bug the date picker
avoids with `dayjs` — here we use the noon offset instead.

## Data source
The grid is fed by `useTasksByMonth(year, month)` (`src/hooks/useTasks.ts`), whose
`queryFn` is `api.tasks.getByMonth(year, month)` → `GET /tasks?year=&month=` on the
Express backend. It was originally pointed at the in-memory **mock store**
(`store.fetchTasksByMonth`); that was switched to the real API so the calendar shows
tasks you actually create. The day sheet uses `useTasksByDate` (a separate query key)
against the same backend.

The cache is persisted to AsyncStorage via `PersistQueryClientProvider`
(`src/providers/QueryProvider.tsx`). Bump its `buster` string to force-clear all
persisted caches after a data-shape change — and remember a plain Fast Refresh (file
save) does **not** clear the in-memory cache; only a true cold reload re-runs hydration.

## Gotchas / debugging
- **Wrong number of days, or month starts on wrong weekday:** you passed the 1-indexed
  `month` to a `Date` constructor without `-1` (or added `-1` to the `daysInMonth` day-`0`
  call). Re-read the calendar-math section.
- **Dots wrong color / invisible:** `color_index` out of 0–4 range, or a `bg-chart-N`
  token missing from `tailwind.config.js`.
- **Day sheet shows previous day's date label:** the noon trick was removed — restore the
  `12` arg in the `new Date(...)`.
- **Dots don't update after adding a task:** the month query key wasn't invalidated after
  the mutation — check `useCreateTask`'s `invalidateQueries` (it invalidates `['tasks']`,
  which prefix-matches the month key).
- **Grid not scrolling:** content lives in a `ScrollView`; a 6-row month fits most
  screens, but keep it wrapped so small screens can scroll.

## Debug log: "dots don't show for some months" (resolved)
A worked example of how the dots were fixed — useful if a whole month ever goes blank
again.

**Symptom:** No dots in June. Tasks created in-app never appeared. Oddly, May *did* show
dots.

**False leads ruled out (all were fine):**
- The grid math, `tasksByDay` grouping, and dot rendering — all correct.
- `useTasksByMonth` `queryFn` and `api.tasks.getByMonth` wiring — correct.
- The `+N`/cap logic and `COLOR_CLASSES` — correct.
- Persisted-cache staleness was *suspected* (May data lingering from the old mock store)
  and the `buster` was bumped to clear it — a valid cleanup, but not the actual cause.

**How it was found:** temporary `console.log`s were added in `calendar.tsx` dumping
`fetchStatus`, `isError`, `error.message`, and the raw `tasks` array. The calendar had
been **swallowing the query error** (`const { data: tasks = [] } = ...` ignores `error`),
so a failing fetch looked identical to "no tasks." The log printed:

```
[calendar] fetchStatus: idle isError: true error: date/time field value out of range: "2026-06-31"
[calendar] tasks count: 0 raw: []
```

**Root cause (backend):** `getTasksByMonth` in
`app/backend/src/services/taskService.ts` built its upper bound by hardcoding day `31`:
```ts
const to = `${year}-${String(month).padStart(2,'0')}-31`;  // "2026-06-31" — invalid
```
June has 30 days, so Postgres rejected the whole query with *date/time field value out of
range*. The endpoint 500'd and the frontend got an empty result. This broke **every month
without 31 days** (and February); May only worked because it happens to have 31 days — the
exact clue that pointed at a day-count bug rather than anything in the frontend.

**Fix:** use a half-open range instead of computing the last day:
```ts
const from      = `${year}-${String(month).padStart(2,'0')}-01`;
const nextYear  = month === 12 ? year + 1 : year;
const nextMonth = month === 12 ? 1 : month + 1;
const toExcl    = `${nextYear}-${String(nextMonth).padStart(2,'0')}-01`;
// .gte('date', from).lt('date', toExcl)
```
`>= first-of-month` and `< first-of-next-month` covers any month length with no last-day
arithmetic.

**Takeaways:**
- The calendar ignores `error`/`isError` from `useTasksByMonth`. If a month silently shows
  nothing, re-add a log (or surface the error) before assuming the data is empty — an
  errored query and an empty month look identical here.
- "Works for some months, not others" is a strong hint at a **day-count / date-range** bug
  (31 vs 30 vs 28), not a frontend rendering problem.
- After backend changes, the dev server runs `tsx watch` and hot-reloads on save; just
  reload the calendar tab to refetch.
