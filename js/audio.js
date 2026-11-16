/**
 * Audio Synthesizer for Math Quest
 * Pure Web Audio API - no external sound files required!
 */

const SoundEngine = (() => {
  let audioCtx = null;
  let muted = false;

  // Restore muted preference from localStorage
  try {
    const saved = localStorage.getItem('mq_sound_muted');
    if (saved !== null) {
      muted = JSON.parse(saved);
    }
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
    } catch (e) {
      // Ignore
    }
    return muted;
  }

  function setMuted(val) {
    muted = !!val;
    try {
      localStorage.setItem('mq_sound_muted', JSON.stringify(muted));
    } catch (e) {
      // Ignore
    }
  }

  /**
   * Helper to play an oscillator note with an envelope
   */
  function playTone(freq, type, duration, startTime = 0, gainLevel = 0.15) {
    if (muted) return;
    const ctx = getContext();
    if (!ctx) return;

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
  }

  // Correct answer chime (Ascending cheerful chime)
  function playCorrect() {
    if (muted) return;
    const ctx = getContext();
    if (!ctx) return;

    playTone(523.25, 'sine', 0.12, 0, 0.18);      // C5
    playTone(659.25, 'sine', 0.18, 0.08, 0.2);     // E5
    playTone(783.99, 'sine', 0.25, 0.16, 0.22);    // G5
  }

  // Wrong answer tone (Soft low buzz)
  function playWrong() {
    if (muted) return;
    const ctx = getContext();
    if (!ctx) return;

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
  }

  // Streak combo celebration sound
  function playStreak(streakCount = 3) {
    if (muted) return;
    const ctx = getContext();
    if (!ctx) return;

    // Fast ascending sparkling arpeggio
    const baseFreq = streakCount >= 10 ? 659.25 : 523.25;
    playTone(baseFreq, 'triangle', 0.1, 0, 0.15);
    playTone(baseFreq * 1.25, 'triangle', 0.1, 0.05, 0.16);
    playTone(baseFreq * 1.5, 'triangle', 0.1, 0.10, 0.18);
    playTone(baseFreq * 2.0, 'sine', 0.25, 0.15, 0.22);
  }

  // Soft flip whoosh for flashcards
  function playFlip() {
    if (muted) return;
    const ctx = getContext();
    if (!ctx) return;

    playTone(330, 'sine', 0.08, 0, 0.1);
    playTone(440, 'triangle', 0.08, 0.03, 0.1);
  }

  // Tactile button tap
  function playClick() {
    if (muted) return;
    const ctx = getContext();
    if (!ctx) return;

    playTone(800, 'sine', 0.04, 0, 0.08);
  }

  // Level Up triumphant fanfare
  function playLevelUp() {
    if (muted) return;
    const ctx = getContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      playTone(freq, 'triangle', idx === 3 ? 0.6 : 0.15, idx * 0.12, 0.22);
    });
  }

  // Game Over sound
  function playGameOver() {
    if (muted) return;
    const ctx = getContext();
    if (!ctx) return;

    playTone(440, 'triangle', 0.2, 0, 0.15);       // A4
    playTone(392, 'triangle', 0.2, 0.18, 0.15);    // G4
    playTone(349.23, 'triangle', 0.4, 0.36, 0.18); // F4
  }

  // Countdown warning tick (e.g., when < 5 seconds left)
  function playTick() {
    if (muted) return;
    playTone(900, 'sine', 0.05, 0, 0.06);
  }

  return {
    isMuted,
    toggleMute,
    setMuted,
    playCorrect,
    playWrong,
    playStreak,
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
