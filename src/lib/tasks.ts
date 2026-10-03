import type { Task, TaskDraft } from '../types'

// crypto.randomUUID() only exists on https/localhost. When you test on your
// phone over http://192.168.x.x it is missing, so we need a fallback.
export function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function createTask(draft: TaskDraft, now: Date, id: string = newId()): Task {
  return {
    id,
    title: draft.title,
    sourceText: draft.sourceText,
    createdAt: now.toISOString(),
    dueAt: draft.dueAt,
    dueHasTime: draft.dueHasTime,
    status: 'active',
    completedAt: null,
    startedAt: null,
  }
}

// Newest first.
export function addTasks(tasks: Task[], created: Task[]): Task[] {
  return [...created, ...tasks]
}

// Complete a task, or un-complete it if it is already done (undo a misclick).
export function toggleDone(tasks: Task[], id: string, now: Date): Task[] {
  return tasks.map((task) => {
    if (task.id !== id) return task
    return task.status === 'done'
      ? { ...task, status: 'active', completedAt: null }
      : { ...task, status: 'done', completedAt: now.toISOString() }
  })
}

export function removeTask(tasks: Task[], id: string): Task[] {
  return tasks.filter((task) => task.id !== id)
}