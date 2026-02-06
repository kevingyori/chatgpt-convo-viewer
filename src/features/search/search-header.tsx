import { Toolbar } from "../../components/toolbar";
import { Dockview } from "../dockview";
import { useSearch } from "./search-context";

export function SearchHeader() {
	const {
		state: { status, totalMessages },
	} = useSearch();
	const {
		actions: { popoutSearch },
	} = Dockview.useDockview();

	return (
		<Toolbar
			className="flex items-center justify-between gap-2 text-[11px] text-slate-500"
			rowClass="flex items-center gap-2 h-7"
		>
			<Toolbar.Row>
				<Toolbar.Text className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
					Full Text Search
				</Toolbar.Text>
			</Toolbar.Row>
			<Toolbar.Row className="text-[10px] text-slate-500">
				<Toolbar.Button
					onClick={popoutSearch}
					className="hover:border-cyan-400/70 hover:text-white transition"
				>
					<span className="text-cyan-300" aria-hidden="true">
						[^]
					</span>
					Popout
				</Toolbar.Button>
				<span>
					{status === "building"
						? "Indexing..."
						: status === "ready"
							? `${totalMessages.toLocaleString("en-US")} msgs`
							: "Idle"}
				</span>
			</Toolbar.Row>
		</Toolbar>
	);
}
