import { useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'

type Props = {
  onSubmit: (text: string) => void
}

export function CaptureBox({ onSubmit }: Props) {
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  function submit() {
    const trimmed = text.trim()
    if (!trimmed) return
    onSubmit(trimmed)
    setText('')
    inputRef.current?.focus()
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    submit()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter submits, Shift+Enter inserts a new line.
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      submit()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <label htmlFor="capture" className="sr-only">
        What's on your mind?
      </label>
      <textarea
        id="capture"
        ref={inputRef}
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={handleKeyDown}
        rows={3}
        placeholder="Dump your thoughts… e.g. finish assignment, call the electrician, pay the bill tomorrow"
        className="w-full resize-none rounded-xl border border-slate-300 bg-white p-3 text-base shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
      />
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-slate-500">Enter to add · Shift+Enter for a new line</p>
        <button
          type="submit"
          disabled={!text.trim()}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Add
        </button>
      </div>
    </form>
  )
}