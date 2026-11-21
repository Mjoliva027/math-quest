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

## 🎮 Game Modes & Daily Sprint

Math Quest features a streamlined **6-card inline mode selector** (responsive grid on desktop, horizontal swipe carousel on mobile) plus the Daily Math Challenge and Mistake Review Drill:

1. **📅 Daily Math Challenge (15-Question Sprint):**
   * Deterministic date-seeded 15-problem sprint mixing Multiplication, Division, and Mystery Factor so every learner solves the exact same set each day.
   * Awards a **+50 Bonus XP** first-completion reward and generates a **Wordle-style emoji share grid** (`🟩`/`🟥`, time, and streak).

2. **⚔️ PvP Arena (Online 1v1 HP Battle, Online Tug-of-War & 2P Local):**
   * **Find Online Match:** Queue up on Vercel + Upstash Redis (`/api/match`) with live online & searching player counts, **PvP Trophy Ranks** (*Bronze → Legend*), **Quick Emotes**, and real-time **1v1 HP Battles** or **Online Tug-of-War**.
   * **8-Second AI Rival Fallback:** If playing offline, locally, or when no human opponent is waiting, an adaptive AI Rival automatically steps in so you can battle anytime.
   * **Friend Room Codes & Invite Links:** Create a 6-letter Room Code or share `?mode=pvp&code=XXXXXX&format=duel|tug` to duel friends directly.
   * **Same-Device 2P Tug-of-War:** Launch split-screen offline 2-player duels (`A/S/D/F` vs `J/K/L/;` + **Flip Top 180°**) right from the PvP Hub.

3. **☄️ Meteor Blaster (HTML5 Canvas Arcade):**
   * Glowing equations descend toward your 3-shield base in real time!
   * Type answers via physical keyboard/numpad or tap quick-target pills to fire lasers with particle explosions and wave progression.
   * Catch **❄️ Freeze**, **💥 Nova**, and **🛡️ Shield** power-up meteors.

4. **❤️ Survival Gauntlet (Endless Tower):**
   * Climb Floors (every 5 correct answers advances a floor with **+25 Bonus XP** and escalating difficulty + score multipliers!).
   * Beat the tightening per-question fuse (`15s` down to `7s`, with `❚❚` / `Esc` Pause), recover **+1 Heart** on a **10-answer streak**, and deploy **50/50 Hint** & **Shield Skip** tactical lifelines.

5. **⚡ Speed Blitz (Time Attack):**
   * Race the clock (choose **30s**, **60s**, or **120s** runs) with **Pause / Resume** (`Esc`), tiered Streak Time Bonuses (`+2s` / `+3s` / `+5s`), and **🔥 Fever Mode** (`3.5x` points + live Fever meter).

6. **♾️ Endless Cards & 🎴 Study Flashcards:**
   * Pressure-free untimed drills (`Finish` anytime) and 3D flip flashcards with **interactive skip-counting dot arrays** (tap any row to count by multiples!).

7. **⚡ Mistake Review Drill:**
   * Automatically collects missed equations across rounds and rotates missed cards to the back of the queue until mastered.

---

## 🏆 Leaderboards & Free Vercel Hosting (GitHub + Upstash Redis)

