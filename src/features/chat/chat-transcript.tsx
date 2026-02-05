import { memo, useEffect, useMemo } from "react";
import { formatTimestamp } from "../../lib/format";
import { Conversations, type DisplayMessage } from "../conversations";
import type { ChatMatch } from "./chat-context";
import { useChat } from "./chat-context";
import { renderChatHighlights } from "./chat-utils";

const EMPTY_MATCHES: ChatMatch[] = [];

const ChatMessage = memo(function ChatMessage({
	message,
	matches,
	activeMatch,
}: {
	message: DisplayMessage;
	matches: ChatMatch[];
	activeMatch: ChatMatch | null;
}) {
	const role = message.authorRole;
	const isUser = role === "user";
	const isAssistant = role === "assistant";

	return (
		<div
			className={`grid grid-cols-[80px_1fr] gap-2 text-[11px] ${
				isUser
					? "text-cyan-100"
					: isAssistant
						? "text-slate-200"
						: "text-slate-400"
			}`}
			data-chat-message-id={message.id}
		>
			<div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 truncate pr-1">
				{role || "other"}
			</div>
			<div className="leading-relaxed whitespace-pre-wrap">
				{renderChatHighlights(message.text || "—", matches, activeMatch)}
				<span className="block text-[10px] text-slate-600 mt-1">
					{formatTimestamp(message.createTime)}
				</span>
			</div>
		</div>
	);
});

export function ChatTranscript() {
	const {
		state: { selectedConversation, selectedMessages },
	} = Conversations.useConversations();
	const {
		state: { matches, activeMatchIndex },
		meta: { scrollToMatch },
	} = useChat();

	useEffect(() => {
		if (activeMatchIndex < 0) return;
		const match = matches[activeMatchIndex];
		if (!match) return;
		scrollToMatch(match);
	}, [activeMatchIndex, matches, scrollToMatch]);

	// Optimize match lookup: Group matches by messageId to avoid O(N*M) filtering in the render loop.
	// This reduces complexity to O(N + M) where N is matches and M is messages.
	const matchesByMessageId = useMemo(() => {
		const map = new Map<string, ChatMatch[]>();
		for (const match of matches) {
			const list = map.get(match.messageId);
			if (list) {
				list.push(match);
			} else {
				map.set(match.messageId, [match]);
			}
		}
		return map;
	}, [matches]);

	const activeMatch = activeMatchIndex >= 0 ? matches[activeMatchIndex] : null;

	return (
		<div className="flex-1 border border-slate-800 bg-slate-950/50 p-2 overflow-auto">
			{!selectedConversation ? (
				<div className="text-center text-slate-600 text-[11px] py-8">
					Select a conversation.
				</div>
			) : selectedMessages.length === 0 ? (
				<div className="text-center text-slate-600 text-[11px] py-8">
					No messages to display.
				</div>
			) : (
				<div className="flex flex-col gap-2">
					{selectedMessages.map((message) => {
						const messageMatches =
							matchesByMessageId.get(message.id) || EMPTY_MATCHES;
						// Only pass the active match if it belongs to this message to prevent
						// unnecessary re-renders of other messages when navigating matches.
						const messageActiveMatch =
							activeMatch?.messageId === message.id ? activeMatch : null;

						return (
							<ChatMessage
								key={message.id}
								message={message}
								matches={messageMatches}
								activeMatch={messageActiveMatch}
							/>
						);
					})}
				</div>
			)}
		</div>
	);
}
