import { Toolbar } from "../../components/toolbar";
import { useConversations } from "./conversations-context";

export function ConversationsFilter() {
	const {
		state: { globalFilter },
		actions: { setGlobalFilter },
	} = useConversations();

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
					aria-label="Filter conversations"
					value={globalFilter}
					onChange={(event) => setGlobalFilter(event.target.value)}
					placeholder="Filter conversations"
					className="flex-1 py-1"
				/>
				{globalFilter ? (
					<Toolbar.IconButton
						onClick={() => setGlobalFilter("")}
						aria-label="Clear filter"
						className="hover:border-rose-400/70"
					>
						<span className="text-rose-300">[x]</span>
					</Toolbar.IconButton>
				) : null}
			</Toolbar.Row>
		</Toolbar>
	);
}
