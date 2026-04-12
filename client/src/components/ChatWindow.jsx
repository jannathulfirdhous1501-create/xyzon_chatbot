import { useState, useRef, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import MessageBubble from './MessageBubble';
import VoiceInput from './VoiceInput';
import TypingIndicator from './TypingIndicator';
import { useChat } from '../hooks/useChat';
import styles from '../styles/ChatWindow.module.css';

const SESSION_KEY = 'chatbot_session_id';

function getSession() {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) { 
    id = uuidv4(); 
    localStorage.setItem(SESSION_KEY, id); 
  }
  return id;
}

export default function ChatWindow() {
  const [sessionId] = useState(getSession);
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);
  const { messages, isLoading, chat } = useChat(sessionId);

  // Auto-scroll logic
  useEffect(() => {
    const scrollToBottom = () => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    // Small timeout ensures the DOM has updated with the new bubble
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [messages, isLoading]);

  // FIXED: Accept text as argument to avoid state race conditions
  const handleSend = useCallback((overrideText) => {
    const text = (typeof overrideText === 'string' ? overrideText : input).trim();
    if (!text || isLoading) return;
    
    setInput('');
    chat(text);
  }, [input, isLoading, chat]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { 
      e.preventDefault(); 
      handleSend(); 
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <span className={styles.logo}>🌐</span>
        <div>
          <h1 className={styles.title}>PolyChat</h1>
          <p className={styles.subtitle}>Talk in any language — even colloquially!</p>
        </div>
      </header>

      <div className={styles.messages}>
        {messages.length === 0 && !isLoading && (
          <div className={styles.empty}>
            <p>👋 Start chatting in any language!</p>
            <p>Hindi, Tamil, English, Marathi... I understand them all 🗣️</p>
          </div>
        )}
        
        {messages.map(m => (
          <MessageBubble key={m.id || Math.random()} message={m} />
        ))}
        
        {isLoading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      <div className={styles.inputArea}>
        {/* FIXED: Passing text directly to handleSend avoids the state lag */}
        <VoiceInput onTranscript={(t) => { setInput(t); handleSend(t); }} />
        
        <textarea
          className={styles.textarea}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder='Type in any language... या हिंदी में लिखें...'
          rows={1}
        />
        
        <button 
          className={styles.sendBtn} 
          onClick={() => handleSend()} 
          disabled={isLoading || !input.trim()}
        >
          ➤
        </button>
      </div>
    </div>
  );
}

