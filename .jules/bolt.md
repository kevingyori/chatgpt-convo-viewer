## 2024-05-23 - Chat Transcript Rendering
**Learning:** Rendering search matches in a long list of messages by filtering the global matches array for each message is O(N*M). This becomes a major bottleneck when search results are abundant.
**Action:** Pre-calculate a lookup map (e.g. `Map<MessageID, Match[]>`) outside the render loop using `useMemo` to reduce lookup time to O(1).

## 2026-02-06 - Search Match Navigation Performance
**Learning:** Navigating through search results (`activeMatchIndex`) causes the entire chat transcript to re-render because `activeMatch` changes, even though only two messages (previous and next active) need updates.
**Action:** Extract `ChatMessage` into a memoized component. Pass `activeMatch` only if it belongs to the message (otherwise `null`), ensuring stable props for the majority of messages during navigation.
