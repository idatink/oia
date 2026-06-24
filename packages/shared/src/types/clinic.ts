import { z } from "zod";

export const ClinicAdminSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  clinicId: z.string().uuid(),
  fullName: z.string().min(1),
  phone: z.string().optional(),
  isPrimary: z.boolean().default(false),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type ClinicAdmin = z.infer<typeof ClinicAdminSchema>;

export const SpecialistSchema = z.object({
  id: z.string().uuid(),
  clinicId: z.string().uuid(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  title: z.string().optional(),
  bio: z.string().optional(),
  photoUrl: z.string().url().optional(),
  yearsExperience: z.number().int().nonnegative().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Specialist = z.infer<typeof SpecialistSchema>;

export const ClinicSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  country: z.string().min(2).max(2),
  city: z.string(),
  address: z.string(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  photos: z.array(z.string().url()).default([]),
  specialties: z.array(z.string()).default([]),
  procedures: z.array(z.string()),
  languages: z.array(z.string()).default([]),
  acceptInternationalPatients: z.boolean().default(true),
  airportPickup: z.boolean().default(false),
  hotelPartnerships: z.boolean().default(false),
  rating: z.number().min(0).max(5).optional(),
  reviewCount: z.number().int().nonnegative().default(0),
  isVerified: z.boolean().default(false),
  isActive: z.boolean().default(true),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Clinic = z.infer<typeof ClinicSchema>;

export const ReviewSchema = z.object({
  id: z.string().uuid(),
  clinicId: z.string().uuid(),
  patientId: z.string().uuid(),
  rating: z.number().min(1).max(5),
  title: z.string().optional(),
  body: z.string(),
  procedure: z.string().optional(),
  wouldRecommend: z.boolean().optional(),
  isVerifiedStay: z.boolean().default(false),
  helpfulCount: z.number().int().nonnegative().default(0),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Review = z.infer<typeof ReviewSchema>;
