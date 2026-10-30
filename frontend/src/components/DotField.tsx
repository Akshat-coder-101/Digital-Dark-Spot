import { useEffect, useRef } from "react";

const N = 2200;
const V = (() => {
  const g = [0.35, 0.12, 0.93];
  const l = Math.hypot(...g);
  return g.map(v => v / l);
})();

export function DotField({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tok = (n: string, f: string) => {
      const css = getComputedStyle(document.documentElement);
      return css.getPropertyValue(n).trim() || f;
    };

    let cBody = tok("--color-seed-muted", tok("--color-foreground", "#9aa59d"));
    let cRim = tok("--color-rind", "#4FBF7A");
    let cEdge = tok("--color-crack", "#F2B84B");

    // Mutation observer to update colors if dark/light theme is toggled
    const themeObserver = new MutationObserver(() => {
      cBody = tok("--color-seed-muted", tok("--color-foreground", "#9aa59d"));
      cRim = tok("--color-rind", "#4FBF7A");
      cEdge = tok("--color-crack", "#F2B84B");
      if (reduce) {
        frame();
      }
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    const pts = Array.from({ length: N }, (_, i) => {
      const y = 1 - (2 * (i + 0.5)) / N;
      const r = Math.sqrt(1 - y * y);
      const th = i * 2.399963;
      const x = Math.cos(th) * r;
      const z = Math.sin(th) * r;
      const d = x * V[0] + y * V[1] + z * V[2];
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
        edge: d > 0.9 && d <= 0.93
      };
    });

    let size = 0, dpr = 1, ang = 0.6, placed = false;
    let mx = -9999, my = -9999;
    const RADIUS = 90, PUSH = 7;

    const target = (p: typeof pts[number]) => {
      const R = size * 0.38, c = size / 2, tilt = 0.35;
      const ca = Math.cos(ang), sa = Math.sin(ang), ct = Math.cos(tilt), st = Math.sin(tilt);
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

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const r = canvas.getBoundingClientRect();
      mx = e.clientX - r.left;
      my = e.clientY - r.top;
    };
    const onLeave = () => {
      mx = my = -9999;
    };
    if (!reduce) {
      window.addEventListener("pointermove", onMove);
      document.addEventListener("pointerleave", onLeave);
    }

    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(canvas);

    const frame = () => {
      if (size <= 0) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);
      if (!reduce) ang += 0.0012;
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
        if (p.edge) {
          ctx.fillStyle = cEdge;
          ctx.globalAlpha = 0.9 * back;
        } else if (rim > 0.82) {
          ctx.fillStyle = cRim;
          ctx.globalAlpha = (0.3 + 0.7 * rim * rim) * back;
        } else {
          ctx.fillStyle = cBody;
          ctx.globalAlpha = (0.12 + 0.35 * rim) * back;
        }
        const s = (p.edge ? 1.9 : 1.4) * t.s;
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
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className={`aspect-square w-full ${className}`}
      role="img"
      aria-label="Sphere of dots representing sources, with a void marking a potential information gap and amber dots at its edge."
    />
  );
}

export default DotField;
