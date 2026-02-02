import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type ReactNode,
} from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type FilterFn,
  type SortingState,
} from '@tanstack/react-table'
import type { IDockviewPanelProps } from 'dockview'
import { HiddenInput } from '../../components/hidden-input'
import { Toolbar } from '../../components/toolbar'
import { formatTimestamp, numberFormat } from '../../lib/format'

export type Conversation = {
  title?: string
  create_time?: number
  update_time?: number
  mapping?: Record<string, MappingNode>
  current_node?: string
  is_archived?: boolean
  conversation_id?: string
  id?: string
}

type MappingNode = {
  id?: string
  message?: {
    author?: {
      role?: string
    }
    create_time?: number
    content?: {
      content_type?: string
      parts?: unknown[]
    }
  }
}

export type DisplayMessage = {
  id: string
  authorRole: string | undefined
  createTime: number | undefined
  text: string
}

export type ConversationRow = {
  id: string
  title: string
  createTime?: number
  updateTime?: number
  messageCount: number
  userCount: number
  assistantCount: number
  currentNode?: string
  isArchived: boolean
  conversationId?: string
  sourceIndex: number
}

type Stats = {
  total: number
  totalMessages: number
  archived: number
  latestUpdate?: number
}

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
  setGlobalFilter: (
    value: string | ((old: string) => string),
  ) => void
  setSorting: (
    value: SortingState | ((old: SortingState) => SortingState),
  ) => void
  setIsDragging: (value: boolean) => void
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void
  onDrop: (event: DragEvent<HTMLDivElement>) => void
  onClear: () => void
  onSelectRow: (index: number) => void
}

type ConversationsMeta = {
  columns: ColumnDef<ConversationRow>[]
  globalFilterFn: FilterFn<ConversationRow>
}

type ConversationsContextValue = {
  state: ConversationsState
  actions: ConversationsActions
  meta: ConversationsMeta
}

const ConversationsContext = createContext<ConversationsContextValue | null>(null)

