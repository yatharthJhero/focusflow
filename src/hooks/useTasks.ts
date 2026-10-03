import { useCallback, useEffect, useState } from 'react'
import type { Task } from '../types'
import { parseInput } from '../lib/parser'
import { addTasks, createTask, removeTask, toggleDone } from '../lib/tasks'
import { loadTasks, saveTasks } from '../lib/storage'

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(() => loadTasks())

  // Save after every change.
  useEffect(() => {
    saveTasks(tasks)
  }, [tasks])

  const addFromText = useCallback((text: string) => {
    const now = new Date()
    const created = parseInput(text, now).map((draft) => createTask(draft, now))
    if (created.length > 0) setTasks((prev) => addTasks(prev, created))
  }, [])

  const toggleTask = useCallback((id: string) => {
    const now = new Date()
    setTasks((prev) => toggleDone(prev, id, now))
  }, [])

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => removeTask(prev, id))
  }, [])

  return { tasks, addFromText, toggleTask, deleteTask }
}