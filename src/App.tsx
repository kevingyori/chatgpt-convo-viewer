import {
	DockviewDefaultTab,
	DockviewReact,
	type DockviewReadyEvent,
} from "dockview";
import { useEffect } from "react";
import { Chat } from "./features/chat";
import { Conversations } from "./features/conversations";
import { Dockview } from "./features/dockview";
import { Search } from "./features/search";

export default function App() {
	return (
		<Dockview.Provider>
			<Conversations.Provider>
				<Search.Provider>
					<Chat.Provider>
						<AppShell />
					</Chat.Provider>
				</Search.Provider>
			</Conversations.Provider>
		</Dockview.Provider>
	);
}

function AppShell() {
	const { state, actions } = Dockview.useDockview();

	const dockviewComponents = {
		conversations: Conversations.Panel,
		chat: Chat.Panel,
		search: Search.Panel,
	};

	const handleDockReady = (event: DockviewReadyEvent) => {
		if (state.ready) return;
		actions.setReady(true);
		actions.setApi(event.api);

		const conversationsPanel = event.api.addPanel({
			id: "conversations",
			component: "conversations",
			title: "CONVERSATIONS",
		});
		const searchPanel = event.api.addPanel({
			id: "search",
			component: "search",
			title: "SEARCH",
			position: {
				referencePanel: "conversations",
				direction: "within",
				index: 1,
			},
			inactive: true,
		});
		const chatPanel = event.api.addPanel({
			id: "chat",
			component: "chat",
			title: "CHAT",
			position: {
				referencePanel: "conversations",
				direction: "right",
			},
			initialWidth: 460,
		});

		actions.setPanels({
			conversations: conversationsPanel,
			search: searchPanel,
			chat: chatPanel,
		});
	};

	useEffect(() => {
		if (!state.ready) return;
		const root = document.querySelector(".dockview-host");
		if (!root || !("ontouchstart" in window)) return;

		let dragTab: HTMLElement | null = null;
		let dragTarget: Element | null = null;
		let dragData: DataTransfer | null = null;
		let startX = 0;
		let startY = 0;
		let dragging = false;

		const resetDrag = () => {
			dragTab = null;
			dragTarget = null;
			dragData = null;
			dragging = false;
			startX = 0;
			startY = 0;
		};

		const createDataTransfer = () => {
			try {
				return new DataTransfer();
			} catch {
				return null;
			}
		};

		const createDragEvent = (type: string, event: PointerEvent) => {
			const dataTransfer = dragData;
			try {
				return new DragEvent(type, {
					bubbles: true,
					cancelable: true,
					dataTransfer,
					clientX: event.clientX,
					clientY: event.clientY,
				});
			} catch {
				const fallbackEvent = new Event(type, {
					bubbles: true,
					cancelable: true,
				}) as DragEvent;
				Object.defineProperty(fallbackEvent, "dataTransfer", {
					value: dataTransfer,
				});
				Object.defineProperty(fallbackEvent, "clientX", {
					value: event.clientX,
				});
				Object.defineProperty(fallbackEvent, "clientY", {
					value: event.clientY,
				});
				return fallbackEvent;
			}
		};

		const startDrag = (event: PointerEvent) => {
			if (!dragTab) return;
			dragData = createDataTransfer();
			const dragStartEvent = createDragEvent("dragstart", event);
			dragTab.dispatchEvent(dragStartEvent);
			dragging = !dragStartEvent.defaultPrevented;
			if (!dragging) {
				resetDrag();
			}
		};

		const handlePointerDown = (event: Event) => {
			const pointerEvent = event as PointerEvent;
			if (pointerEvent.pointerType !== "touch") return;
			const target = pointerEvent.target as Element | null;
			const tab = target?.closest(".dv-tab");
			if (!tab) return;
			dragTab = tab as HTMLElement;
			startX = pointerEvent.clientX;
			startY = pointerEvent.clientY;
		};

		const handlePointerMove = (event: Event) => {
			const pointerEvent = event as PointerEvent;
			if (!dragTab) return;
			const deltaX = Math.abs(pointerEvent.clientX - startX);
			const deltaY = Math.abs(pointerEvent.clientY - startY);
			const threshold = 6;
			if (!dragging) {
				if (deltaX < threshold && deltaY < threshold) return;
				startDrag(pointerEvent);
			}
			if (!dragging) return;
			pointerEvent.preventDefault();
			const target = document.elementFromPoint(
				pointerEvent.clientX,
				pointerEvent.clientY,
			);
			if (!target) return;
			if (dragTarget && dragTarget !== target) {
				dragTarget.dispatchEvent(createDragEvent("dragleave", pointerEvent));
			}
			if (dragTarget !== target) {
				target.dispatchEvent(createDragEvent("dragenter", pointerEvent));
				dragTarget = target;
			}
			target.dispatchEvent(createDragEvent("dragover", pointerEvent));
		};

		const endDrag = (event: Event) => {
			const pointerEvent = event as PointerEvent;
			if (!dragTab) return;
			if (dragging) {
				pointerEvent.preventDefault();
				if (dragTarget) {
					dragTarget.dispatchEvent(createDragEvent("drop", pointerEvent));
				}
				dragTab.dispatchEvent(createDragEvent("dragend", pointerEvent));
			}
			resetDrag();
		};

		root.addEventListener("pointerdown", handlePointerDown, { passive: true });
		root.addEventListener("pointermove", handlePointerMove, { passive: false });
		root.addEventListener("pointerup", endDrag, { passive: false });
		root.addEventListener("pointercancel", endDrag, { passive: false });

		return () => {
			root.removeEventListener("pointerdown", handlePointerDown);
			root.removeEventListener("pointermove", handlePointerMove);
			root.removeEventListener("pointerup", endDrag);
			root.removeEventListener("pointercancel", endDrag);
		};
	}, [state.ready]);

	return (
		<div className="min-h-screen">
			<main className="mx-auto px-3 py-4 sm:px-4 sm:py-5 h-full">
				<section className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-[11px] uppercase tracking-[0.25em] text-slate-500">
					<span className="text-slate-300 font-semibold">CHATGPT EXPORT</span>
					<span className="text-slate-500">/</span>
					<span className="text-slate-400">CONVERSATIONS.JSON VIEWER</span>
				</section>

				<section className="mt-3">
					<div className="dockview-host">
						<DockviewReact
							className="dockview-theme-dark border border-slate-800 dockview-host__inner"
							onReady={handleDockReady}
							components={dockviewComponents}
							defaultTabComponent={(props) => (
								<DockviewDefaultTab {...props} hideClose />
							)}
						/>
					</div>
				</section>
			</main>
		</div>
	);
}
