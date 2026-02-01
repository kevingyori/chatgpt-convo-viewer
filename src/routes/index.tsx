import { createFileRoute } from '@tanstack/solid-router'
import { createMemo, createSignal, For, Show } from 'solid-js'
import {
  createColumnHelper,
  createSolidTable,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type SortingState,
} from '@tanstack/solid-table'
import { FileUp, Search, Trash2 } from 'lucide-solid'

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
}

const numberFormat = new Intl.NumberFormat('en-US')
const dateFormat = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const columnHelper = createColumnHelper<ConversationRow>()

const columns = [
  columnHelper.accessor('title', {
    header: 'Title',
    cell: (info) => info.getValue() || 'Untitled',
  }),
  columnHelper.accessor('createTime', {
    header: 'Created',
    cell: (info) => formatTimestamp(info.getValue()),
  }),
  columnHelper.accessor('updateTime', {
    header: 'Updated',
    cell: (info) => formatTimestamp(info.getValue()),
  }),
  columnHelper.accessor('messageCount', {
    header: 'Messages',
    cell: (info) => numberFormat.format(info.getValue()),
  }),
  columnHelper.accessor('userCount', {
    header: 'User',
    cell: (info) => numberFormat.format(info.getValue()),
  }),
  columnHelper.accessor('assistantCount', {
    header: 'Assistant',
    cell: (info) => numberFormat.format(info.getValue()),
  }),
  columnHelper.accessor('isArchived', {
    header: 'Archived',
    cell: (info) => (info.getValue() ? 'Yes' : 'No'),
  }),
  columnHelper.accessor('currentNode', {
    header: 'Current Node',
    cell: (info) => info.getValue() || '—',
  }),
  columnHelper.accessor('conversationId', {
    header: 'Conversation ID',
    cell: (info) => info.getValue() || '—',
  }),
  columnHelper.accessor('id', {
    header: 'Record ID',
    cell: (info) => info.getValue(),
  }),
]

export const Route = createFileRoute('/')({ component: App })

