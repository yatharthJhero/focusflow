import type { TaskDraft } from '../types'

// TEMPORARY (M1): turns the whole input into ONE task with no deadline.
// M2 replaces the body of this function with real splitting + deadline
// extraction. The signature stays the same, so nothing else has to change.
export function parseInput(text: string, _now: Date): TaskDraft[] {
  const sourceText = text.trim()
  if (!sourceText) return []

  const title = sourceText.replace(/\s+/g, ' ')
  return [{ title, sourceText, dueAt: null, dueHasTime: false }]
}