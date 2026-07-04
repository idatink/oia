'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import BottomTabNav from '@/components/dashboard/BottomTabNav';
import RescheduleModal from '@/components/dashboard/RescheduleModal';

type Booking = {
  id: string;
  type: string;
  scheduledAt: string;
  durationMins: number;
  status: string;
  room: string | null;
  joinLink: string | null;
  notes: string | null;
  consultation: {
    id: string;
    lead: { id: string } | null;
    procedure: { name: string };
    patient: {
      whatsappNumber: string | null;
      user: { name: string };
    };
  };
};

const STATUS_STYLE: Record<string, string> = {
  CONFIRMED: 'bg-blue-50 text-blue-700',
  CLEARED: 'bg-green-50 text-green-700',
  ACTION_REQUIRED: 'bg-primary-fixed text-primary',
  REMINDED: 'bg-surface-container text-on-surface-variant',
  RESCHEDULED: 'bg-yellow-50 text-yellow-700',
  CANCELLED: 'bg-error-container text-on-error-container',
};

const TYPE_LABEL: Record<string, string> = {
  CONSULTATION: 'Consultation',
  SURGERY: 'Surgery',
  VIRTUAL: 'Virtual Session',
};

const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function toDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatTime(d: string) {
  return new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function initials(name: string) {
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
}

function getWeekDays(anchorDate: Date): Date[] {
  // Monday-based 7-day week containing anchorDate
  const d = new Date(anchorDate);
  const day = d.getDay(); // 0=Sun
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const nd = new Date(monday);
    nd.setDate(monday.getDate() + i);
    return nd;
  });
}

