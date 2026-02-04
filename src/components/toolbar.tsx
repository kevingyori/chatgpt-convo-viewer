import {
	type ButtonHTMLAttributes,
	createContext,
	forwardRef,
	type HTMLAttributes,
	type InputHTMLAttributes,
	type ReactNode,
	useContext,
} from "react";

type ToolbarContextValue = {
	state: Record<string, never>;
	actions: Record<string, never>;
	meta: {
		rowClass: string;
		buttonClass: string;
		iconButtonClass: string;
		inputClass: string;
		textClass: string;
	};
};

const ToolbarContext = createContext<ToolbarContextValue | null>(null);

function useToolbarContext() {
	const context = useContext(ToolbarContext);
	if (!context) {
		throw new Error("Toolbar components must be used within <Toolbar>.");
	}
	return context;
}

type ToolbarProps = {
	children: ReactNode;
	className?: string;
	rowClass?: string;
	buttonClass?: string;
	iconButtonClass?: string;
	inputClass?: string;
	textClass?: string;
};

type ToolbarRowProps = HTMLAttributes<HTMLDivElement>;
type ToolbarButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;
type ToolbarInputProps = InputHTMLAttributes<HTMLInputElement>;
type ToolbarTextProps = HTMLAttributes<HTMLSpanElement>;

function ToolbarRoot({
	children,
	className,
	rowClass = "flex items-center gap-3 h-7",
	buttonClass = "inline-flex h-full items-center gap-1.5 border border-slate-700 bg-slate-950 px-2 text-[10px] uppercase tracking-[0.2em] text-slate-300 hover:border-cyan-400/70",
	iconButtonClass = "inline-flex h-full w-6 items-center justify-center border border-slate-700 bg-slate-950 text-[11px] text-cyan-300 hover:border-cyan-400/70",
	inputClass = "border border-slate-800 bg-slate-950/80 px-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400/70",
	textClass = "text-[11px] text-slate-500",
}: ToolbarProps) {
	const value = {
		state: {},
		actions: {},
		meta: {
			rowClass,
			buttonClass,
			iconButtonClass,
			inputClass,
			textClass,
		},
	};
	return (
		<ToolbarContext.Provider value={value}>
			<div className={className}>{children}</div>
		</ToolbarContext.Provider>
	);
}

function ToolbarRow({ className, ...props }: ToolbarRowProps) {
	const {
		meta: { rowClass },
	} = useToolbarContext();
	return (
		<div
			{...props}
			className={className ? `${rowClass} ${className}` : rowClass}
		/>
	);
}

function ToolbarButton({ className, ...props }: ToolbarButtonProps) {
	const {
		meta: { buttonClass },
	} = useToolbarContext();
	return (
		<button
			{...props}
			type={props.type ?? "button"}
			className={className ? `${buttonClass} ${className}` : buttonClass}
		/>
	);
}

function ToolbarIconButton({ className, ...props }: ToolbarButtonProps) {
	const {
		meta: { iconButtonClass },
	} = useToolbarContext();
	return (
		<button
			{...props}
			type={props.type ?? "button"}
			className={
				className ? `${iconButtonClass} ${className}` : iconButtonClass
			}
		/>
	);
}

const ToolbarInput = forwardRef<HTMLInputElement, ToolbarInputProps>(
	({ className, ...props }, ref) => {
		const {
			meta: { inputClass },
		} = useToolbarContext();
		return (
			<input
				ref={ref}
				{...props}
				className={className ? `${inputClass} ${className}` : inputClass}
			/>
		);
	},
);
ToolbarInput.displayName = "Toolbar.Input";

function ToolbarText({ className, ...props }: ToolbarTextProps) {
	const {
		meta: { textClass },
	} = useToolbarContext();
	return (
		<span
			{...props}
			className={className ? `${textClass} ${className}` : textClass}
		/>
	);
}

export const Toolbar = Object.assign(ToolbarRoot, {
	Row: ToolbarRow,
	Button: ToolbarButton,
	IconButton: ToolbarIconButton,
	Input: ToolbarInput,
	Text: ToolbarText,
});
