import type { IDockviewPanelProps } from "dockview";
import { SearchHeader } from "./search-header";
import { SearchInput } from "./search-input";
import { SearchResults } from "./search-results";

export function SearchPanel(_props: IDockviewPanelProps) {
	return (
		<div className="h-full flex flex-col gap-2 p-2">
			<SearchHeader />
			<SearchInput />
			<SearchResults />
		</div>
	);
}
