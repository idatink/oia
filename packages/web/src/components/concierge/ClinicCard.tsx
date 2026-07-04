export interface ClinicCardData {
  id: string;
  name: string;
  city: string;
  country: string;
  description: string;
  niaScore: number | null;
  accreditations: string[];
  specialties: string[];
  website: string | null;
  photoUrl: string | null;
}

interface ClinicCardProps {
  clinic: ClinicCardData;
  onSelect?: (id: string) => void;
}

export default function ClinicCard({ clinic, onSelect }: ClinicCardProps) {
  return (
    <div
      className="bg-surface-container-lowest rounded-card2 overflow-hidden border border-outline-variant/20 shadow-card hover:shadow-concierge transition-all cursor-pointer w-[260px] shrink-0 hover:border-primary/30 group"
      onClick={() => onSelect?.(clinic.id)}
    >
      {/* Photo / gradient header */}
      <div className="h-36 relative overflow-hidden">
        {clinic.photoUrl ? (
          <img src={clinic.photoUrl} alt={clinic.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-secondary-container to-tertiary-fixed" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-on-surface/50 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
          <span className="bg-on-surface/70 text-inverse-on-surface px-2.5 py-1 rounded-full font-body text-[10px] uppercase tracking-widest font-semibold">
            {clinic.city}, {clinic.country}
          </span>
          {clinic.niaScore && (
            <span className="bg-primary text-on-primary px-2 py-1 rounded-full font-body text-[10px] font-bold">
              ★ {clinic.niaScore}/10
            </span>
          )}
        </div>
      </div>

      <div className="p-4">
        <h4 className="font-display text-display-sm text-on-surface mb-1.5">{clinic.name}</h4>

        {/* Accreditations */}
        {clinic.accreditations.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {clinic.accreditations.map(a => (
              <span key={a} className="bg-primary-fixed/30 text-primary px-2 py-0.5 rounded font-body text-[9px] uppercase tracking-wider font-semibold">
                {a}
              </span>
            ))}
          </div>
        )}

        <p className="font-body text-body-sm text-on-surface-variant mb-3 leading-relaxed line-clamp-3">{clinic.description}</p>

        {/* CTA */}
        <div className="flex items-center gap-1.5 text-primary group-hover:gap-2.5 transition-all">
          <span className="font-body text-[11px] font-semibold uppercase tracking-wider">Learn more</span>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/>
          </svg>
        </div>
      </div>
    </div>
  );
}
