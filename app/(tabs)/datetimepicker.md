# Date & Time Pickers — `add.tsx`

## What
Replaced the OS-native date/time modals with `react-native-ui-datepicker` (v3.3.0),
themed to the app's dark palette. State shape and the create-task payload are unchanged.

## Dependency changes
- **Added:** `react-native-ui-datepicker`, `dayjs`
- **Removed:** `react-native-modal-datetime-picker`, `@react-native-community/datetimepicker`
  (nothing else imported them; the new lib is pure-JS and needs no native peer)

## How it's built (`app/(tabs)/add.tsx`)
Both pickers live in a React Native `<Modal transparent>` bottom-sheet. The sheet is a
plain `View`; the dimmed backdrop is an **`absolute inset-0` `Pressable` sibling rendered
behind it** (tap outside to dismiss). The scroll wheel must NOT be nested inside a
`Pressable` — that fights the FlatList scroll responder and makes the wheel janky (see
debugging). The sheet draws on top of the backdrop, so taps inside it don't dismiss.

- **Date** — `<DateTimePicker mode="single" date={dayjs(date)} onChange={onDateChange}>`
- **Time** — `<DateTimePicker mode="single" timePicker initialView="time" hideHeader>`
  shows only the time wheels.

**Theming:** spread `useDefaultClassNames()` then override the slots that used `accent`
tokens this app doesn't define (`today`, `selected`, `selected_month/year`, labels).
Nav arrows are themed Ionicons chevrons passed via the `components` prop so they show on
the dark background.

## Selection flow
**Date:** tap the Date row → sheet opens at current `date` → tap a day → `onDateChange`
runs `dayjs(picked).format('YYYY-MM-DD')`, sets `date`, closes. (Commits on tap, no Done.)

**Time:** tap the Start time row → `openTimePicker()` seeds `tmpTime` from `startTime`
(or now) → wheels fire `onChange` continuously into `tmpTime` → tap **Done** →
`confirmTime()` runs `dayjs(tmpTime).format('HH:mm')`, sets `startTime`, closes.
(Time needs a Done button because the wheels emit on every scroll, unlike a discrete day tap.)

## Why dayjs for formatting
`new Date("YYYY-MM-DD")` parses as UTC midnight → shows the previous day in negative-offset
timezones. `dayjs(date)` parses/formats in local time, fixing that off-by-one.

## Debugging tips
- **Time wheel scroll slow/glitchy:** the wheel is a plain RN `Animated.FlatList`. Don't
  wrap it (or the sheet) in a `Pressable` — a scrollable list inside a `Pressable` fights
  for the touch responder (worst on Android). Use an `absolute inset-0` backdrop `Pressable`
  as a sibling behind a plain `View` sheet, not a wrapper. (This was the original bug.)
- **Picker text/highlights invisible:** a `classNames` slot points at a Tailwind token not
  in `tailwind.config.js` (e.g. `accent`). Add the token or override the slot.
- **Nav arrows missing on dark bg:** override `components.IconPrev/IconNext` (default arrow
  images don't tint to the theme).
- **Date off by one day:** ensure formatting goes through `dayjs`, not `new Date(isoString)`.
- **Time sheet closes mid-scroll / wrong value:** the wheel commits via `tmpTime` + Done —
  don't wire its `onChange` straight to `startTime`.
- **Sheet won't dismiss / closes on inner tap:** check the scrim/inner `Pressable` nesting
  and the inner `e.stopPropagation()`.
- After dependency changes, restart with `npx expo start --clear`.
