// Store utterance globally to prevent browser garbage collection cutting off audio
window.__activeSentinelUtterance = null;

export const speakAlert = (cameraName) => {
  if (!('speechSynthesis' in window)) {
    console.warn("Speech synthesis not supported in this browser.");
    return;
  }

  // Cancel any ongoing speech so alerts don't stack up
  window.speechSynthesis.cancel();

  // Use a slight 50ms timeout. Calling speak() immediately after cancel() 
  // causes Chrome/Edge to occasionally drop the new utterance entirely.
  setTimeout(() => {
    const announcement = `Warning! Security breach detected at ${cameraName}.`;
    const utterance = new SpeechSynthesisUtterance(announcement);
    
    utterance.rate = 1.0;
    utterance.pitch = 0.9; // Slightly deeper, more authoritative tone
    utterance.volume = 1.0;

    // Helper to find and set the voice
    const setVoiceAndSpeak = () => {
      const voices = window.speechSynthesis.getVoices();
      const englishVoice = voices.find(v => 
        v.lang.includes('en-US') || 
        v.lang.includes('en-GB') || 
        v.name.includes('English')
      );
      
      if (englishVoice) {
        utterance.voice = englishVoice;
      }
      
      // Save to global window object to prevent garbage collection
      window.__activeSentinelUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    };

    // Chrome/Edge loads voices asynchronously. If the array is empty, 
    // wait for the 'onvoiceschanged' event before speaking.
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = setVoiceAndSpeak;
    } else {
      setVoiceAndSpeak();
    }
  }, 50);
};