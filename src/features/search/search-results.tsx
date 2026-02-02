import { List } from "../../components/list";
import { Conversations } from "../conversations";
import { Dockview } from "../dockview";
import { useSearch } from "./search-context";
import { renderHighlightedSnippet } from "./search-utils";

export function SearchResults() {
	const {
		state: { query, status, results },
	} = useSearch();
	const {
		actions: { onSelectRow },
	} = Conversations.useConversations();
	const {
		actions: { focusChat },
	} = Dockview.useDockview();

	return (
		<div className="flex-1 border border-slate-800 bg-slate-950/50 overflow-auto">
			{query.trim().length === 0 ? (
				<div className="px-3 py-6 text-slate-600 text-[11px]">
					Enter a query to search across all messages.
				</div>
			) : status === "building" ? (
				<div className="px-3 py-6 text-slate-600 text-[11px]">
					Building search index...
				</div>
			) : results.length === 0 ? (
				<div className="px-3 py-6 text-slate-600 text-[11px]">
					No matches found.
				</div>
			) : (
				<List className="divide-y divide-slate-900/80">
					{results.map((result) => (
						<List.Button
							key={result.record.id}
							onClick={() => {
								onSelectRow(result.record.conversationIndex);
								focusChat();
							}}
						>
							<div className="flex items-center justify-between gap-2">
								<div className="text-slate-400 truncate">
									{result.record.title || "Untitled"}
								</div>
								<div className="text-[10px] text-slate-600 uppercase tracking-[0.2em]">
									{result.record.role}
								</div>
							</div>
							<div className="text-slate-500 mt-1">
								{result.snippet
									? renderHighlightedSnippet(result.snippet, query)
									: "—"}
							</div>
						</List.Button>
					))}
				</List>
			)}
		</div>
	);
}
