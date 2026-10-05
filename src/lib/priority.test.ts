import { describe, expect, it } from 'vitest'
import { getPriority } from './priority'
import type { Task } from '../types'

const NOW = new Date(2026, 9, 5, 10, 0, 0)

function makeTask(
  title: string,
  options: Partial<Task> = {}
): Task {
  return {
    id: '1',
    title,
    sourceText: title,
    createdAt: NOW.toISOString(),
    dueAt: null,
    dueHasTime: false,
    status: 'active',
    completedAt: null,
    startedAt: null,
    ...options,
  }
}

describe('getPriority', () => {
  it('marks overdue tasks as Do Now', () => {
    const task = makeTask('Call Rahul', {
      dueAt: new Date(2026, 9, 4, 18, 0).toISOString(),
    })

    const result = getPriority(task, NOW)

    expect(result.score).toBe(70)
    expect(result.label).toBe('High')
    expect(result.bucket).toBe('Do Now')
  })

  it('gives 60 points to tasks due within 3 hours', () => {
    const task = makeTask('Call Rahul', {
      dueAt: new Date(2026, 9, 5, 12, 0).toISOString(),
    })

    const result = getPriority(task, NOW)

    expect(result.score).toBe(60)
    expect(result.bucket).toBe('Do Now')
  })

  it('gives 50 points to tasks due later today', () => {
    const task = makeTask('Call Rahul', {
      dueAt: new Date(2026, 9, 5, 18, 0).toISOString(),
    })

    const result = getPriority(task, NOW)

    expect(result.score).toBe(50)
    expect(result.label).toBe('High')
    expect(result.bucket).toBe('Do Today')
  })

  it('gives 40 points to tasks due tomorrow', () => {
    const task = makeTask('Call Rahul', {
      dueAt: new Date(2026, 9, 6, 23, 59).toISOString(),
    })

    const result = getPriority(task, NOW)

    expect(result.score).toBe(40)
    expect(result.label).toBe('Medium')
    expect(result.bucket).toBe('Deadline / Scheduled')
  })

  it('adds urgency points', () => {
    const task = makeTask('Urgent call Rahul')

    const result = getPriority(task, NOW)

    expect(result.score).toBe(35)
    expect(result.label).toBe('Medium')
    expect(result.bucket).toBe('Do Today')
  })

  it('adds obligation points once', () => {
    const task = makeTask('Submit assignment')

    const result = getPriority(task, NOW)

    expect(result.score).toBe(10)
    expect(result.label).toBe('Low')
    expect(result.bucket).toBe('Do Later')
  })

  it('subtracts hedge points', () => {
    const task = makeTask('Maybe call Rahul')

    const result = getPriority(task, NOW)

    expect(result.score).toBe(0)
    expect(result.label).toBe('Low')
    expect(result.bucket).toBe('Do Later')
  })

  it('combines urgency and obligation', () => {
    const task = makeTask(
      'Urgent: submit assignment'
    )

    const result = getPriority(task, NOW)

    expect(result.score).toBe(45)
    expect(result.label).toBe('Medium')
    expect(result.bucket).toBe('Do Today')
  })

  it('caps score at 100', () => {
    const task = makeTask(
      'URGENT important must submit assignment',
      {
        dueAt: new Date(
          2026,
          9,
          4,
          18,
          0
        ).toISOString(),
      }
    )

    const result = getPriority(task, NOW)

    expect(result.score).toBe(100)
    expect(result.label).toBe('High')
    expect(result.bucket).toBe('Do Now')
  })

  it('puts future scheduled tasks into Deadline / Scheduled', () => {
    const task = makeTask('Plan trip', {
      dueAt: new Date(
        2026,
        9,
        15,
        23,
        59
      ).toISOString(),
    })

    const result = getPriority(task, NOW)

    expect(result.bucket).toBe('Deadline / Scheduled')
  })

  it('puts completed tasks into Completed regardless of score', () => {
    const task = makeTask('Urgent assignment', {
      status: 'done',
      dueAt: new Date(
        2026,
        9,
        4,
        18,
        0
      ).toISOString(),
    })

    const result = getPriority(task, NOW)

    expect(result.bucket).toBe('Completed')
  })
})