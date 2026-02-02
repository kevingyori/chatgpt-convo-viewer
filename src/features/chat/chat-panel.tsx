import type { IDockviewPanelProps } from 'dockview'
import { ChatHeader } from './chat-header'
import { ChatSearch } from './chat-search'
import { ChatTranscript } from './chat-transcript'

export function ChatPanel(_props: IDockviewPanelProps) {
  return (
    <div className="h-full flex flex-col gap-2 p-2">
      <ChatHeader />
      <ChatSearch />
      <ChatTranscript />
    </div>
  )
}
