import LanguageBadge from './LanguageBadge';
import styles from '../styles/MessageBubble.module.css';

function getTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function MessageBubble({ message }) {
  const isBot = message.role === 'bot';

  return (
    <div className={`${styles.wrap} ${isBot ? styles.bot : styles.user}`}>
      <div className={styles.avatar}>
        {isBot ? '🤖' : '🧑'}
      </div>
      <div className={styles.bubble}>
        <span>{message.text}</span>
        <span className={styles.time}>{getTime()}</span>
        {isBot && message.detectedLang && (
          <LanguageBadge langCode={message.detectedLang} />
        )}
      </div>
    </div>
  );
}