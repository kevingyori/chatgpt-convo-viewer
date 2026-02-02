import {
	ConversationsProvider,
	useConversations,
} from "./conversations-context";
import { ConversationsFilter } from "./conversations-filter";
import { ConversationsHeader } from "./conversations-header";
import { ConversationsPanel } from "./conversations-panel";
import { ConversationsTable } from "./conversations-table";
import type {
	Conversation,
	ConversationRow,
	DisplayMessage,
	Stats,
} from "./conversations-types";

export const Conversations = {
	Provider: ConversationsProvider,
	Panel: ConversationsPanel,
	Header: ConversationsHeader,
	Filter: ConversationsFilter,
	Table: ConversationsTable,
	useConversations,
};

export type { Conversation, DisplayMessage, ConversationRow, Stats };
