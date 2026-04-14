import { useState, useRef, useEffect, useCallback } from 'react';
import { generateMedicalResponse } from '../services/geminiService';
import './AIChatbot.css';

// ── Typing indicator ────────────────────────────────────────────
const THINKING_STAGES = [
  'Analyzing your question...',
  'Querying medical knowledge...',
  'Checking safety data...',
  'Preparing response...',
];

// ── Welcome message ─────────────────────────────────────────────
const WELCOME = {
  role: 'ai',
  type: 'structured',
  content: {
    summary: 'Hello! I\'m MedIntel AI 👋 I can help you understand medications, check drug interactions, find affordable generic alternatives, and answer clinical questions.',
    alternatives: [],
    costInsight: '',
    warning: '',
    disclaimer: '',
  },
  timestamp: new Date(),
};

// ── Quick suggestion chips ──────────────────────────────────────
const SUGGESTIONS = [
  'What are alternatives to Dolo 650?',
  'Side effects of Metformin?',
  'Is it safe to take Ibuprofen with Aspirin?',
  'Cheapest antibiotic for throat infection?',
];

// ── SpeechRecognition setup ──────────────────────────────────────
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

// ── Structured AI response renderer ─────────────────────────────
function StructuredResponse({ content }) {
  return (
    <div className="ai-resp">
      {content.summary && (
        <p className="ai-resp-summary">{content.summary}</p>
      )}

      {content.alternatives?.length > 0 && (
        <div className="ai-resp-block ai-resp-alts">
          <div className="ai-resp-label">
            <span className="material-icons-outlined">swap_horiz</span>
            Affordable Alternatives
          </div>
          <div className="ai-resp-pills">
            {content.alternatives.map((a, i) => (
              <span key={i} className="ai-pill">{a}</span>
            ))}
          </div>
        </div>
      )}

      {content.costInsight && (
        <div className="ai-resp-block ai-resp-cost">
          <div className="ai-resp-label">
            <span className="material-icons-outlined">savings</span>
            Cost Insight
          </div>
          <p>{content.costInsight}</p>
        </div>
      )}

      {content.warning && (
        <div className="ai-resp-block ai-resp-warn">
          <div className="ai-resp-label">
            <span className="material-icons-outlined">warning_amber</span>
            Safety Warning
          </div>
          <p>{content.warning}</p>
        </div>
      )}

      {content.disclaimer && (
        <p className="ai-resp-disclaimer">{content.disclaimer}</p>
      )}
    </div>
  );
}