Math Quest supports **Hybrid Leaderboards**:
* **This Device (Offline):** Always works out of the box across all local learner profiles (Total XP, Today's Daily, Best Blitz, Survival Gauntlet, Meteor Blaster).
* **Online Global, Friend Rooms & PvP Matchmaking (Vercel Serverless):** Hosted via `api/leaderboard.js` and `api/match.js` (zero npm packages) using Upstash Redis REST API. Enter any **Room Code** (e.g. `GRADE4B`) on leaderboards to compete exclusively with a classroom or friend group!

### Deploy Free on Vercel via GitHub:
1. Push this repository to a GitHub repo.
2. Import the repo into **Vercel** (Hobby free tier — framework preset: **Other**, build command: none, output directory: `.`).
3. *(Optional for Online Leaderboards & Online PvP)* Add **Upstash Redis** from the **Vercel Marketplace / Storage** tab so `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are automatically attached to your project, then redeploy.
4. Security headers and `sw.js` cache headers are pre-configured in `vercel.json`.

---

## 🔢 Operations & Adaptive Learning

* **6 Operation Modes:** Multiplication (`×`), Division (`÷`), Mystery Factor (`? × b = c`), Addition (`+`), Subtraction (`−`), and Mixed.
* **Recommended Next Quest:** Analyzes your mistake queue, per-table accuracy, and response-time fluency (`>4.5s` slow facts) to suggest the highest-impact next drill or speed challenge.
* **Daily Streak & Daily Quests:** Earn consecutive-day streaks and complete 3 rotating daily quests for bonus XP.

---

## 👥 Multi-Player Profiles, Star Shop, Companion & Sharing

* **Star Shop, Cosmetics & Streak Freeze:** Earn Stars from rounds, Daily Quests, Daily Challenge, and PvP matches to unlock rare avatars, glowing avatar frames, Meteor Blaster laser skins, extra themes (*Synthwave*, *Nebula*, *Forest*), and **Streak Freeze Shields**.
* **Evolving Math Companion:** Hatch and evolve a 5-stage pet in the lobby as you level up and master multiplication tables.
* **Async Ghost Challenge Links:** Share `?ghost=1&...` links from Speed Blitz or Daily Challenge results so friends can race your exact problem deck against a live pace bar.
* **Weekly Collaborative Room Goals:** Joining any Room Code on Leaderboards tracks shared weekly team progress (`500` equations solved together).
* **3-Star Table Mastery Map:** View `0–3` stars per table (`×2`–`×12`) in the 12×12 Grid modal based on accuracy and sub-2.5s speed fluency.
* **Local Player Profiles:** Switch, create, or remove separate learner profiles on shared family tablets or classroom devices without overwriting streaks or 12×12 heatmaps.
* **Shareable Teacher / Parent Practice Links:** Click **Copy Practice Link** in Customize Practice to generate URL parameters (`?mode=...&op=...&diff=...&tables=...&input=...&dur=...`) that pre-configure a shared assignment.
* **Dark & Daylight Classroom Themes:** Toggle between the signature dark arcade theme, high-contrast light theme, and unlockable shop themes persisted per profile.
* **Parent / Teacher Progress Snapshot:** View facts mastered out of 78 (`1×1`–`12×12`), mastered tables, average response speed, and top focus facts inside Career Stats, with **Print / Save PDF** support.

---

## 🔲 12×12 Multiplication Matrix & Heatmap Explorer

* Click the **12×12 Grid** button in the top navigation bar to open the full interactive Pythagorean table.
* **Mastery Heatmap:**
  * 🟩 **Green (Mastered):** >= 80% accuracy across attempts.
  * 🟨 **Yellow (Learning):** 50% - 79% accuracy.
  * 🟥 **Red (Needs Work):** < 50% accuracy.
  * ⬛ **Slate (Untested):** Not yet practiced.
* **Interactive Crosshairs:** Hovering/tapping any cell highlights the factors, shows historical accuracy & average speed stats, and provides a **"Table of X"** button for instant focused drilling.

---

## 🟣 Visual Area Model (Dot Array Grid)

* Multiplication is visually represented as an interactive grid of glowing dots (e.g. `4 × 6` renders 4 rows of 6 glowing gems).
* **Zero Answer Spoiler:** The answer remains safely concealed as `?` until the user submits their response, at which point the full equation is highlighted in glowing emerald or rose.

---

## ⌨️ Dual Input Styles, Auto-Submit & Keyboard Shortcuts

* **Multiple Choice Mode:** 4 dynamically generated options; click or press **`1`**, **`2`**, **`3`**, **`4`**.
* **Direct Input Mode:** Tactile on-screen numpad with **Backspace (`⌫`)**, **Clear**, and optional **Auto-Submit** (submits automatically once typed digits match the answer length), plus physical keyboard `0`–`9`, `Backspace`, `Enter`, and `Esc` to pause/resume or exit.
* **Flashcards Navigation:** `Spacebar` / Tap / Click to flip; `1` or `ArrowLeft` for Still Learning; `2` or `ArrowRight` for Mastered.

---

## 🏆 Progression, Achievements & Offline PWA Storage

* **XP & Level Progression:** Climb from *Number Novice* to *Grand Math Sage* across 8 unlockable milestone badges.
* **Persisted Preferences & JSON Backup:** All lobby settings, theme, and auto-submit preferences persist automatically, with full JSON export/import backup inside Career Stats.
* **Offline Local Storage & PWA:** Installable via `manifest.json`, PNG icons, in-app **Install** prompt, and Service Worker (`sw.js`, `math-quest-v4`).

---

## 🧪 Automated Testing

Math Quest includes an integrated Node.js test suite covering math generation, seeded PvP decks, PvP combat/tug-of-war state, Survival Gauntlet floors, deterministic daily challenges, multi-profile storage, leaderboard safety, and JSON data integrity:

```bash
node tests/runner.js
```
