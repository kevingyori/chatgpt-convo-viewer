import type { ColumnDef, FilterFn } from '@tanstack/react-table'
import { formatTimestamp, numberFormat } from '../../lib/format'
import type { ConversationRow } from './conversations-types'

export const columns: ColumnDef<ConversationRow>[] = [
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

export const globalFilterFn: FilterFn<ConversationRow> = (row, _columnId, value) => {
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
