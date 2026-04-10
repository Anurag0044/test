import { useChat } from '../context/ChatContext';
import AIChatbot from './AIChatbot';

export default function GlobalChatbot() {
  const { chatOpen, setChatOpen, analyzerContext } = useChat();

  return (
    <>
      {/* AI Chatbot FAB — always visible globally */}
      <button className="chatbot-fab global-fab" onClick={() => setChatOpen(true)} aria-label="Open AI Assistant">
        <span className="material-icons-outlined">smart_toy</span>
        <span className="chatbot-fab-badge"></span>
      </button>

      {/* AI Chatbot Panel */}
      <AIChatbot
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        analyzerContext={analyzerContext}
      />
    </>
  );
}
