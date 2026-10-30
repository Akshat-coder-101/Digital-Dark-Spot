import { useEffect, useRef } from "react";

const N = 2400;
const GAP = [0.35, 0.12, 0.93]; // direction of the void, model space
const gl = Math.hypot(...GAP);
const G = GAP.map((v) => v / gl);

export function DarkSpotSphere({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const css = getComputedStyle(document.documentElement);
    const col = (name: string, fallback: string) =>
      css.getPropertyValue(name).trim() || fallback;
    const cBody = col("--color-seed", col("--foreground", "#999")); // main dots
    const cRim = col("--color-rind", "#4FBF7A");      // bright limb
    const cCrack = col("--color-crack", "#F2B84B");   // void edge

    // points on a Fibonacci sphere
    const pts = Array.from({ length: N }, (_, i) => {
      const y = 1 - (2 * (i + 0.5)) / N;
      const r = Math.sqrt(1 - y * y);
      const th = i * 2.399963;
      const x = Math.cos(th) * r, z = Math.sin(th) * r;
      const d = x * G[0] + y * G[1] + z * G[2];
      const a = Math.random() * Math.PI * 2, b = Math.random() * 2 - 1;
      const k = 1.8 + Math.random() * 1.6;
      return {
        x, y, z,
        sx: Math.cos(a) * Math.sqrt(1 - b * b) * k, sy: b * k,
        sz: Math.sin(a) * Math.sqrt(1 - b * b) * k,
        void: d > 0.93, edge: d > 0.9 && d <= 0.93,
        delay: Math.random() * 0.4,
      };
    });

    let size = 0, dpr = 1;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      size = canvas.clientWidth;
      if (size === 0) return;
      canvas.width = canvas.height = size * dpr;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let mx = 0, my = 0;
    const onMove = (e: PointerEvent) => {
      mx = (e.clientX / window.innerWidth - 0.5) * 0.3;
      my = (e.clientY / window.innerHeight - 0.5) * 0.2;
    };
    if (!reduce) window.addEventListener("pointermove", onMove);

    let visible = true;
    const io = new IntersectionObserver(([e]) => {
      if (e) visible = e.isIntersecting;
    });
    io.observe(canvas);

    const start = performance.now();
    let raf = 0;
    const draw = (now: number) => {
      if (size === 0) return;
      const t = reduce ? 1e6 : now - start;
      const intro = Math.min(1, t / 1800);
      const ang = reduce ? 0.6 : t * 0.00012 + mx;
      const tilt = 0.35 + my;
      const ca = Math.cos(ang), sa = Math.sin(ang);
      const ct = Math.cos(tilt), st = Math.sin(tilt);
      const R = size * 0.38, c = size / 2;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of pts) {
        const e0 = Math.min(1, Math.max(0, (intro - p.delay) / (1 - 0.4)));
        const e = 1 - Math.pow(1 - e0, 3);
        let x = p.sx + (p.x - p.sx) * e;
        let y = p.sy + (p.y - p.sy) * e;
        let z = p.sz + (p.z - p.sz) * e;
        // rotate Y then X
        const x1 = x * ca + z * sa, z1 = -x * sa + z * ca;
        const y2 = y * ct - z1 * st, z2 = y * st + z1 * ct;
        const persp = 3 / (3 - z2);
        const sx = (c + x1 * R * persp) * dpr;
        const sy = (c + y2 * R * persp) * dpr;
        const rim = 1 - Math.abs(z2);
        const back = z2 < 0 ? 0.45 : 1;

        if (p.void) {
          if (Math.random() < 0.015 && e0 === 1 && !reduce) { /* rare stray dot in the void */
            ctx.globalAlpha = 0.5; ctx.fillStyle = cCrack;
            ctx.fillRect(sx, sy, 1.2 * dpr, 1.2 * dpr);
          }
          continue;
        }
        if (p.edge) { ctx.fillStyle = cCrack; ctx.globalAlpha = 0.9 * back * e; }
        else if (rim > 0.82) { ctx.fillStyle = cRim; ctx.globalAlpha = (0.3 + 0.7 * rim * rim) * back * e; }
        else { ctx.fillStyle = cBody; ctx.globalAlpha = (0.12 + 0.35 * rim) * back * e; }
        const s = (p.edge ? 1.8 : 1.3) * persp * dpr;
        ctx.fillRect(sx, sy, s, s);
      }
      ctx.globalAlpha = 1;
      if (!reduce) raf = requestAnimationFrame(loop);
    };
    const loop = (now: number) => {
      if (visible && !document.hidden) draw(now);
      else if (!reduce) raf = requestAnimationFrame(loop);
    };
    if (reduce) draw(performance.now());
    else raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className={`aspect-square w-full ${className}`}
      role="img"
      aria-label="Sphere of dots representing sources, with a void showing a potential information gap and amber dots marking a possible conflict at its edge."
    />
  );
}
