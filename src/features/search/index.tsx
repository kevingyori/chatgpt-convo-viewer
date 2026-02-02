import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { IDockviewPanelProps } from 'dockview'
import FlexSearch from 'flexsearch'
import { List } from '../../components/list'
import { Toolbar } from '../../components/toolbar'
import { Conversations } from '../conversations'
import { Dockview } from '../dockview'

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

type SearchState = {
  query: string
  status: 'idle' | 'building' | 'ready'
  results: SearchResult[]
  totalMessages: number
}

type SearchActions = {
  setQuery: (value: string | ((old: string) => string)) => void
}

type SearchMeta = {
  searchIndexRef: React.MutableRefObject<FlexSearch.Index | null>
  searchRecordsRef: React.MutableRefObject<Map<string, SearchRecord>>
}

type SearchContextValue = {
  state: SearchState
  actions: SearchActions
  meta: SearchMeta
}

const SearchContext = createContext<SearchContextValue | null>(null)

function useSearch() {
  const context = useContext(SearchContext)
  if (!context) {
    throw new Error('Search components must be used within <Search.Provider>.')
  }
  return context
}

type SearchProviderProps = {
  children: ReactNode
}

function SearchProvider({ children }: SearchProviderProps) {
  const {
    state: { conversations, stats },
  } = Conversations.useConversations()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [status, setStatus] = useState<'idle' | 'building' | 'ready'>('idle')

  const searchIndexRef = useRef<FlexSearch.Index | null>(null)
  const searchRecordsRef = useRef<Map<string, SearchRecord>>(new Map())
  const searchBuildIdRef = useRef(0)

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
      setStatus('idle')
      setResults([])
      return
    }

    setStatus('building')
    setResults([])

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
      setStatus('ready')
    }

    void buildIndex()
  }, [conversations])

  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed) {
      setResults([])
      return
    }
    if (status !== 'ready' || !searchIndexRef.current) return

    const matches = searchIndexRef.current.search(trimmed, 200) as string[]
    const records = searchRecordsRef.current
    const nextResults: SearchResult[] = []
    for (const id of matches) {
      const record = records.get(String(id))
      if (!record) continue
      nextResults.push({
        record,
        snippet: buildSnippet(record.text, trimmed),
      })
    }
    setResults(nextResults)
  }, [query, status])

  return (
    <SearchContext.Provider
      value={{
        state: {
          query,
          status,
          results,
          totalMessages: stats.totalMessages,
        },
        actions: {
          setQuery: (value) => setQuery(value),
        },
        meta: { searchIndexRef, searchRecordsRef },
      }}
    >
      {children}
    </SearchContext.Provider>
  )
}

function SearchPanel(_props: IDockviewPanelProps) {
  return (
    <div className="h-full flex flex-col gap-2 p-2">
      <SearchHeader />
      <SearchInput />
      <SearchResults />
    </div>
  )
}

function SearchHeader() {
  const {
    state: { status, totalMessages },
  } = useSearch()
  const { actions: dockviewActions } = Dockview.useDockview()

  return (
    <Toolbar
      className="flex items-center justify-between gap-2 text-[11px] text-slate-500"
      rowClass="flex items-center gap-2 h-7"
    >
      <Toolbar.Row>
        <Toolbar.Text className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
          Full Text Search
        </Toolbar.Text>
      </Toolbar.Row>
      <Toolbar.Row className="text-[10px] text-slate-500">
        <Toolbar.Button
          onClick={dockviewActions.popoutSearch}
          className="hover:border-cyan-400/70 hover:text-white transition"
        >
          <span className="text-cyan-300">[^]</span>
          Popout
        </Toolbar.Button>
        <span>
          {status === 'building'
            ? 'Indexing...'
            : status === 'ready'
              ? `${totalMessages.toLocaleString('en-US')} msgs`
              : 'Idle'}
        </span>
      </Toolbar.Row>
    </Toolbar>
  )
}

function SearchInput() {
  const { state, actions } = useSearch()

  return (
    <Toolbar className="flex items-center gap-2" rowClass="flex items-center gap-2 h-7">
      <Toolbar.Row className="w-full">
        <span className="text-slate-500">[?]</span>
        <Toolbar.Input
          value={state.query}
          onChange={(event) => actions.setQuery(event.target.value)}
          placeholder="Search all messages"
          className="w-full py-1"
        />
      </Toolbar.Row>
    </Toolbar>
  )
}

function SearchResults() {
  const { state } = useSearch()
  const { actions: conversationsActions } = Conversations.useConversations()
  const { actions: dockviewActions } = Dockview.useDockview()

  return (
    <div className="flex-1 border border-slate-800 bg-slate-950/50 overflow-auto">
      {state.query.trim().length === 0 ? (
        <div className="px-3 py-6 text-slate-600 text-[11px]">
          Enter a query to search across all messages.
        </div>
      ) : state.status === 'building' ? (
        <div className="px-3 py-6 text-slate-600 text-[11px]">
          Building search index...
        </div>
      ) : state.results.length === 0 ? (
        <div className="px-3 py-6 text-slate-600 text-[11px]">
          No matches found.
        </div>
      ) : (
        <List className="divide-y divide-slate-900/80">
          {state.results.map((result) => (
            <List.Button
              key={result.record.id}
              onClick={() => {
                conversationsActions.onSelectRow(result.record.conversationIndex)
                dockviewActions.focusChat()
              }}
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
                  ? renderHighlightedSnippet(result.snippet, state.query)
                  : '—'}
              </div>
            </List.Button>
          ))}
        </List>
      )}
    </div>
  )
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

export const Search = {
  Provider: SearchProvider,
  Panel: SearchPanel,
  Header: SearchHeader,
  Input: SearchInput,
  Results: SearchResults,
  useSearch,
}
