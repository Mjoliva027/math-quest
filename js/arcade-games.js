/**
 * Interactive Arcade Mini-Games for Math Quest
 * 1. MeteorBlaster (HTML5 Canvas space defense with power-up meteors & direct/tap targeting)
 * 2. TugOfWar (2-Player same-device split-screen math duel)
 */

const ArcadeGames = (() => {
  // =========================================================================
  // 1. METEOR BLASTER (CANVAS ARCADE)
  // =========================================================================
  const MeteorBlaster = (() => {
    let canvas, ctx;
    let waveEl, scoreEl, comboEl, shieldsEl, pbChaserEl, stageEl;
    let pauseOverlay, btnPause, btnResume, btnExit;
    let inputValEl, btnClear;
    let quickChoiceBtns = [];
    let numpadBtns = [];
    let bound = false;

    const state = {
      running: false,
      paused: false,
      rafId: null,
      lastFrameTime: 0,
      width: 600,
      height: 360,
      wave: 1,
      waveKills: 0,
      score: 0,
      combo: 0,
      maxStreak: 0,
      correctCount: 0,
      totalCount: 0,
      shields: 3,
      xpGained: 0,
      spawnTimer: 0,
      spawnCount: 0,
      freezeUntil: 0,
      targetPB: 0,
      pbBeaten: false,
      laserSkin: 'indigo',
      inputVal: '',
      meteors: [],
      lasers: [],
      particles: [],
      popups: [],
      stars: [],
      config: null,
      callbacks: null,
    };

    const LASER_SKINS = {
      indigo: { turret: '#4f46e5', laser: '#6366f1', glow: '#818cf8' },
      cyan: { turret: '#0891b2', laser: '#22d3ee', glow: '#67e8f9' },
      solar: { turret: '#d97706', laser: '#fbbf24', glow: '#fde047' },
      prism: { turret: '#ec4899', laser: '#a855f7', glow: '#38bdf8', prism: true },
    };

    const COMBO_CALLOUTS = {
      3: '3× SHARP!',
      5: '5× ON FIRE!',
      8: '8× BLAZING!',
      10: '10× UNSTOPPABLE!',
      15: '15× LEGEND!',
      20: '20× GODLIKE!',
    };

    function getSkinPalette(nowMs = Date.now()) {
      const base = LASER_SKINS[state.laserSkin] || LASER_SKINS.indigo;
      if (base.prism) {
        const hue = Math.floor((nowMs / 10) % 360);
        return {
          turret: `hsl(${hue}, 85%, 58%)`,
          laser: `hsl(${(hue + 45) % 360}, 92%, 62%)`,
          glow: `hsl(${(hue + 90) % 360}, 95%, 70%)`,
        };
      }
      return base;
    }

    function triggerShake() {
      if (!stageEl) return;
      stageEl.classList.remove('arena-shake');
      void stageEl.offsetWidth;
      stageEl.classList.add('arena-shake');
      setTimeout(() => {
        if (stageEl) stageEl.classList.remove('arena-shake');
      }, 360);
    }

    function bindElements() {
      if (bound) return;
      canvas = document.getElementById('meteor-canvas');
      ctx = canvas ? canvas.getContext('2d') : null;
      waveEl = document.getElementById('meteor-wave');
      scoreEl = document.getElementById('meteor-score');
      comboEl = document.getElementById('meteor-combo');
      shieldsEl = document.getElementById('meteor-shields');
      pbChaserEl = document.getElementById('meteor-pb-chaser');
      stageEl = document.getElementById('meteor-stage');
      pauseOverlay = document.getElementById('meteor-pause-overlay');
      btnPause = document.getElementById('btn-meteor-pause');
      btnResume = document.getElementById('btn-meteor-resume');
      btnExit = document.getElementById('btn-meteor-exit');
      inputValEl = document.getElementById('meteor-input-val');
      btnClear = document.getElementById('btn-meteor-clear');
      quickChoiceBtns = Array.from(document.querySelectorAll('.meteor-choice-btn'));
      numpadBtns = Array.from(document.querySelectorAll('.meteor-numpad-btn'));

      if (btnPause) btnPause.addEventListener('click', togglePause);
      if (btnResume) btnResume.addEventListener('click', togglePause);
      if (btnExit) {
        btnExit.addEventListener('click', () => {
          if (typeof SoundEngine !== 'undefined') SoundEngine.playClick();
          const exitCb = state.callbacks && state.callbacks.onExit;
          stop();
          if (exitCb) exitCb();
        });
      }

      if (btnClear) {
        btnClear.addEventListener('click', () => {
          if (!state.running || state.paused) return;
          if (typeof SoundEngine !== 'undefined') SoundEngine.playClick();
          state.inputVal = '';
          updateInputDisplay();
        });
      }

      quickChoiceBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          if (!state.running || state.paused) return;
          const val = btn.dataset.answer;
          if (val !== undefined && val !== '') {
            tryFireAnswer(val, true);
          }
        });
      });

      numpadBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          if (!state.running || state.paused) return;
          if (typeof SoundEngine !== 'undefined') SoundEngine.playClick();
          const key = btn.dataset.key;
          handleDirectKey(key);
        });
      });

      window.addEventListener('resize', () => {
        if (state.running) resizeCanvas();
      });

      bound = true;
    }

    function resizeCanvas() {
      if (!canvas || !ctx) return;
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(280, Math.round(rect.width || 600));
      const h = Math.max(240, Math.round(rect.height || 340));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      state.width = w;
      state.height = h;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (state.stars.length === 0) {
        for (let i = 0; i < 42; i++) {
          state.stars.push({
            x: Math.random() * w,
            y: Math.random() * (h - 40),
            r: 0.7 + Math.random() * 1.4,
            phase: Math.random() * Math.PI * 2,
          });
        }
      }
    }

    function updateInputDisplay() {
      if (inputValEl) {
        inputValEl.textContent = state.inputVal !== '' ? state.inputVal : '_';
      }
    }

    function syncHUD() {
      if (waveEl) waveEl.textContent = `Wave ${state.wave}`;
      if (scoreEl) scoreEl.textContent = state.score;
      if (comboEl) comboEl.textContent = `x${state.combo}`;
      if (pbChaserEl) {
        if (state.targetPB > 0) {
          pbChaserEl.classList.remove('hidden');
          if (state.score > state.targetPB) {
            pbChaserEl.textContent = '🏆 NEW PB!';
            pbChaserEl.className = 'px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-[10px] font-bold font-mono text-emerald-300';
          } else {
            pbChaserEl.textContent = `🔥 ${state.targetPB - state.score} to PB`;
            pbChaserEl.className = 'px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[10px] font-bold font-mono text-amber-300';
          }
        } else {
          pbChaserEl.classList.add('hidden');
        }
      }
      if (shieldsEl) {
        shieldsEl.innerHTML = '';
        for (let i = 0; i < 3; i++) {
          const alive = i < state.shields;
          const dot = document.createElement('span');
          dot.className = `inline-block w-3 h-3 rounded-full transition-all ${
            alive ? 'bg-cyan-400 shadow-sm shadow-cyan-400/60' : 'bg-slate-700 opacity-40'
          }`;
          shieldsEl.appendChild(dot);
        }
      }
    }

    function syncQuickChoices() {
      if (quickChoiceBtns.length === 0) return;
      if (state.meteors.length === 0) {
        quickChoiceBtns.forEach(btn => {
          btn.textContent = '—';
          btn.dataset.answer = '';
          btn.disabled = true;
        });
        return;
      }

      const sorted = [...state.meteors].sort((a, b) => b.y - a.y);
      const urgent = sorted[0];
      const values = new Set([urgent.problem.answer]);

      for (let i = 1; i < sorted.length && values.size < 4; i++) {
        values.add(sorted[i].problem.answer);
      }

      const distractors = urgent.problem.options || [];
      for (const opt of distractors) {
        if (values.size >= 4) break;
        values.add(opt);
      }

      let fallback = urgent.problem.answer + 1;
      while (values.size < 4) {
        if (!values.has(fallback)) values.add(fallback);
        fallback++;
      }

      const arr = Array.from(values);
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }

      quickChoiceBtns.forEach((btn, idx) => {
        const val = arr[idx];
        btn.textContent = val;
        btn.dataset.answer = String(val);
        btn.disabled = false;
      });
    }

    function spawnMeteor() {
      if (typeof MathEngine === 'undefined') return;
      const cfg = state.config || {};
      const activeAnswers = new Set(state.meteors.map(m => m.problem.answer));
      let problem = null;
      for (let tries = 0; tries < 10; tries++) {
        const candidate = MathEngine.generateProblem({
          operation: cfg.operation || 'multiply',
          difficulty: cfg.difficulty || 'medium',
          customTables: cfg.customTables || [],
          weakFacts: cfg.weakFacts || [],
        });
        if (!activeAnswers.has(candidate.answer)) {
          problem = candidate;
          break;
        }
        problem = candidate;
      }

      state.spawnCount++;
      let kind = 'normal';
      if (state.spawnCount % 6 === 0) {
        const kinds = ['cryo', 'nova', 'shield'];
        kind = kinds[Math.floor(Math.random() * kinds.length)];
        if (kind === 'shield' && state.shields >= 3) {
          kind = 'nova';
        }
      }

      const margin = 52;
      const usableW = Math.max(80, state.width - margin * 2);
      const x = margin + Math.random() * usableW;
      const baseSpeed = 24 + (state.wave - 1) * 6;
      const speed = baseSpeed + Math.random() * 12;

      state.meteors.push({
        id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        x,
        y: -26,
        vx: (Math.random() - 0.5) * 10,
        speed,
        radius: 28,
        kind,
        problem,
      });
      syncQuickChoices();
    }

    function spawnParticles(x, y, color, count = 14) {
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
        const spd = 40 + Math.random() * 120;
        state.particles.push({
          x,
          y,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd,
          life: 0.45 + Math.random() * 0.25,
          maxLife: 0.7,
          color,
          size: 2 + Math.random() * 2.5,
        });
      }
    }

    function destroyMeteor(meteor, awardExtra = true) {
      const idx = state.meteors.indexOf(meteor);
      if (idx !== -1) state.meteors.splice(idx, 1);

      const palette = getSkinPalette();
      const colors = {
        normal: palette.laser,
        cryo: '#22d3ee',
        nova: '#f59e0b',
        shield: '#10b981',
      };
      const color = colors[meteor.kind] || palette.laser;

      state.lasers.push({
        x1: state.width / 2,
        y1: state.height - 20,
        x2: meteor.x,
        y2: meteor.y,
        color,
        life: 0.16,
      });
      spawnParticles(meteor.x, meteor.y, color, 16);

      if (awardExtra) {
        state.correctCount++;
        state.totalCount++;
        state.combo++;
        state.maxStreak = Math.max(state.maxStreak, state.combo);

        const mult = state.combo >= 10 ? 3 : state.combo >= 5 ? 2 : state.combo >= 3 ? 1.5 : 1;
        const pts = Math.round(25 * mult);
        state.score += pts;
        state.xpGained += 4;
        state.waveKills++;

        if (state.callbacks && state.callbacks.onStatsAttempt) {
          state.callbacks.onStatsAttempt(meteor.problem, true, null);
        }

        state.popups.push({
          x: meteor.x,
          y: meteor.y,
          text: `+${pts}`,
          color: '#34d399',
          life: 0.85,
        });

        if (meteor.kind === 'cryo') {
          state.freezeUntil = Date.now() + 5000;
          state.popups.push({ x: state.width / 2, y: 60, text: 'FREEZE WAVE!', color: '#22d3ee', life: 1.1 });
        } else if (meteor.kind === 'shield') {
          if (state.shields < 3) state.shields++;
          state.popups.push({ x: state.width / 2, y: 60, text: '+1 SHIELD!', color: '#34d399', life: 1.1 });
        } else if (meteor.kind === 'nova') {
          state.popups.push({ x: state.width / 2, y: 60, text: 'NOVA BLAST!', color: '#fbbf24', life: 1.1 });
          triggerShake();
          const remaining = [...state.meteors];
          remaining.forEach(other => destroyMeteor(other, false));
          state.score += remaining.length * 20;
        }

        if (COMBO_CALLOUTS[state.combo]) {
          state.popups.push({ x: state.width / 2, y: 118, text: COMBO_CALLOUTS[state.combo], color: '#fde047', life: 1.05 });
        }

        if (state.targetPB > 0 && !state.pbBeaten && state.score > state.targetPB) {
          state.pbBeaten = true;
          state.popups.push({ x: state.width / 2, y: 40, text: '🏆 NEW RECORD!', color: '#34d399', life: 1.4 });
          if (typeof Confetti !== 'undefined') Confetti.burst(35);
          if (typeof SoundEngine !== 'undefined') SoundEngine.playLevelUp();
        }

        if (state.waveKills >= 6) {
          state.wave++;
          state.waveKills = 0;
          state.popups.push({ x: state.width / 2, y: 90, text: `WAVE ${state.wave}!`, color: '#a5b4fc', life: 1.1 });
          if (typeof SoundEngine !== 'undefined') SoundEngine.playStreak(state.combo);
        } else if (typeof SoundEngine !== 'undefined') {
          SoundEngine.playSlash();
        }
      } else {
        state.score += 20;
        state.popups.push({ x: meteor.x, y: meteor.y, text: '+20', color: '#fbbf24', life: 0.7 });
      }
    }

    function tryFireAnswer(rawStr, isExplicitSubmit) {
      if (!state.running || state.paused || state.meteors.length === 0) return;
      const str = String(rawStr || '').trim();
      if (!str) return;
      const num = Number(str);

      const matches = state.meteors
        .filter(m => m.problem.answer === num)
        .sort((a, b) => b.y - a.y);

      if (matches.length > 0) {
        const prefixConflict = !isExplicitSubmit && state.meteors.some(m => {
          const ansStr = String(m.problem.answer);
          return ansStr !== str && ansStr.startsWith(str);
        });
        if (!prefixConflict) {
          destroyMeteor(matches[0], true);
          state.inputVal = '';
          updateInputDisplay();
          if (navigator.vibrate) navigator.vibrate(14);
          syncHUD();
          syncQuickChoices();
        }
        return;
      }

      if (isExplicitSubmit) {
        state.totalCount++;
        state.combo = 0;
        state.inputVal = '';
        updateInputDisplay();
        if (typeof SoundEngine !== 'undefined') SoundEngine.playWrong();
        if (navigator.vibrate) navigator.vibrate([30, 20, 30]);
        const lowest = [...state.meteors].sort((a, b) => b.y - a.y)[0];
        if (lowest && state.callbacks && state.callbacks.onStatsAttempt) {
          state.callbacks.onStatsAttempt(lowest.problem, false, null);
        }
        state.popups.push({
          x: state.width / 2,
          y: state.height - 56,
          text: 'MISS!',
          color: '#fb7185',
          life: 0.7,
        });
        syncHUD();
      }
    }

    function handleDirectKey(key) {
      if (!state.running || state.paused) return;
      if (key === 'clear') {
        state.inputVal = '';
      } else if (key === 'backspace') {
        state.inputVal = state.inputVal.slice(0, -1);
      } else if (key === 'enter') {
        if (state.inputVal.length > 0) {
          tryFireAnswer(state.inputVal, true);
          return;
        }
      } else if (/^[0-9]$/.test(key)) {
        if (state.inputVal.length < 4) {
          state.inputVal += key;
        }
        updateInputDisplay();
        tryFireAnswer(state.inputVal, false);
        return;
      }
      updateInputDisplay();
    }

    function handleKey(e) {
      if (!state.running) return false;
      if (e.key === 'Escape') {
        togglePause();
        return true;
      }
      if (state.paused) return true;
      if (/^[0-9]$/.test(e.key)) {
        if (typeof SoundEngine !== 'undefined') SoundEngine.playClick();
        handleDirectKey(e.key);
        return true;
      }
      if (e.key === 'Backspace') {
        if (typeof SoundEngine !== 'undefined') SoundEngine.playClick();
        handleDirectKey('backspace');
        return true;
      }
      if (e.key === 'Enter') {
        handleDirectKey('enter');
        return true;
      }
      return false;
    }

    function togglePause() {
      if (!state.running) return;
      if (typeof SoundEngine !== 'undefined') SoundEngine.playClick();
      state.paused = !state.paused;
      if (pauseOverlay) {
        pauseOverlay.classList.toggle('hidden', !state.paused);
      }
      if (!state.paused) {
        state.lastFrameTime = performance.now();
      }
    }

    function updateFrame(dt) {
      const now = Date.now();
      const isFrozen = now < state.freezeUntil;
      const speedFactor = isFrozen ? 0.3 : 1.0;

      const spawnInterval = Math.max(1.05, 2.5 - (state.wave - 1) * 0.22);
      state.spawnTimer += dt * speedFactor;
      if (state.meteors.length === 0 || (state.spawnTimer >= spawnInterval && state.meteors.length < 5)) {
        state.spawnTimer = 0;
        spawnMeteor();
      }

      const shieldLineY = state.height - 26;
      for (let i = state.meteors.length - 1; i >= 0; i--) {
        const m = state.meteors[i];
        m.x += m.vx * dt * speedFactor;
        if (m.x < 44 || m.x > state.width - 44) m.vx *= -1;
        m.x = Math.max(44, Math.min(state.width - 44, m.x));
        m.y += m.speed * dt * speedFactor;

        if (m.y + m.radius >= shieldLineY) {
          state.meteors.splice(i, 1);
          state.shields--;
          state.combo = 0;
          state.totalCount++;
          spawnParticles(m.x, shieldLineY, '#f43f5e', 18);
          state.popups.push({
            x: m.x,
            y: shieldLineY - 16,
            text: `${m.problem.equation} = ${m.problem.answer}`,
            color: '#fda4af',
            life: 1.1,
          });
          if (state.callbacks && state.callbacks.onStatsAttempt) {
            state.callbacks.onStatsAttempt(m.problem, false, null);
          }
          if (typeof SoundEngine !== 'undefined') SoundEngine.playBossAttack();
          triggerShake();
          if (navigator.vibrate) navigator.vibrate([40, 30, 60]);
          syncHUD();
          syncQuickChoices();

          if (state.shields <= 0) {
            const summary = {
              score: state.score,
              maxStreak: state.maxStreak,
              correctCount: state.correctCount,
              totalCount: state.totalCount,
              wave: state.wave,
              xpGained: state.xpGained,
            };
            const finishCb = state.callbacks && state.callbacks.onFinish;
            stop();
            if (finishCb) finishCb(summary);
            return;
          }
        }
      }

      for (let i = state.lasers.length - 1; i >= 0; i--) {
        state.lasers[i].life -= dt;
        if (state.lasers[i].life <= 0) state.lasers.splice(i, 1);
      }
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) state.particles.splice(i, 1);
      }
      for (let i = state.popups.length - 1; i >= 0; i--) {
        const pop = state.popups[i];
        pop.y -= 28 * dt;
        pop.life -= dt;
        if (pop.life <= 0) state.popups.splice(i, 1);
      }
    }

    function drawFrame(nowMs) {
      if (!ctx) return;
      const isLight = document.documentElement.classList.contains('theme-light');
      const w = state.width;
      const h = state.height;

      const grad = ctx.createLinearGradient(0, 0, 0, h);
      if (isLight) {
        grad.addColorStop(0, '#e0f2fe');
        grad.addColorStop(1, '#f8fafc');
      } else {
        grad.addColorStop(0, '#020617');
        grad.addColorStop(1, '#0f172a');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Background stars
      state.stars.forEach(s => {
        const alpha = 0.25 + 0.45 * Math.sin(nowMs * 0.002 + s.phase);
        ctx.fillStyle = isLight ? `rgba(79, 70, 229, ${alpha * 0.35})` : `rgba(199, 210, 254, ${alpha})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Freeze tint
      if (Date.now() < state.freezeUntil) {
        ctx.fillStyle = 'rgba(34, 211, 238, 0.09)';
        ctx.fillRect(0, 0, w, h);
      }

      // Shield base arc
      ctx.strokeStyle = state.shields > 1 ? '#22d3ee' : '#f43f5e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(16, h - 22);
      ctx.quadraticCurveTo(w / 2, h - 34, w - 16, h - 22);
      ctx.stroke();

      // Turret dot
      const palette = getSkinPalette(nowMs);
      ctx.fillStyle = palette.turret;
      ctx.beginPath();
      ctx.arc(w / 2, h - 18, 8, Math.PI, 0);
      ctx.fill();

      // Lasers
      state.lasers.forEach(l => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, l.life / 0.16);
        ctx.strokeStyle = l.color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(l.x1, l.y1);
        ctx.lineTo(l.x2, l.y2);
        ctx.stroke();
        ctx.restore();
      });

      // Meteors
      state.meteors.forEach(m => {
        const themeMap = {
          normal: { fill: isLight ? '#312e81' : '#1e1b4b', stroke: '#818cf8', tag: '' },
          cryo: { fill: '#083344', stroke: '#22d3ee', tag: 'ICE' },
          nova: { fill: '#451a03', stroke: '#fbbf24', tag: 'NOVA' },
          shield: { fill: '#064e3b', stroke: '#34d399', tag: '+HP' },
        };
        const style = themeMap[m.kind] || themeMap.normal;

        // Flame tail
        ctx.fillStyle = style.stroke + '33';
        ctx.beginPath();
        ctx.moveTo(m.x - 12, m.y);
        ctx.lineTo(m.x + 12, m.y);
        ctx.lineTo(m.x, m.y - 42);
        ctx.closePath();
        ctx.fill();

        // Meteor body pill
        const label = m.problem.equation;
        ctx.font = 'bold 14px monospace';
        const pillW = Math.max(66, ctx.measureText(label).width + 24);
        const pillH = 34;
        const rx = m.x - pillW / 2;
        const ry = m.y - pillH / 2;

        ctx.fillStyle = style.fill;
        ctx.strokeStyle = style.stroke;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(rx, ry, pillW, pillH, 12);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, m.x, m.y + 1);

        if (style.tag) {
          ctx.font = 'bold 9px sans-serif';
          ctx.fillStyle = style.stroke;
          ctx.fillText(style.tag, m.x, ry - 7);
        }
      });

      // Particles
      state.particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Popups
      state.popups.forEach(pop => {
        ctx.save();
        ctx.globalAlpha = Math.min(1, pop.life);
        ctx.font = 'bold 13px monospace';
        ctx.fillStyle = pop.color;
        ctx.textAlign = 'center';
        ctx.fillText(pop.text, pop.x, pop.y);
        ctx.restore();
      });
    }

    function loop(nowMs) {
      if (!state.running) return;
      if (!state.paused) {
        const dt = Math.min(0.05, Math.max(0.001, (nowMs - state.lastFrameTime) / 1000));
        state.lastFrameTime = nowMs;
        updateFrame(dt);
      }
      if (state.running) {
        drawFrame(nowMs);
        state.rafId = requestAnimationFrame(loop);
      }
    }

    function start({ operation, difficulty, customTables, weakFacts, targetPB = 0, laserSkin = 'indigo', onStatsAttempt, onFinish, onExit }) {
      bindElements();
      stop();

      state.config = { operation, difficulty, customTables, weakFacts };
      state.callbacks = { onStatsAttempt, onFinish, onExit };
      state.targetPB = Number(targetPB) || 0;
      state.pbBeaten = false;
      state.laserSkin = LASER_SKINS[laserSkin] ? laserSkin : 'indigo';
      state.wave = 1;
      state.waveKills = 0;
      state.score = 0;
      state.combo = 0;
      state.maxStreak = 0;
      state.correctCount = 0;
      state.totalCount = 0;
      state.shields = 3;
      state.xpGained = 0;
      state.spawnTimer = 0;
      state.spawnCount = 0;
      state.freezeUntil = 0;
      state.inputVal = '';
      state.meteors = [];
      state.lasers = [];
      state.particles = [];
      state.popups = [];
      state.stars = [];
      state.paused = false;
      state.running = true;

      if (pauseOverlay) pauseOverlay.classList.add('hidden');
      resizeCanvas();
      updateInputDisplay();
      spawnMeteor();
      syncHUD();

      state.lastFrameTime = performance.now();
      state.rafId = requestAnimationFrame(loop);
    }

    function stop() {
      state.running = false;
      state.paused = false;
      if (state.rafId) {
        cancelAnimationFrame(state.rafId);
        state.rafId = null;
      }
    }

    return { start, stop, handleKey };
  })();

  // =========================================================================
  // 2. 2-PLAYER SAME-DEVICE TUG-OF-WAR DUEL
  // =========================================================================
  const TugOfWar = (() => {
    let bound = false;
    let p1Zone, p2Zone, p1Eq, p2Eq, p1Status, p2Status;
    let p1Btns = [], p2Btns = [];
    let ropeKnot, ropeLabel;
    let victoryOverlay, winnerTitle, winnerStats;
    let btnFlip, btnExit, btnRematch, btnLobby;

    const state = {
      running: false,
      flipped: false,
      ropePos: 0, // -5 (P1 wins) to +5 (P2 wins)
      p1Score: 0,
      p2Score: 0,
      p1Problem: null,
      p2Problem: null,
      p1StunUntil: 0,
      p2StunUntil: 0,
      p1Timer: null,
      p2Timer: null,
      config: null,
      callbacks: null,
    };

    function bindElements() {
      if (bound) return;
      p1Zone = document.getElementById('tug-p1-zone');
      p2Zone = document.getElementById('tug-p2-zone');
      p1Eq = document.getElementById('tug-p1-equation');
      p2Eq = document.getElementById('tug-p2-equation');
      p1Status = document.getElementById('tug-p1-status');
      p2Status = document.getElementById('tug-p2-status');
      p1Btns = Array.from(document.querySelectorAll('.tug-p1-choice'));
      p2Btns = Array.from(document.querySelectorAll('.tug-p2-choice'));
      ropeKnot = document.getElementById('tug-rope-knot');
      ropeLabel = document.getElementById('tug-rope-label');
      victoryOverlay = document.getElementById('tug-victory-overlay');
      winnerTitle = document.getElementById('tug-winner-title');
      winnerStats = document.getElementById('tug-winner-stats');
      btnFlip = document.getElementById('btn-tug-flip');
      btnExit = document.getElementById('btn-tug-exit');
      btnRematch = document.getElementById('btn-tug-rematch');
      btnLobby = document.getElementById('btn-tug-lobby');

      p1Btns.forEach(btn => {
        btn.addEventListener('click', () => submitChoice(1, btn.dataset.answer));
      });
      p2Btns.forEach(btn => {
        btn.addEventListener('click', () => submitChoice(2, btn.dataset.answer));
      });

      if (btnFlip) {
        btnFlip.addEventListener('click', () => {
          if (typeof SoundEngine !== 'undefined') SoundEngine.playClick();
          state.flipped = !state.flipped;
          if (p1Zone) p1Zone.classList.toggle('rotate-180', state.flipped);
        });
      }

      if (btnExit) {
        btnExit.addEventListener('click', () => {
          if (typeof SoundEngine !== 'undefined') SoundEngine.playClick();
          const cb = state.callbacks && state.callbacks.onExit;
          stop();
          if (cb) cb();
        });
      }

      if (btnRematch) {
        btnRematch.addEventListener('click', () => {
          if (typeof SoundEngine !== 'undefined') SoundEngine.playClick();
          if (state.config && state.callbacks) {
            start({ ...state.config, ...state.callbacks });
          }
        });
      }

      if (btnLobby) {
        btnLobby.addEventListener('click', () => {
          if (typeof SoundEngine !== 'undefined') SoundEngine.playClick();
          const cb = state.callbacks && state.callbacks.onExit;
          stop();
          if (cb) cb();
        });
      }

      bound = true;
    }

    function loadPlayerProblem(playerNum) {
      if (typeof MathEngine === 'undefined') return;
      const cfg = state.config || {};
      const prob = MathEngine.generateProblem({
        operation: cfg.operation || 'multiply',
        difficulty: cfg.difficulty || 'medium',
        customTables: cfg.customTables || [],
      });

      if (playerNum === 1) {
        state.p1Problem = prob;
        if (p1Eq) p1Eq.textContent = prob.equation;
        p1Btns.forEach((btn, idx) => {
          const val = prob.options[idx];
          btn.textContent = val;
          btn.dataset.answer = String(val);
        });
      } else {
        state.p2Problem = prob;
        if (p2Eq) p2Eq.textContent = prob.equation;
        p2Btns.forEach((btn, idx) => {
          const val = prob.options[idx];
          btn.textContent = val;
          btn.dataset.answer = String(val);
        });
      }
    }

    function syncRopeUI() {
      const pct = Math.max(5, Math.min(95, 50 + state.ropePos * 9));
      if (ropeKnot) ropeKnot.style.left = `${pct}%`;
      if (ropeLabel) {
        if (state.ropePos === 0) {
          ropeLabel.textContent = 'EVEN!';
        } else if (state.ropePos < 0) {
          ropeLabel.textContent = `P1 +${Math.abs(state.ropePos)}`;
        } else {
          ropeLabel.textContent = `P2 +${state.ropePos}`;
        }
      }
    }

    function submitChoice(playerNum, answerStr) {
      if (!state.running || answerStr === undefined) return;
      const now = Date.now();
      if (playerNum === 1 && now < state.p1StunUntil) return;
      if (playerNum === 2 && now < state.p2StunUntil) return;

      const prob = playerNum === 1 ? state.p1Problem : state.p2Problem;
      if (!prob) return;

      const isCorrect = Number(answerStr) === prob.answer;
      if (isCorrect) {
        if (typeof SoundEngine !== 'undefined') SoundEngine.playCorrect();
        if (navigator.vibrate) navigator.vibrate(12);
        if (playerNum === 1) {
          state.p1Score++;
          state.ropePos--;
          if (p1Status) p1Status.textContent = `Pull! (${state.p1Score})`;
        } else {
          state.p2Score++;
          state.ropePos++;
          if (p2Status) p2Status.textContent = `Pull! (${state.p2Score})`;
        }
        syncRopeUI();

        if (state.ropePos <= -5 || state.ropePos >= 5) {
          const winner = state.ropePos <= -5 ? 1 : 2;
          finishMatch(winner);
          return;
        }
        loadPlayerProblem(playerNum);
      } else {
        if (typeof SoundEngine !== 'undefined') SoundEngine.playWrong();
        if (navigator.vibrate) navigator.vibrate([30, 20, 30]);
        const stunMs = 800;
        if (playerNum === 1) {
          state.p1StunUntil = now + stunMs;
          if (p1Zone) p1Zone.classList.add('tug-stunned');
          if (p1Status) p1Status.textContent = 'Oops! Wait...';
          clearTimeout(state.p1Timer);
          state.p1Timer = setTimeout(() => {
            if (p1Zone) p1Zone.classList.remove('tug-stunned');
            if (p1Status) p1Status.textContent = `Ready (${state.p1Score})`;
            if (state.running) loadPlayerProblem(1);
          }, stunMs);
        } else {
          state.p2StunUntil = now + stunMs;
          if (p2Zone) p2Zone.classList.add('tug-stunned');
          if (p2Status) p2Status.textContent = 'Oops! Wait...';
          clearTimeout(state.p2Timer);
          state.p2Timer = setTimeout(() => {
            if (p2Zone) p2Zone.classList.remove('tug-stunned');
            if (p2Status) p2Status.textContent = `Ready (${state.p2Score})`;
            if (state.running) loadPlayerProblem(2);
          }, stunMs);
        }
      }
    }

    function finishMatch(winner) {
      state.running = false;
      if (typeof SoundEngine !== 'undefined') SoundEngine.playLevelUp();
      if (typeof Confetti !== 'undefined') Confetti.cannon();
      if (winnerTitle) winnerTitle.textContent = `Player ${winner} Wins!`;
      if (winnerStats) {
        winnerStats.textContent = `Player 1: ${state.p1Score} pulls · Player 2: ${state.p2Score} pulls (+20 Practice XP)`;
      }
      if (victoryOverlay) victoryOverlay.classList.remove('hidden');
      if (state.callbacks && state.callbacks.onWin) {
        state.callbacks.onWin({ winner, p1Score: state.p1Score, p2Score: state.p2Score });
      }
    }

    function handleKey(e) {
      if (!state.running) return false;
      if (e.key === 'Escape') {
        const cb = state.callbacks && state.callbacks.onExit;
        stop();
        if (cb) cb();
        return true;
      }
      const key = e.key.toLowerCase();
      const p1Map = { a: 0, s: 1, d: 2, f: 3 };
      const p2Map = { j: 0, k: 1, l: 2, ';': 3 };
      if (key in p1Map) {
        const btn = p1Btns[p1Map[key]];
        if (btn) submitChoice(1, btn.dataset.answer);
        return true;
      }
      if (key in p2Map) {
        const btn = p2Btns[p2Map[key]];
        if (btn) submitChoice(2, btn.dataset.answer);
        return true;
      }
      return false;
    }

    function start({ operation, difficulty, customTables, onWin, onExit }) {
      bindElements();
      stop();

      state.config = { operation, difficulty, customTables };
      state.callbacks = { onWin, onExit };
      state.ropePos = 0;
      state.p1Score = 0;
      state.p2Score = 0;
      state.p1StunUntil = 0;
      state.p2StunUntil = 0;
      state.running = true;

      if (victoryOverlay) victoryOverlay.classList.add('hidden');
      if (p1Zone) p1Zone.classList.remove('tug-stunned');
      if (p2Zone) p2Zone.classList.remove('tug-stunned');
      if (p1Status) p1Status.textContent = 'Ready (0)';
      if (p2Status) p2Status.textContent = 'Ready (0)';

      syncRopeUI();
      loadPlayerProblem(1);
      loadPlayerProblem(2);
    }

    function stop() {
      state.running = false;
      clearTimeout(state.p1Timer);
      clearTimeout(state.p2Timer);
      state.p1Timer = null;
      state.p2Timer = null;
      if (p1Zone) p1Zone.classList.remove('tug-stunned');
      if (p2Zone) p2Zone.classList.remove('tug-stunned');
    }

    return { start, stop, handleKey };
  })();

  return {
    MeteorBlaster,
    TugOfWar,
  };
})();
