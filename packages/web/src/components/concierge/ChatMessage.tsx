import ClinicCard, { type ClinicCardData } from './ClinicCard';
import GalleryWidget from './GalleryWidget';

export type MessageRole = 'nia' | 'patient';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  clinics?: ClinicCardData[];
  gallery?: string;
  timestamp: Date;
  photoPreviewUrls?: string[];
  matchLink?: string; // durable /matches/<token> room link, rendered as a card
}

interface ChatMessageProps {
  message: Message;
  patientInitial?: string;
  onClinicSelect?: (id: string) => void;
}

export default function ChatMessage({ message, patientInitial = 'E', onClinicSelect }: ChatMessageProps) {
  const isOia = message.role === 'nia';

  return (
    <div className={`flex gap-3 ${isOia ? 'items-start' : 'items-end flex-row-reverse'}`}>
      {/* Avatar */}
      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
        isOia ? 'bg-primary' : 'bg-secondary-container'
      }`}>
        {isOia ? (
          <svg className="w-5 h-5 text-on-primary" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/>
          </svg>
        ) : (
          <span className="font-display text-display-sm text-on-secondary-container">{patientInitial}</span>
        )}
      </div>

      <div className={`flex flex-col gap-2 max-w-[75%] ${isOia ? 'items-start' : 'items-end'}`}>
        {/* Photo previews (patient uploads) */}
        {!isOia && message.photoPreviewUrls && message.photoPreviewUrls.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-end">
            {message.photoPreviewUrls.map((url, i) => (
              <img
                key={i}
                src={url}
                alt="Treatment area photo"
                className="w-32 h-32 object-cover rounded-xl border border-outline-variant/30"
              />
            ))}
          </div>
        )}

        {/* Text bubble */}
        {message.content && (
          <div className={`px-4 py-3 rounded-2xl font-body text-body-md leading-relaxed ${
            isOia
              ? 'bg-surface-container-lowest border border-outline-variant/20 text-on-surface rounded-tl-sm'
              : 'bg-primary text-on-primary rounded-tr-sm'
          }`}>
            {message.content}
          </div>
        )}

        {/* Before/after gallery */}
        {isOia && message.gallery && (
          <div className="w-64">
            <GalleryWidget procedure={message.gallery} />
          </div>
        )}

        {/* Inline clinic cards */}
        {isOia && message.clinics && message.clinics.length > 0 && (
          <div className="flex gap-3 overflow-x-auto pb-2 max-w-[calc(100vw-200px)] md:max-w-none">
            {message.clinics.map(clinic => (
              <ClinicCard key={clinic.id} clinic={clinic} onSelect={onClinicSelect} />
            ))}
          </div>
        )}

        {/* Match-room link card — the durable "all your matches" page */}
        {isOia && message.matchLink && (
          <a
            href={message.matchLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 bg-surface-container-lowest border border-primary/30 rounded-2xl px-4 py-3 hover:border-primary/60 transition-colors group"
          >
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <svg className="text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 18, height: 18 }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-body text-sm font-semibold text-on-surface">Your match room</p>
              <p className="font-body text-xs text-on-surface-variant">Browse every match, filter by country, and pick your favourites</p>
            </div>
            <span className="font-body text-primary text-sm group-hover:translate-x-0.5 transition-transform">→</span>
          </a>
        )}

        {/* Timestamp */}
        <span className="font-body text-[10px] text-on-surface-variant px-1">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}
