import type { TaskDraft } from '../types'

// Test data for the parser, kept separate from the test runner so it reads like a table.
// "now" is built from local-time parts, so these tests pass in any time zone.

export const DEFAULT_NOW = new Date(2026, 9, 5, 10, 0, 0) // Monday 5 Oct 2026, 10:00
const EVENING = new Date(2026, 9, 5, 18, 0, 0) // Monday 18:00
const LATE_NIGHT = new Date(2026, 9, 5, 22, 30, 0) // Monday 22:30

// Handy dates relative to DEFAULT_NOW (all date-only deadlines are 23:59):
//   tomorrow  = Tue 2026-10-06     Friday    = Fri 2026-10-09
//   this week = Sun 2026-10-11     next week = Sun 2026-10-18

const pad = (n: number) => String(n).padStart(2, '0')

export function formatLocal(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export type TaskSummary = { title: string; due: string | null; timed: boolean }

export function summarize(drafts: TaskDraft[]): TaskSummary[] {
  return drafts.map((d) => ({
    title: d.title,
    due: d.dueAt ? formatLocal(d.dueAt) : null,
    timed: d.dueHasTime,
  }))
}

const task = (title: string, due: string | null = null, timed = false): TaskSummary => ({ title, due, timed })

export type ParserCase = {
  name: string
  input: string
  expected: TaskSummary[]
  now?: Date
  sources?: string[] // expected sourceText of each task, when worth checking
}

export const PARSER_CASES: ParserCase[] = [
  // ---- The two official examples ----
  {
    name: 'example 1: list + "and" + deadline on the last task only',
    input: 'Finish assignment, buy milk and call Rahul tomorrow',
    expected: [task('Finish assignment'), task('Buy milk'), task('Call Rahul', '2026-10-06 23:59')],
    sources: ['Finish assignment', 'buy milk', 'call Rahul tomorrow'],
  },
  {
    name: 'example 2: four tasks with their own deadlines',
    input:
      'I need to submit my database assignment tomorrow, buy groceries tonight, practice JavaScript this week, and call the internet provider.',
    expected: [
      task('Submit my database assignment', '2026-10-06 23:59'),
      task('Buy groceries', '2026-10-05 21:00', true),
      task('Practice JavaScript', '2026-10-11 23:59'),
      task('Call the internet provider'),
    ],
    sources: [
      'I need to submit my database assignment tomorrow',
      'buy groceries tonight',
      'practice JavaScript this week',
      'call the internet provider',
    ],
  },

  // ---- Splitting ----
  { name: 'a shopping list stays one task', input: 'buy milk, eggs and bread', expected: [task('Buy milk, eggs and bread')] },
  {
    name: 'a deadline after a list applies to the whole list',
    input: 'buy milk, eggs and bread tomorrow',
    expected: [task('Buy milk, eggs and bread', '2026-10-06 23:59')],
  },
  {
    name: '"and" between two actions splits',
    input: 'finish assignment and call Rahul',
    expected: [task('Finish assignment'), task('Call Rahul')],
  },
  {
    name: 'filler words are removed, each task keeps its own deadline',
    input: 'I have to pay the electricity bill tonight and call the plumber tomorrow',
    expected: [task('Pay the electricity bill', '2026-10-05 21:00', true), task('Call the plumber', '2026-10-06 23:59')],
  },
  {
    name: 'each date attaches only to its own clause',
    input: 'finish essay tomorrow and call Rahul friday',
    expected: [task('Finish essay', '2026-10-06 23:59'), task('Call Rahul', '2026-10-09 23:59')],
  },
  {
    name: 'one task per line',
    input: 'buy milk\ncall Rahul\nfinish essay',
    expected: [task('Buy milk'), task('Call Rahul'), task('Finish essay')],
  },
  { name: 'lines without verbs are still separate tasks', input: 'milk\neggs', expected: [task('Milk'), task('Eggs')] },
  {
    name: 'sentences split on full stops',
    input: 'Buy milk. Call Rahul tomorrow.',
    expected: [task('Buy milk'), task('Call Rahul', '2026-10-06 23:59')],
  },
  { name: 'no deadline', input: 'call the electrician', expected: [task('Call the electrician')] },

  // ---- Date and time fragments ----
  {
    name: 'a date/time after a comma belongs to the previous task',
    input: 'Call Rahul, tomorrow at 5 PM',
    expected: [task('Call Rahul', '2026-10-06 17:00', true)],
  },
  {
    name: 'a date on its own line belongs to the previous task',
    input: 'buy milk\ntomorrow',
    expected: [task('Buy milk', '2026-10-06 23:59')],
  },
  {
    name: 'a leading date belongs to the next task',
    input: 'tomorrow, call Rahul',
    expected: [task('Call Rahul', '2026-10-06 23:59')],
    sources: ['tomorrow, call Rahul'],
  },
  {
    name: 'input that is only a date is kept, not lost',
    input: 'tomorrow at 5 PM',
    expected: [task('Tomorrow at 5 PM', '2026-10-06 17:00', true)],
  },
  {
    name: 'a comma inside a date does not split',
    input: 'submit report by Dec 3, 2026',
    expected: [task('Submit report', '2026-12-03 23:59')],
  },

  // ---- Deadlines ----
  { name: 'weekday, with "by" removed from the title', input: 'submit report by Friday', expected: [task('Submit report', '2026-10-09 23:59')] },
  { name: 'weekday, with "on" removed from the title', input: 'dentist appointment on Friday', expected: [task('Dentist appointment', '2026-10-09 23:59')] },
  { name: 'time later today', input: 'call mom at 5 PM', expected: [task('Call mom', '2026-10-05 17:00', true)] },
  { name: 'time already passed today means tomorrow', input: 'call mom at 5 PM', now: EVENING, expected: [task('Call mom', '2026-10-06 17:00', true)] },
  { name: 'a.m./p.m. with dots', input: 'call Rahul at 5 p.m.', expected: [task('Call Rahul', '2026-10-05 17:00', true)] },
  { name: 'tonight defaults to 9 PM', input: 'buy groceries tonight', expected: [task('Buy groceries', '2026-10-05 21:00', true)] },
  { name: 'tonight after 9 PM means end of today', input: 'buy groceries tonight', now: LATE_NIGHT, expected: [task('Buy groceries', '2026-10-05 23:59', true)] },
  { name: 'tonight with a time', input: 'watch the match tonight at 8', expected: [task('Watch the match', '2026-10-05 20:00', true)] },
  { name: 'next week means the Sunday after this one', input: 'plan the trip next week', expected: [task('Plan the trip', '2026-10-18 23:59')] },
  { name: '"end of this week" wording is removed', input: 'finish report by the end of this week', expected: [task('Finish report', '2026-10-11 23:59')] },

  // ---- Hedging words stay in sourceText for the priority step ----
  {
    name: 'filler is removed from the title but kept in sourceText',
    input: 'maybe call Rahul tomorrow',
    expected: [task('Call Rahul', '2026-10-06 23:59')],
    sources: ['maybe call Rahul tomorrow'],
  },
]

export type SplitCase = { input: string; clauses: string[] }

export const SPLIT_CASES: SplitCase[] = [
  { input: 'Finish assignment, buy milk and call Rahul tomorrow', clauses: ['Finish assignment', 'buy milk', 'call Rahul tomorrow'] },
  { input: 'buy milk, eggs and bread', clauses: ['buy milk, eggs and bread'] },
  { input: 'milk, eggs, bread', clauses: ['milk, eggs, bread'] },
  { input: 'salt and pepper', clauses: ['salt and pepper'] },
  { input: 'finish assignment and call Rahul', clauses: ['finish assignment', 'call Rahul'] },
  { input: 'buy pen and book', clauses: ['buy pen and book'] }, // "book" with no object is a noun here
  { input: 'buy pens and book tickets', clauses: ['buy pens', 'book tickets'] },
  { input: 'call Rahul then buy milk', clauses: ['call Rahul', 'buy milk'] },
  { input: 'Call Rahul at 5 p.m. and buy milk', clauses: ['Call Rahul at 5 pm', 'buy milk'] },
  { input: 'submit report by Dec 3, 2026', clauses: ['submit report by Dec 3, 2026'] },
  { input: 'buy milk\ncall Rahul', clauses: ['buy milk', 'call Rahul'] },
  { input: 'milk\neggs', clauses: ['milk', 'eggs'] },
  { input: 'And then call mom', clauses: ['call mom'] }, // leading filler is not a task
  { input: '', clauses: [] },
]