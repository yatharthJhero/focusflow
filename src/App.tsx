import { CaptureBox } from './components/CaptureBox'
import { TaskSection } from './components/TaskSection'
import { useTasks } from './hooks/useTasks'

export default function App() {
  const { tasks, addFromText, toggleTask, deleteTask } = useTasks()
  const active = tasks.filter((task) => task.status === 'active')
  const done = tasks.filter((task) => task.status === 'done')

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto max-w-2xl space-y-6 px-4 py-8">
        <header>
          <h1 className="text-2xl font-bold tracking-tight">FocusFlow</h1>
          <p className="text-sm text-slate-500">Dump your thoughts. Get a plan.</p>
        </header>

        <CaptureBox onSubmit={addFromText} />

        <TaskSection
          title="To do"
          tasks={active}
          emptyText="Nothing here yet. Type something above."
          onToggle={toggleTask}
          onDelete={deleteTask}
        />
        <TaskSection
          title="Completed"
          tasks={done}
          emptyText="Completed tasks will show up here."
          onToggle={toggleTask}
          onDelete={deleteTask}
        />
      </main>
    </div>
  )
}