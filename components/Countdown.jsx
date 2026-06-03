'use client';
import { useEffect, useState } from 'react';

const TARGET = new Date('2026-06-18T00:00:00-06:00').getTime();

function pad(n) {
  return n < 10 ? '0' + n : String(n);
}

export default function Countdown() {
  const [diff, setDiff] = useState(null);

  useEffect(() => {
    setDiff(TARGET - Date.now());
    const timer = setInterval(() => setDiff(TARGET - Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const skeleton = (
    <div className="countdown" aria-label="Cuenta regresiva para la Feria San Juan 2026">
      <span className="cd-label"><span className="spark"></span> Cuenta regresiva</span>
      <div className="cd-row">
        <div className="cd-unit"><b>--</b><span>días</span></div>
        <div className="cd-unit"><b>--</b><span>horas</span></div>
        <div className="cd-unit"><b>--</b><span>min</span></div>
        <div className="cd-unit"><b>--</b><span>seg</span></div>
      </div>
    </div>
  );

  if (diff === null) return skeleton;
  if (diff <= 0) return <div className="cd-live">¡La Feria San Juan ya comenzó! 🎉</div>;

  const s = Math.floor(diff / 1000);
  return (
    <div className="countdown" aria-label="Cuenta regresiva para la Feria San Juan 2026">
      <span className="cd-label"><span className="spark"></span> Cuenta regresiva</span>
      <div className="cd-row">
        <div className="cd-unit"><b>{Math.floor(s / 86400)}</b><span>días</span></div>
        <div className="cd-unit"><b>{pad(Math.floor((s % 86400) / 3600))}</b><span>horas</span></div>
        <div className="cd-unit"><b>{pad(Math.floor((s % 3600) / 60))}</b><span>min</span></div>
        <div className="cd-unit"><b>{pad(s % 60)}</b><span>seg</span></div>
      </div>
    </div>
  );
}
