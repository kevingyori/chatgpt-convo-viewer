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

export type MappingNode = {
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

export type Stats = {
  total: number
  totalMessages: number
  archived: number
  latestUpdate?: number
}
