import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { IDockviewPanelProps } from 'dockview'
import { Toolbar } from '../../components/toolbar'
import { formatTimestamp } from '../../lib/format'
import { Conversations, type Conversation, type DisplayMessage } from '../conversations'
import { Dockview } from '../dockview'

type ChatMatch = {
  messageId: string
  start: number
  end: number
}

type ChatState = {
  query: string
  matches: ChatMatch[]
  activeMatchIndex: number
  copied: boolean
}

type ChatActions = {
  setQuery: (value: string | ((old: string) => string)) => void
  prevMatch: () => void
  nextMatch: () => void
  copyContext: () => void
}

type ChatMeta = {
  scrollToMatch: (match: ChatMatch) => void
}

type ChatContextValue = {
  state: ChatState
  actions: ChatActions
  meta: ChatMeta
}

const ChatContext = createContext<ChatContextValue | null>(null)

function useChat() {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('Chat components must be used within <Chat.Provider>.')
  }
  return context
}

type ChatProviderProps = {
  children: ReactNode
}

function ChatProvider({ children }: ChatProviderProps) {
  const {
    state: { selectedConversation, selectedMessages },
  } = Conversations.useConversations()
  const [query, setQuery] = useState('')
  const [matches, setMatches] = useState<ChatMatch[]>([])
  const [activeMatchIndex, setActiveMatchIndex] = useState(-1)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const trimmed = query.trim().toLowerCase()
    if (!trimmed) {
      setMatches([])
      setActiveMatchIndex(-1)
      return
    }

    const nextMatches: ChatMatch[] = []
    for (const message of selectedMessages) {
      const haystack = message.text.toLowerCase()
      let index = 0
      while (index < haystack.length) {
        const found = haystack.indexOf(trimmed, index)
        if (found === -1) break
        nextMatches.push({
          messageId: message.id,
          start: found,
          end: found + trimmed.length,
        })
        index = found + trimmed.length
      }
    }
    setMatches(nextMatches)
    setActiveMatchIndex(nextMatches.length > 0 ? 0 : -1)
  }, [query, selectedMessages])

  const actions: ChatActions = {
    setQuery: (value) => setQuery(value),
    prevMatch: () => {
      if (matches.length === 0) return
      setActiveMatchIndex((current) =>
        current <= 0 ? matches.length - 1 : current - 1,
      )
    },
    nextMatch: () => {
      if (matches.length === 0) return
      setActiveMatchIndex((current) =>
        current >= matches.length - 1 ? 0 : current + 1,
      )
    },
    copyContext: async () => {
      if (!selectedConversation) return
      const text = buildContextText(selectedConversation, selectedMessages)
      try {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1600)
      } catch {
        fallbackCopy(text)
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1600)
      }
    },
  }

  const meta: ChatMeta = {
    scrollToMatch: (match) => {
      const el = document.querySelector(`[data-chat-message-id="${match.messageId}"]`)
      if (el instanceof HTMLElement) {
        el.scrollIntoView({ block: 'center', behavior: 'smooth' })
      }
    },
  }

  return (
    <ChatContext.Provider
      value={{
        state: { query, matches, activeMatchIndex, copied },
        actions,
        meta,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

function ChatPanel(_props: IDockviewPanelProps) {
  return (
    <div className="h-full flex flex-col gap-2 p-2">
      <ChatHeader />
      <ChatSearch />
      <ChatTranscript />
    </div>
  )
}

function ChatHeader() {
  const {
    state: { selectedConversation },
  } = Conversations.useConversations()
  const {
    state: { copied },
    actions: chatActions,
  } = useChat()
  const { actions: dockviewActions } = Dockview.useDockview()

  return (
    <Toolbar
      className="flex items-center justify-between gap-2 text-[11px] text-slate-500"
      rowClass="flex items-center gap-2 h-7"
    >
      <Toolbar.Row className="min-w-0">
        <Toolbar.Text className="text-[10px] uppercase tracking-[0.2em] truncate">
          {selectedConversation?.title || 'Chat'}
        </Toolbar.Text>
      </Toolbar.Row>
      {selectedConversation ? (
        <Toolbar.Row>
          <Toolbar.Button
            onClick={chatActions.copyContext}
            className="interactive hover:border-cyan-400/70 hover:text-white transition"
          >
            <span className="text-cyan-300">[→]</span>
            {copied ? 'Copied' : 'Copy'}
          </Toolbar.Button>
          <Toolbar.Button
            onClick={dockviewActions.popoutChat}
            className="interactive hover:border-cyan-400/70 hover:text-white transition"
          >
            <span className="text-cyan-300">[^]</span>
            Popout
          </Toolbar.Button>
        </Toolbar.Row>
      ) : null}
    </Toolbar>
  )
}

function ChatSearch() {
  const {
    state: { query, matches, activeMatchIndex },
    actions: chatActions,
  } = useChat()

  return (
    <Toolbar className="flex items-center gap-2" rowClass="flex items-center gap-2 h-7">
      <Toolbar.Row className="w-full">
        <span className="text-slate-500">[?]</span>
        <Toolbar.Input
          value={query}
          onChange={(event) => chatActions.setQuery(event.target.value)}
          placeholder="Search this chat"
          className="interactive w-full py-1"
        />
        <div className="flex items-center gap-1 text-[10px] text-slate-500 whitespace-nowrap">
          <Toolbar.Button
            onClick={chatActions.prevMatch}
            className="interactive px-1.5 tracking-normal hover:border-cyan-400/70 hover:text-white transition"
            disabled={matches.length === 0}
          >
            {'[<]'}
          </Toolbar.Button>
          <Toolbar.Button
            onClick={chatActions.nextMatch}
            className="interactive px-1.5 tracking-normal hover:border-cyan-400/70 hover:text-white transition"
            disabled={matches.length === 0}
          >
            {'[>]'}
          </Toolbar.Button>
          <span className="text-slate-500">
            {matches.length === 0
              ? '0/0'
              : `${activeMatchIndex + 1}/${matches.length}`}
          </span>
        </div>
      </Toolbar.Row>
    </Toolbar>
  )
}

function ChatTranscript() {
  const {
    state: { selectedConversation, selectedMessages },
  } = Conversations.useConversations()
  const {
    state: { matches, activeMatchIndex },
    meta,
  } = useChat()

  useEffect(() => {
    if (activeMatchIndex < 0) return
    const match = matches[activeMatchIndex]
    if (!match) return
    meta.scrollToMatch(match)
  }, [activeMatchIndex, matches, meta])

  return (
    <div className="flex-1 border border-slate-800 bg-slate-950/50 p-2 overflow-auto">
      {!selectedConversation ? (
        <div className="text-center text-slate-600 text-[11px] py-8">
          Select a conversation.
        </div>
      ) : selectedMessages.length === 0 ? (
        <div className="text-center text-slate-600 text-[11px] py-8">
          No messages to display.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {selectedMessages.map((message) => {
            const role = message.authorRole
            const isUser = role === 'user'
            const isAssistant = role === 'assistant'
            const messageMatches = matches.filter(
              (match) => match.messageId === message.id,
            )
            const activeMatch =
              activeMatchIndex >= 0 ? matches[activeMatchIndex] : null
            return (
              <div
                key={message.id}
                className={`grid grid-cols-[80px_1fr] gap-2 text-[11px] ${
                  isUser
                    ? 'text-cyan-100'
                    : isAssistant
                      ? 'text-slate-200'
                      : 'text-slate-400'
                }`}
                data-chat-message-id={message.id}
              >
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 truncate pr-1">
                  {role || 'other'}
                </div>
                <div className="leading-relaxed whitespace-pre-wrap">
                  {renderChatHighlights(
                    message.text || '—',
                    messageMatches,
                    activeMatch?.messageId === message.id ? activeMatch : null,
                  )}
                  <span className="block text-[10px] text-slate-600 mt-1">
                    {formatTimestamp(message.createTime)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function renderChatHighlights(
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

function buildContextText(conversation: Conversation, messages: DisplayMessage[]) {
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

function fallbackCopy(value: string) {
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

export const Chat = {
  Provider: ChatProvider,
  Panel: ChatPanel,
  Header: ChatHeader,
  Search: ChatSearch,
  Transcript: ChatTranscript,
  useChat,
}
