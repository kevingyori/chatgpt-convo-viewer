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
					value={globalFilter}
					onChange={(event) => setGlobalFilter(event.target.value)}
					placeholder="Filter conversations"
					aria-label="Filter conversations"
					className="w-full py-1"
				/>
			</Toolbar.Row>
		</Toolbar>
	);
}
