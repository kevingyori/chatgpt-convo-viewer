## 2024-05-22 - ASCII Tokens and Accessibility
**Learning:** The project relies heavily on ASCII characters (e.g., `[+]`, `[x]`, `[?]`) for iconography to mimic a Bloomberg/TUI aesthetic. While visually distinct, these create significant noise for screen readers (e.g., reading "Left bracket plus right bracket").
**Action:** Always wrap decorative ASCII tokens in `aria-hidden="true"` and ensure the interactive element has a proper `aria-label` or accessible text description.