function BookingCard({ booking, onWhatsApp, onReschedule }: { booking: Booking; onWhatsApp: (n: string | null) => void; onReschedule: (b: Booking) => void }) {
  const leadId = booking.consultation.lead?.id;
  const statusStyle = STATUS_STYLE[booking.status] ?? 'bg-surface-container text-on-surface-variant';
  const isActionRequired = booking.status === 'ACTION_REQUIRED';

  return (
    <div className="bg-surface-container-lowest rounded-card2 border border-outline-variant/20 shadow-card p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
            <span className="font-body text-sm font-semibold text-on-secondary-container">
              {initials(booking.consultation.patient.user.name)}
            </span>
          </div>
          <div>
            <p className="font-body font-semibold text-on-surface">{booking.consultation.patient.user.name}</p>
            <p className="font-body text-[11px] text-on-surface-variant">{booking.consultation.procedure.name}</p>
          </div>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full font-body text-[9px] font-bold uppercase tracking-wider whitespace-nowrap ${statusStyle}`}>
          {booking.status.replace(/_/g, ' ')}
        </span>
      </div>

      <div className="flex items-center gap-1.5 mb-3 ml-[52px]">
        <svg className="w-3.5 h-3.5 text-on-surface-variant" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="font-body text-body-sm text-on-surface-variant">
          {formatTime(booking.scheduledAt)} · {booking.durationMins} min
          {booking.room ? ` · Room ${booking.room}` : ''}
          {booking.type === 'VIRTUAL' ? ' · Virtual' : ''}
        </span>
      </div>

      {booking.notes && (
        <p className="font-body text-[11px] text-on-surface-variant italic mb-3 ml-[52px]">{booking.notes}</p>
      )}

      <div className="flex gap-2">
        {isActionRequired && (
          <>
            <button
              onClick={() => onWhatsApp(booking.consultation.patient.whatsappNumber)}
              className="flex-1 py-2 rounded-lg font-body text-label-caps uppercase tracking-wider font-semibold text-[10px] bg-primary text-on-primary hover:opacity-90 transition-all"
            >
              Send Reminder
            </button>
            <button
              onClick={() => onReschedule(booking)}
              className="flex-1 py-2 rounded-lg font-body text-label-caps uppercase tracking-wider font-semibold text-[10px] border border-outline-variant text-on-surface hover:border-primary hover:text-primary transition-all"
            >
              Reschedule
            </button>
          </>
        )}
        {booking.joinLink && !isActionRequired && (
          <a href={booking.joinLink} target="_blank" rel="noopener noreferrer" className="flex-1">
            <button className="w-full py-2 rounded-lg font-body text-label-caps uppercase tracking-wider font-semibold text-[10px] bg-primary text-on-primary hover:opacity-90 transition-all">
              Join Link
            </button>
          </a>
        )}
        {!isActionRequired && !booking.joinLink && (
          leadId ? (
            <Link href={`/concierge/${leadId}`} className="flex-1">
              <button className="w-full py-2 rounded-lg font-body text-label-caps uppercase tracking-wider font-semibold text-[10px] border border-outline-variant text-on-surface hover:border-primary hover:text-primary transition-all">
                Manage
              </button>
            </Link>
          ) : (
            <button className="flex-1 py-2 rounded-lg font-body text-label-caps uppercase tracking-wider font-semibold text-[10px] border border-outline-variant text-on-surface hover:border-primary hover:text-primary transition-all">
              Manage
            </button>
          )
        )}
      </div>
    </div>
  );
}

export default function BookingsPage() {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [weekAnchor, setWeekAnchor] = useState<Date>(today);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [rescheduleTarget, setRescheduleTarget] = useState<Booking | null>(null);
  const [weekCounts, setWeekCounts] = useState<Record<string, number>>({});

  const fetchBookings = useCallback(async (date: Date) => {
    setLoading(true);
    const res = await fetch(`/api/bookings?date=${toDateKey(date)}`);
    if (res.ok) setBookings(await res.json());
    setLoading(false);
  }, []);

  const fetchWeekCounts = useCallback(async (anchor: Date) => {
    const week = getWeekDays(anchor);
    const monday = toDateKey(week[0]);
    const res = await fetch(`/api/bookings/week?start=${monday}`);
    if (res.ok) setWeekCounts(await res.json());
  }, []);

  useEffect(() => { fetchBookings(selectedDate); }, [selectedDate, fetchBookings]);
  useEffect(() => { fetchWeekCounts(weekAnchor); }, [weekAnchor, fetchWeekCounts]);

  const weekDays = getWeekDays(weekAnchor);
  const todayKey = toDateKey(today);
  const selectedKey = toDateKey(selectedDate);

  const selectDate = (d: Date) => {
    setSelectedDate(d);
    setWeekAnchor(d);
  };

  const prevWeek = () => {
    const d = new Date(weekAnchor);
    d.setDate(d.getDate() - 7);
    setWeekAnchor(d);
  };
  const nextWeek = () => {
    const d = new Date(weekAnchor);
    d.setDate(d.getDate() + 7);
    setWeekAnchor(d);
  };

  const getCountForDay = (d: Date) => weekCounts[toDateKey(d)] ?? 0;

  const monthLabel = `${MONTH_NAMES[weekDays[0].getMonth()]} ${weekDays[0].getFullYear()}`;

  const actionRequired = bookings.filter(b => b.status === 'ACTION_REQUIRED');

  const openWhatsApp = (number: string | null) => {
    if (!number) return;
    window.open(`https://web.whatsapp.com/send?phone=${number.replace(/\D/g, '')}`, '_blank');
  };

  const WeekStrip = ({ compact = false }: { compact?: boolean }) => (
    <div className={`grid grid-cols-7 ${compact ? 'gap-1' : 'gap-2'}`}>
      {weekDays.map((d) => {
        const key = toDateKey(d);
        const isSelected = key === selectedKey;
        const isToday = key === todayKey;
        return (
          <button
            key={key}
            onClick={() => selectDate(d)}
            className={`flex flex-col items-center ${compact ? 'gap-0.5 py-1.5' : 'gap-1 py-3'} rounded-xl transition-all ${
              isSelected ? 'bg-primary text-on-primary' : 'hover:bg-surface-container-low'
            }`}
          >
            <span className={`font-body text-[9px] font-semibold uppercase tracking-wider ${isSelected ? 'text-on-primary/70' : 'text-on-surface-variant'}`}>
              {DAY_NAMES[d.getDay()]}
            </span>
            <span className={`font-display ${compact ? 'text-lg' : 'text-xl'} leading-none ${isSelected ? 'text-on-primary' : isToday ? 'text-primary' : 'text-on-surface'}`}>
              {d.getDate()}
            </span>
            {isToday && !isSelected && <span className="w-1 h-1 rounded-full bg-primary" />}
            {isSelected && <span className="w-1 h-1 rounded-full bg-on-primary/60" />}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-surface pb-20 lg:pb-0 lg:min-h-0 lg:h-full lg:flex lg:overflow-hidden">

      {/* Mobile header */}
      <header className="bg-surface-container-lowest border-b border-outline-variant/20 px-5 py-4 flex items-center justify-between sticky top-0 z-30 lg:hidden">
        <div className="flex items-center gap-3">
          <button className="text-on-surface-variant">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          <h1 className="font-display text-display-sm text-on-surface">Bookings</h1>
        </div>
        <div className="w-9 h-9 rounded-full bg-secondary-container flex items-center justify-center">
          <span className="font-display text-display-sm text-on-secondary-container">A</span>
        </div>
      </header>

      {/* Mobile content */}
      <div className="lg:hidden px-5 pt-6 space-y-5">
        {/* Calendar strip */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-display-sm text-on-surface">{monthLabel}</h2>
            <div className="flex gap-2">
              <button onClick={prevWeek} className="w-8 h-8 rounded-full border border-outline-variant flex items-center justify-center text-on-surface-variant hover:border-primary hover:text-primary transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button onClick={nextWeek} className="w-8 h-8 rounded-full border border-outline-variant flex items-center justify-center text-on-surface-variant hover:border-primary hover:text-primary transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
          <WeekStrip compact />
        </div>

        {/* Arrivals */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="font-body text-label-caps text-on-surface-variant uppercase tracking-wider font-semibold">
              {selectedKey === todayKey ? "Today's" : toDateKey(selectedDate)} Bookings
            </p>
            {!loading && <span className="font-body text-[10px] text-on-surface-variant">{bookings.length} total</span>}
          </div>
          {loading ? (
            <div className="py-10 text-center"><p className="font-body text-body-sm text-on-surface-variant">Loading…</p></div>
          ) : bookings.length === 0 ? (
            <div className="py-10 text-center border-2 border-dashed border-outline-variant/30 rounded-card2">
              <p className="font-body text-body-sm text-on-surface-variant">No bookings on this date</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map(b => <BookingCard key={b.id} booking={b} onWhatsApp={openWhatsApp} onReschedule={setRescheduleTarget} />)}
            </div>
          )}
        </div>

        {/* Summary stats */}
        <div className="bg-surface-container-low rounded-card2 p-5 border border-outline-variant/10">
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="font-body text-label-caps text-on-surface-variant uppercase tracking-wider font-semibold">
                {selectedKey === todayKey ? 'Today' : 'Selected Day'}
              </p>
              <p className="font-display text-display-md text-on-surface mt-0.5">
                {bookings.length} <span className="font-body text-body-md text-on-surface-variant font-normal">Booking{bookings.length !== 1 ? 's' : ''}</span>
              </p>
            </div>
            <div className="flex gap-4">
              {[
                { label: 'Surgeries', value: bookings.filter(b => b.type === 'SURGERY').length },
                { label: 'Consults', value: bookings.filter(b => b.type !== 'SURGERY').length },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <p className="font-display text-display-sm text-on-surface">{s.value}</p>
                  <p className="font-body text-[10px] text-on-surface-variant uppercase tracking-wider">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Insight card if action required */}
        {actionRequired.length > 0 && (
          <div className="bg-on-surface rounded-card2 p-5 text-inverse-on-surface">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-4 h-4 text-primary-fixed" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              <span className="font-body text-label-caps text-primary-fixed uppercase tracking-widest font-semibold">Nia Insight</span>
            </div>
            <p className="font-body text-body-sm text-inverse-on-surface/80 italic mb-4 leading-relaxed">
              {actionRequired.length} booking{actionRequired.length !== 1 ? 's' : ''} require{actionRequired.length === 1 ? 's' : ''} action today.
              {actionRequired[0]?.notes ? ` "${actionRequired[0].notes}"` : ''}
            </p>
            <button
              onClick={() => actionRequired[0] && setRescheduleTarget(actionRequired[0])}
              className="w-full bg-primary text-on-primary py-3 rounded-lg font-body text-label-caps uppercase tracking-widest font-semibold hover:opacity-90 transition-all"
            >
              Resolve Issue
            </button>
          </div>
        )}
      </div>

      {/* Desktop layout */}
      <div className="hidden lg:flex lg:flex-1 lg:overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Calendar strip */}
          <div className="bg-surface-container-lowest rounded-card2 border border-outline-variant/20 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-display-sm text-on-surface">{monthLabel}</h2>
              <div className="flex items-center gap-3">
                <span className="font-body text-body-sm text-on-surface-variant">
                  {bookings.length} booking{bookings.length !== 1 ? 's' : ''}
                </span>
                <div className="flex gap-1">
                  <button onClick={prevWeek} className="w-8 h-8 rounded-full border border-outline-variant flex items-center justify-center text-on-surface-variant hover:border-primary hover:text-primary transition-all">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <button onClick={nextWeek} className="w-8 h-8 rounded-full border border-outline-variant flex items-center justify-center text-on-surface-variant hover:border-primary hover:text-primary transition-all">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>
            </div>
            <WeekStrip />
          </div>

          {/* Bookings list */}
          <div>
            <p className="font-body text-label-caps text-on-surface-variant uppercase tracking-wider font-semibold mb-3">
              {selectedKey === todayKey ? "Today's Bookings" : `Bookings · ${selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
            </p>
            {loading ? (
              <div className="py-12 text-center"><p className="font-body text-body-sm text-on-surface-variant">Loading…</p></div>
            ) : bookings.length === 0 ? (
              <div className="py-12 text-center border-2 border-dashed border-outline-variant/30 rounded-card2">
                <p className="font-body text-body-sm text-on-surface-variant">No bookings on this date</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map(b => <BookingCard key={b.id} booking={b} onWhatsApp={openWhatsApp} onReschedule={setRescheduleTarget} />)}
              </div>
            )}
          </div>
        </div>

        {/* Right panel */}
        <aside className="w-[280px] shrink-0 border-l border-outline-variant/20 bg-surface-container-lowest overflow-y-auto p-5 space-y-4">
          <div className="bg-surface rounded-card2 border border-outline-variant/20 p-5">
            <p className="font-body text-[9px] text-on-surface-variant uppercase tracking-widest font-semibold mb-2">
              {selectedKey === todayKey ? 'Today' : selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </p>
            <p className="font-display text-3xl text-on-surface">
              {bookings.length} <span className="font-body text-base text-on-surface-variant font-normal">Booking{bookings.length !== 1 ? 's' : ''}</span>
            </p>
            <div className="flex gap-4 mt-3">
              {[
                { label: 'Surgeries', value: bookings.filter(b => b.type === 'SURGERY').length },
                { label: 'Consults', value: bookings.filter(b => b.type !== 'SURGERY').length },
              ].map(s => (
                <div key={s.label}>
                  <p className="font-display text-xl text-on-surface">{s.value}</p>
                  <p className="font-body text-[10px] text-on-surface-variant uppercase tracking-wider">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {actionRequired.length > 0 && (
            <div className="bg-on-surface rounded-card2 p-4">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-3.5 h-3.5 text-primary-fixed" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                <span className="font-body text-[9px] text-primary-fixed uppercase tracking-widest font-semibold">Nia Insight</span>
              </div>
              <p className="font-body text-[11px] text-inverse-on-surface/75 italic mb-3 leading-relaxed">
                {actionRequired.length} booking{actionRequired.length !== 1 ? 's' : ''} require{actionRequired.length === 1 ? 's' : ''} action.
                {actionRequired[0]?.notes ? ` "${actionRequired[0].notes}"` : ''}
              </p>
              <button
                onClick={() => actionRequired[0] && setRescheduleTarget(actionRequired[0])}
                className="w-full bg-primary text-on-primary py-2.5 rounded-lg font-body text-[10px] uppercase tracking-widest font-semibold hover:opacity-90 transition-all"
              >
                Resolve Issue
              </button>
            </div>
          )}

          <div className="bg-surface rounded-card2 border border-outline-variant/20 p-4">
            <p className="font-body text-[9px] text-on-surface-variant uppercase tracking-widest font-semibold mb-3">This Week</p>
            <div className="space-y-2">
              {weekDays.map(d => {
                const key = toDateKey(d);
                const isSelected = key === selectedKey;
                return (
                  <button
                    key={key}
                    onClick={() => selectDate(d)}
                    className="w-full flex items-center justify-between hover:opacity-70 transition-opacity"
                  >
                    <span className={`font-body text-[11px] font-semibold ${isSelected ? 'text-primary' : 'text-on-surface-variant'}`}>
                      {DAY_NAMES[d.getDay()]} {d.getDate()}
                    </span>
                    <span className={`font-body text-[10px] ${isSelected ? 'text-primary font-semibold' : 'text-on-surface-variant'}`}>
                      {isSelected ? `${bookings.length} booked` : getCountForDay(d) > 0 ? `${getCountForDay(d)} booked` : '—'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>
      </div>

      <BottomTabNav />

      <RescheduleModal
        open={!!rescheduleTarget}
        bookingId={rescheduleTarget?.id ?? null}
        patientName={rescheduleTarget?.consultation.patient.user.name ?? ''}
        currentScheduledAt={rescheduleTarget?.scheduledAt ?? null}
        onClose={() => setRescheduleTarget(null)}
        onSuccess={() => fetchBookings(selectedDate)}
      />
    </div>
  );
}
