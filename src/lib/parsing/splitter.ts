import { startsWithAction, stripLeadingFiller } from './language'

// Hard breaks: a new line, ";", or a sentence-ending . ! ? (followed by a space
// or the end of the text, so decimals like "2.5" are not split).
const HARD_BREAK = /[\r\n;]+|[.!?]+(?=\s|$)/

// Soft breaks: " and ", " then ", " and then ", " & ".
const CONJUNCTION = /\s+(?:and\s+then|and|then|&)\s+/gi

// Splits one block of text on conjunctions, but ONLY where the words after the
// conjunction look like a new task (start with an action verb plus an object).
function splitOnConjunctions(segment: string): string[] {
  const parts: string[] = []
  let start = 0
  for (const match of segment.matchAll(CONJUNCTION)) {
    const rest = segment.slice(match.index + match[0].length)
    if (startsWithAction(rest, true)) {
      parts.push(segment.slice(start, match.index))
      start = match.index + match[0].length
    }
  }
  parts.push(segment.slice(start))
  return parts
}

// A block is the text between hard breaks. Inside it we split on commas and
// conjunctions, then glue back any piece that does not start a new task.
function splitBlock(block: string): string[] {
  const clauses: string[] = []
  for (const segment of block.split(',')) {
    for (const piece of splitOnConjunctions(segment)) {
      const text = piece.trim()
      if (stripLeadingFiller(text) === '') continue // empty, or only filler like "and"
      const last = clauses.length - 1
      if (last < 0 || startsWithAction(text)) {
        clauses.push(text) // starts with a verb: a new task
      } else {
        clauses[last] += ', ' + text // "eggs", "bread", "2026": part of the previous task
      }
    }
  }
  return clauses
}

// Input -> list of clauses (one per intended task). Pure: no dates involved here.
export function splitClauses(input: string): string[] {
  // "5 p.m." -> "5 pm", so the dots are not mistaken for sentence ends.
  const text = input.replace(/\b([ap])\.m\.?/gi, '$1m')
  const clauses: string[] = []
  for (const block of text.split(HARD_BREAK)) {
    clauses.push(...splitBlock(block))
  }
  return clauses
}