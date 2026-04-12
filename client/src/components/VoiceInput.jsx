import { useVoice } from '../hooks/useVoice';

export default function VoiceInput({ onTranscript }) {
  const { isRecording, isTranscribing, startRecording, stopRecording } = useVoice();

  const handleClick = async (e) => {
    e.preventDefault(); // Prevents accidental form submissions
    
    if (isRecording) {
      const result = await stopRecording();
      // Ensure we only pass the transcript if it's not empty
      if (result?.transcript && result.transcript.trim().length > 0) {
        onTranscript(result.transcript, result.languageCode); 
      }
    } else {
      try {
        await startRecording();
      } catch (err) {
        console.error("Mic access denied or error:", err);
      }
    }
  };

  return (
    <div className="voice-input-container">
      <button
        onClick={handleClick}
        className={`voice-btn ${isRecording ? 'recording' : ''} ${isTranscribing ? 'processing' : ''}`}
        disabled={isTranscribing}
        type="button"
      >
        {isTranscribing ? (
          <span className="loader">⏳ processing...</span>
        ) : isRecording ? (
          <span>⏹ Stop</span>
        ) : (
          <span>🎙 Speak</span>
        )}
      </button>
      
      {/* Optional: Add a small "Recording..." text for better UX */}
      {isRecording && <p className="status-text">Listening...</p>}
    </div>
  );
}

