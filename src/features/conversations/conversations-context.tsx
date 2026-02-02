import { createContext, useContext, useState, type ChangeEvent, type DragEvent, type ReactNode } from 'react'
import type { SortingState } from '@tanstack/react-table'
import type { Conversation, ConversationRow, DisplayMessage, Stats } from './conversations-types'
import { columns, globalFilterFn } from './conversations-columns'
import { extractMessages, normalizeConversations } from './conversations-utils'

type ConversationsState = {
  conversations: Conversation[]
  fileName: string | null
  error: string | null
  loading: boolean
  isDragging: boolean
  globalFilter: string
  sorting: SortingState
  selectedIndex: number | null
  rows: ConversationRow[]
  stats: Stats
  selectedConversation: Conversation | null
  selectedMessages: DisplayMessage[]
}

type ConversationsActions = {
  setGlobalFilter: (value: string | ((old: string) => string)) => void
  setSorting: (value: SortingState | ((old: SortingState) => SortingState)) => void
  setIsDragging: (value: boolean) => void
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void
  onDrop: (event: DragEvent<HTMLDivElement>) => void
  onClear: () => void
  onSelectRow: (index: number) => void
}

type ConversationsMeta = {
  columns: typeof columns
  globalFilterFn: typeof globalFilterFn
}

type ConversationsContextValue = {
  state: ConversationsState
  actions: ConversationsActions
  meta: ConversationsMeta
}

const ConversationsContext = createContext<ConversationsContextValue | null>(null)

export function useConversations() {
  const context = useContext(ConversationsContext)
  if (!context) {
    throw new Error(
      'Conversations components must be used within <Conversations.Provider>.',
    )
  }
  return context
}

type ConversationsProviderProps = {
  children: ReactNode
}

export function ConversationsProvider({ children }: ConversationsProviderProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [fileName, setFileName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'updateTime', desc: true },
  ])
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  const rows: ConversationRow[] = conversations.map((conversation, index) => {
    const mappingNodes = Object.values(conversation.mapping ?? {})
    const messageNodes = mappingNodes.filter((node) => node?.message)
    const userCount = messageNodes.filter(
      (node) => node?.message?.author?.role === 'user',
    ).length
    const assistantCount = messageNodes.filter(
      (node) => node?.message?.author?.role === 'assistant',
    ).length

    return {
      id: conversation.id ?? `row-${index + 1}`,
      title: conversation.title ?? '',
      createTime: conversation.create_time,
      updateTime: conversation.update_time,
      messageCount: messageNodes.length,
      userCount,
      assistantCount,
      currentNode: conversation.current_node ?? undefined,
      isArchived: Boolean(conversation.is_archived),
      conversationId: conversation.conversation_id ?? undefined,
      sourceIndex: index,
    }
  })

  const stats: Stats = {
    total: rows.length,
    totalMessages: rows.reduce((sum, row) => sum + row.messageCount, 0),
    archived: rows.filter((row) => row.isArchived).length,
    latestUpdate:
      rows.length > 0
        ? Math.max(...rows.map((row) => row.updateTime ?? row.createTime ?? 0))
        : undefined,
  }

  const selectedConversation =
    selectedIndex === null ? null : conversations[selectedIndex] ?? null
  const selectedMessages = selectedConversation ? extractMessages(selectedConversation) : []

  const handleFile = async (file: File) => {
    console.info('[upload] selected', {
      name: file.name,
      size: file.size,
      type: file.type,
    })
    setError(null)
    setLoading(true)
    setFileName(file.name)
    try {
      const text = await file.text()
      console.info('[upload] read', {
        chars: text.length,
        preview: text.slice(0, 200),
      })
      const parsed = JSON.parse(text)
      console.info('[upload] parsed', {
        kind: Array.isArray(parsed) ? 'array' : typeof parsed,
        keys:
          parsed && typeof parsed === 'object'
            ? Object.keys(parsed as Record<string, unknown>).slice(0, 12)
            : null,
      })
      const normalized = normalizeConversations(parsed)
      console.info('[upload] normalized', {
        count: normalized.length,
      })
      if (normalized.length === 0) {
        throw new Error(
          'No conversation records found. Ensure you selected conversations.json.',
        )
      }
      setConversations(normalized)
      setSelectedIndex(null)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to parse the JSON file.'
      setError(message)
      setConversations([])
      setSelectedIndex(null)
    } finally {
      setLoading(false)
    }
  }

  const actions: ConversationsActions = {
    setGlobalFilter: (value) => setGlobalFilter(value),
    setSorting: (value) => setSorting(value),
    setIsDragging,
    onFileChange: async (event) => {
      const input = event.currentTarget
      const file = input.files?.[0]
      if (!file) return
      await handleFile(file)
      if (input.isConnected) {
        input.value = ''
      }
    },
    onDrop: (event) => {
      event.preventDefault()
      setIsDragging(false)
      const file = event.dataTransfer?.files?.[0]
      if (file) {
        void handleFile(file)
      }
    },
    onClear: () => {
      setConversations([])
      setFileName(null)
      setError(null)
      setGlobalFilter('')
      setSorting([{ id: 'updateTime', desc: true }])
      setSelectedIndex(null)
    },
    onSelectRow: (index) => setSelectedIndex(index),
  }

  return (
    <ConversationsContext.Provider
      value={{
        state: {
          conversations,
          fileName,
          error,
          loading,
          isDragging,
          globalFilter,
          sorting,
          selectedIndex,
          rows,
          stats,
          selectedConversation,
          selectedMessages,
        },
        actions,
        meta: { columns, globalFilterFn },
      }}
    >
      {children}
    </ConversationsContext.Provider>
  )
}
