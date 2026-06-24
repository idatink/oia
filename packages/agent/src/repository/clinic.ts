export interface ClinicResult {
  id: string;
  name: string;
  city: string;
  country: string;
  procedures: string[];
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  shortDescription: string;
  phone?: string;
}

export interface ClinicRepository {
  findByProcedureAndLocation(
    procedure: string | null,
    location: string | null,
  ): Promise<ClinicResult[]>;
}

const STUB_CLINICS: ClinicResult[] = [
  {
    id: 'clinic-istanbul-aesthetics',
    name: 'Istanbul Aesthetics Center',
    city: 'Istanbul',
    country: 'TR',
    procedures: ['rhinoplasty', 'facelift', 'liposuction'],
    rating: 4.8,
    reviewCount: 312,
    isVerified: true,
    shortDescription: 'Leading rhinoplasty specialists with over 2,000 cases annually.',
  },
  {
    id: 'clinic-novabeauty-istanbul',
    name: 'Nova Beauty Istanbul',
    city: 'Istanbul',
    country: 'TR',
    procedures: ['BBL', 'breast augmentation', 'liposuction', 'rhinoplasty'],
    rating: 4.7,
    reviewCount: 198,
    isVerified: true,
    shortDescription: 'Body contouring specialists. Ranked #1 BBL clinic in Turkey 2024.',
  },
  {
    id: 'clinic-renew-istanbul',
    name: 'Renew Clinic Istanbul',
    city: 'Istanbul',
    country: 'TR',
    procedures: ['facelift', 'rhinoplasty', 'breast augmentation'],
    rating: 4.9,
    reviewCount: 87,
    isVerified: true,
    shortDescription: 'Boutique facial rejuvenation clinic. Surgeon personally performs all facelifts.',
  },
  {
    id: 'clinic-elite-dubai',
    name: 'Elite Medical Dubai',
    city: 'Dubai',
    country: 'AE',
    procedures: ['rhinoplasty', 'facelift', 'breast augmentation', 'liposuction'],
    rating: 4.6,
    reviewCount: 145,
    isVerified: true,
    shortDescription: 'Premium cosmetic surgery in the heart of Dubai.',
  },
  {
    id: 'clinic-forma-prague',
    name: 'Forma Clinic Prague',
    city: 'Prague',
    country: 'CZ',
    procedures: ['breast augmentation', 'liposuction', 'BBL', 'facelift'],
    rating: 4.7,
    reviewCount: 220,
    isVerified: true,
    shortDescription: 'Central Europe\'s most-reviewed cosmetic clinic. English-speaking team.',
  },
];

function normalize(s: string) {
  return s.toLowerCase().trim();
}

function locationMatches(clinic: ClinicResult, location: string | null): boolean {
  if (!location) return true;
  const loc = normalize(location);
  return (
    normalize(clinic.city).includes(loc) ||
    normalize(clinic.country).includes(loc) ||
    loc.includes(normalize(clinic.city)) ||
    loc.includes(normalize(clinic.country))
  );
}

function procedureMatches(clinic: ClinicResult, procedure: string | null): boolean {
  if (!procedure) return true;
  const proc = normalize(procedure);
  return clinic.procedures.some((p) => normalize(p).includes(proc) || proc.includes(normalize(p)));
}

export class StubClinicRepository implements ClinicRepository {
  async findByProcedureAndLocation(
    procedure: string | null,
    location: string | null,
  ): Promise<ClinicResult[]> {
    return STUB_CLINICS.filter(
      (c) => procedureMatches(c, procedure) && locationMatches(c, location),
    ).slice(0, 3);
  }
}
