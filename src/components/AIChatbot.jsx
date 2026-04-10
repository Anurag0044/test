import { useState, useRef, useEffect, useCallback } from 'react';
import { generateMedicalResponse } from '../services/geminiService';
import './AIChatbot.css';

// ---- AI Thinking stages ----
const THINKING_STAGES = [
  'Initializing medical analysis...',
  'Processing clinical data...',
  'Validating safety & alternatives...',
  'Generating response...',
];

const STAGE_DELAY = 1100;

// ---- Neural particles for background ----
function NeuralBackground() {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w = canvas.width = canvas.offsetWidth;
    let h = canvas.height = canvas.offsetHeight;

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const dotColor = isDark ? 'rgba(34,197,94,0.12)' : 'rgba(0,108,73,0.07)';
    const lineColor = isDark
      ? (opacity) => `rgba(34,197,94,${0.06 * opacity})`
      : (opacity) => `rgba(0,108,73,${0.04 * opacity})`;

    const dots = Array.from({ length: 35 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.5,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dx = dots[i].x - dots[j].x;
          const dy = dots[i].y - dots[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.strokeStyle = lineColor(1 - dist / 100);
            ctx.lineWidth = 0.5;
            ctx.moveTo(dots[i].x, dots[i].y);
            ctx.lineTo(dots[j].x, dots[j].y);
            ctx.stroke();
          }
        }
      }

      for (const d of dots) {
        d.x += d.vx;
        d.y += d.vy;
        if (d.x < 0 || d.x > w) d.vx *= -1;
        if (d.y < 0 || d.y > h) d.vy *= -1;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = dotColor;
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    const handleResize = () => {
      w = canvas.width = canvas.offsetWidth;
      h = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="neural-canvas" />;
}

// ---- Speech Recognition Setup ----
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export default function AIChatbot({ analyzerContext = '', isOpen, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      type: 'structured',
      content: {
        summary: 'MedIntel AI is online. I can help you understand medications, check drug interactions, find cost-effective alternatives, and provide clinical insights based on your analysis.',
        alternatives: [],
        costInsight: '',
        warning: '',
        disclaimer: '',
      },
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingStage, setThinkingStage] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const thinkingTimerRef = useRef(null);
  const recognitionRef = useRef(null);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking, thinkingStage]);

  // Focus on open
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 400);
  }, [isOpen]);

  // Thinking progression
  useEffect(() => {
    if (!isThinking) { setThinkingStage(0); return; }
    if (thinkingStage >= THINKING_STAGES.length) return;

    thinkingTimerRef.current = setTimeout(() => {
      setThinkingStage(prev => prev + 1);
    }, STAGE_DELAY);

    return () => clearTimeout(thinkingTimerRef.current);
  }, [isThinking, thinkingStage]);

  // Cleanup
  useEffect(() => {
    return () => {
      clearTimeout(thinkingTimerRef.current);
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // ---- Voice-to-text ----
  const toggleVoice = useCallback(() => {
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    let finalTranscript = '';

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interim += transcript;
        }
      }
      setInput(finalTranscript || interim);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (finalTranscript) {
        setInput(finalTranscript);
      }
    };

    recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.start();
    setIsListening(true);
  }, [isListening]);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isThinking) return;

    // Stop voice if active
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    setMessages(prev => [...prev, { role: 'user', type: 'text', content: trimmed, timestamp: new Date() }]);
    setInput('');
    setIsThinking(true);

    try {
      const response = await generateMedicalResponse(trimmed, analyzerContext);
      setMessages(prev => [...prev, { role: 'ai', type: 'structured', content: response, timestamp: new Date() }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'ai', type: 'structured', timestamp: new Date(),
        content: {
          summary: 'Analysis interrupted. The AI service is temporarily unavailable. Please retry.',
          alternatives: [], costInsight: '', warning: '',
          disclaimer: 'This information is for educational purposes only. Consult a healthcare professional.',
        },
      }]);
    } finally {
      setIsThinking(false);
    }
  }, [input, isThinking, isListening, analyzerContext]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const formatTime = (d) => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // ---- Render structured AI response ----
  const renderStructured = (c) => (
    <div className="ai-resp">
      {c.summary && <div className="ai-resp-summary">{c.summary}</div>}

      {c.alternatives?.length > 0 && (
        <div className="ai-resp-block ai-resp-alts">
          <div className="ai-resp-label">
            <span className="material-icons-outlined">swap_horiz</span> Alternatives
          </div>
          <div className="ai-resp-pills">
            {c.alternatives.map((a, i) => <span key={i} className="ai-pill">{a}</span>)}
          </div>
        </div>
      )}

      {c.costInsight && (
        <div className="ai-resp-block ai-resp-cost">
          <div className="ai-resp-label">
            <span className="material-icons-outlined">savings</span> Cost Insight
          </div>
          <p>{c.costInsight}</p>
        </div>
      )}

      {c.warning && (
        <div className="ai-resp-block ai-resp-warn">
          <div className="ai-resp-label">
            <span className="material-icons-outlined">warning_amber</span> Warning
          </div>
          <p>{c.warning}</p>
        </div>
      )}

      {c.disclaimer && <p className="ai-resp-disclaimer">{c.disclaimer}</p>}
    </div>
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="cbot-backdrop" onClick={onClose} />

      {/* Panel */}
      <div className="cbot-panel">
        {/* Neural BG */}
        <NeuralBackground />

        {/* Header */}
        <header className="cbot-header">
          <div className="cbot-header-left">
            <div className="cbot-icon">
              <span className="material-icons-outlined">psychology</span>
            </div>
            <div>
              <h3 className="cbot-title">MedIntel AI</h3>
              <span className="cbot-subtitle">Clinical Intelligence System</span>
            </div>
          </div>
          <div className="cbot-header-right">
            <div className="cbot-status">
              <span className="cbot-status-dot" />
              <span>Live</span>
            </div>
            <button className="cbot-close" onClick={onClose} aria-label="Close">
              <span className="material-icons-outlined">close</span>
            </button>
          </div>
        </header>

        {/* Context bar */}
        {analyzerContext && (
          <div className="cbot-ctx">
            <span className="material-icons-outlined">link</span>
            Analysis context linked
          </div>
        )}

        {/* Messages */}
        <div className="cbot-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`cbot-msg cbot-msg-${msg.role}`}>
              {msg.role === 'ai' && (
                <div className="cbot-ai-ava">
                  <span className="material-icons-outlined">auto_awesome</span>
                </div>
              )}
              <div className="cbot-bubble">
                {msg.type === 'structured' ? renderStructured(msg.content) : <p>{msg.content}</p>}
                <span className="cbot-time">{formatTime(msg.timestamp)}</span>
              </div>
            </div>
          ))}

          {/* Thinking */}
          {isThinking && (
            <div className="cbot-msg cbot-msg-ai">
              <div className="cbot-ai-ava">
                <span className="material-icons-outlined cbot-ava-pulse">auto_awesome</span>
              </div>
              <div className="cbot-bubble cbot-thinking">
                <div className="cbot-think-stages">
                  {THINKING_STAGES.map((s, i) => (
                    <div key={i} className={`cbot-think-line ${i < thinkingStage ? 'done' : i === thinkingStage ? 'active' : 'wait'}`}>
                      <span className="material-icons-outlined cbot-think-icon">
                        {i < thinkingStage ? 'check_circle' : i === thinkingStage ? 'pending' : 'radio_button_unchecked'}
                      </span>
                      {s}
                    </div>
                  ))}
                </div>
                <div className="cbot-dots"><span /><span /><span /></div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="cbot-input-area">
          <div className="cbot-input-row">
            <input
              ref={inputRef}
              className="cbot-input"
              type="text"
              placeholder={isListening ? 'Listening...' : 'Ask about medicines, safety, or alternatives...'}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isThinking}
            />

            {/* Voice button */}
            <button
              className={`cbot-voice ${isListening ? 'cbot-voice-active' : ''}`}
              onClick={toggleVoice}
              disabled={isThinking}
              aria-label={isListening ? 'Stop listening' : 'Start voice input'}
            >
              <span className="material-icons-outlined">
                {isListening ? 'mic' : 'mic_none'}
              </span>
              {isListening && (
                <>
                  <span className="cbot-voice-ring cbot-voice-ring-1" />
                  <span className="cbot-voice-ring cbot-voice-ring-2" />
                  <span className="cbot-voice-ring cbot-voice-ring-3" />
                </>
              )}
            </button>

            {/* Send button */}
            <button className="cbot-send" onClick={handleSend} disabled={isThinking || !input.trim()} aria-label="Send">
              <span className="material-icons-outlined">arrow_upward</span>
            </button>
          </div>
          <p className="cbot-input-note">AI-generated · Always verify with a healthcare professional</p>
        </div>
      </div>
    </>
  );
}
