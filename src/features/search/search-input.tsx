import { useRef } from "react";
import { Toolbar } from "../../components/toolbar";
import { useSearch } from "./search-context";

export function SearchInput() {
	const {
		state: { query },
		actions: { setQuery },
	} = useSearch();
	const inputRef = useRef<HTMLInputElement>(null);

	const handleClear = () => {
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
					aria-label="Search all messages"
					value={query}
					onChange={(event) => setQuery(event.target.value)}
					placeholder="Search all messages"
					className="flex-1 py-1"
				/>
				{query ? (
					<Toolbar.Button
						onClick={handleClear}
						aria-label="Clear search"
						className="hover:text-rose-400 transition-colors"
					>
						[x]
					</Toolbar.Button>
				) : null}
			</Toolbar.Row>
		</Toolbar>
	);
}
