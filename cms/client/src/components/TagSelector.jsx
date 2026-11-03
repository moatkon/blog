import React, { useState } from 'react'
import { Plus, X } from 'lucide-react'

const TagSelector = ({ value = [], onChange, suggestions = [], placeholder = '输入标签后按回车' }) => {
  const [input, setInput] = useState('')

  const addTags = (raw) => {
    const parts = String(raw)
      .split(/[,，]/)
      .map((tag) => tag.trim())
      .filter(Boolean)

    if (!parts.length) return

    const existing = new Set(value.map((tag) => tag.toLowerCase()))
    const next = [...value]

    parts.forEach((tag) => {
      if (!existing.has(tag.toLowerCase())) {
        existing.add(tag.toLowerCase())
        next.push(tag)
      }
    })

    onChange(next)
    setInput('')
  }

  const removeTag = (tag) => onChange(value.filter((item) => item !== tag))

  const onKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      addTags(input)
    } else if (event.key === 'Backspace' && !input && value.length) {
      onChange(value.slice(0, -1))
    }
  }

  const available = suggestions.filter(
    (tag) => !value.some((item) => item.toLowerCase() === tag.toLowerCase())
  )

  return (
    <div>
      <div className="flex min-h-[42px] flex-wrap items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2 py-1.5 focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/10">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-1 text-xs font-medium text-brand-700"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="rounded-sm text-brand-500 hover:text-brand-800"
              aria-label={`移除标签 ${tag}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => addTags(input)}
          placeholder={value.length ? '' : placeholder}
          className="h-7 min-w-[8rem] flex-1 border-0 bg-transparent px-1 text-sm outline-none placeholder:text-slate-400"
        />
      </div>

      {available.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {available.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => addTags(tag)}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-500 transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
            >
              <Plus className="h-3 w-3" />
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default TagSelector
