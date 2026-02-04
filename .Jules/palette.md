## 2025-02-14 - Accessible Search Pattern
**Learning:** Adding `aria-label` to icon-only or placeholder-only inputs is critical. Decorative text icons (like `[?]`) create screen reader noise unless hidden with `aria-hidden="true"`.
**Action:** When adding helper icons, always hide them from AT. When adding clear buttons, ensure focus returns to the input field to preserve the user's typing flow.
