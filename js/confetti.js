/**
 * Lightweight Canvas Confetti Engine for Math Quest
 * Pure vanilla JavaScript - no external dependencies!
 */

const Confetti = (() => {
  let canvas = null;
  let ctx = null;
  let particles = [];
  let animationId = null;
  let isRunning = false;

  const COLORS = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
    '#8B5CF6', '#EC4899', '#06B6D4', '#F97316',
  ];

  function initCanvas() {
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'confetti-canvas';
      canvas.style.position = 'fixed';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.width = '100vw';
      canvas.style.height = '100vh';
      canvas.style.pointerEvents = 'none';
      canvas.style.zIndex = '9999';
      document.body.appendChild(canvas);
      ctx = canvas.getContext('2d');
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
  }

  function resizeCanvas() {
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
  }

  function createParticle(x, y) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 8 + 4;
    return {
      x: x || window.innerWidth / 2,
      y: y || window.innerHeight / 3,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 4, // slight upward impulse
      size: Math.random() * 8 + 5,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 12,
      opacity: 1,
      gravity: 0.18,
      drag: 0.98,
      decay: Math.random() * 0.015 + 0.008,
    };
  }

  function render() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.vx *= p.drag;
      p.vy += p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;
      p.opacity -= p.decay;

      if (p.opacity <= 0 || p.y > canvas.height + 20) {
        particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.globalAlpha = Math.max(0, p.opacity);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    }

    if (particles.length > 0) {
      animationId = requestAnimationFrame(render);
    } else {
      isRunning = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  function burst(count = 70, originX = null, originY = null) {
    initCanvas();
    const x = originX || window.innerWidth / 2;
    const y = originY || window.innerHeight * 0.4;

    for (let i = 0; i < count; i++) {
      particles.push(createParticle(x, y));
    }

    if (!isRunning) {
      isRunning = true;
      render();
    }
  }

  function cannon() {
    initCanvas();
    // Left cannon
    for (let i = 0; i < 40; i++) {
      const p = createParticle(100, window.innerHeight - 50);
      p.vx = Math.random() * 10 + 5;
      p.vy = -(Math.random() * 14 + 10);
      particles.push(p);
    }
    // Right cannon
    for (let i = 0; i < 40; i++) {
      const p = createParticle(window.innerWidth - 100, window.innerHeight - 50);
      p.vx = -(Math.random() * 10 + 5);
      p.vy = -(Math.random() * 14 + 10);
      particles.push(p);
    }

    if (!isRunning) {
      isRunning = true;
      render();
    }
  }

  return {
    burst,
    cannon,
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Confetti;
}
