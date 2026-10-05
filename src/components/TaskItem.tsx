import type { Task } from '../types'

type Props = {
  task: Task
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}

export function TaskItem({ task, onToggle, onDelete }: Props) {
  const done = task.status === 'done'
  // TEMPORARY (M2): plain-text deadline so you can check the parser. M3 replaces this with chips.
  const due = task.dueAt
    ? new Date(task.dueAt).toLocaleString([], task.dueHasTime ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' })
    : null

  return (
    <li className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <input
        type="checkbox"
        checked={done}
        onChange={() => onToggle(task.id)}
        aria-label={done ? `Mark "${task.title}" as not done` : `Mark "${task.title}" as done`}
        className="mt-0.5 h-6 w-6 shrink-0 cursor-pointer accent-indigo-600"
      />
      <div className="min-w-0 flex-1">
        <span className={`break-words ${done ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{task.title}</span>
        {due && <p className="text-xs text-slate-500">Due: {due}</p>}
      </div>
      <button
        type="button"
        onClick={() => onDelete(task.id)}
        aria-label={`Delete "${task.title}"`}
        className="shrink-0 rounded-md px-2 py-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
      >
        ✕
      </button>
    </li>
  )
}