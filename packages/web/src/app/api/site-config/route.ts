import { NextResponse } from 'next/server';
import { db } from '@nia/shared/src/db';

export const dynamic = 'force-dynamic';

const DEFAULT_IMAGES: Record<string, string> = {
  // Homepage
  hero: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&q=80',
  'recovery-suite': 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=700&q=80',
  'facial-sculpting': 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600&q=80',
  'body-contouring': 'https://images.unsplash.com/photo-1609557927087-f9cf8e88de18?w=600&q=80',
  'skin-regeneration': 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=600&q=80',
  'corrective-care': 'https://images.unsplash.com/photo-1595272568891-123402d0fb3b?w=600&q=80',
  'concierge-about': 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=700&q=80',
  // Treatments
  'tx-rhinoplasty': 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600&q=80',
  'tx-blepharoplasty': 'https://images.unsplash.com/photo-1595272568891-123402d0fb3b?w=600&q=80',
  'tx-facelift': 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=600&q=80',
  'tx-body-contouring': 'https://images.unsplash.com/photo-1609557927087-f9cf8e88de18?w=600&q=80',
  'tx-breast-aug': 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=600&q=80',
  'tx-tummy-tuck': 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600&q=80',
  'tx-skin-regen': 'https://images.unsplash.com/photo-1526758097130-bab247274f58?w=600&q=80',
  'tx-corrective': 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&q=80',
  // About
  'about-hero-video': 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=900&q=80',
  'about-qa-1': 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=400&q=80',
  'about-qa-2': 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&q=80',
  'about-qa-3': 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&q=80',
  'about-qa-4': 'https://images.unsplash.com/photo-1614859324967-bdf413c35b5a?w=400&q=80',
  // Results Gallery
  'result-1': 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=600&q=80',
  'result-2': 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&q=80',
  'result-3': 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&q=80',
  'result-4': 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&q=80',
  'result-5': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&q=80',
  'result-6': 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=600&q=80',
  'result-7': 'https://images.unsplash.com/photo-1583500178690-594ce74b4618?w=600&q=80',
  'result-8': 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&q=80',
  'result-9': 'https://images.unsplash.com/photo-1614859324967-bdf413c35b5a?w=600&q=80',
};

export async function GET() {
  try {
    const rows = await db.niaConfig.findMany({
      where: { category: { in: ['site-image', 'site-component'] } },
    });

    const images: Record<string, string> = { ...DEFAULT_IMAGES };
    const components: object[] = [];

    for (const row of rows) {
      if (row.category === 'site-image') {
        const slotKey = row.key.replace('site.image.', '');
        const rawUrl = row.value as string;
        // Private blob URLs must be served through the dashboard proxy
        // Include updatedAt timestamp so each new upload gets a cache-busting URL
        images[slotKey] = rawUrl.includes('blob.vercel-storage.com')
          ? `https://nia-medtourism-dashboard.vercel.app/api/public/site-image?key=${slotKey}&t=${row.updatedAt.getTime()}`
          : rawUrl;
      } else if (row.category === 'site-component') {
        const v = row.value as Record<string, unknown>;
        if (v.isLive) {
          components.push({
            id: row.key.replace('site.component.', ''),
            ...v,
          });
        }
      }
    }

    components.sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));

    return NextResponse.json(
      { images, components },
      { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' } }
    );
  } catch {
    return NextResponse.json({ images: DEFAULT_IMAGES, components: [] });
  }
}
