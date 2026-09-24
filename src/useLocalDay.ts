import { useEffect, useState } from 'react';
import { localDay, millisecondsUntilNextLocalDay } from './domain';

/** Keep a mounted screen on the device's current calendar day. */
export function useLocalDay() {
  const [day, setDay] = useState(() => localDay(new Date()));
  useEffect(() => {
    let midnightTimer: number;
    const schedule = () => {
      window.clearTimeout(midnightTimer);
      midnightTimer = window.setTimeout(() => {
        check();
      }, millisecondsUntilNextLocalDay(new Date()) + 50);
    };
    const check = () => { setDay(localDay(new Date())); schedule(); };
    schedule();
    const safetyTimer = window.setInterval(check, 60_000);
    window.addEventListener('focus', check);
    document.addEventListener('visibilitychange', check);
    return () => {
      window.clearTimeout(midnightTimer);
      window.clearInterval(safetyTimer);
      window.removeEventListener('focus', check);
      document.removeEventListener('visibilitychange', check);
    };
  }, []);
  return day;
}
