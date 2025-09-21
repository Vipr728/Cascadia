"use client";

import { useState } from 'react';

export default function PlaceCall() {
  const [to, setTo] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  // Time-only input (HH:MM) to imply daily schedule
  const [whenTime, setWhenTime] = useState<string>("");
  const [scheduledFor, setScheduledFor] = useState<Date | null>(null);
  const [timerId, setTimerId] = useState<number | null>(null);
  const [editing, setEditing] = useState<boolean>(false);

  async function placeCall() {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch('/api/voice?action=call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || 'Failed to place call');
        setResult(data);
      } else {
        setResult(data);
      }
    } catch (e: any) {
      setError(e?.message || 'Unexpected error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-2 w-full flex justify-center">
      <div className="inline-flex items-center gap-2">
        <input
          className="w-56 rounded-full bg-[#141414] border border-[#303030] px-3 py-1.5 text-sm text-white placeholder-[#808080] focus:outline-none focus:ring-2 focus:ring-[#00b8a3]/60 disabled:opacity-60 disabled:cursor-not-allowed"
          placeholder="+1XXXXXXXXXX"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          disabled={!!scheduledFor && !editing}
        />
        {(!scheduledFor || editing) && (
          <input
            type="time"
            className="rounded-full bg-[#141414] border border-[#303030] px-3 py-1.5 text-sm text-white placeholder-[#808080] focus:outline-none focus:ring-2 focus:ring-[#00b8a3]/60"
            value={whenTime}
            onChange={(e) => setWhenTime(e.target.value)}
          />
        )}
        <button
          onClick={() => {
            setError(null);
            setResult(null);
            if (!to.trim()) { setError('Enter a phone number'); return; }
            if (!whenTime) { setError('Pick a time'); return; }
            // Compute next occurrence today/tomorrow based on selected HH:MM
            const now = new Date();
            const [hhStr, mmStr] = whenTime.split(':');
            const hh = Math.max(0, Math.min(23, Number(hhStr)));
            const mm = Math.max(0, Math.min(59, Number(mmStr)));
            const target = new Date(now);
            target.setSeconds(0, 0);
            target.setHours(hh, mm, 0, 0);
            if (target.getTime() <= now.getTime()) {
              target.setDate(target.getDate() + 1);
            }
            const delay = target.getTime() - now.getTime();
            if (delay <= 0) { setError('Time is in the past'); return; }
            if (timerId) { window.clearTimeout(timerId); }
            const id = window.setTimeout(() => {
              placeCall();
              setScheduledFor(null);
              setTimerId(null);
            }, delay);
            setTimerId(id);
            setScheduledFor(target);
            setEditing(false);
          }}
          disabled={loading || !to.trim()}
          className="px-4 py-1.5 rounded-full bg-[#00b8a3] text-black text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_0_1px_rgba(0,184,163,0.2)_inset]"
        >
          {scheduledFor ? (editing ? 'Save' : 'Reschedule') : 'Schedule'}
        </button>
      </div>
      {error && (
        <div className="text-[#ff6b6b] text-xs mt-1">{error}</div>
      )}
      {scheduledFor && !editing && (
        <div className="text-xs mt-3 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#101010] border border-[#303030] px-3 py-1 text-[#d1d5db] whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00b8a3]"></span>
            <span>Daily at {whenTime || `${scheduledFor.getHours().toString().padStart(2,'0')}:${scheduledFor.getMinutes().toString().padStart(2,'0')}`}</span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#101010] border border-[#303030] px-3 py-1 text-[#cbd5e1] whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-[#9aa0a6]"></span>
            <span>Next {scheduledFor.toLocaleString()}</span>
          </div>
          <button
            className="inline-flex items-center rounded-full border border-[#303030] bg-[#111111] text-[#cbd5e1] text-[11px] px-3 py-1 hover:bg-[#151515]"
            onClick={() => {
              const dt = scheduledFor as Date;
              const pad = (n: number) => String(n).padStart(2, '0');
              const val = `${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
              setWhenTime(val);
              setEditing(true);
            }}
            aria-label="Change scheduled time"
            title="Change scheduled time"
          >
            Change
          </button>
        </div>
      )}
    </div>
  );
}


