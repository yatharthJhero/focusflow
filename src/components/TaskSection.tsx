import type { Task } from '../types'
import { TaskItem } from './TaskItem'

type Props = {
  title: string
  tasks: Task[]
  emptyText: string
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}

export function TaskSection({ title, tasks, emptyText, onToggle, onDelete }: Props) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
        {title} <span className="font-normal">({tasks.length})</span>
      </h2>
      {tasks.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">{emptyText}</p>
      ) : (
        <ul className="space-y-2">
          {tasks.map((task) => (
            <TaskItem key={task.id} task={task} onToggle={onToggle} onDelete={onDelete} />
          ))}
        </ul>
      )}
    </section>
  )
}