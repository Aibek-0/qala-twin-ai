"use client";
import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { fmt } from "@/lib/api";
export default function AnimatedNumber({
  value,
  locale,
  currency = false,
}: {
  value: string | number | null;
  locale: string;
  currency?: boolean;
}) {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(value === null ? null : Number(value));
  useEffect(() => {
    if (value === null) {
      setDisplay(null);
      return;
    }
    const target = Number(value);
    if (reduced) {
      setDisplay(target);
      return;
    }
    let frame = 0;
    let start = 0;
    function tick(time: number) {
      if (!start) start = time;
      const progress = Math.min(1, (time - start) / 650);
      setDisplay(target * (1 - (1 - progress) ** 3));
      if (progress < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, reduced]);
  return (
    <span aria-label={fmt(value, locale, currency)}>
      <span aria-hidden="true">{fmt(display, locale, currency)}</span>
    </span>
  );
}
