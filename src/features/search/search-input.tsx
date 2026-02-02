import { Toolbar } from '../../components/toolbar'
import { useSearch } from './search-context'

export function SearchInput() {
  const {
    state: { query },
    actions: { setQuery },
  } = useSearch()

  return (
    <Toolbar className="flex items-center gap-2" rowClass="flex items-center gap-2 h-7">
      <Toolbar.Row className="w-full">
        <span className="text-slate-500">[?]</span>
        <Toolbar.Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search all messages"
          className="w-full py-1"
        />
      </Toolbar.Row>
    </Toolbar>
  )
}
