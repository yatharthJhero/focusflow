import { useState } from 'react'
import type { Task } from '../types'
import { getPriority } from '../lib/priority'

type Props = {
  task: Task
  now: Date
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}

function priorityClass(label: string): string {
  if (label === 'High') {
    return 'bg-red-100 text-red-700'
  }

  if (label === 'Medium') {
    return 'bg-amber-100 text-amber-700'
  }

  return 'bg-slate-100 text-slate-600'
}

export function TaskItem({
  task,
  now,
  onToggle,
  onDelete,
}: Props) {
  const done = task.status === 'done'
  const priority = getPriority(task, now)
  const [showWhy, setShowWhy] = useState(false)

  const due = task.dueAt
    ? new Date(task.dueAt).toLocaleString(
        [],
        task.dueHasTime
          ? {
              dateStyle: 'medium',
              timeStyle: 'short',
            }
          : {
              dateStyle: 'medium',
            }
      )
    : null

  return (
    <li className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={done}
          onChange={() => onToggle(task.id)}
          aria-label={
            done
              ? `Mark "${task.title}" as not done`
              : `Mark "${task.title}" as done`
          }
          className="mt-0.5 h-6 w-6 shrink-0 cursor-pointer accent-indigo-600"
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`break-words ${
                done
                  ? 'text-slate-400 line-through'
                  : 'text-slate-900'
              }`}
            >
              {task.title}
            </span>

            {!done && (
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${priorityClass(
                  priority.label
                )}`}
              >
                {priority.label}
              </span>
            )}
          </div>

          {due && (
            <p className="mt-1 text-xs text-slate-500">
              Due: {due}
            </p>
          )}

          {!done && (
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setShowWhy((value) => !value)}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
              >
                {showWhy ? 'Hide why' : `Why? (${priority.score})`}
              </button>

              {showWhy && (
                <div className="mt-2 rounded-lg bg-slate-50 p-2 text-xs text-slate-600">
                  <p className="mb-1 font-medium text-slate-700">
                    Priority score: {priority.score}/100
                  </p>

                  <ul className="space-y-1">
                    {priority.reasons.map((reason) => (
                      <li key={reason}>• {reason}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => onDelete(task.id)}
          aria-label={`Delete "${task.title}"`}
          className="shrink-0 rounded-md px-2 py-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
        >
          ✕
        </button>
      </div>
    </li>
  )
}