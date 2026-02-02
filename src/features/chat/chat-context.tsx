import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { Conversations } from '../conversations'
import { buildContextText, fallbackCopy } from './chat-utils'

export type ChatMatch = {
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

export function useChat() {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('Chat components must be used within <Chat.Provider>.')
  }
  return context
}

type ChatProviderProps = {
  children: ReactNode
}

export function ChatProvider({ children }: ChatProviderProps) {
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
