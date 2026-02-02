export const numberFormat = new Intl.NumberFormat('en-US')

export const dateFormat = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export function formatTimestamp(value?: number) {
  if (!value) return '—'
  const date = new Date(value * 1000)
  if (Number.isNaN(date.getTime())) return '—'
  return dateFormat.format(date)
}
