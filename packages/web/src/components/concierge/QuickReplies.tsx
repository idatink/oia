interface QuickRepliesProps {
  suggestions: string[];
  onSelect: (text: string) => void;
}

export default function QuickReplies({ suggestions, onSelect }: QuickRepliesProps) {
  if (!suggestions.length) return null;

  return (
    <div className="flex gap-2 flex-wrap px-4 py-2">
      {suggestions.map(s => (
        <button
          key={s}
          onClick={() => onSelect(s)}
          className="px-4 py-2 rounded-full border border-outline-variant bg-surface-container-lowest font-body text-body-sm text-on-surface hover:border-primary hover:text-primary transition-all"
        >
          {s}
        </button>
      ))}
    </div>
  );
}
