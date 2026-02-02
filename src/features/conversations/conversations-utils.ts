import type { Conversation, DisplayMessage } from "./conversations-types";

export function extractMessages(conversation: Conversation): DisplayMessage[] {
	const mappingNodes = Object.values(conversation.mapping ?? {});
	const messages = mappingNodes
		.map((node) => {
			const message = node?.message;
			if (!message) return null;
			const parts = Array.isArray(message.content?.parts)
				? (message.content?.parts ?? [])
				: [];
			const text = parts
				.map((part) => String(part))
				.join("\n")
				.trim();
			return {
				id: node?.id ?? message?.create_time?.toString() ?? "message",
				authorRole: message.author?.role,
				createTime: message.create_time,
				text,
			};
		})
		.filter((message): message is DisplayMessage => message !== null);

	return messages.sort((a, b) => (a.createTime ?? 0) - (b.createTime ?? 0));
}

export function normalizeConversations(value: unknown): Conversation[] {
	if (Array.isArray(value)) return value as Conversation[];

	if (value && typeof value === "object") {
		const maybeRecord = value as Record<string, unknown>;
		if (Array.isArray(maybeRecord.conversations)) {
			return maybeRecord.conversations as Conversation[];
		}
		if (Array.isArray(maybeRecord.items)) {
			return maybeRecord.items as Conversation[];
		}
		if (Array.isArray(maybeRecord.data)) {
			return maybeRecord.data as Conversation[];
		}

		return Object.values(maybeRecord).filter((item): item is Conversation =>
			Boolean(
				item &&
					typeof item === "object" &&
					("mapping" in item ||
						"title" in item ||
						"id" in item ||
						"conversation_id" in item),
			),
		);
	}

	return [];
}
