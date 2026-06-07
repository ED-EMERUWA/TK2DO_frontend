import AsyncStorage from '@react-native-async-storage/async-storage'

const QUEUE_KEY = 'OFFLINE_MUTATION_QUEUE'

export type QueuedMutation = {
  id:        string   // unique id so we can de-dupe
  type:      'CREATE_TASK' | 'UPDATE_TASK' | 'DELETE_TASK'
  payload:   unknown
  createdAt: string
}

// ─── Read the queue from disk ────────────────────────────────────────────────

export async function getQueue(): Promise<QueuedMutation[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

// ─── Add a mutation to the queue ─────────────────────────────────────────────

export async function enqueue(mutation: Omit<QueuedMutation, 'id' | 'createdAt'>) {
  const queue = await getQueue()
  const item: QueuedMutation = {
    ...mutation,
    id:        Math.random().toString(36).slice(2),
    createdAt: new Date().toISOString(),
  }
  console.log('offline enqueue', item)
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify([...queue, item]))
  return item
}

// ─── Remove one item (after it succeeds) ─────────────────────────────────────

export async function dequeue(id: string) {
  const queue = await getQueue()
  await AsyncStorage.setItem(
    QUEUE_KEY,
    JSON.stringify(queue.filter(m => m.id !== id))
  )
}

// ─── Flush the whole queue (called when app comes back online) ────────────────

export async function flushQueue(
  handlers: Record<QueuedMutation['type'], (payload: unknown) => Promise<void>>
) {
  const queue = await getQueue()
  for (const mutation of queue) {
    try {
      await handlers[mutation.type](mutation.payload)
      console.log('Flushed mutation', mutation)
      await dequeue(mutation.id)
    } catch(error) {
      console.log('Failed to flush mutation', mutation, error)
      // Leave it in the queue to retry next flush
    }
  }
}