import { ConversationsProvider, useConversations } from './conversations-context'
import { ConversationsPanel } from './conversations-panel'
import { ConversationsHeader } from './conversations-header'
import { ConversationsFilter } from './conversations-filter'
import { ConversationsTable } from './conversations-table'
import type {
  Conversation,
  DisplayMessage,
  ConversationRow,
  Stats,
} from './conversations-types'

export const Conversations = {
  Provider: ConversationsProvider,
  Panel: ConversationsPanel,
  Header: ConversationsHeader,
  Filter: ConversationsFilter,
  Table: ConversationsTable,
  useConversations,
}

export type { Conversation, DisplayMessage, ConversationRow, Stats }
