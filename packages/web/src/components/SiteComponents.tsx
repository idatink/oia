'use client';

import { useEffect, useState, createContext, useContext } from 'react';

interface SiteConfig {
  images: Record<string, string>;
  components: Array<{
    id: string;
    type: string;
    label: string;
    isLive: boolean;
    config: Record<string, unknown>;
    order: number;
  }>;
  loaded: boolean;
}


const SiteConfigContext = createContext<SiteConfig>({ images: {}, components: [], loaded: false });

export function useSiteConfig() { return useContext(SiteConfigContext); }

export function SiteConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<SiteConfig>({ images: {}, components: [], loaded: false });

  useEffect(() => {
    fetch('/api/site-config')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d && d.images && d.components) setConfig({ ...d, loaded: true });
        else setConfig(c => ({ ...c, loaded: true }));
      })
      .catch(() => setConfig(c => ({ ...c, loaded: true })));
  }, []);

  return (
    <SiteConfigContext.Provider value={config}>
      <ActiveComponents components={config.components} />
      {children}
    </SiteConfigContext.Provider>
  );
}

function ActiveComponents({ components }: { components: SiteConfig['components'] }) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  if (!components.length) return null;

  return (
    <>
      {components.map(c => {
        if (dismissed.has(c.id)) return null;

        if (c.type === 'promo-strip') {
          const cfg = c.config as { message?: string; bgColor?: string; textColor?: string; link?: string };
          return (
            <div
              key={c.id}
              style={{ background: cfg.bgColor ?? '#99402b', color: cfg.textColor ?? '#fff' }}
              className="w-full text-center text-[11px] font-semibold py-2 px-4 tracking-wide relative"
            >
              {cfg.link ? (
                <a href={cfg.link} className="hover:underline">{cfg.message}</a>
              ) : (
                <span>{cfg.message}</span>
              )}
              <button
                onClick={() => setDismissed(p => new Set([...p, c.id]))}
                className="absolute right-3 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 text-lg leading-none"
                aria-label="Dismiss"
              >×</button>
            </div>
          );
        }

        if (c.type === 'announcement-banner') {
          const cfg = c.config as { title?: string; message?: string; ctaText?: string; ctaUrl?: string; bgColor?: string; textColor?: string };
          return (
            <div
              key={c.id}
              style={{ background: cfg.bgColor ?? '#1b1c1b', color: cfg.textColor ?? '#fff' }}
              className="w-full px-4 py-3 flex items-center justify-between gap-4 text-sm relative"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="w-2 h-2 rounded-full bg-current opacity-60 shrink-0" />
                <p className="truncate">
                  {cfg.title && <strong className="mr-2">{cfg.title}</strong>}
                  {cfg.message}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {cfg.ctaText && cfg.ctaUrl && (
                  <a
                    href={cfg.ctaUrl}
                    className="px-3 py-1 rounded-full border border-current opacity-80 hover:opacity-100 text-[11px] font-semibold uppercase tracking-wider transition-opacity"
                  >
                    {cfg.ctaText}
                  </a>
                )}
                <button
                  onClick={() => setDismissed(p => new Set([...p, c.id]))}
                  className="opacity-40 hover:opacity-80 text-xl leading-none"
                  aria-label="Dismiss"
                >×</button>
              </div>
            </div>
          );
        }

        return null;
      })}
    </>
  );
}

// Referral campaign is a standalone section embedded in pages
export function ReferralSection() {
  const { components } = useSiteConfig();
  const campaign = components.find(c => c.type === 'referral-campaign' && c.isLive);
  if (!campaign) return null;

  const cfg = campaign.config as {
    heading?: string;
    subheading?: string;
    body?: string;
    referralCode?: string;
    reward?: string;
    ctaText?: string;
    ctaUrl?: string;
    bgColor?: string;
  };

  return (
    <section
      style={{ background: cfg.bgColor ?? '#f6f1ee' }}
      className="py-20 px-6"
    >
      <div className="max-w-container mx-auto grid md:grid-cols-2 gap-12 items-center">
        <div>
          {cfg.subheading && (
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#99402b] mb-3">{cfg.subheading}</p>
          )}
          <h2 className="font-serif text-4xl text-[#1b1c1b] leading-tight mb-4">{cfg.heading ?? 'Refer a Friend'}</h2>
          <p className="text-[#5c5f5c] leading-relaxed mb-8">{cfg.body}</p>
          {cfg.ctaUrl && (
            <a
              href={cfg.ctaUrl}
              className="inline-flex items-center gap-2 bg-[#99402b] text-white px-7 py-3.5 rounded-lg font-semibold text-sm uppercase tracking-widest hover:opacity-90 transition-opacity"
            >
              {cfg.ctaText ?? 'Get Started'}
            </a>
          )}
        </div>
        {cfg.referralCode && (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#dcc0ba]/30">
            <p className="text-[10px] uppercase tracking-widest text-[#5c5f5c] font-semibold mb-3">Your referral code</p>
            <div className="flex items-center gap-3 bg-[#f6f1ee] rounded-xl px-5 py-4 mb-4">
              <span className="font-mono text-2xl font-bold text-[#99402b] tracking-widest flex-1">{cfg.referralCode}</span>
              <button
                onClick={() => navigator.clipboard?.writeText(cfg.referralCode ?? '')}
                className="text-[10px] text-[#99402b] font-semibold uppercase tracking-wider hover:underline"
              >
                Copy
              </button>
            </div>
            {cfg.reward && (
              <p className="text-sm text-[#5c5f5c]">
                <strong className="text-[#1b1c1b]">Reward:</strong> {cfg.reward}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
