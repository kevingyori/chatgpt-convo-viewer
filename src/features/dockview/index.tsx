import type { DockviewApi, IDockviewPanel } from "dockview";
import {
	createContext,
	type ReactNode,
	useContext,
	useRef,
	useState,
} from "react";

type DockviewState = {
	ready: boolean;
};

type DockviewActions = {
	setReady: (value: boolean) => void;
	setApi: (api: DockviewApi | null) => void;
	setPanels: (panels: DockviewPanels) => void;
	popoutChat: () => void;
	popoutSearch: () => void;
	focusChat: () => void;
};

type DockviewPanels = {
	conversations: IDockviewPanel | null;
	chat: IDockviewPanel | null;
	search: IDockviewPanel | null;
};

type DockviewMeta = {
	apiRef: React.MutableRefObject<DockviewApi | null>;
	panelsRef: React.MutableRefObject<DockviewPanels>;
};

type DockviewContextValue = {
	state: DockviewState;
	actions: DockviewActions;
	meta: DockviewMeta;
};

const DockviewContext = createContext<DockviewContextValue | null>(null);

function useDockview() {
	const context = useContext(DockviewContext);
	if (!context) {
		throw new Error(
			"Dockview components must be used within <Dockview.Provider>.",
		);
	}
	return context;
}

type DockviewProviderProps = {
	children: ReactNode;
};

function DockviewProvider({ children }: DockviewProviderProps) {
	const [ready, setReady] = useState(false);
	const apiRef = useRef<DockviewApi | null>(null);
	const panelsRef = useRef<DockviewPanels>({
		conversations: null,
		chat: null,
		search: null,
	});

	const actions: DockviewActions = {
		setReady,
		setApi: (api) => {
			apiRef.current = api;
		},
		setPanels: (panels) => {
			panelsRef.current = panels;
		},
		popoutChat: () => {
			if (!apiRef.current || !panelsRef.current.chat) return;
			apiRef.current.addPopoutGroup(panelsRef.current.chat);
		},
		popoutSearch: () => {
			if (!apiRef.current || !panelsRef.current.search) return;
			apiRef.current.addPopoutGroup(panelsRef.current.search);
		},
		focusChat: () => {
			panelsRef.current.chat?.api.setActive();
		},
	};

	return (
		<DockviewContext.Provider
			value={{
				state: { ready },
				actions,
				meta: { apiRef, panelsRef },
			}}
		>
			{children}
		</DockviewContext.Provider>
	);
}

export const Dockview = {
	Provider: DockviewProvider,
	useDockview,
};
