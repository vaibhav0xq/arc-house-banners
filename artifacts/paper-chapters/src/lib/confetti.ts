/**
 * A short burst of paper offcuts, drawn on a throwaway full-screen canvas.
 * No dependency; ~1.8 s; skipped entirely under prefers-reduced-motion.
 */

type Piece = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  rot: number;
  vrot: number;
  tilt: number;
  vtilt: number;
  color: string;
};

const DURATION_MS = 1800;
const GRAVITY = 0.0016; // px per ms^2

export function burstPaperConfetti(opts: { x?: number; y?: number; colors: string[]; count?: number } ): void {
  if (typeof window === 'undefined') return;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  const colors = opts.colors.length ? opts.colors : ['#E8934A', '#1F2A5C', '#FBF3E0'];
  const count = opts.count ?? 90;

  const canvas = document.createElement('canvas');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  Object.assign(canvas.style, {
    position: 'fixed',
    inset: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: '9999',
  } satisfies Partial<CSSStyleDeclaration>);
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.remove();
    return;
  }
  ctx.scale(dpr, dpr);

  const originX = opts.x ?? window.innerWidth / 2;
  const originY = opts.y ?? window.innerHeight * 0.4;
  const pieces: Piece[] = Array.from({ length: count }, () => {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.9;
    const speed = 0.35 + Math.random() * 0.55;
    return {
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      w: 6 + Math.random() * 8,
      h: 8 + Math.random() * 14,
      rot: Math.random() * Math.PI,
      vrot: (Math.random() - 0.5) * 0.012,
      tilt: Math.random() * Math.PI,
      vtilt: 0.004 + Math.random() * 0.008,
      color: colors[Math.floor(Math.random() * colors.length)]!,
    };
  });

  let last = performance.now();
  const start = last;
  const frame = (now: number) => {
    const dt = Math.min(32, now - last);
    last = now;
    const t = now - start;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    const fade = t > DURATION_MS - 400 ? Math.max(0, (DURATION_MS - t) / 400) : 1;
    for (const p of pieces) {
      p.vy += GRAVITY * dt;
      p.vx *= 0.995;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vrot * dt;
      p.tilt += p.vtilt * dt;
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.scale(1, Math.abs(Math.cos(p.tilt)) * 0.85 + 0.15);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    if (t < DURATION_MS) {
      requestAnimationFrame(frame);
    } else {
      canvas.remove();
    }
  };
  requestAnimationFrame(frame);
}
