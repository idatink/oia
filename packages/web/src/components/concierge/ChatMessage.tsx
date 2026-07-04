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
}

interface ChatMessageProps {
  message: Message;
  patientInitial?: string;
  onClinicSelect?: (id: string) => void;
}

export default function ChatMessage({ message, patientInitial = 'E', onClinicSelect }: ChatMessageProps) {
  const isNia = message.role === 'nia';

  return (
    <div className={`flex gap-3 ${isNia ? 'items-start' : 'items-end flex-row-reverse'}`}>
      {/* Avatar */}
      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
        isNia ? 'bg-primary' : 'bg-secondary-container'
      }`}>
        {isNia ? (
          <svg className="w-5 h-5 text-on-primary" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/>
          </svg>
        ) : (
          <span className="font-display text-display-sm text-on-secondary-container">{patientInitial}</span>
        )}
      </div>

      <div className={`flex flex-col gap-2 max-w-[75%] ${isNia ? 'items-start' : 'items-end'}`}>
        {/* Photo previews (patient uploads) */}
        {!isNia && message.photoPreviewUrls && message.photoPreviewUrls.length > 0 && (
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
            isNia
              ? 'bg-surface-container-lowest border border-outline-variant/20 text-on-surface rounded-tl-sm'
              : 'bg-primary text-on-primary rounded-tr-sm'
          }`}>
            {message.content}
          </div>
        )}

        {/* Before/after gallery */}
        {isNia && message.gallery && (
          <div className="w-64">
            <GalleryWidget procedure={message.gallery} />
          </div>
        )}

        {/* Inline clinic cards */}
        {isNia && message.clinics && message.clinics.length > 0 && (
          <div className="flex gap-3 overflow-x-auto pb-2 max-w-[calc(100vw-200px)] md:max-w-none">
            {message.clinics.map(clinic => (
              <ClinicCard key={clinic.id} clinic={clinic} onSelect={onClinicSelect} />
            ))}
          </div>
        )}

        {/* Timestamp */}
        <span className="font-body text-[10px] text-on-surface-variant px-1">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}
