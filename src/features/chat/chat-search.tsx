import { useRef } from "react";
import { Toolbar } from "../../components/toolbar";
import { useChat } from "./chat-context";

export function ChatSearch() {
	const {
		state: { query, matches, activeMatchIndex },
		actions: { setQuery, prevMatch, nextMatch },
	} = useChat();

	const inputRef = useRef<HTMLInputElement>(null);

	const clearSearch = () => {
		setQuery("");
		inputRef.current?.focus();
	};

	return (
		<Toolbar
			className="flex items-center gap-2"
			rowClass="flex items-center gap-2 h-7"
		>
			<Toolbar.Row className="w-full">
				<span className="text-slate-500" aria-hidden="true">
					[?]
				</span>
				<Toolbar.Input
					ref={inputRef}
					value={query}
					onChange={(event) => setQuery(event.target.value)}
					placeholder="Search this chat"
					aria-label="Search this chat"
					className="interactive w-full py-1"
				/>
				{query && (
					<Toolbar.Button
						onClick={clearSearch}
						className="px-1 text-slate-500 hover:text-white border-none bg-transparent"
						aria-label="Clear search"
					>
						[x]
					</Toolbar.Button>
				)}
				<div className="flex items-center gap-1 text-[10px] text-slate-500 whitespace-nowrap">
					<Toolbar.Button
						onClick={prevMatch}
						className="interactive px-1.5 tracking-normal hover:border-cyan-400/70 hover:text-white transition"
						disabled={matches.length === 0}
						aria-label="Previous match"
					>
						{"[<]"}
					</Toolbar.Button>
					<Toolbar.Button
						onClick={nextMatch}
						className="interactive px-1.5 tracking-normal hover:border-cyan-400/70 hover:text-white transition"
						disabled={matches.length === 0}
						aria-label="Next match"
					>
						{"[>]"}
					</Toolbar.Button>
					<span className="text-slate-500">
						{matches.length === 0
							? "0/0"
							: `${activeMatchIndex + 1}/${matches.length}`}
					</span>
				</div>
			</Toolbar.Row>
		</Toolbar>
	);
}
