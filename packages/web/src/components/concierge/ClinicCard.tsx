export interface ClinicCardData {
  id: string;
  name: string;
  city: string;
  country: string;
  rating: number;
  reviewCount: number;
  description: string;
  tags: string[];
}

interface ClinicCardProps {
  clinic: ClinicCardData;
  onSelect?: (id: string) => void;
}

export default function ClinicCard({ clinic, onSelect }: ClinicCardProps) {
  return (
    <div
      className="bg-surface-container-lowest rounded-card2 overflow-hidden border border-outline-variant/20 shadow-card hover:shadow-concierge transition-shadow cursor-pointer w-[260px] shrink-0"
      onClick={() => onSelect?.(clinic.id)}
    >
      {/* Image placeholder */}
      <div className="h-36 bg-gradient-to-br from-secondary-container to-tertiary-fixed relative">
        <div className="absolute top-3 left-3 bg-on-surface/70 text-inverse-on-surface px-2.5 py-1 rounded-full">
          <span className="font-body text-[10px] uppercase tracking-widest font-semibold">
            {clinic.city}, {clinic.country}
          </span>
        </div>
      </div>

      <div className="p-4">
        <h4 className="font-display text-display-sm text-on-surface mb-1">{clinic.name}</h4>

        {/* Rating */}
        <div className="flex items-center gap-1.5 mb-2">
          <svg className="w-4 h-4 text-primary fill-current" viewBox="0 0 24 24">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
          </svg>
          <span className="font-body text-body-sm font-semibold text-on-surface">{clinic.rating}</span>
          <span className="font-body text-body-sm text-on-surface-variant">({clinic.reviewCount} Reviews)</span>
        </div>

        <p className="font-body text-body-sm text-on-surface-variant mb-3 leading-relaxed">{clinic.description}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {clinic.tags.map(tag => (
            <span
              key={tag}
              className="border border-outline-variant px-2 py-0.5 rounded font-body text-[10px] uppercase tracking-wider text-on-surface-variant font-semibold"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
