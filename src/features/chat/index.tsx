import { ChatProvider, useChat } from "./chat-context";
import { ChatHeader } from "./chat-header";
import { ChatPanel } from "./chat-panel";
import { ChatSearch } from "./chat-search";
import { ChatTranscript } from "./chat-transcript";

export const Chat = {
	Provider: ChatProvider,
	Panel: ChatPanel,
	Header: ChatHeader,
	Search: ChatSearch,
	Transcript: ChatTranscript,
	useChat,
};
