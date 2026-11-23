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
  let currentBgmTrack = 'bgm_classic';
  let currentSfxPack = 'sfx_classic';
  let activeRecognition = null;

  const BGM_TRACKS = {
    bgm_classic: {
      name: 'Classic Chiptune',
      bpm: 125,
      notes: [
        261.63, 329.63, 392.00, 523.25,
        220.00, 261.63, 329.63, 440.00,
        174.61, 220.00, 261.63, 349.23,
        196.00, 246.94, 293.66, 392.00,
      ],
      leadType: 'square',
      bassType: 'triangle',
    },
    bgm_synthwave: {
      name: 'Synthwave Arp',
      bpm: 132,
      notes: [
        220.00, 261.63, 329.63, 440.00,
        196.00, 246.94, 293.66, 392.00,
        174.61, 220.00, 261.63, 349.23,
        164.81, 196.00, 246.94, 329.63,
      ],
      leadType: 'sawtooth',
      bassType: 'triangle',
    },
    bgm_boss: {
      name: 'Boss Battle Rush',
      bpm: 145,
      notes: [
        146.83, 220.00, 293.66, 349.23,
        146.83, 220.00, 329.63, 349.23,
        130.81, 196.00, 261.63, 329.63,
        138.59, 207.65, 277.18, 349.23,
      ],
      leadType: 'square',
      bassType: 'sawtooth',
    },
    bgm_lofi: {
      name: 'Crystal Study',
      bpm: 105,
      notes: [261.63, 293.66, 329.63, 392.00, 440.00, 392.00, 329.63, 293.66],
      leadType: 'sine',
      bassType: 'sine',
    },
  };

  const SFX_PACKS = ['sfx_classic', 'sfx_coin', 'sfx_laser'];

  // Restore preferences from localStorage
  try {
    const saved = localStorage.getItem('mq_sound_muted');
    if (saved !== null) muted = JSON.parse(saved);

    const savedBgm = localStorage.getItem('mq_bgm_muted');
    if (savedBgm !== null) bgmMuted = JSON.parse(savedBgm);

    const savedSpeech = localStorage.getItem('mq_speech_enabled');
    if (savedSpeech !== null) speechEnabled = JSON.parse(savedSpeech);

    const savedTrack = localStorage.getItem('mq_bgm_track');
    if (savedTrack && BGM_TRACKS[savedTrack]) currentBgmTrack = savedTrack;

    const savedSfx = localStorage.getItem('mq_sfx_pack');
    if (savedSfx && SFX_PACKS.includes(savedSfx)) currentSfxPack = savedSfx;
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

  function speak(text, force = false) {
    if ((!speechEnabled && !force) || !('speechSynthesis' in window)) return;
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

  function speakEquation(num1, op, num2, force = false, extra = null) {
    if (!speechEnabled && !force) return;
    if (op === 'missing' && extra && extra.product) {
      if (extra.missingPosition === 'first') {
        speak(`what times ${extra.knownFactor} equals ${extra.product}`, force);
      } else {
        speak(`${extra.knownFactor} times what equals ${extra.product}`, force);
      }
      return;
    }
    let opWord = 'times';
    if (op === 'add' || op === '+') opWord = 'plus';
    if (op === 'subtract' || op === '−') opWord = 'minus';
    if (op === 'divide' || op === '÷') opWord = 'divided by';
    speak(`${num1} ${opWord} ${num2}`, force);
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

  // Correct answer chime (respects selected SFX pack)
  function playCorrect() {
    if (muted) return;
    if (currentSfxPack === 'sfx_coin') {
      playTone(987.77, 'square', 0.08, 0, 0.16);
      playTone(1318.51, 'square', 0.22, 0.07, 0.18);
      return;
    }
    if (currentSfxPack === 'sfx_laser') {
      playTone(587.33, 'sawtooth', 0.08, 0, 0.14);
      playTone(880.00, 'triangle', 0.12, 0.05, 0.18);
      playTone(1174.66, 'sine', 0.2, 0.11, 0.2);
      return;
    }
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

  // Critical hit sound (energetic rising triad)
  function playCritical() {
    if (muted) return;
    playTone(659.25, 'triangle', 0.1, 0, 0.22);
    playTone(880, 'sawtooth', 0.12, 0.05, 0.16);
    playTone(1318.5, 'triangle', 0.22, 0.1, 0.24);
  }

  // Shield block deflect sound
  function playShieldBlock() {
    if (muted) return;
    playTone(440, 'sine', 0.14, 0, 0.2);
    playTone(784, 'triangle', 0.2, 0.06, 0.22);
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
  // 8-BIT SYNTH BGM JUKEBOX
  // =========================================================================
  function setBgmTrack(trackId) {
    const resolved = BGM_TRACKS[trackId] ? trackId : 'bgm_classic';
    currentBgmTrack = resolved;
    try {
      localStorage.setItem('mq_bgm_track', resolved);
    } catch (e) {}
    if (!bgmMuted && bgmInterval) {
      stopBGM();
      startBGM();
    }
    return currentBgmTrack;
  }

  function getBgmTrack() {
    return currentBgmTrack;
  }

  function setSfxPack(packId) {
    const resolved = SFX_PACKS.includes(packId) ? packId : 'sfx_classic';
    currentSfxPack = resolved;
    try {
      localStorage.setItem('mq_sfx_pack', resolved);
    } catch (e) {}
    return currentSfxPack;
  }

  function getSfxPack() {
    return currentSfxPack;
  }

  function startBGM() {
    if (bgmMuted || bgmInterval) return;
    const ctx = getContext();
    if (!ctx) return;

    const track = BGM_TRACKS[currentBgmTrack] || BGM_TRACKS.bgm_classic;
    bgmStep = 0;
    const bpm = isFeverMode ? Math.round(track.bpm * 1.25) : track.bpm;
    const intervalMs = (60 / bpm) * 1000 * 0.5;

    bgmInterval = setInterval(() => {
      if (bgmMuted || muted) return;
      const activeTrack = BGM_TRACKS[currentBgmTrack] || BGM_TRACKS.bgm_classic;
      const noteFreq = activeTrack.notes[bgmStep % activeTrack.notes.length];
      const pitchMultiplier = isFeverMode ? 1.25 : 1.0;

      playTone(noteFreq * 0.5 * pitchMultiplier, activeTrack.bassType, 0.18, 0, 0.05);

      if (bgmStep % 2 === 0) {
        playTone(noteFreq * pitchMultiplier, activeTrack.leadType, 0.09, 0, 0.032);
      }

      bgmStep++;
    }, intervalMs);
  }

  // =========================================================================
  // HANDS-FREE VOICE RECOGNITION NUMBER PARSER
  // =========================================================================
  const NUMBER_WORDS = {
    zero: 0, oh: 0,
    one: 1, won: 1,
    two: 2, to: 2, too: 2,
    three: 3,
    four: 4, for: 4, fore: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8, ate: 8,
    nine: 9,
    ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14,
    fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
    twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
  };

  function parseSpokenNumber(rawTranscript) {
    if (typeof rawTranscript !== 'string') return null;
    const cleaned = rawTranscript.toLowerCase().replace(/-/g, ' ').trim();
    if (!cleaned) return null;

    const digitMatch = cleaned.match(/\b(\d{1,4})\b/);
    if (digitMatch) {
      const val = parseInt(digitMatch[1], 10);
      return Number.isFinite(val) && val >= 0 && val <= 9999 ? val : null;
    }

    const words = cleaned.replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(Boolean);
    let total = 0;
    let current = 0;
    let matched = false;

    for (const w of words) {
      if (w === 'and') continue;
      if (w === 'hundred') {
        if (!matched) {
          current = 1;
          matched = true;
        }
        current *= 100;
        continue;
      }
      if (w === 'thousand') {
        if (!matched) {
          current = 1;
          matched = true;
        }
        total += current * 1000;
        current = 0;
        continue;
      }
      if (Object.prototype.hasOwnProperty.call(NUMBER_WORDS, w)) {
        current += NUMBER_WORDS[w];
        matched = true;
      }
    }

    if (!matched) return null;
    const result = total + current;
    return result >= 0 && result <= 9999 ? result : null;
  }

  function isVoiceInputSupported() {
    if (typeof window === 'undefined') return false;
    return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  function stopListening() {
    if (activeRecognition) {
      try {
        activeRecognition.stop();
      } catch (e) {}
      activeRecognition = null;
    }
  }

  function listenForNumber({ onResult, onStateChange } = {}) {
    if (!isVoiceInputSupported()) {
      if (onStateChange) onStateChange('unsupported');
      return false;
    }
    stopListening();
    try {
      const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new Rec();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 3;
      activeRecognition = recognition;
      if (onStateChange) onStateChange('listening');

      recognition.onresult = (event) => {
        let resolved = null;
        if (event && event.results && event.results[0]) {
          for (let i = 0; i < event.results[0].length; i++) {
            const num = parseSpokenNumber(event.results[0][i].transcript);
            if (num !== null) {
              resolved = num;
              break;
            }
          }
        }
        if (onResult) onResult(resolved);
      };
      recognition.onerror = () => {
        if (onStateChange) onStateChange('idle');
      };
      recognition.onend = () => {
        if (activeRecognition === recognition) activeRecognition = null;
        if (onStateChange) onStateChange('idle');
      };
      recognition.start();
      return true;
    } catch (e) {
      activeRecognition = null;
      if (onStateChange) onStateChange('idle');
      return false;
    }
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
    BGM_TRACKS,
    SFX_PACKS,
    setBgmTrack,
    getBgmTrack,
    setSfxPack,
    getSfxPack,
    parseSpokenNumber,
    isVoiceInputSupported,
    listenForNumber,
    stopListening,
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
    playCritical,
    playShieldBlock,
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
