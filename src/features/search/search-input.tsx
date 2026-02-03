import { Toolbar } from "../../components/toolbar";
import { useSearch } from "./search-context";

export function SearchInput() {
	const {
		state: { query },
		actions: { setQuery },
	} = useSearch();

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
					aria-label="Search all messages"
					value={query}
					onChange={(event) => setQuery(event.target.value)}
					placeholder="Search all messages"
					className="flex-1 py-1"
				/>
				{query ? (
					<Toolbar.IconButton
						onClick={() => setQuery("")}
						aria-label="Clear search"
						className="hover:border-rose-400/70"
					>
						<span className="text-rose-300">[x]</span>
					</Toolbar.IconButton>
				) : null}
			</Toolbar.Row>
		</Toolbar>
	);
}
