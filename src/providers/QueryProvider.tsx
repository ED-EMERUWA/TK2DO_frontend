import { QueryClient } from '@tanstack/react-query'
import {
  PersistQueryClientProvider,
} from '@tanstack/react-query-persist-client'
import {
  createAsyncStoragePersister,
} from '@tanstack/query-async-storage-persister'
import AsyncStorage from '@react-native-async-storage/async-storage'

// ─── QueryClient ───────────────────────────────────────────────────────────
//
// This is the BRAIN. It holds the in-memory cache and all config.
// Create it once, outside the component, so it never re-creates on re-render.
//
// staleTime:  How long data is considered "fresh". During this window,
//             useQuery will NOT re-fetch — it just returns cached data.
//             After staleTime, data is "stale" and gets a background refetch
//             next time a component mounts or the window refocuses.
//
// gcTime:     How long UNUSED cached data stays in memory before being
//             garbage collected. Must be >= maxAge in persistOptions.
//             If gcTime < maxAge, data gets GC'd before the persister
//             can save it to AsyncStorage — nothing gets persisted.
//
// retry:      How many times to retry a failed query before showing an error.
//             Set to 1 for snappy failure feedback; 3 for flaky networks.
//
// networkMode: 'offlineFirst' — attempt queries and mutations even when
//              React Query thinks you're offline. This is important for
//              React Native where connectivity detection can be unreliable.

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:   1000 * 60 * 5,        // 5 minutes fresh
      gcTime:      1000 * 60 * 60 * 24,  // keep in memory 24 hours
      retry:       1,
      networkMode: 'offlineFirst',
    },
    mutations: {
      networkMode: 'offlineFirst', // attempt mutation even if RQ thinks offline
      retry:       1,
    },
  },
})

// ─── Persister ─────────────────────────────────────────────────────────────
//
// The persister knows how to SERIALIZE the entire QueryClient cache
// and write it to AsyncStorage. It also knows how to READ it back.
//
// key:         The single AsyncStorage key the whole cache is stored under.
//              Everything is serialised into one JSON blob.
//              You can check this manually: AsyncStorage.getItem('MY_APP_CACHE')
//
// throttleTime: How often (ms) the persister writes to disk. The cache can
//              change rapidly (optimistic updates etc) so we throttle writes.
//              Default is 1000ms — fine for most apps.

const persister = createAsyncStoragePersister({
  storage:      AsyncStorage,
  key:          'MY_APP_CACHE',
  throttleTime: 1000,
})

// ─── PersistQueryClientProvider ────────────────────────────────────────────
//
// This REPLACES QueryClientProvider. Do not use both.
//
// On app launch:  reads AsyncStorage → hydrates the QueryClient cache
//                 → your components instantly see cached data with no fetch.
//
// While running:  every cache change is written to AsyncStorage (throttled).
//
// maxAge:         If the cache on disk is older than this, it's discarded
//                 on startup and a fresh fetch is made instead.
//                 Must be <= gcTime or nothing will be there to persist.
//
// onSuccess:      Called after the cache is successfully hydrated from disk.
//                 Good place to kick off background syncs.

type Props = { children: React.ReactNode }

export function QueryProvider({ children }: Props) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge:         1000 * 60 * 60 * 24, // discard cache older than 24h
        buster:         '2',                  // change this string to force-clear
                                              // all users' caches on next launch
                                              // (e.g. after a breaking data change)
      }}
      onSuccess={() => {
        // Cache hydrated from AsyncStorage — good time to trigger
        // background refetches for critical data
        queryClient.resumePausedMutations() // retry any mutations that were
                                            // paused because of no connectivity
      }}
    >
      {children}
    </PersistQueryClientProvider>
  )
}