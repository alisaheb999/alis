import { useEffect, useRef, useState } from "react";
import { Clock3 } from 'lucide-react';

export type PriceSchedule = { nextIncreaseAt: number; serverNow: number };

export function TextPriceCountdown({ schedule, onExpire }: { schedule: PriceSchedule; onExpire: () => void }) {
  const [seconds, setSeconds] = useState<number | null>(null);
  const expire = useRef(onExpire);
  expire.current = onExpire;
  useEffect(() => {
    const started = performance.now();
    let notified = false;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((schedule.nextIncreaseAt - schedule.serverNow - (performance.now() - started)) / 1000));
      setSeconds(remaining);
      if (!remaining && !notified) { notified = true; expire.current(); }
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [schedule.nextIncreaseAt, schedule.serverNow]);
  const time = seconds === null ? "--:--:--" : [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60].map((v) => String(v).padStart(2, "0")).join(":");
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-danger" title="বর্তমান দামের সময়সীমা" aria-label="বর্তমান দামের সময়সীমা">
      <Clock3 className="size-3.5" aria-hidden="true" />
      <time className="font-mono tabular-nums">{time}</time>
    </span>
  );
}
