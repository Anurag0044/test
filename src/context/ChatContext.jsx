import { createContext, useState, useContext } from 'react';

const ChatContext = createContext({});

export function ChatProvider({ children }) {
  const [chatOpen, setChatOpen] = useState(false);
  const [analyzerContext, setAnalyzerContext] = useState('');

  return (
    <ChatContext.Provider value={{ chatOpen, setChatOpen, analyzerContext, setAnalyzerContext }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  return useContext(ChatContext);
}
