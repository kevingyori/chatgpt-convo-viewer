## 2024-05-23 - Chat Transcript Rendering
**Learning:** Rendering search matches in a long list of messages by filtering the global matches array for each message is O(N*M). This becomes a major bottleneck when search results are abundant.
**Action:** Pre-calculate a lookup map (e.g. `Map<MessageID, Match[]>`) outside the render loop using `useMemo` to reduce lookup time to O(1).

## 2024-05-24 - Chat Transcript List Virtualization
**Learning:** Changing a global `activeMatchIndex` caused the entire message list to re-render because the match highlighting logic was inline. By extracting `ChatMessage` and passing `activeMatch` only to the affected message, we reduced re-renders from O(N) to O(1) (only previous and current active match update).
**Action:** Extract list items to `React.memo` components and ensure props (like `activeMatch`) are passed selectively or stable (using `EMPTY_MATCHES` constant) to avoid unnecessary updates.
