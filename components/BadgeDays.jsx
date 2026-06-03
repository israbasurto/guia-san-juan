'use client';
import { useEffect, useState } from 'react';

const TARGET = new Date('2026-06-18T00:00:00-06:00').getTime();

export default function BadgeDays() {
  const [days, setDays] = useState('--');

  useEffect(() => {
    const d = Math.ceil((TARGET - Date.now()) / 86400000);
    setDays(d > 0 ? d : '🎉');
  }, []);

  return <b id="badge-days">{days}</b>;
}
