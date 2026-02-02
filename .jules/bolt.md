## 2024-05-23 - Chat Transcript Rendering
**Learning:** Rendering search matches in a long list of messages by filtering the global matches array for each message is O(N*M). This becomes a major bottleneck when search results are abundant.
**Action:** Pre-calculate a lookup map (e.g. `Map<MessageID, Match[]>`) outside the render loop using `useMemo` to reduce lookup time to O(1).