// ── Main AIChatbot component ──────────────────────────────────────
export default function AIChatbot({ analyzerContext = '', isOpen, onClose }) {
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [thinkStage, setThinkStage] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState('');

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const thinkTimer = useRef(null);
  const recognRef = useRef(null);

  // ── Auto scroll ─────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  // ── Focus input on open ─────────────────────────────────────
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 350);
  }, [isOpen]);

  // ── Thinking stage ticker ────────────────────────────────────
  useEffect(() => {
    if (!isThinking) { setThinkStage(0); return; }
    if (thinkStage >= THINKING_STAGES.length) return;
    thinkTimer.current = setTimeout(() => setThinkStage(p => p + 1), 1000);
    return () => clearTimeout(thinkTimer.current);
  }, [isThinking, thinkStage]);

  // ── Cleanup on unmount ───────────────────────────────────────
  useEffect(() => () => {
    clearTimeout(thinkTimer.current);
    recognRef.current?.abort();
  }, []);

  // ── Build history for API ────────────────────────────────────
  const buildHistory = useCallback(() =>
    messages
      .filter(m => m.role !== 'ai' || m.type !== 'structured' || m !== WELCOME)
      .slice(-10)
      .map(m => ({
        role: m.role,
        text: m.role === 'user' ? m.content : (m.content?.summary || ''),
      }))
      .filter(h => h.text),
    [messages]);

  // ── Send message ─────────────────────────────────────────────
  const handleSend = useCallback(async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || isThinking) return;

    recognRef.current?.stop();
    setIsListening(false);
    setInput('');
    setError('');

    setMessages(prev => [...prev, {
      role: 'user', type: 'text', content: trimmed, timestamp: new Date(),
    }]);
    setIsThinking(true);

    try {
      // Run API call and minimum thinking delay in parallel
      // so the UI never rushes — the response only appears after
      // both the API responds AND at least 3 seconds have passed.
      const MIN_THINKING_MS = 3000;
      const [response] = await Promise.all([
        generateMedicalResponse(trimmed, analyzerContext, buildHistory()),
        new Promise((r) => setTimeout(r, MIN_THINKING_MS)),
      ]);
      setMessages(prev => [...prev, {
        role: 'ai', type: 'structured', content: response, timestamp: new Date(),
      }]);
    } catch (err) {
      const errMsg = err.message?.includes('API key')
        ? 'Gemini API key issue. Please check your VITE_GEMINI_API_KEY in the .env file.'
        : 'Connection to Gemini API failed. Please check your internet connection and API key.';
      setError(errMsg);
      setMessages(prev => [...prev, {
        role: 'ai', type: 'structured', timestamp: new Date(),
        content: {
          summary: `I'm having trouble connecting to the AI service. ${errMsg}`,
          alternatives: [], costInsight: '', warning: '',
          disclaimer: 'Always consult a licensed healthcare professional.',
        },
      }]);
    } finally {
      setIsThinking(false);
    }
  }, [input, isThinking, analyzerContext, buildHistory]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // ── Voice input ──────────────────────────────────────────────
  const toggleVoice = useCallback(() => {
    if (!SpeechRecognition) {
      setError('Voice input is not supported in this browser.');
      return;
    }
    if (isListening) {
      recognRef.current?.stop();
      setIsListening(false);
      return;
    }
    const rec = new SpeechRecognition();
    rec.lang = 'en-IN';
    rec.interimResults = true;
    recognRef.current = rec;

    let final = '';
    rec.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      setInput(final || interim);
    };
    rec.onend = () => { setIsListening(false); if (final) setInput(final); };
    rec.onerror = () => setIsListening(false);
    rec.start();
    setIsListening(true);
  }, [isListening]);

  const fmt = (d) => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop — close on click */}
      <div className="cbot-backdrop" onClick={onClose} />

      {/* Panel */}
      <div className="cbot-panel" role="dialog" aria-modal="true" aria-label="MedIntel AI Assistant">

        {/* ── Header ── */}
        <header className="cbot-header">
          <div className="cbot-header-left">
            <div className="cbot-icon">
              <span className="material-icons-outlined">psychology</span>
            </div>
            <div>
              <h3 className="cbot-title">MedIntel AI</h3>
              <span className="cbot-subtitle">Clinical Intelligence</span>
            </div>
          </div>
          <div className="cbot-header-right">
            <div className="cbot-status">
              <span className="cbot-status-dot" />
              Live
            </div>
            <button className="cbot-close" onClick={onClose} aria-label="Close chatbot">
              <span className="material-icons-outlined">close</span>
            </button>
          </div>
        </header>

        {/* Context bar */}
        {analyzerContext && (
          <div className="cbot-ctx">
            <span className="material-icons-outlined">biotech</span>
            Analyzer context linked — ask me about your medicines
          </div>
        )}

        {/* Error bar */}
        {error && (
          <div className="cbot-error-bar">
            <span className="material-icons-outlined">error_outline</span>
            {error}
            <button onClick={() => setError('')}>✕</button>
          </div>
        )}

        {/* ── Messages ── */}
        <div className="cbot-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`cbot-msg cbot-msg-${msg.role}`}>
              {msg.role === 'ai' && (
                <div className="cbot-ai-ava">
                  <span className="material-icons-outlined">auto_awesome</span>
                </div>
              )}
              <div className="cbot-bubble">
                {msg.type === 'structured'
                  ? <StructuredResponse content={msg.content} />
                  : <p>{msg.content}</p>
                }
                <span className="cbot-time">{fmt(msg.timestamp)}</span>
              </div>
            </div>
          ))}

          {/* Thinking bubble */}
          {isThinking && (
            <div className="cbot-msg cbot-msg-ai">
              <div className="cbot-ai-ava">
                <span className="material-icons-outlined cbot-ava-pulse">auto_awesome</span>
              </div>
              <div className="cbot-bubble cbot-thinking">
                <div className="cbot-think-stages">
                  {THINKING_STAGES.map((s, i) => (
                    <div key={i} className={`cbot-think-line ${i < thinkStage ? 'done' : i === thinkStage ? 'active' : 'wait'}`}>
                      <span className="material-icons-outlined cbot-think-icon">
                        {i < thinkStage ? 'check_circle' : i === thinkStage ? 'pending' : 'radio_button_unchecked'}
                      </span>
                      {s}
                    </div>
                  ))}
                </div>
                <div className="cbot-dots"><span /><span /><span /></div>
              </div>
            </div>
          )}

          {/* Suggestion chips — only when there's just the welcome message */}
          {messages.length === 1 && !isThinking && (
            <div className="cbot-suggestions">
              {SUGGESTIONS.map((s, i) => (
                <button key={i} className="cbot-chip" onClick={() => handleSend(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* ── Input Area ── */}
        <div className="cbot-input-area">
          <div className="cbot-input-row">
            <input
              ref={inputRef}
              className="cbot-input"
              type="text"
              placeholder={isListening ? '🎙 Listening...' : 'Ask about medicines, alternatives, safety...'}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isThinking}
              aria-label="Message input"
            />

            {/* Voice */}
            <button
              className={`cbot-voice ${isListening ? 'cbot-voice-active' : ''}`}
              onClick={toggleVoice}
              disabled={isThinking}
              aria-label={isListening ? 'Stop listening' : 'Voice input'}
              title={SpeechRecognition ? (isListening ? 'Stop' : 'Voice input') : 'Not supported'}
            >
              <span className="material-icons-outlined">
                {isListening ? 'mic' : 'mic_none'}
              </span>
              {isListening && (
                <>
                  <span className="cbot-voice-ring cbot-voice-ring-1" />
                  <span className="cbot-voice-ring cbot-voice-ring-2" />
                </>
              )}
            </button>

            {/* Send */}
            <button
              className="cbot-send"
              onClick={() => handleSend()}
              disabled={isThinking || !input.trim()}
              aria-label="Send message"
            >
              <span className="material-icons-outlined">
                {isThinking ? 'hourglass_top' : 'arrow_upward'}
              </span>
            </button>
          </div>
          <p className="cbot-input-note">AI-generated · Always verify with a healthcare professional</p>
        </div>
      </div>
    </>
  );
}