import { useState, useRef, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import MessageBubble from './MessageBubble';
import VoiceInput from './VoiceInput';
import TypingIndicator from './TypingIndicator';
import { useChat } from '../hooks/useChat';
import styles from '../styles/ChatWindow.module.css';

const SESSION_KEY = 'xyzon_chatbot_session_id';

function getSession() {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = uuidv4();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

// Quick-start chips for Xyzon topics
const QUICK_CHIPS = [
  '📚 Training Programs',
  '💼 Placement Support',
  '🎓 Internship Details',
  '📅 Upcoming Events',
  '📞 Contact & Location',
  '💰 Course Fees',
];

export default function ChatWindow() {
  const [sessionId] = useState(getSession);
  const [input, setInput] = useState('');
  const [showWelcome, setShowWelcome] = useState(true);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const { messages, isLoading, chat } = useChat(sessionId);

  // Auto-scroll on new messages
  useEffect(() => {
    const timer = setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages, isLoading]);

  // Auto-resize textarea
  const handleInput = (e) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 130) + 'px';
  };

  const handleSend = useCallback((overrideText) => {
    const text = (typeof overrideText === 'string' ? overrideText : input).trim();
    if (!text || isLoading) return;
    setInput('');
    setShowWelcome(false);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    chat(text);
  }, [input, isLoading, chat]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChip = (chipText) => {
    setShowWelcome(false);
    handleSend(chipText);
  };

  return (
    <div className={styles.container}>

      {/* ── Header ── */}
      <header className={styles.header}>
        <div className={styles.logoMark}>X</div>
        <div className={styles.headerText}>
          <h1 className={styles.title}>Xyzon Innovations</h1>
          <p className={styles.subtitle}>Company Assistant · Replies only to Xyzon queries</p>
        </div>
        <div className={styles.statusPill}>
          <span className={styles.statusDot} />
          Online
        </div>
      </header>

      {/* ── Messages ── */}
      <div className={styles.messages}>

        {/* Welcome / empty state */}
        {showWelcome && messages.length === 0 && !isLoading && (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🏢</div>
            <div>
              <p className={styles.emptyTitle}>Welcome to Xyzon Innovations!</p>
              <p className={styles.emptyText}>
                Ask me anything about our training programs, internships, placement support,
                events, or enrollment — in any language!
              </p>
            </div>
            <div className={styles.chips}>
              {QUICK_CHIPS.map(chip => (
                <button key={chip} className={styles.chip} onClick={() => handleChip(chip)}>
                  {chip}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(m => (
          <MessageBubble key={m.id || Math.random()} message={m} />
        ))}

        {isLoading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* ── Input Area ── */}
      <div className={styles.inputArea}>
        <VoiceInput onTranscript={(t) => { setInput(t); handleSend(t); }} />

        <div className={styles.inputWrap}>
          <textarea
            ref={textareaRef}
            className={styles.textarea}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKey}
            placeholder="Ask about Xyzon — in any language..."
            rows={1}
          />
        </div>

        <button
          className={styles.sendBtn}
          onClick={() => handleSend()}
          disabled={isLoading || !input.trim()}
          aria-label="Send message"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>

    </div>
  );
}