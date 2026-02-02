import { SearchProvider, useSearch } from "./search-context";
import { SearchHeader } from "./search-header";
import { SearchInput } from "./search-input";
import { SearchPanel } from "./search-panel";
import { SearchResults } from "./search-results";

export const Search = {
	Provider: SearchProvider,
	Panel: SearchPanel,
	Header: SearchHeader,
	Input: SearchInput,
	Results: SearchResults,
	useSearch,
};
