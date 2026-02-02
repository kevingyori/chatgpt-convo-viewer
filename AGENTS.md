<INSTRUCTIONS>
## Bloomberg TUI Style
- Favor a Bloomberg terminal-inspired look: dense layout, high-contrast dark backgrounds, and subtle neon accents.
- Use ASCII-like tokens for icons and labels (examples: `[+]`, `[?]`, `[x]`, `>>`).
- Prefer square edges and sharp borders over rounded corners.
- Keep text compact (small sizes, tight spacing) while preserving readability.

## Spacing Guide
- Standard button sizing: `text-[10px]`, `px-2`, `py-0.5`, `gap-1.5` for icon+label buttons.
- Align buttons to a shared visual height by avoiding mixed `py-1` and `py-0.5` in the same row.
- Use `h-6` square buttons only for icon-only controls (e.g., `?` tooltip).

## UI Components
- Prefer small, reusable UI components for toolbar controls instead of repeating long class strings.
- Keep component APIs minimal (className overrides, common base classes) to enforce consistent sizing.
</INSTRUCTIONS>
