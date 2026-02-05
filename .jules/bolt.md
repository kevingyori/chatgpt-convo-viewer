## 2024-05-23 - Chat Transcript Rendering
**Learning:** Rendering search matches in a long list of messages by filtering the global matches array for each message is O(N*M). This becomes a major bottleneck when search results are abundant.
**Action:** Pre-calculate a lookup map (e.g. `Map<MessageID, Match[]>`) outside the render loop using `useMemo` to reduce lookup time to O(1).

## 2024-05-24 - Chat Message Re-renders
**Learning:** Rendering messages inline within `ChatTranscript` causes all message nodes to re-render whenever the parent state (like `activeMatchIndex`) changes, even if the message itself hasn't changed.
**Action:** Extract list items into `React.memo` components and pass only relevant props (e.g., pass `activeMatch` only if it belongs to that specific message) to ensure O(1) updates for interactions like "Next Match".
