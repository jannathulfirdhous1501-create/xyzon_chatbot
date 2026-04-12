const LANG_LABELS = {
  'hi-IN': '🇮🇳 Hindi', 'ta-IN': '🇮🇳 Tamil', 'te-IN': '🇮🇳 Telugu',
  'mr-IN': '🇮🇳 Marathi', 'bn-IN': '🇮🇳 Bengali', 'kn-IN': '🇮🇳 Kannada',
  'ml-IN': '🇮🇳 Malayalam', 'gu-IN': '🇮🇳 Gujarati', 'pa-IN': '🇮🇳 Punjabi',
  'en-IN': '🇬🇧 English', 'en-US': '🇺🇸 English'
};

export default function LanguageBadge({ langCode }) {
  // Use the comprehensive LANG_LABELS map
  // If the langCode is missing or not in the map, it shows "Detected"
  const label = LANG_LABELS[langCode] || '✨ Detected';

  return (
    <span className="badge" style={{ 
      fontSize: '0.75rem', 
      padding: '2px 8px', 
      borderRadius: '10px', 
      background: 'rgba(255,255,255,0.1)',
      marginLeft: '10px'
    }}>
      {label}
    </span>
  );
}