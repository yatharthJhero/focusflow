// Word lists and text-cleaning rules for the parser.
// This file is plain data + small pure functions. To change what counts as the
// start of a new task, or what gets stripped from titles, edit it here.

// A comma-separated piece starts a NEW task only if it begins with one of these
// verbs (after filler like "I need to" is removed). Otherwise it is treated as
// a continuation of the previous task, which is what keeps "buy milk, eggs and
// bread" together as one task.
export const ACTION_VERBS: ReadonlySet<string> = new Set([
  'apply', 'arrange', 'ask', 'attend', 'bake', 'book', 'bring', 'build', 'buy',
  'call', 'cancel', 'check', 'clean', 'collect', 'complete', 'confirm', 'contact',
  'cook', 'deliver', 'deploy', 'design', 'discuss', 'do', 'donate', 'download',
  'draft', 'drive', 'drop', 'edit', 'email', 'exercise', 'feed', 'fill', 'finish',
  'fix', 'follow', 'get', 'go', 'install', 'iron', 'join', 'learn', 'make',
  'meditate', 'meet', 'message', 'order', 'organise', 'organize', 'pack', 'pay',
  'pick', 'plan', 'practice', 'practise', 'prepare', 'print', 'publish', 'push',
  'read', 'recycle', 'register', 'rehearse', 'remind', 'renew', 'repair', 'reply',
  'research', 'respond', 'return', 'review', 'revise', 'schedule', 'sell', 'send',
  'set', 'shop', 'sign', 'solve', 'start', 'study', 'submit', 'take', 'tell',
  'test', 'text', 'tidy', 'update', 'upload', 'vacuum', 'visit', 'walk', 'wash',
  'watch', 'water', 'wrap', 'write',
])

// Phrases removed from the START of a task title. Order matters when one phrase
// is the prefix of another ("and then" before "and"). The original wording is
// still kept in sourceText, so later steps (priority hints like "maybe") can use it.
const FILLER_PHRASES = [
  'and then', 'and', 'then', 'also', 'plus', 'but', 'so', 'please', 'pls',
  'maybe', 'just', 'okay', 'ok',
  "i(?:'ll| will| need to| have to| got to| want to| should| must| gotta|'m going to| am going to)",
  'we need to', 'need to', 'have to', 'has to', 'got to', 'gotta', 'want to',
  'should', 'must', 'remember to', "don'?t forget to", 'do not forget to',
  'make sure to', 'try to', 'to',
]
const FILLER_RE = new RegExp(`^(?:${FILLER_PHRASES.join('|')})\\b[\\s,]*`, 'i')

// Removes filler repeatedly: "and then I need to call" -> "call".
export function stripLeadingFiller(text: string): string {
  let current = text.trim()
  for (;;) {
    const next = current.replace(FILLER_RE, '').trim()
    if (next === current) return current
    current = next
  }
}

// Does this piece of text begin with an action verb?
// needsObject = the verb must be followed by at least one more word. We use this
// stricter check for " and ", so "buy pen and book" stays one task while
// "buy pens and book tickets" splits.
export function startsWithAction(text: string, needsObject = false): boolean {
  const words = stripLeadingFiller(text).toLowerCase().split(/\s+/)
  const first = (words[0] ?? '').replace(/[^a-z]/g, '')
  return ACTION_VERBS.has(first) && (!needsObject || words.length > 1)
}

const DAY_NAME =
  '(?:sun(?:day)?|mon(?:day)?|tue(?:sday)?|wed(?:nesday)?|thu(?:rsday)?|fri(?:day)?|sat(?:urday)?)'

const TEMPORAL_PREFIX_RE = new RegExp(
  `^\\s*(?:(?:by|on|at|around|before|until|till)\\s+)?(?:the\\s+)?(?:day after tomorrow|tomorrow|tonight|today|this week|next week|(?:this|next)\\s+${DAY_NAME}|${DAY_NAME})(?=\\b)`,
  'i'
)

const LEADING_CLOCK_RE =
  /^(?:at|around|by)\s+\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)?\b\s*/i

export type TemporalPrefix = {
  phrase: string
  rest: string
}

export function stripLeadingTemporal(text: string): TemporalPrefix | null {
  const cleaned = stripLeadingFiller(text)
  const match = TEMPORAL_PREFIX_RE.exec(cleaned)

  if (!match) return null

  let rest = cleaned.slice(match[0].length).trim()

  rest = rest.replace(LEADING_CLOCK_RE, '').trim()
  rest = stripLeadingFiller(rest)

  return {
    phrase: match[0].trim(),
    rest,
  }
}

export function startsWithActionAfterTemporal(
  text: string,
  needsObject = false
): boolean {
  const temporal = stripLeadingTemporal(text)

  if (!temporal) return false

  return startsWithAction(temporal.rest, needsObject)
}

const ELLIPTICAL_MODIFIER_RE =
  /^(?:with|for|using|together with|along with|without|near)\b/i

export function isEllipticalTemporalFragment(text: string): boolean {
  const temporal = stripLeadingTemporal(text)

  if (!temporal || !temporal.rest) return false

  return ELLIPTICAL_MODIFIER_RE.test(temporal.rest)
}

export type Span = { index: number; length: number }

const EDGE_PUNCTUATION = /^[\s,;:.!?-]+|[\s,;:.!?-]+$/g
const LEADING_PREPOSITION = /^(?:by|on|at|due|before|until|till)\b\s*/i
const TRAILING_PREPOSITION = /\s+(?:by|on|at|due|before|until|till)$/i

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

// Trim whitespace and stray punctuation from both ends, collapse inner spaces.
export function tidyEdges(text: string): string {
  return text.replace(/\s+/g, ' ').replace(EDGE_PUNCTUATION, '')
}

// Builds the title shown in the UI:
//   1. cut the deadline phrase out of the clause
//   2. strip filler ("I need to", "and") and dangling words ("by", "on", "at")
//   3. capitalise the first letter
// Returns '' when nothing is left, which means the clause was only a date.
export function cleanTitle(clause: string, deadlineSpan: Span | null): string {
  let text = clause
  if (deadlineSpan) {
    text = clause.slice(0, deadlineSpan.index) + ' ' + clause.slice(deadlineSpan.index + deadlineSpan.length)
  }
  text = text.replace(/\s+/g, ' ').replace(/\s+([,;.!?])/g, '$1')

  for (;;) {
    const before = text
    text = tidyEdges(text)
    text = stripLeadingFiller(text)
    text = text.replace(LEADING_PREPOSITION, '').replace(TRAILING_PREPOSITION, '')
    if (text === before) break
  }
  return capitalize(text)
}