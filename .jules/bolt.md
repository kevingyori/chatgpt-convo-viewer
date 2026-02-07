## 2024-05-23 - Chat Transcript Rendering
**Learning:** Rendering search matches in a long list of messages by filtering the global matches array for each message is O(N*M). This becomes a major bottleneck when search results are abundant.
**Action:** Pre-calculate a lookup map (e.g. `Map<MessageID, Match[]>`) outside the render loop using `useMemo` to reduce lookup time to O(1).

## 2024-05-24 - Chat Transcript Re-renders
**Learning:** Even with optimized match lookup, passing active match state down to inline list items triggers re-renders for every message (O(N)) on every navigation step.
**Action:** Extract list items (messages) to separate `React.memo` components. Pass only the relevant active state (or `null` if not active) to prevent unnecessary re-renders of unaffected items.
