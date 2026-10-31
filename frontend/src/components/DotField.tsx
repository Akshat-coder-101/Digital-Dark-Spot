import { useEffect, useRef } from "react";

const N = 2000;
const V = (() => {
  const g = [0.35, 0.12, 0.93];
  const l = Math.hypot(...g);
  return g.map(v => v / l);
})();

export function DotField({
  className = "",
  isFocused = false,
  charCount = 0
}: {
  className?: string;
  isFocused?: boolean;
  charCount?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const focusedRef = useRef(isFocused);
  focusedRef.current = isFocused;

  const charCountRef = useRef(charCount);
  charCountRef.current = charCount;
  const prevCharCountRef = useRef(charCount);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tok = (n: string) => {
      const css = getComputedStyle(document.documentElement);
      return css.getPropertyValue(n).trim();
    };

    let cBody = tok("--text-muted") || tok("--color-text-muted") || "currentColor";
    let cRim = tok("--signal") || tok("--color-signal") || "currentColor";
    let cEdge = tok("--conflict") || tok("--color-conflict") || "currentColor";

    // Mutation observer to update colors if dark/light theme is toggled
    const themeObserver = new MutationObserver(() => {
      cBody = tok("--text-muted") || tok("--color-text-muted") || "currentColor";
      cRim = tok("--signal") || tok("--color-signal") || "currentColor";
      cEdge = tok("--conflict") || tok("--color-conflict") || "currentColor";
      if (reduce) {
        frame();
      }
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    // Generate points on Fibonacci sphere with dense equatorial belt
    const pts = Array.from({ length: N }, (_, i) => {
      const y = 1 - (2 * (i + 0.5)) / N;
      const r = Math.sqrt(1 - y * y);
      const th = i * 2.399963;
      const x = Math.cos(th) * r;
      const z = Math.sin(th) * r;
      const d = x * V[0] + y * V[1] + z * V[2];
      const inBelt = Math.abs(y) < 0.22;
      return {
        mx: x,
        my: y,
        mz: z,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        k: 0.012 + Math.random() * 0.02,
        hole: d > 0.93,
        edge: d > 0.89 && d <= 0.93,
        belt: inBelt
      };
    });

    let size = 0, dpr = 1, ang = 0.6, placed = false;
    let mx = -9999, my = -9999;
    let tiltX = 0, targetTiltX = 0;
    let tiltY = 0, targetTiltY = 0;
    let angVel = 0;
    let isDragging = false;
    let lastClientX = 0;
    const RADIUS = 90, PUSH = 7;

    const target = (p: typeof pts[number]) => {
      const R = size * 0.38, c = size / 2;
      const currentTilt = 0.35 + tiltX;
      const currentAng = ang + tiltY;
      const ca = Math.cos(currentAng), sa = Math.sin(currentAng);
      const ct = Math.cos(currentTilt), st = Math.sin(currentTilt);
      const x1 = p.mx * ca + p.mz * sa, z1 = -p.mx * sa + p.mz * ca;
      const y2 = p.my * ct - z1 * st, z2 = p.my * st + z1 * ct;
      const s = 3 / (3 - z2);
      return { tx: c + x1 * R * s, ty: c + y2 * R * s, z: z2, s };
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      size = canvas.clientWidth || 300;
      canvas.width = canvas.height = size * dpr;
      if (!placed) {
        placed = true;
        for (const p of pts) {
          if (reduce) {
            const t = target(p);
            p.x = t.tx;
            p.y = t.ty;
          } else {
            p.x = Math.random() * size;
            p.y = Math.random() * size; // scattered start
          }
        }
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // Interactive 3D hover and drag listeners
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const r = canvas.getBoundingClientRect();
      const cx = e.clientX - r.left;
      const cy = e.clientY - r.top;

      // Active parallax zone (over and around the canvas)
      if (cx >= -80 && cx <= size + 80 && cy >= -80 && cy <= size + 80) {
        mx = cx;
        my = cy;
        const normX = Math.max(-1.5, Math.min(1.5, (cx - size / 2) / (size / 2)));
        const normY = Math.max(-1.5, Math.min(1.5, (cy - size / 2) / (size / 2)));
        targetTiltX = -normY * 0.45;
        targetTiltY = normX * 0.65;

        if (isDragging) {
          const dx = e.clientX - lastClientX;
          ang += dx * 0.006;
          angVel = dx * 0.002;
          lastClientX = e.clientX;
        }
      } else {
        targetTiltX = 0;
        targetTiltY = 0;
        mx = my = -9999;
      }
    };

    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      isDragging = true;
      lastClientX = e.clientX;
    };

    const onUp = () => {
      isDragging = false;
    };

    const onLeave = () => {
      targetTiltX = 0;
      targetTiltY = 0;
      isDragging = false;
      mx = my = -9999;
    };

    if (!reduce) {
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      canvas.addEventListener("pointerdown", onDown);
      document.addEventListener("pointerleave", onLeave);
    }

    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(canvas);

    const frame = () => {
      if (size <= 0) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);

      if (!reduce) {
        const baseSpeed = focusedRef.current ? 0.0022 : 0.0012;
        ang += baseSpeed + angVel;
        angVel *= 0.92;

        // Subtle gentle impulse on user typing
        if (charCountRef.current !== prevCharCountRef.current) {
          prevCharCountRef.current = charCountRef.current;
          angVel += 0.0006;
        }

        tiltX += (targetTiltX - tiltX) * 0.08;
        tiltY += (targetTiltY - tiltY) * 0.08;
      }

      for (const p of pts) {
        if (p.hole) continue;
        const t = target(p);
        if (reduce) {
          p.x = t.tx;
          p.y = t.ty;
        } else {
          p.vx += (t.tx - p.x) * p.k;
          p.vy += (t.ty - p.y) * p.k;
          const dx = p.x - mx, dy = p.y - my, d = Math.hypot(dx, dy);
          if (d < RADIUS && d > 0.01) {
            const f = Math.pow(1 - d / RADIUS, 2) * PUSH;
            p.vx += (dx / d) * f;
            p.vy += (dy / d) * f;
          }
          p.vx *= 0.86;
          p.vy *= 0.86;
          p.x += p.vx;
          p.y += p.vy;
        }

        const rim = 1 - Math.abs(t.z), back = t.z < 0 ? 0.45 : 1;
        const focusBoost = focusedRef.current ? 0.12 : 0;

        if (p.edge) {
          ctx.fillStyle = cEdge;
          ctx.globalAlpha = Math.min(1, 0.95 * back + focusBoost);
        } else if (p.belt && Math.random() > 0.28) {
          // Equatorial amber belt matching motion.dev
          ctx.fillStyle = cEdge;
          ctx.globalAlpha = Math.min(1, (0.35 + 0.6 * rim + focusBoost) * back);
        } else if (rim > 0.82) {
          ctx.fillStyle = cRim;
          ctx.globalAlpha = Math.min(1, (0.3 + 0.7 * rim * rim + focusBoost) * back);
        } else {
          ctx.fillStyle = cBody;
          ctx.globalAlpha = Math.min(1, (0.12 + 0.35 * rim) * back);
        }

        const isSpecial = p.edge || p.belt;
        const s = (isSpecial ? 1.75 : 1.35) * t.s;
        ctx.fillRect(p.x, p.y, s, s);
      }
      ctx.globalAlpha = 1;
    };

    let raf = 0;
    const loop = () => {
      if (visible && !document.hidden) frame();
      raf = requestAnimationFrame(loop);
    };
    if (reduce) {
      frame();
    } else {
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      themeObserver.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className={`aspect-square w-full cursor-grab active:cursor-grabbing select-none ${className}`}
      role="img"
      aria-label="3D particle sphere representing sources with an interactive hover parallax tilt and a void marking potential information gaps."
    />
  );
}

export default DotField;
