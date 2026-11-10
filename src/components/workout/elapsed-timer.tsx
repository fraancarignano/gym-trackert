"use client";

import { useSyncExternalStore } from "react";
import { formatElapsed } from "@/lib/format";

// Un solo reloj compartido que avisa cada segundo.
let now = Date.now();
const listeners = new Set<() => void>();
let interval: ReturnType<typeof setInterval> | null = null;

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (interval === null) {
    now = Date.now();
    interval = setInterval(() => {
      now = Date.now();
      listeners.forEach((l) => l());
    }, 1000);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && interval !== null) {
      clearInterval(interval);
      interval = null;
    }
  };
}

/** Tiempo transcurrido desde `startedAt` ("12:34"). En el servidor no muestra nada. */
export function ElapsedTimer({ startedAt, className }: { startedAt: string; className?: string }) {
  const current = useSyncExternalStore(
    subscribe,
    () => now,
    () => null,
  );
  return (
    <span className={className} aria-label="Tiempo transcurrido">
      {current === null ? "--:--" : formatElapsed(current - Date.parse(startedAt))}
    </span>
  );
}
