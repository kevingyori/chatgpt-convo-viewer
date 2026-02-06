import { useEffect, useRef, useState } from "react";
import { HiddenInput } from "../../components/hidden-input";
import { Toolbar } from "../../components/toolbar";
import { numberFormat } from "../../lib/format";
import { useConversations } from "./conversations-context";

export function ConversationsHeader() {
	const {
		state: { isDragging, fileName, loading, error, stats },
		actions: { onFileChange, onClear },
	} = useConversations();
	const [isHelpOpen, setIsHelpOpen] = useState(false);
	const helpRef = useRef<HTMLDivElement | null>(null);
	const inputRef = useRef<HTMLInputElement | null>(null);

	useEffect(() => {
		if (!isHelpOpen) return;
		const handleOutside = (event: MouseEvent | TouchEvent) => {
			const target = event.target;
			if (!(target instanceof Node)) return;
			if (!helpRef.current?.contains(target)) {
				setIsHelpOpen(false);
			}
		};
		document.addEventListener("mousedown", handleOutside);
		document.addEventListener("touchstart", handleOutside);
		return () => {
			document.removeEventListener("mousedown", handleOutside);
			document.removeEventListener("touchstart", handleOutside);
		};
	}, [isHelpOpen]);

	const dragClass = isDragging ? " border-cyan-400/80 bg-cyan-500/10" : "";

	return (
		<Toolbar className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
			<Toolbar.Row>
				<Toolbar.Button
					className={`cursor-pointer${dragClass}`}
					onClick={() => inputRef.current?.click()}
				>
					<span className="text-cyan-300" aria-hidden="true">
						[+]
					</span>
					<span>Load file</span>
				</Toolbar.Button>
				<div className="relative" ref={helpRef}>
					<Toolbar.IconButton
						aria-label="How to export conversations"
						aria-expanded={isHelpOpen}
						onClick={() => setIsHelpOpen((open) => !open)}
					>
						?
					</Toolbar.IconButton>
					{isHelpOpen ? (
						<div className="absolute left-0 top-8 z-10 w-72 border border-slate-700 bg-slate-950/95 p-3 text-[11px] text-slate-200 shadow-lg">
							<div className="font-semibold text-cyan-200">Export steps</div>
							<ol className="mt-2 list-decimal space-y-1 pl-4 text-slate-300">
								<li>ChatGPT Settings &gt; Data controls</li>
								<li>Export data</li>
								<li>Confirm export</li>
								<li>Download from email</li>
								<li>Unzip the download</li>
								<li>Upload conversations.json from the unzipped folder</li>
							</ol>
						</div>
					) : null}
				</div>
				<HiddenInput
					ref={inputRef}
					type="file"
					accept=".json,application/json"
					onChange={onFileChange}
				/>
				<Toolbar.Text>{fileName ?? "No file loaded"}</Toolbar.Text>
				{loading ? (
					<Toolbar.Text className="text-cyan-300">Parsing…</Toolbar.Text>
				) : null}
				{error ? (
					<Toolbar.Text className="text-rose-300">{error}</Toolbar.Text>
				) : null}
			</Toolbar.Row>
			<Toolbar.Row>
				<Toolbar.Button
					onClick={onClear}
					className="gap-2 hover:border-rose-400/70 hover:text-white transition"
				>
					<span className="text-rose-300" aria-hidden="true">
						[x]
					</span>
					Clear
				</Toolbar.Button>
				<Toolbar.Text>
					Total:{" "}
					<span className="text-slate-200">
						{numberFormat.format(stats.total)}
					</span>{" "}
					| Msg:{" "}
					<span className="text-slate-200">
						{numberFormat.format(stats.totalMessages)}
					</span>{" "}
					| Archived:{" "}
					<span className="text-slate-200">
						{numberFormat.format(stats.archived)}
					</span>
				</Toolbar.Text>
			</Toolbar.Row>
		</Toolbar>
	);
}
