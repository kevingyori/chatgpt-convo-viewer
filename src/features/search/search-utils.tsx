export function renderHighlightedSnippet(snippet: string, query: string) {
  const trimmed = query.trim()
  if (!trimmed) return snippet
  const lowerSnippet = snippet.toLowerCase()
  const lowerQuery = trimmed.toLowerCase()
  const parts: Array<{ text: string; match: boolean }> = []

  let index = 0
  while (index < snippet.length) {
    const found = lowerSnippet.indexOf(lowerQuery, index)
    if (found === -1) {
      parts.push({ text: snippet.slice(index), match: false })
      break
    }
    if (found > index) {
      parts.push({ text: snippet.slice(index, found), match: false })
    }
    parts.push({
      text: snippet.slice(found, found + lowerQuery.length),
      match: true,
    })
    index = found + lowerQuery.length
  }

  return parts.map((part, idx) =>
    part.match ? (
      <span key={`${part.text}-${idx}`} className="search-highlight">
        {part.text}
      </span>
    ) : (
      <span key={`${part.text}-${idx}`}>{part.text}</span>
    ),
  )
}
