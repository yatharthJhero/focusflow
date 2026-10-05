import { describe, expect, it } from 'vitest'
import { DEFAULT_NOW, PARSER_CASES, SPLIT_CASES, summarize } from './parser.cases'
import { parseInput } from './parser'
import { splitClauses } from './parsing/splitter'

describe('splitClauses', () => {
  for (const c of SPLIT_CASES) {
    it(JSON.stringify(c.input), () => {
      expect(splitClauses(c.input)).toEqual(c.clauses)
    })
  }
})

describe('parseInput', () => {
  for (const c of PARSER_CASES) {
    it(c.name, () => {
      const drafts = parseInput(c.input, c.now ?? DEFAULT_NOW)
      expect(summarize(drafts)).toEqual(c.expected)
      if (c.sources) expect(drafts.map((d) => d.sourceText)).toEqual(c.sources)
    })
  }

  it('returns no tasks for blank input', () => {
    expect(parseInput('', DEFAULT_NOW)).toEqual([])
    expect(parseInput('   \n  ', DEFAULT_NOW)).toEqual([])
  })

  it('returns no tasks for input that is only punctuation', () => {
    expect(parseInput(' , ; . ', DEFAULT_NOW)).toEqual([])
    expect(parseInput('!!!', DEFAULT_NOW)).toEqual([])
  })

  it('falls back to one task with the original text if the date recognizer throws', () => {
    const broken = () => {
      throw new Error('boom')
    }
    const drafts = parseInput('call Rahul, buy milk tomorrow', DEFAULT_NOW, broken)
    expect(drafts.length).toBe(1)
    expect(drafts[0]?.title).toBe('call Rahul, buy milk tomorrow')
    expect(drafts[0]?.dueAt).toBe(null)
  })

  it('still works, without deadlines, if the recognizer finds nothing', () => {
    const none = () => null
    const drafts = parseInput('finish assignment and call Rahul tomorrow', DEFAULT_NOW, none)
    expect(drafts.map((d) => d.title)).toEqual(['Finish assignment', 'Call Rahul tomorrow'])
  })

  it('ignores an invalid date from the recognizer', () => {
    const invalid = () => ({ index: 0, length: 4, date: new Date(NaN), hasTime: false, hasDay: true })
    const drafts = parseInput('call Rahul', DEFAULT_NOW, invalid)
    expect(drafts.map((d) => d.dueAt)).toEqual([null])
  })
})