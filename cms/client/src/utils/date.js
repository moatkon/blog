import { format } from 'date-fns'

const pad = (value) => String(value).padStart(2, '0')

export function parseContentDate(value) {
  if (!value) return null
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }

  const normalized = String(value).trim().replace(' ', 'T')
  const date = new Date(normalized)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatDate(value, pattern = 'yyyy-MM-dd') {
  const date = parseContentDate(value)
  return date ? format(date, pattern) : '—'
}

export function formatDateTime(value) {
  return formatDate(value, 'yyyy-MM-dd HH:mm')
}

export function formatForDateInput(value) {
  const date = parseContentDate(value)
  return date ? format(date, "yyyy-MM-dd'T'HH:mm") : ''
}

export function toPostDate(date = new Date()) {
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    ` ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  )
}

export function toNoteDate(date = new Date()) {
  const offsetMinutes = -date.getTimezoneOffset()
  const sign = offsetMinutes >= 0 ? '+' : '-'
  const absolute = Math.abs(offsetMinutes)

  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}` +
    `${sign}${pad(Math.floor(absolute / 60))}:${pad(absolute % 60)}`
  )
}

export function fromInputToPostDate(value) {
  if (!value) return ''
  return toPostDate(new Date(value))
}

export function fromInputToNoteDate(value) {
  if (!value) return ''
  return toNoteDate(new Date(value))
}
