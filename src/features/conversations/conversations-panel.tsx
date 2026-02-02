import type { IDockviewPanelProps } from 'dockview'
import { ConversationsHeader } from './conversations-header'
import { ConversationsFilter } from './conversations-filter'
import { ConversationsTable } from './conversations-table'

export function ConversationsPanel(_props: IDockviewPanelProps) {
  return (
    <div className="h-full flex flex-col gap-2 p-2">
      <ConversationsHeader />
      <ConversationsFilter />
      <ConversationsTable />
    </div>
  )
}
