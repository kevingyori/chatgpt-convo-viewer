import {
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { useConversations } from "./conversations-context";

export function ConversationsTable() {
	const {
		state: { rows, sorting, globalFilter, selectedIndex, isDragging },
		actions: {
			setSorting,
			setGlobalFilter,
			setIsDragging,
			onDrop,
			onSelectRow,
		},
		meta,
	} = useConversations();

	const table = useReactTable({
		data: rows,
		columns: meta.columns,
		state: {
			sorting,
			globalFilter,
		},
		onSortingChange: setSorting,
		onGlobalFilterChange: setGlobalFilter,
		globalFilterFn: meta.globalFilterFn,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getSortedRowModel: getSortedRowModel(),
	});

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: Drag and drop zone
		<div
			className="relative flex-1 border border-slate-800 bg-slate-950/50 overflow-hidden"
			onDragEnter={(event) => {
				event.preventDefault();
				setIsDragging(true);
			}}
			onDragOver={(event) => {
				event.preventDefault();
				setIsDragging(true);
			}}
			onDragLeave={(event) => {
				if (event.currentTarget === event.target) {
					setIsDragging(false);
				}
			}}
			onDrop={onDrop}
		>
			{isDragging ? (
				<div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 border-2 border-dashed border-cyan-500">
					<div className="text-xl font-bold tracking-widest text-cyan-400 uppercase">
						Drop file to load
					</div>
				</div>
			) : null}
			<div className="overflow-auto h-full">
				<table className="w-full text-[11px]">
					<thead className="bg-slate-900/80 text-[10px] uppercase tracking-[0.2em] text-slate-500">
						{table.getHeaderGroups().map((headerGroup) => (
							<tr key={headerGroup.id}>
								{headerGroup.headers.map((header) => {
									const sorted = header.column.getIsSorted();
									return (
										<th
											key={header.id}
											className="px-2 py-1 text-left font-semibold cursor-pointer select-none"
											onClick={header.column.getToggleSortingHandler()}
										>
											<span className="inline-flex items-center gap-1.5">
												{header.isPlaceholder
													? null
													: flexRender(
															header.column.columnDef.header,
															header.getContext(),
														)}
												{sorted === "asc" ? "↑" : null}
												{sorted === "desc" ? "↓" : null}
											</span>
										</th>
									);
								})}
							</tr>
						))}
					</thead>
					<tbody className="divide-y divide-slate-900/80">
						{table.getRowModel().rows.length > 0 ? (
							table.getRowModel().rows.map((row) => (
								<tr
									key={row.id}
									className={
										selectedIndex === row.original.sourceIndex
											? "bg-slate-900/80"
											: "hover:bg-slate-900/60 transition cursor-pointer"
									}
									onClick={() => onSelectRow(row.original.sourceIndex)}
								>
									{row.getVisibleCells().map((cell) => (
										<td key={cell.id} className="px-2 py-1 text-slate-200">
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</td>
									))}
								</tr>
							))
						) : (
							<tr>
								<td
									colSpan={meta.columns.length}
									className="px-3 py-6 text-center text-slate-500 text-[11px]"
								>
									{rows.length === 0
										? "Load a file to see conversations."
										: "No conversations match your filter."}
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}