function useConversations() {
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

const columns: ColumnDef<ConversationRow>[] = [
  {
    accessorKey: 'title',
    header: 'Title',
    cell: (info) => info.getValue<string>() || 'Untitled',
  },
  {
    accessorKey: 'createTime',
    header: 'Created',
    cell: (info) => formatTimestamp(info.getValue<number | undefined>()),
  },
  {
    accessorKey: 'updateTime',
    header: 'Updated',
    cell: (info) => formatTimestamp(info.getValue<number | undefined>()),
  },
  {
    accessorKey: 'messageCount',
    header: 'Messages',
    cell: (info) => numberFormat.format(info.getValue<number>()),
  },
  {
    accessorKey: 'userCount',
    header: 'User',
    cell: (info) => numberFormat.format(info.getValue<number>()),
  },
  {
    accessorKey: 'assistantCount',
    header: 'Assistant',
    cell: (info) => numberFormat.format(info.getValue<number>()),
  },
  {
    accessorKey: 'isArchived',
    header: 'Archived',
    cell: (info) => (info.getValue<boolean>() ? 'Yes' : 'No'),
  },
  {
    accessorKey: 'currentNode',
    header: 'Current Node',
    cell: (info) => info.getValue<string>() || '—',
  },
  {
    accessorKey: 'conversationId',
    header: 'Conversation ID',
    cell: (info) => info.getValue<string>() || '—',
  },
  {
    accessorKey: 'id',
    header: 'Record ID',
    cell: (info) => info.getValue<string>(),
  },
]

const globalFilterFn: FilterFn<ConversationRow> = (row, _columnId, value) => {
  const filter = String(value ?? '').trim().toLowerCase()
  if (!filter) return true
  const haystack = [
    row.original.title,
    row.original.id,
    row.original.conversationId,
    row.original.currentNode,
    row.original.isArchived ? 'yes' : 'no',
    row.original.messageCount,
    row.original.userCount,
    row.original.assistantCount,
    row.original.createTime,
    row.original.updateTime,
  ]
    .map((entry) => (entry === undefined ? '' : String(entry)))
    .join(' ')
    .toLowerCase()
  return haystack.includes(filter)
}

function ConversationsProvider({ children }: ConversationsProviderProps) {
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
  const selectedMessages = selectedConversation
    ? extractMessages(selectedConversation)
    : []

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

function ConversationsPanel(_props: IDockviewPanelProps) {
  return (
    <div className="h-full flex flex-col gap-2 p-2">
      <ConversationsHeader />
      <ConversationsFilter />
      <ConversationsTable />
    </div>
  )
}

function ConversationsHeader() {
  const { state, actions } = useConversations()
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const helpRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!isHelpOpen) return
    const handleOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (!helpRef.current?.contains(target)) {
        setIsHelpOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('touchstart', handleOutside)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('touchstart', handleOutside)
    }
  }, [isHelpOpen])

  const dragClass = state.isDragging
    ? ' border-cyan-400/80 bg-cyan-500/10'
    : ''

  return (
    <Toolbar className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
      <Toolbar.Row>
        <Toolbar.Button
          className={`cursor-pointer${dragClass}`}
          onClick={() => inputRef.current?.click()}
        >
          <span className="text-cyan-300">[+]</span>
          <span>Load file</span>
        </Toolbar.Button>
        <div className="relative" ref={helpRef}>
          <Toolbar.IconButton
            aria-label="How to export conversations"
            aria-expanded={isHelpOpen}
            onClick={() => setIsHelpOpen((open) => !open)}
          >
            ?
          </Toolbar.IconButton>
          {isHelpOpen ? (
            <div className="absolute left-0 top-8 z-10 w-72 border border-slate-700 bg-slate-950/95 p-3 text-[11px] text-slate-200 shadow-lg">
              <div className="font-semibold text-cyan-200">Export steps</div>
              <ol className="mt-2 list-decimal space-y-1 pl-4 text-slate-300">
                <li>ChatGPT Settings &gt; Data controls</li>
                <li>Export data</li>
                <li>Confirm export</li>
                <li>Download from email</li>
                <li>Unzip the download</li>
                <li>Upload conversations.json from the unzipped folder</li>
              </ol>
            </div>
          ) : null}
        </div>
        <HiddenInput
          ref={inputRef}
          type="file"
          accept=".json,application/json"
          onChange={actions.onFileChange}
        />
        <Toolbar.Text>{state.fileName ?? 'No file loaded'}</Toolbar.Text>
        {state.loading ? (
          <Toolbar.Text className="text-cyan-300">Parsing…</Toolbar.Text>
        ) : null}
        {state.error ? (
          <Toolbar.Text className="text-rose-300">{state.error}</Toolbar.Text>
        ) : null}
      </Toolbar.Row>
      <Toolbar.Row>
        <Toolbar.Button
          onClick={actions.onClear}
          className="gap-2 hover:border-rose-400/70 hover:text-white transition"
        >
          <span className="text-rose-300">[x]</span> Clear
        </Toolbar.Button>
        <Toolbar.Text>
          Total:{' '}
          <span className="text-slate-200">
            {numberFormat.format(state.stats.total)}
          </span>{' '}
          | Msg:{' '}
          <span className="text-slate-200">
            {numberFormat.format(state.stats.totalMessages)}
          </span>{' '}
          | Archived:{' '}
          <span className="text-slate-200">
            {numberFormat.format(state.stats.archived)}
          </span>
        </Toolbar.Text>
      </Toolbar.Row>
    </Toolbar>
  )
}

function ConversationsFilter() {
  const { state, actions } = useConversations()
  return (
    <Toolbar className="flex items-center gap-2" rowClass="flex items-center gap-2 h-7">
      <Toolbar.Row className="w-full">
        <span className="text-slate-500">[?]</span>
        <Toolbar.Input
          value={state.globalFilter}
          onChange={(event) => actions.setGlobalFilter(event.target.value)}
          placeholder="Filter conversations"
          className="w-full py-1"
        />
      </Toolbar.Row>
    </Toolbar>
  )
}

