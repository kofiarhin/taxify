import { useEffect, useState } from 'react';

const toMillis = (startedAt) => {
  if (!startedAt) return null;
  const parsed = startedAt instanceof Date ? startedAt.getTime() : new Date(startedAt).getTime();
  return Number.isNaN(parsed) ? null : parsed;
};

export const useElapsedSeconds = (startedAt, active = true) => {
  const startMs = toMillis(startedAt);
  const compute = () => (startMs ? Math.max(0, Math.floor((Date.now() - startMs) / 1000)) : 0);
  const [seconds, setSeconds] = useState(compute);

  useEffect(() => {
    if (!startMs || !active) {
      setSeconds(0);
      return undefined;
    }
    setSeconds(Math.max(0, Math.floor((Date.now() - startMs) / 1000)));
    const id = setInterval(() => {
      setSeconds(Math.max(0, Math.floor((Date.now() - startMs) / 1000)));
    }, 1000);
    return () => clearInterval(id);
  }, [startMs, active]);

  return seconds;
};

export const formatElapsed = (totalSeconds) => {
  const safe = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  const pad = (value) => String(value).padStart(2, '0');
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
};

