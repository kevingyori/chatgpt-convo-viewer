import FlexSearch from "flexsearch";
import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
import { Conversations } from "../conversations";

type SearchRecord = {
	id: string;
	conversationIndex: number;
	messageId: string;
	title: string;
	role: string;
	text: string;
	createTime?: number;
};

type SearchResult = {
	record: SearchRecord;
	snippet: string;
};

type SearchState = {
	query: string;
	status: "idle" | "building" | "ready";
	results: SearchResult[];
	totalMessages: number;
};

type SearchActions = {
	setQuery: (value: string | ((old: string) => string)) => void;
};

type SearchMeta = {
	searchIndexRef: React.MutableRefObject<FlexSearch.Index | null>;
	searchRecordsRef: React.MutableRefObject<Map<string, SearchRecord>>;
};

type SearchContextValue = {
	state: SearchState;
	actions: SearchActions;
	meta: SearchMeta;
};

const SearchContext = createContext<SearchContextValue | null>(null);

export function useSearch() {
	const context = useContext(SearchContext);
	if (!context) {
		throw new Error("Search components must be used within <Search.Provider>.");
	}
	return context;
}

type SearchProviderProps = {
	children: ReactNode;
};

export function SearchProvider({ children }: SearchProviderProps) {
	const {
		state: { conversations, stats },
	} = Conversations.useConversations();
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<SearchResult[]>([]);
	const [status, setStatus] = useState<"idle" | "building" | "ready">("idle");

	const searchIndexRef = useRef<FlexSearch.Index | null>(null);
	const searchRecordsRef = useRef<Map<string, SearchRecord>>(new Map());
	const searchBuildIdRef = useRef(0);

	useEffect(() => {
		const buildId = searchBuildIdRef.current + 1;
		searchBuildIdRef.current = buildId;

		const records = new Map<string, SearchRecord>();
		const index = new FlexSearch.Index({
			tokenize: "forward",
			cache: 200,
			resolution: 9,
		});

		if (conversations.length === 0) {
			searchIndexRef.current = index;
			searchRecordsRef.current = records;
			setStatus("idle");
			setResults([]);
			return;
		}

		setStatus("building");
		setResults([]);

		const buildIndex = async () => {
			let count = 0;
			for (let cIndex = 0; cIndex < conversations.length; cIndex += 1) {
				const conversation = conversations[cIndex];
				const mappingNodes = Object.values(conversation.mapping ?? {});
				for (const node of mappingNodes) {
					const message = node?.message;
					if (!message) continue;
					const parts = Array.isArray(message.content?.parts)
						? (message.content?.parts ?? [])
						: [];
					const text = parts
						.map((part) => String(part))
						.join("\n")
						.trim();
					if (!text) continue;
					const id = `m-${cIndex}-${count}`;
					const role = message.author?.role ?? "other";
					const title = conversation.title ?? "Untitled";
					index.add(id, `${text}\n${title}\n${role}`);
					records.set(id, {
						id,
						conversationIndex: cIndex,
						messageId: node?.id ?? id,
						title,
						role,
						text,
						createTime: message.create_time,
					});
					count += 1;
					if (count % 500 === 0) {
						await new Promise((resolve) => setTimeout(resolve, 0));
						if (searchBuildIdRef.current !== buildId) return;
					}
				}
			}

			if (searchBuildIdRef.current !== buildId) return;
			searchIndexRef.current = index;
			searchRecordsRef.current = records;
			setStatus("ready");
		};

		void buildIndex();
	}, [conversations]);

	useEffect(() => {
		const trimmed = query.trim();
		if (!trimmed) {
			setResults([]);
			return;
		}
		if (status !== "ready" || !searchIndexRef.current) return;

		const matches = searchIndexRef.current.search(trimmed, 200) as string[];
		const records = searchRecordsRef.current;
		const nextResults: SearchResult[] = [];
		for (const id of matches) {
			const record = records.get(String(id));
			if (!record) continue;
			nextResults.push({
				record,
				snippet: buildSnippet(record.text, trimmed),
			});
		}
		setResults(nextResults);
	}, [query, status]);

	return (
		<SearchContext.Provider
			value={{
				state: {
					query,
					status,
					results,
					totalMessages: stats.totalMessages,
				},
				actions: {
					setQuery: (value) => setQuery(value),
				},
				meta: { searchIndexRef, searchRecordsRef },
			}}
		>
			{children}
		</SearchContext.Provider>
	);
}

function buildSnippet(text: string, query: string) {
	const lowerText = text.toLowerCase();
	const lowerQuery = query.toLowerCase();
	const matchIndex = lowerText.indexOf(lowerQuery);
	if (matchIndex === -1) {
		return text.slice(0, 140);
	}
	const start = Math.max(0, matchIndex - 60);
	const end = Math.min(text.length, matchIndex + lowerQuery.length + 60);
	const prefix = start > 0 ? "…" : "";
	const suffix = end < text.length ? "…" : "";
	return `${prefix}${text.slice(start, end)}${suffix}`;
}
