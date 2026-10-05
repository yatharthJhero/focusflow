// The ONLY file that imports chrono-node. It adapts chrono's result to our small
// RecognizedDate shape, so the rest of the parser never depends on the library
// (and tests can swap in a different Recognizer).
import * as chrono from 'chrono-node'
import type { Recognizer } from './deadline'

// chrono happily reads some ordinary words as dates ("may", "sat", "now").
// If the matched text is one of these on its own, or just a bare number, ignore it.
const IGNORED_MATCHES: ReadonlySet<string> = new Set([
  'now', 'may', 'march', 'sat', 'sun', 'mon', 'tue', 'tues', 'wed', 'thu', 'thur',
  'thurs', 'fri', 'a', 'an', 'second', 'seconds', 'minute', 'minutes', 'hour',
  'hours', 'day', 'days', 'week', 'weeks', 'month', 'months', 'year', 'years',
])

export const chronoRecognizer: Recognizer = (text, now) => {
  // forwardDate: "Friday" means the NEXT Friday, never one in the past.
  for (const result of chrono.parse(text, now, { forwardDate: true })) {
    const matched = result.text.trim().toLowerCase()
    if (IGNORED_MATCHES.has(matched) || /^\d+$/.test(matched)) continue

    return {
      index: result.index,
      length: result.text.length,
      date: result.start.date(),
      hasTime: result.start.isCertain('hour'),
      hasDay: result.start.isCertain('day') || result.start.isCertain('weekday'),
    }
  }
  return null
}