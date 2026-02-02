import { Toolbar } from '../../components/toolbar'
import { Conversations } from '../conversations'
import { Dockview } from '../dockview'
import { useChat } from './chat-context'

export function ChatHeader() {
  const {
    state: { selectedConversation },
  } = Conversations.useConversations()
  const {
    state: { copied },
    actions: { copyContext },
  } = useChat()
  const {
    actions: { popoutChat },
  } = Dockview.useDockview()

  return (
    <Toolbar
      className="flex items-center justify-between gap-2 text-[11px] text-slate-500"
      rowClass="flex items-center gap-2 h-7"
    >
      <Toolbar.Row className="min-w-0">
        <Toolbar.Text className="text-[10px] uppercase tracking-[0.2em] truncate">
          {selectedConversation?.title || 'Chat'}
        </Toolbar.Text>
      </Toolbar.Row>
      {selectedConversation ? (
        <Toolbar.Row>
          <Toolbar.Button
            onClick={copyContext}
            className="interactive hover:border-cyan-400/70 hover:text-white transition"
          >
            <span className="text-cyan-300">[→]</span>
            {copied ? 'Copied' : 'Copy'}
          </Toolbar.Button>
          <Toolbar.Button
            onClick={popoutChat}
            className="interactive hover:border-cyan-400/70 hover:text-white transition"
          >
            <span className="text-cyan-300">[^]</span>
            Popout
          </Toolbar.Button>
        </Toolbar.Row>
      ) : null}
    </Toolbar>
  )
}
