import type { Task } from '../types'

export type PriorityLabel = 'High' | 'Medium' | 'Low'

export type TaskBucket =
  | 'Do Now'
  | 'Do Today'
  | 'Do Later'
  | 'Deadline / Scheduled'
  | 'Completed'

export type PriorityResult = {
  score: number
  label: PriorityLabel
  bucket: TaskBucket
  reasons: string[]
}

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS

const URGENCY_RE = /\b(?:urgent|asap|important|must)\b/i
const OBLIGATION_RE =
  /\b(?:submit|assignment|bill|exam|meeting)\b/i
const HEDGE_RE =
  /\b(?:maybe|someday|eventually|might)\b/i

function calendarDayNumber(date: Date): number {
  return Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  )
}

function calendarDayDifference(from: Date, to: Date): number {
  return Math.round(
    (calendarDayNumber(to) - calendarDayNumber(from)) / DAY_MS
  )
}

function isValidDate(date: Date): boolean {
  return !Number.isNaN(date.getTime())
}

function deadlineSignal(
  task: Task,
  now: Date
): { points: number; reason: string | null } {
  if (!task.dueAt) {
    return { points: 0, reason: null }
  }

  const due = new Date(task.dueAt)

  if (!isValidDate(due)) {
    return { points: 0, reason: null }
  }

  const differenceMs = due.getTime() - now.getTime()

  if (differenceMs < 0) {
    return { points: 70, reason: 'Overdue (+70)' }
  }

  if (differenceMs <= 3 * HOUR_MS) {
    return {
      points: 60,
      reason: 'Due within 3 hours (+60)',
    }
  }

  const dayDifference = calendarDayDifference(now, due)

  if (dayDifference === 0) {
    return {
      points: 50,
      reason: 'Due later today (+50)',
    }
  }

  if (dayDifference === 1) {
    return {
      points: 40,
      reason: 'Due tomorrow (+40)',
    }
  }

  if (dayDifference >= 2 && dayDifference <= 3) {
    return {
      points: 25,
      reason: 'Due in 2–3 days (+25)',
    }
  }

  if (dayDifference >= 4 && dayDifference <= 7) {
    return {
      points: 12,
      reason: 'Due in 4–7 days (+12)',
    }
  }

  if (dayDifference > 7) {
    return {
      points: 5,
      reason: 'Due later (+5)',
    }
  }

  return { points: 0, reason: null }
}

function labelForScore(score: number): PriorityLabel {
  if (score >= 50) return 'High'
  if (score >= 25) return 'Medium'
  return 'Low'
}

function hasDeadlineToday(task: Task, now: Date): boolean {
  if (!task.dueAt) return false

  const due = new Date(task.dueAt)

  if (!isValidDate(due)) return false

  return calendarDayDifference(now, due) === 0
}

function bucketForTask(
  task: Task,
  score: number,
  now: Date
): TaskBucket {
  if (task.status === 'done') {
    return 'Completed'
  }

  if (score >= 60) {
    return 'Do Now'
  }

  if (
    hasDeadlineToday(task, now) ||
    (!task.dueAt && score >= 35)
  ) {
    return 'Do Today'
  }

  if (task.dueAt) {
    return 'Deadline / Scheduled'
  }

  return 'Do Later'
}

export function getPriority(
  task: Task,
  now: Date
): PriorityResult {
  const text = task.sourceText.toLowerCase()

  const deadline = deadlineSignal(task, now)

  let score = deadline.points
  const reasons: string[] = []

  if (deadline.reason) {
    reasons.push(deadline.reason)
  }

  if (URGENCY_RE.test(text)) {
    score += 35
    reasons.push('Urgency language detected (+35)')
  }

  if (OBLIGATION_RE.test(text)) {
    score += 10
    reasons.push('Obligation-related task (+10)')
  }

  if (HEDGE_RE.test(text)) {
    score -= 25
    reasons.push('Hedging language detected (-25)')
  }

  score = Math.max(0, Math.min(100, score))

  const label = labelForScore(score)
  const bucket = bucketForTask(task, score, now)

  if (reasons.length === 0) {
    reasons.push('No urgency or deadline signal')
  }

  return {
    score,
    label,
    bucket,
    reasons,
  }
}

export function compareTasks(
  a: Task,
  b: Task,
  now: Date
): number {
  const priorityA = getPriority(a, now)
  const priorityB = getPriority(b, now)

  if (priorityA.score !== priorityB.score) {
    return priorityB.score - priorityA.score
  }

  if (a.dueAt && b.dueAt) {
    return (
      new Date(a.dueAt).getTime() -
      new Date(b.dueAt).getTime()
    )
  }

  if (a.dueAt) return -1
  if (b.dueAt) return 1

  return (
    new Date(a.createdAt).getTime() -
    new Date(b.createdAt).getTime()
  )
}