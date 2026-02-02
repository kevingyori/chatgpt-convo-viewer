import { Toolbar } from '../../components/toolbar'
import { useChat } from './chat-context'

export function ChatSearch() {
  const {
    state: { query, matches, activeMatchIndex },
    actions: { setQuery, prevMatch, nextMatch },
  } = useChat()

  return (
    <Toolbar className="flex items-center gap-2" rowClass="flex items-center gap-2 h-7">
      <Toolbar.Row className="w-full">
        <span className="text-slate-500">[?]</span>
        <Toolbar.Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search this chat"
          className="interactive w-full py-1"
        />
        <div className="flex items-center gap-1 text-[10px] text-slate-500 whitespace-nowrap">
          <Toolbar.Button
            onClick={prevMatch}
            className="interactive px-1.5 tracking-normal hover:border-cyan-400/70 hover:text-white transition"
            disabled={matches.length === 0}
          >
            {'[<]'}
          </Toolbar.Button>
          <Toolbar.Button
            onClick={nextMatch}
            className="interactive px-1.5 tracking-normal hover:border-cyan-400/70 hover:text-white transition"
            disabled={matches.length === 0}
          >
            {'[>]'}
          </Toolbar.Button>
          <span className="text-slate-500">
            {matches.length === 0 ? '0/0' : `${activeMatchIndex + 1}/${matches.length}`}
          </span>
        </div>
      </Toolbar.Row>
    </Toolbar>
  )
}
