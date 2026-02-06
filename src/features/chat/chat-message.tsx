import { memo } from "react";
import { formatTimestamp } from "../../lib/format";
import type { DisplayMessage } from "../conversations";
import type { ChatMatch } from "./chat-context";
import { renderChatHighlights } from "./chat-utils";

type ChatMessageProps = {
	message: DisplayMessage;
	matches: ChatMatch[];
	activeMatch: ChatMatch | null;
};

// Memoized to prevent re-rendering all messages when the active search match changes.
// Only the previous active message and the new active message will re-render.
export const ChatMessage = memo(function ChatMessage({
	message,
	matches,
	activeMatch,
}: ChatMessageProps) {
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
