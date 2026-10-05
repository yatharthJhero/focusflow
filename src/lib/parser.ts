import type { TaskDraft } from '../types'
import { chronoRecognizer } from './parsing/chrono'
import { findDeadline, type Recognizer } from './parsing/deadline'
import { capitalize, cleanTitle, tidyEdges } from './parsing/language'
import { splitClauses } from './parsing/splitter'

// The parser boundary. Pipeline:
//   text -> splitClauses -> attachDateFragments -> one draft per clause
// Each clause gets its own deadline, so a date only applies to its own task.
//
// `recognize` defaults to chrono-node; tests can pass a different one.
export function parseInput(text: string, now: Date, recognize: Recognizer = chronoRecognizer): TaskDraft[] {
  const sourceText = text.trim()
  if (!/[\p{L}\p{N}]/u.test(sourceText)) return [] // blank, or only punctuation: nothing to add

  try {
    const clauses = attachDateFragments(splitClauses(sourceText), now, recognize)
    const drafts = clauses.map((clause) => toDraft(clause, now, recognize)).filter((draft) => draft.title !== '')
    if (drafts.length > 0) return drafts
  } catch {
    // Any unexpected error falls through to the fallback below.
  }
  return [fallbackDraft(sourceText)]
}

// A clause that is ONLY a date ("tomorrow", "at 5 PM", "by Friday") is not a task.
function isDateOnly(clause: string, now: Date, recognize: Recognizer): boolean {
  const deadline = findDeadline(clause, now, recognize)
  return deadline !== null && cleanTitle(clause, deadline) === ''
}

// Glues date-only clauses onto a neighbouring task:
//   "buy milk" / "tomorrow"        -> "buy milk, tomorrow"   (belongs to the previous task)
//   "tomorrow" / "call Rahul"      -> "tomorrow, call Rahul" (nothing before it: belongs to the next)
function attachDateFragments(clauses: string[], now: Date, recognize: Recognizer): string[] {
  const merged: string[] = []
  let pending = '' // a leading date fragment waiting for the next task

  for (const clause of clauses) {
    if (isDateOnly(clause, now, recognize)) {
      const last = merged.length - 1
      if (last >= 0) merged[last] += ', ' + clause
      else pending = pending ? pending + ', ' + clause : clause
    } else {
      merged.push(pending ? pending + ', ' + clause : clause)
      pending = ''
    }
  }
  if (pending) merged.push(pending) // the input was only a date: keep it rather than lose it
  return merged
}

function toDraft(clause: string, now: Date, recognize: Recognizer) {
  const deadline = findDeadline(clause, now, recognize)
  const sourceText = tidyEdges(clause)
  return {
    title: cleanTitle(clause, deadline) || capitalize(sourceText),
    sourceText,
    dueAt: deadline ? deadline.dueAt.toISOString() : null,
    dueHasTime: deadline ? deadline.dueHasTime : false,
  } satisfies TaskDraft
}

// Last resort: the whole input becomes one task. The user's text is never lost.
function fallbackDraft(sourceText: string): TaskDraft {
  return { title: sourceText.replace(/\s+/g, ' '), sourceText, dueAt: null, dueHasTime: false }
}