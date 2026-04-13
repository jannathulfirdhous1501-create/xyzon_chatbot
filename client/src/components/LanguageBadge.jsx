const LANG_NAMES = {
  'en-IN': '🇬🇧 English',
  'hi-IN': '🇮🇳 Hindi',
  'ta-IN': '🇮🇳 Tamil',
  'te-IN': '🇮🇳 Telugu',
  'ml-IN': '🇮🇳 Malayalam',
  'kn-IN': '🇮🇳 Kannada',
  'mr-IN': '🇮🇳 Marathi',
  'bn-IN': '🇮🇳 Bengali',
  'gu-IN': '🇮🇳 Gujarati',
  'pa-IN': '🇮🇳 Punjabi',
  'or-IN': '🇮🇳 Odia',
  'ur-IN': '🇮🇳 Urdu',
  'fr-FR': '🇫🇷 French',
  'de-DE': '🇩🇪 German',
  'ar':    '🇸🇦 Arabic',
  'zh':    '🇨🇳 Chinese',
};

export default function LanguageBadge({ langCode }) {
  if (!langCode) return null;
  const label = LANG_NAMES[langCode] || langCode;
  return (
    <div className="lang-badge">
      {label}
    </div>
  );
}