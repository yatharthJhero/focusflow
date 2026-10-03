export type TaskStatus = 'active' | 'done'

export type Task = {
  id: string
  title: string // cleaned text shown in the UI
  sourceText: string // original text it came from (used for scoring in M3)
  createdAt: string // ISO timestamp
  dueAt: string | null // ISO timestamp, null = no deadline
  dueHasTime: boolean // false for "tomorrow", true for "5 PM"
  status: TaskStatus
  completedAt: string | null
  startedAt: string | null // set by "Start" in Focus mode (M4)
}

// What a parser produces. createTask() adds id, timestamps and status.
export type TaskDraft = Pick<Task, 'title' | 'sourceText' | 'dueAt' | 'dueHasTime'>