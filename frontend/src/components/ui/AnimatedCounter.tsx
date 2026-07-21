"use client";
import { useEffect, useRef, useState } from "react";

export default function AnimatedCounter({ to, duration = 1.2 }: { to: number; duration?: number }) {
  const [value, setValue] = useState(0);
  const start = useRef<number | null>(null);

  useEffect(() => {
    let raf: number;
    function tick(ts: number) {
      if (start.current === null) start.current = ts;
      const progress = Math.min((ts - start.current) / (duration * 1000), 1);
      setValue(Math.round(progress * to));
      if (progress < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, duration]);

  return <>{value.toLocaleString()}</>;
}