function App() {
  const [conversations, setConversations] = createSignal<Conversation[]>([])
  const [fileName, setFileName] = createSignal<string | null>(null)
  const [error, setError] = createSignal<string | null>(null)
  const [loading, setLoading] = createSignal(false)
  const [globalFilter, setGlobalFilter] = createSignal('')
  const [sorting, setSorting] = createSignal<SortingState>([
    { id: 'updateTime', desc: true },
  ])

  const rows = createMemo<ConversationRow[]>(() => {
    return conversations().map((conversation, index) => {
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
      }
    })
  })

  const stats = createMemo(() => {
    const current = rows()
    const totalMessages = current.reduce(
      (sum, row) => sum + row.messageCount,
      0,
    )
    const archived = current.filter((row) => row.isArchived).length
    return {
      total: current.length,
      totalMessages,
      archived,
      latestUpdate:
        current.length > 0
          ? Math.max(
              ...current.map((row) => row.updateTime ?? row.createTime ?? 0),
            )
          : undefined,
    }
  })

  const table = createSolidTable({
    get data() {
      return rows()
    },
    columns,
    state: {
      get globalFilter() {
        return globalFilter()
      },
      get sorting() {
        return sorting()
      },
    },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const handleFileChange = async (event: Event) => {
    const target = event.currentTarget as HTMLInputElement
    const file = target.files?.[0]
    if (!file) return

    setError(null)
    setLoading(true)
    setFileName(file.name)
    try {
      const text = await file.text()
      const parsed = JSON.parse(text)
      const normalized = normalizeConversations(parsed)
      if (normalized.length === 0) {
        throw new Error(
          'No conversation records found. Ensure you selected conversations.json.',
        )
      }
      setConversations(normalized)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to parse the JSON file.'
      setError(message)
      setConversations([])
    } finally {
      setLoading(false)
      target.value = ''
    }
  }

  const handleClear = () => {
    setConversations([])
    setFileName(null)
    setError(null)
    setGlobalFilter('')
    setSorting([{ id: 'updateTime', desc: true }])
  }

  return (
    <div class="min-h-screen bg-[#0b0d10] text-slate-100 relative overflow-hidden">
      <div class="absolute -top-40 right-0 h-96 w-96 rounded-full bg-cyan-500/20 blur-[140px]" />
      <div class="absolute top-48 -left-32 h-96 w-96 rounded-full bg-amber-400/10 blur-[160px]" />

      <main class="relative max-w-7xl mx-auto px-6 py-14">
        <section class="flex flex-col gap-6">
          <div class="flex flex-col gap-2">
            <p class="text-xs tracking-[0.4em] text-cyan-300/70 uppercase">
              ChatGPT Export Viewer
            </p>
            <h1 class="text-4xl md:text-5xl font-semibold text-white">
              Browse conversations.json with TanStack Table
            </h1>
            <p class="text-base md:text-lg text-slate-300 max-w-3xl">
              Drop in your export file to scan titles, timelines, and message
              stats instantly. Everything stays local in your browser.
            </p>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
            <div class="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-[0_20px_80px_-60px_rgba(8,145,178,0.9)]">
              <div class="flex items-start justify-between gap-6">
                <div>
                  <h2 class="text-xl font-semibold text-white">
                    Import conversations.json
                  </h2>
                  <p class="text-sm text-slate-400 mt-1">
                    ChatGPT exports can be large, so loading may take a moment.
                  </p>
                </div>
                <Show when={fileName()}>
                  <button
                    type="button"
                    onClick={handleClear}
                    class="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white transition"
                  >
                    <Trash2 class="w-4 h-4" /> Clear
                  </button>
                </Show>
              </div>

              <label class="mt-5 flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-700 bg-slate-950/60 px-6 py-10 text-center cursor-pointer hover:border-cyan-400/60 transition">
                <FileUp class="w-8 h-8 text-cyan-300" />
                <span class="text-sm text-slate-300">
                  Click to select a file
                </span>
                <span class="text-xs text-slate-500">conversations.json</span>
                <input
                  class="sr-only"
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileChange}
                />
              </label>

              <div class="mt-4 text-sm text-slate-400">
                <Show
                  when={fileName()}
                  fallback={<span>No file loaded yet.</span>}
                >
                  <span class="text-slate-200">{fileName()}</span>
                </Show>
                <Show when={loading()}>
                  <span class="ml-2 text-cyan-300">Parsing…</span>
                </Show>
                <Show when={error()}>
                  {(message) => (
                    <span class="block mt-2 text-rose-300">{message()}</span>
                  )}
                </Show>
              </div>
            </div>

            <div class="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/90 via-slate-900/50 to-slate-950/90 p-6">
              <h2 class="text-xl font-semibold text-white">Snapshot</h2>
              <div class="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div class="rounded-xl bg-slate-950/70 border border-slate-800 p-4">
                  <p class="text-slate-400 text-xs uppercase tracking-[0.2em]">
                    Conversations
                  </p>
                  <p class="text-2xl font-semibold mt-2 text-white">
                    {numberFormat.format(stats().total)}
                  </p>
                </div>
                <div class="rounded-xl bg-slate-950/70 border border-slate-800 p-4">
                  <p class="text-slate-400 text-xs uppercase tracking-[0.2em]">
                    Messages
                  </p>
                  <p class="text-2xl font-semibold mt-2 text-white">
                    {numberFormat.format(stats().totalMessages)}
                  </p>
                </div>
                <div class="rounded-xl bg-slate-950/70 border border-slate-800 p-4">
                  <p class="text-slate-400 text-xs uppercase tracking-[0.2em]">
                    Archived
                  </p>
                  <p class="text-2xl font-semibold mt-2 text-white">
                    {numberFormat.format(stats().archived)}
                  </p>
                </div>
                <div class="rounded-xl bg-slate-950/70 border border-slate-800 p-4">
                  <p class="text-slate-400 text-xs uppercase tracking-[0.2em]">
                    Latest Update
                  </p>
                  <p class="text-lg font-semibold mt-2 text-white">
                    {formatTimestamp(stats().latestUpdate)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="mt-10">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 class="text-2xl font-semibold text-white">Conversation List</h2>
              <p class="text-sm text-slate-400 mt-1">
                Sort and filter to zoom in on the conversations you need.
              </p>
            </div>
            <div class="relative max-w-xs w-full">
              <Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={globalFilter()}
                onInput={(event) => setGlobalFilter(event.currentTarget.value)}
                placeholder="Filter conversations…"
                class="w-full rounded-full border border-slate-800 bg-slate-950/70 px-9 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/70"
              />
            </div>
          </div>

          <div class="mt-6 rounded-2xl border border-slate-800 bg-slate-950/40 overflow-hidden">
            <div class="overflow-auto">
              <table class="w-full text-sm">
                <thead class="bg-slate-900/70 text-xs uppercase tracking-[0.2em] text-slate-400">
                  <For each={table.getHeaderGroups()}>
                    {(headerGroup) => (
                      <tr>
                        <For each={headerGroup.headers}>
                          {(header) => {
                            const sorted = header.column.getIsSorted()
                            return (
                              <th
                                class="px-4 py-3 text-left font-semibold cursor-pointer select-none"
                                onClick={header.column.getToggleSortingHandler()}
                              >
                                <span class="inline-flex items-center gap-2">
                                  {header.isPlaceholder
                                    ? null
                                    : flexRender(
                                        header.column.columnDef.header,
                                        header.getContext(),
                                      )}
                                  <Show when={sorted === 'asc'}>↑</Show>
                                  <Show when={sorted === 'desc'}>↓</Show>
                                </span>
                              </th>
                            )
                          }}
                        </For>
                      </tr>
                    )}
                  </For>
                </thead>
                <tbody class="divide-y divide-slate-900">
                  <Show
                    when={table.getRowModel().rows.length > 0}
                    fallback={
                      <tr>
                        <td
                          colSpan={columns.length}
                          class="px-6 py-12 text-center text-slate-500"
                        >
                          {conversations().length === 0
                            ? 'Load a file to see conversations here.'
                            : 'No conversations match your filter.'}
                        </td>
                      </tr>
                    }
                  >
                    <For each={table.getRowModel().rows}>
                      {(row) => (
                        <tr class="hover:bg-slate-900/60 transition">
                          <For each={row.getVisibleCells()}>
                            {(cell) => (
                              <td class="px-4 py-3 text-slate-200">
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext(),
                                )}
                              </td>
                            )}
                          </For>
                        </tr>
                      )}
                    </For>
                  </Show>
                </tbody>
              </table>
            </div>
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
