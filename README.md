# ⚔️ Math Quest

An interactive, gamified mental math & multiplication table training game designed to make arithmetic practice addictive, fast, and fun.

---

## 🚀 Quick Start / How to Run

Because **Math Quest** is a lightweight, zero-dependency client application with built-in Web Audio synthesis and offline `localStorage` persistence, you can run and play it immediately:

1. **Via Web Server (Apache):**
   Navigate to:
   ```
   http://localhost/math-quest/
   ```
2. **Direct File Access:**
   Open `/var/www/html/math-quest/index.html` in any modern web browser (Chrome, Edge, Firefox, Safari).

---

## 🎮 Game Modes

1. **⚡ Speed Blitz (Time Attack):**
   * Race the clock (choose between **30s**, **60s**, or **120s** runs).
   * Build consecutive streaks to trigger score & XP multipliers (`1.5x`, `2x`, `3x`).
   * Fast-paced arcade action with milestone confetti bursts!

2. **❤️ Survival (3 Hearts):**
   * Start with 3 lives.
   * Every mistake costs one heart.
   * Untimed — tests pure precision and endurance.

3. **🎴 Flashcards (Study Mode):**
   * Self-paced 3D card flips.
   * Tap or press **Spacebar** to flip the card and reveal the answer with conceptual hints.
   * Rate your mastery with **🔴 Still Learning** or **🟢 Mastered!** to build confidence.

4. **⚡ Mistake Review Drill:**
   * Automatically collects any problem answered incorrectly during any round.
   * Allows players to replay and drill exclusively their missed equations until mastered!

---

## 🧮 Math Operations & Difficulties

* **Operations Supported:**
  * **Multiplication ($\times$):** Tables from $1 \times 1$ up to $20 \times 20$.
  * **Addition ($+$):** Single-digit to double-digit mental sums.
  * **Subtraction ($-$):** Always generates non-negative results ($a \ge b$).
  * **Mixed Mode (🎲):** Dynamically alternates across multiplication, addition, and subtraction.
* **Targeted Times Table Filter:**
  * Select specific multiplication tables (e.g. exclusively practice $7\times$, $8\times$, $9\times$, or $12\times$).
* **Difficulty Tiers:**
  * **🟢 Easy:** Tables 1–5, sums up to 20.
  * **🟡 Medium:** Tables 1–12 (standard full times table).
  * **🔴 Hard:** Tables 2–20, larger mental arithmetic.

---

## ⌨️ Dual Input Styles & Keyboard Shortcuts

* **🔘 Multiple Choice Mode:**
  * 4 dynamically generated options with realistic distractors.
  * Click the on-screen buttons or press **`1`**, **`2`**, **`3`**, **`4`** on your keyboard.
* **🔢 Direct Input Mode:**
  * Tactile on-screen numpad for mobile/tablets.
  * Physical keyboard support: type digits `0`–`9`, `Backspace` to delete, and `Enter` to submit.
* **Flashcards Navigation:**
  * `Spacebar` / Click: Flip card.
  * `1` or `ArrowLeft`: Need more practice.
  * `2` or `ArrowRight`: Mastered.

---

## 🏆 Progression & Audio

* **XP & Level Progression:** Earn experience points, climb from *Number Novice* to *Grand Math Sage*, and track lifetime statistics.
* **Zero Sound File Overhead:** All audio effects (correct chimes, buzzing errors, streak fanfares, card whooshes) are synthesized natively via the browser's **Web Audio API** (`AudioContext`). Includes an instant mute toggle.
* **Offline Local Storage:** No database required — streaks, high scores, accuracy, and review queues are saved securely in the browser.