function ConversationsTable() {
  const { state, actions, meta } = useConversations()

  const table = useReactTable({
    data: state.rows,
    columns: meta.columns,
    state: {
      sorting: state.sorting,
      globalFilter: state.globalFilter,
    },
    onSortingChange: actions.setSorting,
    onGlobalFilterChange: actions.setGlobalFilter,
    globalFilterFn: meta.globalFilterFn,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div
      className="flex-1 border border-slate-800 bg-slate-950/50 overflow-hidden"
      onDragEnter={(event) => {
        event.preventDefault()
        actions.setIsDragging(true)
      }}
      onDragOver={(event) => {
        event.preventDefault()
        actions.setIsDragging(true)
      }}
      onDragLeave={(event) => {
        if (event.currentTarget === event.target) {
          actions.setIsDragging(false)
        }
      }}
      onDrop={actions.onDrop}
    >
      <div className="overflow-auto h-full">
        <table className="w-full text-[11px]">
          <thead className="bg-slate-900/80 text-[10px] uppercase tracking-[0.2em] text-slate-500">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const sorted = header.column.getIsSorted()
                  return (
                    <th
                      key={header.id}
                      className="px-2 py-1 text-left font-semibold cursor-pointer select-none"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                        {sorted === 'asc' ? '↑' : null}
                        {sorted === 'desc' ? '↓' : null}
                      </span>
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-900/80">
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={
                    state.selectedIndex === row.original.sourceIndex
                      ? 'bg-slate-900/80'
                      : 'hover:bg-slate-900/60 transition cursor-pointer'
                  }
                  onClick={() => actions.onSelectRow(row.original.sourceIndex)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-2 py-1 text-slate-200">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-3 py-6 text-center text-slate-500 text-[11px]"
                >
                  {state.rows.length === 0
                    ? 'Load a file to see conversations.'
                    : 'No conversations match your filter.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function extractMessages(conversation: Conversation): DisplayMessage[] {
  const mappingNodes = Object.values(conversation.mapping ?? {})
  const messages = mappingNodes
    .map((node) => {
      const message = node?.message
      if (!message) return null
      const parts = Array.isArray(message.content?.parts)
        ? message.content?.parts ?? []
        : []
      const text = parts.map((part) => String(part)).join('\n').trim()
      return {
        id: node?.id ?? message?.create_time?.toString() ?? 'message',
        authorRole: message.author?.role,
        createTime: message.create_time,
        text,
      }
    })
    .filter((message): message is DisplayMessage => message !== null)

  return messages.sort((a, b) => (a.createTime ?? 0) - (b.createTime ?? 0))
}

function normalizeConversations(value: unknown): Conversation[] {
  if (Array.isArray(value)) return value as Conversation[]

  if (value && typeof value === 'object') {
    const maybeRecord = value as Record<string, unknown>
    if (Array.isArray(maybeRecord.conversations)) {
      return maybeRecord.conversations as Conversation[]
    }
    if (Array.isArray(maybeRecord.items)) {
      return maybeRecord.items as Conversation[]
    }
    if (Array.isArray(maybeRecord.data)) {
      return maybeRecord.data as Conversation[]
    }

    return Object.values(maybeRecord).filter(
      (item): item is Conversation =>
        Boolean(
          item &&
            typeof item === 'object' &&
            ('mapping' in item ||
              'title' in item ||
              'id' in item ||
              'conversation_id' in item),
        ),
    )
  }

  return []
}

export const Conversations = {
  Provider: ConversationsProvider,
  Panel: ConversationsPanel,
  Header: ConversationsHeader,
  Filter: ConversationsFilter,
  Table: ConversationsTable,
  useConversations,
}
