## 2026-02-06 - ASCII-based UI Accessibility
**Learning:** ASCII characters used as icons (e.g., `[<]`, `[?]`) are read literally by screen readers (e.g., "Left bracket less than right bracket"), creating a noisy and confusing experience.
**Action:** Always wrap decorative ASCII tokens in a `span` with `aria-hidden="true"`. For interactive buttons using ASCII art, provide a descriptive `aria-label` (e.g., "Previous match") to override the text content.
