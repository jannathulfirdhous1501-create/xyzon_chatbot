import LanguageBadge from './LanguageBadge';
import styles from '../styles/MessageBubble.module.css';

export default function MessageBubble({ message }) {
  const isBot = message.role === 'bot';
  
  return (
    <div className={`${styles.wrap} ${isBot ? styles.bot : styles.user}`}>
      <div className={styles.avatar}>{isBot ? '🤖' : '🧑'}</div>
      <div className={styles.bubble}>
        {message.text}
        {/* FIX: Change .lang to .detectedLang to match your backend response */}
        {isBot && <LanguageBadge langCode={message.detectedLang} />}
      </div>
    </div>
  );
}

