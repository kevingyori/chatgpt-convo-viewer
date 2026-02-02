import type { ChatMatch } from './chat-context'
import type { Conversation, DisplayMessage } from '../conversations'
import { formatTimestamp } from '../../lib/format'

export function renderChatHighlights(
  text: string,
  matches: ChatMatch[],
  activeMatch: ChatMatch | null,
) {
  if (matches.length === 0) return text

  const parts: Array<{ text: string; match: boolean; active: boolean }> = []
  let cursor = 0
  for (const match of matches) {
    if (match.start > cursor) {
      parts.push({ text: text.slice(cursor, match.start), match: false, active: false })
    }
    const isActive =
      activeMatch?.messageId === match.messageId &&
      activeMatch?.start === match.start
    parts.push({
      text: text.slice(match.start, match.end),
      match: true,
      active: isActive,
    })
    cursor = match.end
  }
  if (cursor < text.length) {
    parts.push({ text: text.slice(cursor), match: false, active: false })
  }

  return parts.map((part, idx) =>
    part.match ? (
      <span
        key={`${part.text}-${idx}`}
        className={part.active ? 'chat-highlight-active' : 'chat-highlight'}
      >
        {part.text}
      </span>
    ) : (
      <span key={`${part.text}-${idx}`}>{part.text}</span>
    ),
  )
}

export function buildContextText(conversation: Conversation, messages: DisplayMessage[]) {
  const header = [
    '# ChatGPT Conversation Export',
    `Title: ${conversation.title || 'Untitled'}`,
    `Conversation ID: ${conversation.conversation_id || '—'}`,
    `Created: ${formatTimestamp(conversation.create_time)}`,
    `Updated: ${formatTimestamp(conversation.update_time)}`,
    `Archived: ${conversation.is_archived ? 'Yes' : 'No'}`,
    '',
    '## Transcript',
  ]

  const body = messages.map((message, index) => {
    const role = message.authorRole || 'other'
    const stamp = message.createTime ? ` (${formatTimestamp(message.createTime)})` : ''
    const label = `${index + 1}. ${role}${stamp}`
    const content = message.text ? message.text : '—'
    return `${label}\n${content}`
  })

  return [...header, ...body].join('\n\n')
}

export function fallbackCopy(value: string) {
  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.setAttribute('readonly', 'true')
  textarea.style.position = 'fixed'
  textarea.style.top = '-9999px'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  document.body.removeChild(textarea)
}
