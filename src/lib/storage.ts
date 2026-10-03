import type { Task } from '../types'

export const STORAGE_KEY = 'focusflow:v1'

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>

// Accessing window.localStorage can itself throw (blocked cookies, private
// mode in some browsers), so it is wrapped.
function defaultStorage(): StorageLike | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string'
}

function isTask(value: unknown): value is Task {
  if (typeof value !== 'object' || value === null) return false
  const t = value as Record<string, unknown>
  return (
    typeof t.id === 'string' &&
    typeof t.title === 'string' &&
    typeof t.sourceText === 'string' &&
    typeof t.createdAt === 'string' &&
    isNullableString(t.dueAt) &&
    typeof t.dueHasTime === 'boolean' &&
    (t.status === 'active' || t.status === 'done') &&
    isNullableString(t.completedAt) &&
    isNullableString(t.startedAt)
  )
}

// Never throws: missing, corrupt or wrong-version data just gives an empty list.
export function loadTasks(storage: StorageLike | null = defaultStorage()): Task[] {
  if (!storage) return []
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return []
    const data: unknown = JSON.parse(raw)
    if (typeof data !== 'object' || data === null) return []
    const { version, tasks } = data as { version?: unknown; tasks?: unknown }
    if (version !== 1 || !Array.isArray(tasks)) return []
    return tasks.filter(isTask)
  } catch {
    return []
  }
}

// Returns false instead of throwing (e.g. storage full or blocked).
export function saveTasks(tasks: Task[], storage: StorageLike | null = defaultStorage()): boolean {
  if (!storage) return false
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, tasks }))
    return true
  } catch {
    return false
  }
}