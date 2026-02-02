import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react'
import FlexSearch from 'flexsearch'
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
import {
  DockviewReact,
  DockviewDefaultTab,
  type DockviewApi,
  type DockviewReadyEvent,
  type IDockviewPanel,
  type IDockviewPanelProps,
} from 'dockview'

type Conversation = {
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

type ConversationRow = {
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

type ConversationsPanelParams = {
  fileName: string | null
  loading: boolean
  error: string | null
  stats: Stats
  rows: ConversationRow[]
  globalFilter: string
  sorting: SortingState
  isDragging: boolean
  setGlobalFilter: (value: string) => void
  setSorting: (value: SortingState) => void
  setIsDragging: (value: boolean) => void
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void
  onDrop: (event: DragEvent<HTMLButtonElement>) => void
  onClear: () => void
  onSelectRow: (index: number) => void
  selectedIndex: number | null
}

type ChatPanelParams = {
  selectedConversation: Conversation | null
  selectedMessages: DisplayMessage[]
  copied: boolean
  onCopyContext: () => void
  onPopout: () => void
  chatQuery: string
  onChatQueryChange: (value: string) => void
  chatMatches: ChatMatch[]
  activeChatMatchIndex: number
  onChatPrev: () => void
  onChatNext: () => void
}

type SearchRecord = {
  id: string
  conversationIndex: number
  messageId: string
  title: string
  role: string
  text: string
  createTime?: number
}

type SearchResult = {
  record: SearchRecord
  snippet: string
}

type ChatMatch = {
  messageId: string
  start: number
  end: number
}

type SearchPanelParams = {
  query: string
  status: 'idle' | 'building' | 'ready'
  results: SearchResult[]
  totalMessages: number
  onQueryChange: (value: string) => void
  onSelectResult: (record: SearchRecord) => void
  onPopout: () => void
}

const numberFormat = new Intl.NumberFormat('en-US')
const dateFormat = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

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

function ConversationsPanel({
  params,
}: IDockviewPanelProps<ConversationsPanelParams>) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  if (!params) return null

  const dragClass = params.isDragging
    ? ' border-cyan-400/80 bg-cyan-500/10'
    : ''

  const table = useReactTable({
    data: params.rows,
    columns,
    state: {
      sorting: params.sorting,
      globalFilter: params.globalFilter,
    },
    onSortingChange: params.setSorting,
    onGlobalFilterChange: params.setGlobalFilter,
    globalFilterFn,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className="h-full flex flex-col gap-2 p-2">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className={`inline-flex items-center gap-2 border border-slate-700 bg-slate-950 px-2.5 py-1 text-[11px] uppercase tracking-[0.2em] text-slate-300 cursor-pointer hover:border-cyan-400/70${dragClass}`}
            onClick={() => inputRef.current?.click()}
            onDragEnter={(event) => {
              event.preventDefault()
              params.setIsDragging(true)
            }}
            onDragOver={(event) => {
              event.preventDefault()
              params.setIsDragging(true)
            }}
            onDragLeave={() => params.setIsDragging(false)}
            onDrop={params.onDrop}
          >
            <span className="text-cyan-300">[+]</span>
            <span>Load file</span>
          </button>
          <div className="relative">
            <button
              type="button"
              aria-label="How to export conversations"
              aria-expanded={isHelpOpen}
              className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-700 bg-slate-950 text-[11px] text-cyan-300 hover:border-cyan-400/70"
              onClick={() => setIsHelpOpen((open) => !open)}
            >
              ?
            </button>
            {isHelpOpen ? (
              <div className="absolute left-0 top-8 z-10 w-72 rounded border border-slate-700 bg-slate-950/95 p-3 text-[11px] text-slate-200 shadow-lg">
                <div className="font-semibold text-cyan-200">
                  Export steps
                </div>
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
          <input
            ref={inputRef}
            className="sr-only"
            type="file"
            accept=".json,application/json"
            onChange={params.onFileChange}
          />
          <span className="text-[11px] text-slate-500">
            {params.fileName ?? 'No file loaded'}
          </span>
          {params.loading ? (
            <span className="text-cyan-300 text-[11px]">Parsing…</span>
          ) : null}
          {params.error ? (
            <span className="text-rose-300 text-[11px]">{params.error}</span>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={params.onClear}
            className="inline-flex items-center gap-2 border border-slate-700 bg-slate-950 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-300 hover:border-rose-400/70 hover:text-white transition"
          >
            <span className="text-rose-300">[x]</span> Clear
          </button>
          <div className="text-[11px] text-slate-500">
            Total:{' '}
            <span className="text-slate-200">
              {numberFormat.format(params.stats.total)}
            </span>{' '}
            | Msg:{' '}
            <span className="text-slate-200">
              {numberFormat.format(params.stats.totalMessages)}
            </span>{' '}
            | Archived:{' '}
            <span className="text-slate-200">
              {numberFormat.format(params.stats.archived)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-slate-500">[?]</span>
        <input
          value={params.globalFilter}
          onChange={(event) => params.setGlobalFilter(event.target.value)}
          placeholder="Filter conversations"
          className="w-full border border-slate-800 bg-slate-950/80 px-2 py-1 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400/70"
        />
      </div>

      <div className="flex-1 border border-slate-800 bg-slate-950/50 overflow-hidden">
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
                      params.selectedIndex === row.original.sourceIndex
                        ? 'bg-slate-900/80'
                        : 'hover:bg-slate-900/60 transition cursor-pointer'
                    }
                    onClick={() => params.onSelectRow(row.original.sourceIndex)}
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
                    {params.rows.length === 0
                      ? 'Load a file to see conversations.'
                      : 'No conversations match your filter.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function ChatPanel({
  params,
}: IDockviewPanelProps<ChatPanelParams>) {
  if (!params) return null

  return (
    <div className="h-full flex flex-col gap-2 p-2">
      <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
        <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 truncate">
          {params.selectedConversation?.title || 'Chat'}
        </div>
        {params.selectedConversation ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={params.onCopyContext}
              className="interactive inline-flex items-center gap-1.5 border border-slate-700 bg-slate-950 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-slate-300 hover:border-cyan-400/70 hover:text-white transition"
            >
              <span className="text-cyan-300">[→]</span>
              {params.copied ? 'Copied' : 'Copy'}
            </button>
            <button
              type="button"
              onClick={params.onPopout}
              className="interactive inline-flex items-center gap-1.5 border border-slate-700 bg-slate-950 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-slate-300 hover:border-cyan-400/70 hover:text-white transition"
            >
              <span className="text-cyan-300">[^]</span>
              Popout
            </button>
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-slate-500">[?]</span>
        <input
          value={params.chatQuery}
          onChange={(event) => params.onChatQueryChange(event.target.value)}
          placeholder="Search this chat"
          className="interactive w-full border border-slate-800 bg-slate-950/80 px-2 py-1 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400/70"
        />
        <div className="flex items-center gap-1 text-[10px] text-slate-500 whitespace-nowrap">
          <button
            type="button"
            onClick={params.onChatPrev}
            className="interactive inline-flex items-center border border-slate-700 bg-slate-950 px-1.5 py-0.5 text-slate-300 hover:border-cyan-400/70 hover:text-white transition"
            disabled={params.chatMatches.length === 0}
          >
            {'[<]'}
          </button>
          <button
            type="button"
            onClick={params.onChatNext}
            className="interactive inline-flex items-center border border-slate-700 bg-slate-950 px-1.5 py-0.5 text-slate-300 hover:border-cyan-400/70 hover:text-white transition"
            disabled={params.chatMatches.length === 0}
          >
            {'[>]'}
          </button>
          <span className="text-slate-500">
            {params.chatMatches.length === 0
              ? '0/0'
              : `${params.activeChatMatchIndex + 1}/${params.chatMatches.length}`}
          </span>
        </div>
      </div>

      <div className="flex-1 border border-slate-800 bg-slate-950/50 p-2 overflow-auto">
        {!params.selectedConversation ? (
          <div className="text-center text-slate-600 text-[11px] py-8">
            Select a conversation.
          </div>
        ) : params.selectedMessages.length === 0 ? (
          <div className="text-center text-slate-600 text-[11px] py-8">
            No messages to display.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {params.selectedMessages.map((message) => {
              const role = message.authorRole
              const isUser = role === 'user'
              const isAssistant = role === 'assistant'
              const matches = params.chatMatches.filter(
                (match) => match.messageId === message.id,
              )
              const activeMatch =
                params.activeChatMatchIndex >= 0
                  ? params.chatMatches[params.activeChatMatchIndex]
                  : null
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
                      matches,
                      activeMatch?.messageId === message.id
                        ? activeMatch
                        : null,
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
    </div>
  )
}

function SearchPanel({
  params,
}: IDockviewPanelProps<SearchPanelParams>) {
  if (!params) return null

  return (
    <div className="h-full flex flex-col gap-2 p-2">
      <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
        <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
          Full Text Search
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-500">
          <button
            type="button"
            onClick={params.onPopout}
            className="inline-flex items-center gap-1.5 border border-slate-700 bg-slate-950 px-2 py-0.5 uppercase tracking-[0.2em] text-slate-300 hover:border-cyan-400/70 hover:text-white transition"
          >
            <span className="text-cyan-300">[^]</span>
            Popout
          </button>
          <span>
            {params.status === 'building'
              ? 'Indexing...'
              : params.status === 'ready'
                ? `${params.totalMessages.toLocaleString('en-US')} msgs`
                : 'Idle'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-slate-500">[?]</span>
        <input
          value={params.query}
          onChange={(event) => params.onQueryChange(event.target.value)}
          placeholder="Search all messages"
          className="w-full border border-slate-800 bg-slate-950/80 px-2 py-1 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400/70"
        />
      </div>

      <div className="flex-1 border border-slate-800 bg-slate-950/50 overflow-auto">
        {params.query.trim().length === 0 ? (
          <div className="px-3 py-6 text-slate-600 text-[11px]">
            Enter a query to search across all messages.
          </div>
        ) : params.status === 'building' ? (
          <div className="px-3 py-6 text-slate-600 text-[11px]">
            Building search index...
          </div>
        ) : params.results.length === 0 ? (
          <div className="px-3 py-6 text-slate-600 text-[11px]">
            No matches found.
          </div>
        ) : (
          <div className="divide-y divide-slate-900/80">
            {params.results.map((result) => (
              <button
                key={result.record.id}
                type="button"
                onClick={() => params.onSelectResult(result.record)}
                className="w-full text-left px-3 py-2 text-[11px] text-slate-200 hover:bg-slate-900/60 transition"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-slate-400 truncate">
                    {result.record.title || 'Untitled'}
                  </div>
                  <div className="text-[10px] text-slate-600 uppercase tracking-[0.2em]">
                    {result.record.role}
                  </div>
                </div>
                <div className="text-slate-500 mt-1">
                  {result.snippet
                    ? renderHighlightedSnippet(result.snippet, params.query)
                    : '—'}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [fileName, setFileName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [copied, setCopied] = useState(false)
  const [dockReady, setDockReady] = useState(false)
  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'updateTime', desc: true },
  ])
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchStatus, setSearchStatus] = useState<
    'idle' | 'building' | 'ready'
  >('idle')
  const [chatQuery, setChatQuery] = useState('')
  const [chatMatches, setChatMatches] = useState<ChatMatch[]>([])
  const [activeChatMatchIndex, setActiveChatMatchIndex] = useState(-1)

  const dockviewApiRef = useRef<DockviewApi | null>(null)
  const conversationsPanelRef = useRef<IDockviewPanel | null>(null)
  const chatPanelRef = useRef<IDockviewPanel | null>(null)
  const searchPanelRef = useRef<IDockviewPanel | null>(null)
  const searchIndexRef = useRef<FlexSearch.Index | null>(null)
  const searchRecordsRef = useRef<Map<string, SearchRecord>>(new Map())
  const searchBuildIdRef = useRef(0)

  const rows = useMemo<ConversationRow[]>(() => {
    return conversations.map((conversation, index) => {
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
  }, [conversations])

  const stats = useMemo<Stats>(() => {
    const totalMessages = rows.reduce(
      (sum, row) => sum + row.messageCount,
      0,
    )
    const archived = rows.filter((row) => row.isArchived).length
    return {
      total: rows.length,
      totalMessages,
      archived,
      latestUpdate:
        rows.length > 0
          ? Math.max(...rows.map((row) => row.updateTime ?? row.createTime ?? 0))
          : undefined,
    }
  }, [rows])

  useEffect(() => {
    const buildId = searchBuildIdRef.current + 1
    searchBuildIdRef.current = buildId

    const records = new Map<string, SearchRecord>()
    const index = new FlexSearch.Index({
      tokenize: 'forward',
      cache: 200,
      resolution: 9,
    })

    if (conversations.length === 0) {
      searchIndexRef.current = index
      searchRecordsRef.current = records
      setSearchStatus('idle')
      setSearchResults([])
      return
    }

    setSearchStatus('building')
    setSearchResults([])

    const buildIndex = async () => {
      let count = 0
      for (let cIndex = 0; cIndex < conversations.length; cIndex += 1) {
        const conversation = conversations[cIndex]
        const mappingNodes = Object.values(conversation.mapping ?? {})
        for (const node of mappingNodes) {
          const message = node?.message
          if (!message) continue
          const parts = Array.isArray(message.content?.parts)
            ? message.content?.parts ?? []
            : []
          const text = parts.map((part) => String(part)).join('\n').trim()
          if (!text) continue
          const id = `m-${cIndex}-${count}`
          const role = message.author?.role ?? 'other'
          const title = conversation.title ?? 'Untitled'
          index.add(id, `${text}\n${title}\n${role}`)
          records.set(id, {
            id,
            conversationIndex: cIndex,
            messageId: node?.id ?? id,
            title,
            role,
            text,
            createTime: message.create_time,
          })
          count += 1
          if (count % 500 === 0) {
            await new Promise((resolve) => setTimeout(resolve, 0))
            if (searchBuildIdRef.current !== buildId) return
          }
        }
      }

      if (searchBuildIdRef.current !== buildId) return
      searchIndexRef.current = index
      searchRecordsRef.current = records
      setSearchStatus('ready')
    }

    void buildIndex()
  }, [conversations])

  const selectedConversation = useMemo(() => {
    if (selectedIndex === null) return null
    return conversations[selectedIndex] ?? null
  }, [conversations, selectedIndex])

  const selectedMessages = useMemo(() => {
    if (!selectedConversation) return []
    return extractMessages(selectedConversation)
  }, [selectedConversation])

  useEffect(() => {
    const query = chatQuery.trim().toLowerCase()
    if (!query) {
      setChatMatches([])
      setActiveChatMatchIndex(-1)
      return
    }

    const matches: ChatMatch[] = []
    for (const message of selectedMessages) {
      const haystack = message.text.toLowerCase()
      let index = 0
      while (index < haystack.length) {
        const found = haystack.indexOf(query, index)
        if (found === -1) break
        matches.push({
          messageId: message.id,
          start: found,
          end: found + query.length,
        })
        index = found + query.length
      }
    }
    setChatMatches(matches)
    setActiveChatMatchIndex(matches.length > 0 ? 0 : -1)
  }, [chatQuery, selectedMessages])

  useEffect(() => {
    if (activeChatMatchIndex < 0) return
    const match = chatMatches[activeChatMatchIndex]
    if (!match) return
    const el = document.querySelector(`[data-chat-message-id="${match.messageId}"]`)
    if (el instanceof HTMLElement) {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
  }, [activeChatMatchIndex, chatMatches])

  useEffect(() => {
    const query = searchQuery.trim()
    if (!query) {
      setSearchResults([])
      return
    }
    if (searchStatus !== 'ready' || !searchIndexRef.current) return

    const matches = searchIndexRef.current.search(query, 200) as string[]
    const records = searchRecordsRef.current
    const results: SearchResult[] = []
    for (const id of matches) {
      const record = records.get(String(id))
      if (!record) continue
      results.push({
        record,
        snippet: buildSnippet(record.text, query),
      })
    }
    setSearchResults(results)
  }, [searchQuery, searchStatus])

  const handleCopyContext = async () => {
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
  }

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget
    const file = input.files?.[0]
    if (!file) return
    await handleFile(file)
    if (input.isConnected) {
      input.value = ''
    }
  }

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

  const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault()
    setIsDragging(false)
    const file = event.dataTransfer?.files?.[0]
    if (file) {
      void handleFile(file)
    }
  }

  const conversationsParams = useMemo<ConversationsPanelParams>(
    () => ({
      fileName,
      loading,
      error,
      stats,
      rows,
      globalFilter,
      sorting,
      isDragging,
      setGlobalFilter,
      setSorting,
      setIsDragging,
      onFileChange: handleFileChange,
      onDrop: handleDrop,
      onClear: () => {
        setConversations([])
        setFileName(null)
        setError(null)
        setGlobalFilter('')
        setSorting([{ id: 'updateTime', desc: true }])
        setSelectedIndex(null)
      },
      onSelectRow: (index) => setSelectedIndex(index),
      selectedIndex,
    }),
    [
      fileName,
      loading,
      error,
      stats,
      rows,
      globalFilter,
      sorting,
      isDragging,
      selectedIndex,
    ],
  )

  const chatParams = useMemo<ChatPanelParams>(
    () => ({
      selectedConversation,
      selectedMessages,
      copied,
      onCopyContext: handleCopyContext,
      onPopout: () => {
        if (!chatPanelRef.current || !dockviewApiRef.current) return
        dockviewApiRef.current.addPopoutGroup(chatPanelRef.current)
      },
      chatQuery,
      onChatQueryChange: setChatQuery,
      chatMatches,
      activeChatMatchIndex,
      onChatPrev: () => {
        if (chatMatches.length === 0) return
        setActiveChatMatchIndex((current) =>
          current <= 0 ? chatMatches.length - 1 : current - 1,
        )
      },
      onChatNext: () => {
        if (chatMatches.length === 0) return
        setActiveChatMatchIndex((current) =>
          current >= chatMatches.length - 1 ? 0 : current + 1,
        )
      },
    }),
    [
      selectedConversation,
      selectedMessages,
      copied,
      chatQuery,
      chatMatches,
      activeChatMatchIndex,
    ],
  )

  const searchParams = useMemo<SearchPanelParams>(
    () => ({
      query: searchQuery,
      status: searchStatus,
      results: searchResults,
      totalMessages: stats.totalMessages,
      onQueryChange: setSearchQuery,
      onSelectResult: (record) => {
        setSelectedIndex(record.conversationIndex)
        chatPanelRef.current?.api.setActive()
      },
      onPopout: () => {
        if (!searchPanelRef.current || !dockviewApiRef.current) return
        dockviewApiRef.current.addPopoutGroup(searchPanelRef.current)
      },
    }),
    [searchQuery, searchStatus, searchResults, stats.totalMessages],
  )

  const handleDockReady = (event: DockviewReadyEvent) => {
    if (dockReady) return
    setDockReady(true)
    dockviewApiRef.current = event.api
    conversationsPanelRef.current = event.api.addPanel({
      id: 'conversations',
      component: 'conversations',
      title: 'CONVERSATIONS',
      params: conversationsParams,
    })
    searchPanelRef.current = event.api.addPanel({
      id: 'search',
      component: 'search',
      title: 'SEARCH',
      position: {
        referencePanel: 'conversations',
        direction: 'within',
        index: 1,
      },
      params: searchParams,
      inactive: true,
    })
    chatPanelRef.current = event.api.addPanel({
      id: 'chat',
      component: 'chat',
      title: 'CHAT',
      position: {
        referencePanel: 'conversations',
        direction: 'right',
      },
      initialWidth: 460,
      params: chatParams,
    })
  }

  useEffect(() => {
    conversationsPanelRef.current?.api.updateParameters(conversationsParams)
  }, [conversationsParams])

  useEffect(() => {
    chatPanelRef.current?.api.updateParameters(chatParams)
  }, [chatParams])

  useEffect(() => {
    searchPanelRef.current?.api.updateParameters(searchParams)
  }, [searchParams])

  const dockviewComponents = useMemo(
    () => ({
      conversations: ConversationsPanel,
      chat: ChatPanel,
      search: SearchPanel,
    }),
    [],
  )

  return (
    <div className="min-h-screen bg-[#0a0c0f] text-slate-100">
      <main className="mx-auto px-3 py-4 h-full">
        <section className="flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.25em] text-slate-500">
          <span className="text-slate-300 font-semibold">CHATGPT EXPORT</span>
          <span className="text-slate-500">/</span>
          <span className="text-slate-400">CONVERSATIONS.JSON VIEWER</span>
        </section>

        <section className="mt-3">
          <div className="dockview-host">
            <DockviewReact
              className="dockview-theme-dark border border-slate-800 dockview-host__inner"
              onReady={handleDockReady}
              components={dockviewComponents}
              defaultTabComponent={(props) => (
                <DockviewDefaultTab {...props} hideClose />
              )}
            />
          </div>
        </section>
      </main>
    </div>
  )
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

function formatTimestamp(value?: number) {
  if (!value) return '—'
  const date = new Date(value * 1000)
  if (Number.isNaN(date.getTime())) return '—'
  return dateFormat.format(date)
}

function buildSnippet(text: string, query: string) {
  const lowerText = text.toLowerCase()
  const lowerQuery = query.toLowerCase()
  const matchIndex = lowerText.indexOf(lowerQuery)
  if (matchIndex === -1) {
    return text.slice(0, 140)
  }
  const start = Math.max(0, matchIndex - 60)
  const end = Math.min(text.length, matchIndex + lowerQuery.length + 60)
  const prefix = start > 0 ? '…' : ''
  const suffix = end < text.length ? '…' : ''
  return `${prefix}${text.slice(start, end)}${suffix}`
}

function renderHighlightedSnippet(snippet: string, query: string) {
  const trimmed = query.trim()
  if (!trimmed) return snippet
  const lowerSnippet = snippet.toLowerCase()
  const lowerQuery = trimmed.toLowerCase()
  const parts: Array<{ text: string; match: boolean }> = []

  let index = 0
  while (index < snippet.length) {
    const found = lowerSnippet.indexOf(lowerQuery, index)
    if (found === -1) {
      parts.push({ text: snippet.slice(index), match: false })
      break
    }
    if (found > index) {
      parts.push({ text: snippet.slice(index, found), match: false })
    }
    parts.push({
      text: snippet.slice(found, found + lowerQuery.length),
      match: true,
    })
    index = found + lowerQuery.length
  }

  return parts.map((part, idx) =>
    part.match ? (
      <span key={`${part.text}-${idx}`} className="search-highlight">
        {part.text}
      </span>
    ) : (
      <span key={`${part.text}-${idx}`}>{part.text}</span>
    ),
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

type DisplayMessage = {
  id: string
  authorRole?: string
  createTime?: number
  text: string
}

function extractMessages(conversation: Conversation): DisplayMessage[] {
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
    .filter((message): message is DisplayMessage => Boolean(message))

  return messages.sort((a, b) => (a.createTime ?? 0) - (b.createTime ?? 0))
}

function buildContextText(
  conversation: Conversation,
  messages: DisplayMessage[],
) {
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
    const stamp = message.createTime
      ? ` (${formatTimestamp(message.createTime)})`
      : ''
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
