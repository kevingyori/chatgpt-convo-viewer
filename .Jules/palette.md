# Palette's Journal

## 2026-02-03 - TUI Input Clearing
**Learning:** In dense TUI layouts, search and filter inputs often lack explicit "clear" actions. Adding a conditional `[x]` button next to the input (when text is present) significantly improves usability without cluttering the interface. Using discrete "icon buttons" with borders matches the blocky TUI aesthetic better than integrated "X" icons inside the input field.
**Action:** When creating TUI-style inputs, always consider reserving space (flex-layout) for a conditional clear button that appears adjacent to the input field.
