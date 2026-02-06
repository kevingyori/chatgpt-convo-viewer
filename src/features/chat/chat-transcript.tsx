import { useEffect, useMemo } from "react";
import { Conversations } from "../conversations";
import type { ChatMatch } from "./chat-context";
import { useChat } from "./chat-context";
import { ChatMessage } from "./chat-message";

const EMPTY_MATCHES: ChatMatch[] = [];

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
					{selectedMessages.map((message) => (
						<ChatMessage
							key={message.id}
							message={message}
							matches={matchesByMessageId.get(message.id) || EMPTY_MATCHES}
							activeMatch={
								activeMatch?.messageId === message.id ? activeMatch : null
							}
						/>
					))}
				</div>
			)}
		</div>
	);
}
