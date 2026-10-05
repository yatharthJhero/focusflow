import {
  isEllipticalTemporalFragment,
  startsWithAction,
  startsWithActionAfterTemporal,
  stripLeadingFiller,
} from './language'

// Hard breaks: a new line, ";", or a sentence-ending . ! ?
// followed by a space or the end of the text.
const HARD_BREAK = /[\r\n;]+|[.!?]+(?=\s|$)/

// Soft breaks: "and", "then", "and then", "&".
const CONJUNCTION = /\s+(?:and\s+then|and|then|&)\s+/gi

function startsNewTask(text: string, needsObject = false): boolean {
  return (
    startsWithAction(text, needsObject) ||
    startsWithActionAfterTemporal(text, needsObject)
  )
}

function splitOnConjunctions(segment: string): string[] {
  const parts: string[] = []
  let start = 0

  for (const match of segment.matchAll(CONJUNCTION)) {
    const rest = segment.slice(
      (match.index ?? 0) + match[0].length
    )

    if (
      startsNewTask(rest, true) ||
      isEllipticalTemporalFragment(rest)
    ) {
      parts.push(segment.slice(start, match.index))
      start = (match.index ?? 0) + match[0].length
    }
  }

  parts.push(segment.slice(start))

  return parts
}

function splitBlock(block: string): string[] {
  const clauses: string[] = []

  for (const segment of block.split(',')) {
    for (const piece of splitOnConjunctions(segment)) {
      const text = piece.trim()

      if (stripLeadingFiller(text) === '') continue

      const last = clauses.length - 1

      if (
        last < 0 ||
        startsNewTask(text) ||
        isEllipticalTemporalFragment(text)
      ) {
        clauses.push(text)
      } else {
        clauses[last] += ', ' + text
      }
    }
  }

  return clauses
}

export function splitClauses(input: string): string[] {
  // Prevent "5 p.m." from being interpreted as a sentence boundary.
  const text = input.replace(/\b([ap])\.m\.?/gi, '$1m')

  const clauses: string[] = []

  for (const block of text.split(HARD_BREAK)) {
    clauses.push(...splitBlock(block))
  }

  return clauses
}