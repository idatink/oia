'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
  open: boolean;
  bookingId: string | null;
  patientName: string;
  currentScheduledAt: string | null;
  onClose: () => void;
  onSuccess: () => void;
};

function toLocalDateTimeValue(iso: string | null): { date: string; time: string } {
  if (!iso) {
    const now = new Date();
    return {
      date: now.toISOString().slice(0, 10),
      time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
    };
  }
  const d = new Date(iso);
  return {
    date: d.toISOString().slice(0, 10),
    time: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
  };
}

export default function RescheduleModal({ open, bookingId, patientName, currentScheduledAt, onClose, onSuccess }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const init = toLocalDateTimeValue(currentScheduledAt);
  const [date, setDate] = useState(init.date);
  const [time, setTime] = useState(init.time);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      const i = toLocalDateTimeValue(currentScheduledAt);
      setDate(i.date);
      setTime(i.time);
      setNotes('');
      setError(null);
    }
  }, [open, currentScheduledAt]);

  const handleSubmit = async () => {
    if (!bookingId) return;
    setSaving(true);
    setError(null);

    // Combine date + time into ISO string (treat as local time)
    const localDT = new Date(`${date}T${time}:00`);
    if (isNaN(localDT.getTime())) {
      setError('Invalid date or time.');
      setSaving(false);
      return;
    }

    const res = await fetch(`/api/bookings/${bookingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scheduledAt: localDT.toISOString(),
        status: 'RESCHEDULED',
        ...(notes ? { notes } : {}),
      }),
    });

    if (!res.ok) {
      setError('Failed to reschedule. Please try again.');
      setSaving(false);
      return;
    }

    setSaving(false);
    onSuccess();
    onClose();
  };

  return (
    <>
      <div
        ref={overlayRef}
        onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
        className={`fixed inset-0 z-50 flex items-center justify-center px-4 bg-on-surface/30 transition-opacity duration-200 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
        <div className={`w-full max-w-sm bg-surface-container-lowest rounded-card2 border border-outline-variant/20 shadow-2xl transition-all duration-200 ${open ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
          {/* Header */}
          <div className="px-5 py-4 border-b border-outline-variant/20 flex items-center justify-between">
            <div>
              <h2 className="font-display text-display-sm text-on-surface">Reschedule</h2>
              <p className="font-body text-[11px] text-on-surface-variant mt-0.5">{patientName}</p>
            </div>
            <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="px-5 py-5 space-y-4">
            <div>
              <label className="font-body text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold block mb-1.5">
                New Date
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 font-body text-body-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="font-body text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold block mb-1.5">
                New Time
              </label>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 font-body text-body-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="font-body text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold block mb-1.5">
                Notes <span className="text-on-surface-variant/50 normal-case tracking-normal font-normal">(optional)</span>
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                placeholder="Reason for rescheduling…"
                className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 font-body text-body-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary transition-colors resize-none"
              />
            </div>

            {error && (
              <p className="font-body text-[11px] text-error">{error}</p>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 pb-5 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 border border-outline-variant rounded-xl font-body text-label-caps uppercase tracking-wider font-semibold text-[10px] text-on-surface hover:border-primary hover:text-primary transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || !date || !time}
              className="flex-1 py-2.5 bg-primary text-on-primary rounded-xl font-body text-label-caps uppercase tracking-wider font-semibold text-[10px] hover:opacity-90 transition-all disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Confirm'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
