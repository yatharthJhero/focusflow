// Deadline extraction for ONE clause.
//
// Order of attempts (first match wins, so behaviour is predictable):
//   1. "tonight" [at 8]        -> our own rule
//   2. "this week" / "next week" -> our own rule (chrono treats these as "+7 days")
//   3. anything else           -> the injected date Recognizer (chrono-node in the app)
//
// Conventions used everywhere:
//   - a date WITHOUT a time ("tomorrow", "Friday", "this week") means END of that
//     day, 23:59 local time, with dueHasTime = false
//   - "tonight" with no time means 9 PM today (or 23:59 if 9 PM has already passed)
//   - weeks run Monday-Sunday, so "this week" = the coming Sunday and
//     "next week" = the Sunday after that
// Every function takes `now` as an argument, so tests are deterministic.

// What a date recognizer reports about the first date phrase it finds in a clause.
export type RecognizedDate = {
  index: number // where the phrase starts in the clause
  length: number // how long the phrase is
  date: Date
  hasTime: boolean // did the text give a time of day ("5 PM")?
  hasDay: boolean // did the text give a day ("tomorrow", "Friday", "Oct 5")?
}

export type Recognizer = (text: string, now: Date) => RecognizedDate | null

export type Deadline = {
  dueAt: Date
  dueHasTime: boolean
  index: number // span of the phrase in the clause, so it can be cut from the title
  length: number
}

const TONIGHT_RE = /\btonight\b(?:\s+(?:at|by|around|before)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?(?![a-z0-9]))?/i
const WEEK_RE =
  /\b(?:(?:by|before)\s+)?(?:(?:the\s+)?end\s+of\s+|later\s+|sometime\s+)?(this|next)\s+week\b/i

function atTime(base: Date, hour: number, minute: number): Date {
  return new Date(base.getFullYear(), base.getMonth(), base.getDate(), hour, minute, 0, 0)
}

function endOfDay(base: Date, plusDays = 0): Date {
  return new Date(base.getFullYear(), base.getMonth(), base.getDate() + plusDays, 23, 59, 0, 0)
}

function tonightDeadline(match: RegExpExecArray, now: Date): Deadline {
  let dueAt = now.getHours() < 21 ? atTime(now, 21, 0) : endOfDay(now)

  if (match[1] !== undefined) {
    let hour = Number(match[1])
    const minute = match[2] ? Number(match[2]) : 0
    const meridiem = match[3]?.toLowerCase()
    if (meridiem === 'pm' && hour < 12) hour += 12
    else if (meridiem === 'am' && hour === 12) hour = 0
    else if (!meridiem && hour >= 1 && hour <= 11) hour += 12 // "tonight at 8" means 8 PM
    if (hour <= 23 && minute <= 59) dueAt = atTime(now, hour, minute)
  }
  return { dueAt, dueHasTime: true, index: match.index, length: match[0].length }
}

function weekDeadline(match: RegExpExecArray, now: Date): Deadline {
  const daysToSunday = (7 - now.getDay()) % 7 // 0 if today is Sunday
  const extra = match[1]?.toLowerCase() === 'next' ? 7 : 0
  return {
    dueAt: endOfDay(now, daysToSunday + extra),
    dueHasTime: false,
    index: match.index,
    length: match[0].length,
  }
}

// Turns what the recognizer found into our conventions.
function resolveRecognized(hit: RecognizedDate, now: Date): Date {
  // Date only ("tomorrow", "Friday"): end of that day.
  if (!hit.hasTime) return endOfDay(hit.date)

  // Time only ("5 PM") and that time has already passed today: use tomorrow.
  if (!hit.hasDay && hit.date.getTime() < now.getTime()) {
    const next = new Date(hit.date)
    next.setDate(next.getDate() + 1)
    return next
  }
  return hit.date
}

export function findDeadline(clause: string, now: Date, recognize: Recognizer): Deadline | null {
  const tonight = TONIGHT_RE.exec(clause)
  if (tonight) return tonightDeadline(tonight, now)

  const week = WEEK_RE.exec(clause)
  if (week) return weekDeadline(week, now)

  const hit = recognize(clause, now)
  if (!hit || Number.isNaN(hit.date.getTime())) return null
  return {
    dueAt: resolveRecognized(hit, now),
    dueHasTime: hit.hasTime,
    index: hit.index,
    length: hit.length,
  }
}