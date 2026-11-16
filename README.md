# ⚔️ Math Quest

An interactive, gamified mental math & multiplication table training game designed to make arithmetic practice addictive, fast, and fun.

---

## 🚀 Quick Start / How to Run

Because **Math Quest** is a lightweight, zero-dependency client application with built-in Web Audio synthesis, Web Speech API integration, and offline `localStorage` persistence, you can run and play it immediately:

1. **Via Web Server (Apache):**
   Navigate to:
   ```
   http://localhost/math-quest/
   ```
2. **Direct File Access:**
   Open `/var/www/html/math-quest/index.html` directly in any modern web browser (Chrome, Edge, Firefox, Safari).

---

## 🎮 Game Modes (Inline 5-Column Carousel)

Math Quest features a streamlined **inline mode selector** (5-column grid on desktop, touch-friendly horizontal swipe carousel on mobile) showcasing all 5 training formats:

1. **⚡ Speed Blitz (Time Attack):**
   * Race the clock (choose **30s**, **60s**, or **120s** runs).
   * **⏱️ Tiered Streak Time Bonus:** High streaks earn extra seconds back to the clock!
     * **Streak 3:** **+2s** Streak Bonus
     * **Streak 5:** **+3s** Fever Bonus
     * **Streak 10+ (every 5):** **+5s** Mega Streak Bonus
   * Build consecutive streaks to trigger score & XP multipliers (`1.5x`, `2x`, `3x`).
   * Reach a streak of **5+** to activate **🔥 Fever Mode** (3.5x multiplier, neon fiery border, accelerated BGM tempo!).

2. **♾️ Endless Cards (Choice-Based Continuous Practice):**
   * Untimed, pressure-free flashcard-style practice with multiple choice options.
   * Play as many problems as you want without life limits or ticking clocks.
   * Tracks your active card count (`#1`, `#2`, ...), streak bonuses, and XP.
   * Tap **Finish** anytime to end the session, review mistakes, and record your Endless High Score.

3. **🐉 RPG Boss Battle (Combat Mode):**
   * Real RPG combat against animated math monsters:
     * **Goblin Multiplier** (Tier 1, 100 HP)
     * **Iron Math Golem** (Tier 2, 160 HP)
     * **Calculus Hydra** (Tier 3, 240 HP)
   * Correct answers trigger player sword slash attacks with floating damage numbers.
   * Wrong answers or letting the 12s turn timer expire allows the boss to counter-attack!
   * Defeating bosses awards special badges, bonus XP, and celebratory confetti.

4. **❤️ Survival (3 Hearts):**
   * Start with 3 lives.
   * Every mistake costs one heart.
   * Untimed — tests pure precision and endurance under high stakes.

5. **🎴 Flashcards (Study Mode):**
   * Self-paced 3D card flips with touch swipe gestures (swipe left for learning, right for mastered).
   * Tap or press **Spacebar** to flip the card and reveal the answer with conceptual hints and **visual dot array area models**.
   * Rate your mastery with **Still Learning** or **Mastered!** to build confidence.

6. **⚡ Mistake Review Drill:**
   * Automatically collects any problem answered incorrectly during any round.
   * Allows players to replay and drill exclusively their missed equations until mastered!

---

## 🔲 12×12 Multiplication Matrix & Heatmap Explorer

* Click the **12×12 Grid** button in the top navigation bar to open the full interactive Pythagorean table.
* **Mastery Heatmap:**
  * 🟩 **Green (Mastered):** $\ge 80\%$ accuracy across attempts.
  * 🟨 **Yellow (Learning):** $50\% - 79\%$ accuracy.
  * 🟥 **Red (Needs Work):** $< 50\%$ accuracy.
  * ⬛ **Slate (Untested):** Not yet practiced.
* **Interactive Crosshairs:** Hovering/tapping any cell highlights the factors, shows historical accuracy stats, and provides a **"Practice Table of X"** button for instant focused drilling.

---

## 🟣 Visual Area Model (Dot Array Grid)

* Multiplication is visually represented as an interactive grid of glowing dots (e.g. $4 \times 6$ renders 4 rows of 6 glowing gems).
* **Zero Answer Spoiler:** The answer remains safely concealed as `?` until the user submits their response, at which point the full equation is highlighted in glowing emerald or rose.
* Available during quiz hints and on the back of study flashcards to help visual learners connect repeated addition to geometric arrays.

---

## 🎨 Professional Vector SVG Iconography

* All UI icons have been upgraded from casual emojis to crisp, clean, lightweight inline vector SVGs.
* Seamlessly styled for high-DPI retina displays with responsive coloring matching player rank, fever state, and active modes.

---

## 🎵 8-Bit Synth BGM & 🗣️ Voice Read-Aloud

* **Chiptune Arcade BGM:** Toggleable background music generated on the fly via the browser's native **Web Audio API** (zero MP3 files needed). Tempo and pitch dynamically accelerate when entering **Fever Mode**.
* **🗣️ Speech Synthesis:** Uses the native browser Speech API to read aloud equations (e.g. *"What is seven times eight?"*) — perfect for younger learners and auditory memorization.

---

## ⌨️ Dual Input Styles & Keyboard Shortcuts

* **Multiple Choice Mode:**
  * 4 dynamically generated options with realistic distractors.
  * Click on-screen buttons or press **`1`**, **`2`**, **`3`**, **`4`** on your keyboard.
* **Direct Input Mode:**
  * Tactile on-screen numpad for mobile/tablets.
  * Physical keyboard support: type digits `0`–`9`, `Backspace` to delete, and `Enter` to submit.
* **Flashcards Navigation:**
  * `Spacebar` / Click: Flip card.
  * `1` or `ArrowLeft`: Need more practice.
  * `2` or `ArrowRight`: Mastered.

---

## 🏆 Progression & Storage

* **XP & Level Progression:** Earn experience points, climb from *Number Novice* to *Grand Math Sage*, and track lifetime statistics.
* **Offline Local Storage:** No database required — streaks, high scores, accuracy, matrix heatmap data, and boss defeats are saved securely in the browser's `localStorage`.
