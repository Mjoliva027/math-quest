/**
 * Audio Synthesizer & Voice Engine for Math Quest
 * Pure Web Audio API + Web Speech API - Zero external audio files required!
 */

const SoundEngine = (() => {
  let audioCtx = null;
  let muted = false;
  let bgmMuted = true; // BGM is off by default so it never annoys the user
  let speechEnabled = false; // Voice read-aloud toggle
  let bgmInterval = null;
  let bgmStep = 0;
  let isFeverMode = false;

  // Restore preferences from localStorage
  try {
    const saved = localStorage.getItem('mq_sound_muted');
    if (saved !== null) muted = JSON.parse(saved);

    const savedBgm = localStorage.getItem('mq_bgm_muted');
    if (savedBgm !== null) bgmMuted = JSON.parse(savedBgm);

    const savedSpeech = localStorage.getItem('mq_speech_enabled');
    if (savedSpeech !== null) speechEnabled = JSON.parse(savedSpeech);
  } catch (e) {
    // Ignore storage errors
  }

  function getContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function isMuted() {
    return muted;
  }

  function toggleMute() {
    muted = !muted;
    try {
      localStorage.setItem('mq_sound_muted', JSON.stringify(muted));
    } catch (e) {}
    return muted;
  }

  function isBgmMuted() {
    return bgmMuted;
  }

  function toggleBGM() {
    bgmMuted = !bgmMuted;
    try {
      localStorage.setItem('mq_bgm_muted', JSON.stringify(bgmMuted));
    } catch (e) {}

    if (bgmMuted) {
      stopBGM();
    } else {
      startBGM();
    }
    return bgmMuted;
  }

  function isSpeechEnabled() {
    return speechEnabled;
  }

  function toggleSpeech() {
    speechEnabled = !speechEnabled;
    try {
      localStorage.setItem('mq_speech_enabled', JSON.stringify(speechEnabled));
    } catch (e) {}
    if (speechEnabled) {
      speak("Voice enabled");
    }
    return speechEnabled;
  }

  function speak(text) {
    if (!speechEnabled || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel(); // Cancel any previous speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.1;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  }

  function speakEquation(num1, op, num2) {
    if (!speechEnabled) return;
    let opWord = 'times';
    if (op === 'add' || op === '+') opWord = 'plus';
    if (op === 'subtract' || op === '−') opWord = 'minus';
    speak(`${num1} ${opWord} ${num2}`);
  }

  /**
   * Helper to play an oscillator note with an envelope
   */
  function playTone(freq, type, duration, startTime = 0, gainLevel = 0.15) {
    if (muted) return;
    const ctx = getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);

      gain.gain.setValueAtTime(gainLevel, ctx.currentTime + startTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + startTime);
      osc.stop(ctx.currentTime + startTime + duration);
    } catch (e) {}
  }

  // Correct answer chime (Ascending cheerful chime)
  function playCorrect() {
    if (muted) return;
    playTone(523.25, 'sine', 0.12, 0, 0.18);      // C5
    playTone(659.25, 'sine', 0.18, 0.08, 0.2);     // E5
    playTone(783.99, 'sine', 0.25, 0.16, 0.22);    // G5
  }

  // Wrong answer tone (Soft low buzz)
  function playWrong() {
    if (muted) return;
    const ctx = getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) {}
  }

  // Streak combo celebration sound
  function playStreak(streakCount = 3) {
    if (muted) return;
    const baseFreq = streakCount >= 10 ? 659.25 : 523.25;
    playTone(baseFreq, 'triangle', 0.1, 0, 0.15);
    playTone(baseFreq * 1.25, 'triangle', 0.1, 0.05, 0.16);
    playTone(baseFreq * 1.5, 'triangle', 0.1, 0.10, 0.18);
    playTone(baseFreq * 2.0, 'sine', 0.25, 0.15, 0.22);
  }

  // Fever Mode activation sound
  function playFever() {
    if (muted) return;
    const notes = [440, 554.37, 659.25, 880, 1108.73];
    notes.forEach((freq, idx) => {
      playTone(freq, 'sawtooth', 0.25, idx * 0.06, 0.15);
    });
  }

  // Player sword slash attack sound
  function playSlash() {
    if (muted) return;
    const ctx = getContext();
    if (!ctx) return;

    try {
      const bufferSize = ctx.sampleRate * 0.12;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2500, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.12);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
    } catch (e) {}
  }

  // Boss hit / recoil sound
  function playBossHit() {
    if (muted) return;
    playTone(180, 'triangle', 0.15, 0, 0.25);
    playTone(120, 'square', 0.2, 0.05, 0.18);
  }

  // Boss attack sound (heavy thud)
  function playBossAttack() {
    if (muted) return;
    playTone(90, 'sawtooth', 0.35, 0, 0.3);
    playTone(60, 'sine', 0.4, 0.05, 0.35);
  }

  // Soft flip whoosh for flashcards
  function playFlip() {
    if (muted) return;
    playTone(330, 'sine', 0.08, 0, 0.1);
    playTone(440, 'triangle', 0.08, 0.03, 0.1);
  }

  // Tactile button tap
  function playClick() {
    if (muted) return;
    playTone(800, 'sine', 0.04, 0, 0.08);
  }

  // Level Up triumphant fanfare
  function playLevelUp() {
    if (muted) return;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      playTone(freq, 'triangle', idx === 3 ? 0.6 : 0.15, idx * 0.12, 0.22);
    });
  }

  // Game Over sound
  function playGameOver() {
    if (muted) return;
    playTone(440, 'triangle', 0.2, 0, 0.15);       // A4
    playTone(392, 'triangle', 0.2, 0.18, 0.15);    // G4
    playTone(349.23, 'triangle', 0.4, 0.36, 0.18); // F4
  }

  // Countdown warning tick
  function playTick() {
    if (muted) return;
    playTone(900, 'sine', 0.05, 0, 0.06);
  }

  // =========================================================================
  // 8-BIT SYNTH BGM GENERATOR
  // =========================================================================
  const BGM_NOTES = [
    261.63, 329.63, 392.00, 523.25, // C4, E4, G4, C5
    220.00, 261.63, 329.63, 440.00, // A3, C4, E4, A4
    174.61, 220.00, 261.63, 349.23, // F3, A3, C4, F4
    196.00, 246.94, 293.66, 392.00, // G3, B3, D4, G4
  ];

  function startBGM() {
    if (bgmMuted || bgmInterval) return;
    const ctx = getContext();
    if (!ctx) return;

    bgmStep = 0;
    const bpm = isFeverMode ? 160 : 125;
    const intervalMs = (60 / bpm) * 1000 * 0.5;

    bgmInterval = setInterval(() => {
      if (bgmMuted || muted) return;
      const noteFreq = BGM_NOTES[bgmStep % BGM_NOTES.length];
      const pitchMultiplier = isFeverMode ? 1.25 : 1.0;

      playTone(noteFreq * 0.5 * pitchMultiplier, 'triangle', 0.18, 0, 0.05);

      if (bgmStep % 2 === 0) {
        playTone(noteFreq * pitchMultiplier, 'square', 0.09, 0, 0.035);
      }

      bgmStep++;
    }, intervalMs);
  }

  function stopBGM() {
    if (bgmInterval) {
      clearInterval(bgmInterval);
      bgmInterval = null;
    }
  }

  function setFeverMode(enabled) {
    if (isFeverMode !== enabled) {
      isFeverMode = enabled;
      if (!bgmMuted && bgmInterval) {
        stopBGM();
        startBGM();
      }
    }
  }

  return {
    isMuted,
    toggleMute,
    isBgmMuted,
    toggleBGM,
    isSpeechEnabled,
    toggleSpeech,
    speak,
    speakEquation,
    setFeverMode,
    startBGM,
    stopBGM,
    playCorrect,
    playWrong,
    playStreak,
    playFever,
    playSlash,
    playBossHit,
    playBossAttack,
    playFlip,
    playClick,
    playLevelUp,
    playGameOver,
    playTick,
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SoundEngine;
}
