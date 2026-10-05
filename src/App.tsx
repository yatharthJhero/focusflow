import { useEffect, useState } from 'react'
import { CaptureBox } from './components/CaptureBox'
import { TaskSection } from './components/TaskSection'
import { useTasks } from './hooks/useTasks'
import {
  compareTasks,
  getPriority,
  type TaskBucket,
} from './lib/priority'
import type { Task } from './types'

const BUCKETS: TaskBucket[] = [
  'Do Now',
  'Do Today',
  'Do Later',
  'Deadline / Scheduled',
  'Completed',
]

function sortCompleted(a: Task, b: Task): number {
  const aTime = a.completedAt
    ? new Date(a.completedAt).getTime()
    : 0

  const bTime = b.completedAt
    ? new Date(b.completedAt).getTime()
    : 0

  return bTime - aTime
}

export default function App() {
  const {
    tasks,
    addFromText,
    toggleTask,
    deleteTask,
  } = useTasks()

  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date())
    }, 60_000)

    return () => window.clearInterval(timer)
  }, [])

  const groups: Record<TaskBucket, Task[]> = {
    'Do Now': [],
    'Do Today': [],
    'Do Later': [],
    'Deadline / Scheduled': [],
    Completed: [],
  }

  for (const task of tasks) {
    const bucket = getPriority(task, now).bucket
    groups[bucket].push(task)
  }

  groups['Do Now'].sort((a, b) => compareTasks(a, b, now))
  groups['Do Today'].sort((a, b) => compareTasks(a, b, now))
  groups['Do Later'].sort((a, b) => compareTasks(a, b, now))
  groups['Deadline / Scheduled'].sort((a, b) =>
    compareTasks(a, b, now)
  )
  groups.Completed.sort(sortCompleted)

  const emptyMessages: Record<TaskBucket, string> = {
    'Do Now': 'Nothing needs your immediate attention.',
    'Do Today': 'Nothing else is planned for today.',
    'Do Later': 'Lower-priority tasks will appear here.',
    'Deadline / Scheduled': 'Scheduled tasks will appear here.',
    Completed: 'Completed tasks will show up here.',
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto max-w-2xl space-y-6 px-4 py-8">
        <header>
          <h1 className="text-2xl font-bold tracking-tight">
            FocusFlow
          </h1>
          <p className="text-sm text-slate-500">
            Dump your thoughts. Get a plan.
          </p>
        </header>

        <CaptureBox onSubmit={addFromText} />

        {BUCKETS.map((bucket) => (
          <TaskSection
            key={bucket}
            title={bucket}
            tasks={groups[bucket]}
            now={now}
            emptyText={emptyMessages[bucket]}
            onToggle={toggleTask}
            onDelete={deleteTask}
          />
        ))}
      </main>
    </div>
  )
}