## 2024-05-23 - Chat Transcript Rendering
**Learning:** Rendering search matches in a long list of messages by filtering the global matches array for each message is O(N*M). This becomes a major bottleneck when search results are abundant.
**Action:** Pre-calculate a lookup map (e.g. `Map<MessageID, Match[]>`) outside the render loop using `useMemo` to reduce lookup time to O(1).

## 2024-05-24 - Chat List Re-rendering
**Learning:** In a long list of messages, changing the "active" search match causes a global re-render if the active match object is passed to all items, effectively defeating `React.memo`.
**Action:** Extract the list item to a memoized component and compute a specific `activeMatchForItem` prop in the parent (passing `null` or a stable value for unaffected items) to isolate updates to only the affected components.
