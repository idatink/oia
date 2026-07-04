import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

async function main() {
  // ─── Clinic ────────────────────────────────────────────────────────────────
  const clinic = await db.clinic.upsert({
    where: { slug: 'nia-demo-clinic' },
    create: { name: 'Nia Demo Clinic', slug: 'nia-demo-clinic', country: 'KR', city: 'Seoul', description: 'Premium cosmetic surgery clinic in the Gangnam district.', isVerified: true, isActive: true },
    update: {},
  });
  console.log(`✓ Clinic: ${clinic.name}`);

  // ─── Coordinator ──────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('nia-demo-2024', 12);
  const coordUser = await db.user.upsert({
    where: { email: 'coordinator@nia-demo.com' },
    create: { email: 'coordinator@nia-demo.com', name: 'Dr. Aldrich', role: 'COORDINATOR', passwordHash },
    update: { passwordHash },
  });
  const coordinator = await db.coordinator.upsert({
    where: { userId: coordUser.id },
    create: { userId: coordUser.id, clinicId: clinic.id, isOnDuty: true },
    update: {},
  });
  console.log(`✓ Coordinator: ${coordUser.email}`);

  // ─── Procedures ───────────────────────────────────────────────────────────
  const procs = await Promise.all([
    db.procedure.upsert({ where: { slug: 'rhinoplasty' }, create: { slug: 'rhinoplasty', name: 'Rhinoplasty', category: 'FACIAL' }, update: {} }),
    db.procedure.upsert({ where: { slug: 'facelift' }, create: { slug: 'facelift', name: 'Face Lift', category: 'FACIAL' }, update: {} }),
    db.procedure.upsert({ where: { slug: 'blepharoplasty' }, create: { slug: 'blepharoplasty', name: 'Blepharoplasty', category: 'FACIAL' }, update: {} }),
    db.procedure.upsert({ where: { slug: 'tummy-tuck' }, create: { slug: 'tummy-tuck', name: 'Tummy Tuck (Abdominoplasty)', category: 'BODY' }, update: {} }),
    db.procedure.upsert({ where: { slug: 'liposuction-flanks' }, create: { slug: 'liposuction-flanks', name: 'Liposuction / Flanks', category: 'BODY' }, update: {} }),
    db.procedure.upsert({ where: { slug: 'arm-lift' }, create: { slug: 'arm-lift', name: 'Arm Lift (Brachioplasty)', category: 'BODY' }, update: {} }),
    db.procedure.upsert({ where: { slug: 'thigh-lift' }, create: { slug: 'thigh-lift', name: 'Thigh Lift', category: 'BODY' }, update: {} }),
  ]);
  const [rhinoplasty, facelift, , tummyTuck, lipo, armLift, thighLift] = procs;
  console.log(`✓ Procedures: ${procs.map(p => p.slug).join(', ')}`);

  // ─── Patients + Leads ─────────────────────────────────────────────────────

  const MEDICAL_CLEAR = { diabetes: false, cancerTreatment: false, organTransplant: false, dvt: false, pacemaker: false, hypertension: false, bloodClotting: false, heartDisease: false, thyroidDisorder: false, immuneDisorder: false, pregnancy: false, allergies: false };

  const DEMO_LEADS = [
    {
      email: 'marcus.thorne@example.com',
      name: 'Marcus Thorne',
      phone: '+12125550101',
      whatsapp: '+12125550101',
      countryOfResidence: 'United States',
      preferredLanguage: 'English',
      dateOfBirth: new Date('1988-04-15'),
      location: 'New York, USA',
      procedureId: rhinoplasty.id,
      additionalProcedureIds: [] as string[],
      preferredDoctorName: null as string | null,
      status: 'NEW' as const,
      source: 'whatsapp',
      aiScore: 72,
      aiPriority: 'Medium',
      aiRationale: 'Patient asked detailed pre-op questions and requested a cost breakdown. Dorsal hump reduction is the primary concern. Follow-up within 48 hours recommended. Likely to book within 30 days if quote is competitive.',
      intent: 'Seeking rhinoplasty consultation with a board-certified surgeon in Seoul.',
      scope: ['Primary: Open Rhinoplasty', 'Concern: Dorsal hump reduction', 'Prefers: October window'],
      medicalScreening: { ...MEDICAL_CLEAR },
      photoUrls: [] as string[],
    },
    {
      email: 'elena.r@example.com',
      name: 'Elena Rodriguez',
      phone: '+971501234567',
      whatsapp: '+971501234567',
      countryOfResidence: 'United Arab Emirates',
      preferredLanguage: 'English',
      dateOfBirth: new Date('1982-09-22'),
      location: 'Dubai, UAE',
      procedureId: facelift.id,
      additionalProcedureIds: [] as string[],
      preferredDoctorName: null as string | null,
      status: 'NEW' as const,
      source: 'web',
      aiScore: 61,
      aiPriority: 'Medium',
      aiRationale: 'Patient browsed clinic photos and asked about recovery time. Mid-range intent — price sensitive. Needs a detailed proposal with downtime breakdown.',
      intent: 'Interested in a minimally invasive facelift with fast recovery for a Dubai-based schedule.',
      scope: ['Mini SMAS Facelift', 'Concern: Recovery time under 2 weeks', 'Prefers: Gangnam clinic'],
      medicalScreening: { ...MEDICAL_CLEAR },
      photoUrls: [] as string[],
    },
    {
      email: 'sarah.j@example.com',
      name: 'Sarah J.',
      phone: '+447700900123',
      whatsapp: '+447700900123',
      countryOfResidence: 'United Kingdom',
      preferredLanguage: 'English',
      dateOfBirth: new Date('1987-03-14'),
      location: 'London, UK',
      procedureId: tummyTuck.id,
      additionalProcedureIds: [lipo.id, armLift.id, thighLift.id],
      preferredDoctorName: 'Dr. Kemal Ornek',
      status: 'SELECTED' as const,
      source: 'whatsapp',
      aiScore: 98,
      aiPriority: 'High',
      aiRationale: 'Exceptional post-weight-loss candidate. 40kg weight loss completed 8 months ago; weight stable for 6 months — ideal surgical timing. BMI 22.5 (65kg / 170cm). All 12 screening questions clear: no diabetes, no cardiac history, no bleeding disorders, no medications beyond vitamins, not pregnant, no prior surgeries. 3 photos submitted and AI-reviewed — skin excess confirmed across abdomen, flanks, arms and thighs. Combined procedure recommended. Low anaesthetic and surgical risk. Prioritise for quote within 2 hours.',
      intent: 'Post-weight-loss body contouring across abdomen, flanks, arms and thighs following 40kg weight loss.',
      scope: ['Tummy Tuck (Abdominoplasty)', 'Liposuction / Flanks', 'Arm Lift (Brachioplasty)', 'Thigh Lift', 'BMI 22.5 — low surgical risk'],
      medicalScreening: { ...MEDICAL_CLEAR },
      photoUrls: ['photo_sarah_1.jpg', 'photo_sarah_2.jpg', 'photo_sarah_3.jpg'],
    },
  ];

  for (const lead of DEMO_LEADS) {
    // User
    const patientUser = await db.user.upsert({
      where: { email: lead.email },
      create: { email: lead.email, name: lead.name, phone: lead.phone, role: 'PATIENT' },
      update: { name: lead.name, phone: lead.phone },
    });

    // Patient
    const patient = await db.patient.upsert({
      where: { userId: patientUser.id },
      create: {
        userId: patientUser.id,
        whatsappNumber: lead.whatsapp,
        countryOfResidence: lead.countryOfResidence,
        preferredLanguage: lead.preferredLanguage,
        dateOfBirth: lead.dateOfBirth,
      },
      update: {
        countryOfResidence: lead.countryOfResidence,
        preferredLanguage: lead.preferredLanguage,
        dateOfBirth: lead.dateOfBirth,
      },
    });

    // Check if consultation + lead already exist
    const existingConsult = await db.consultation.findFirst({ where: { patientId: patient.id, clinicId: clinic.id } });
    if (existingConsult) {
      // Update existing consultation with new fields
      await db.consultation.update({
        where: { id: existingConsult.id },
        data: {
          additionalProcedureIds: lead.additionalProcedureIds,
          preferredDoctorName: lead.preferredDoctorName,
        },
      });
      // Update existing lead
      const existingLead = await db.lead.findUnique({ where: { consultationId: existingConsult.id } });
      if (existingLead) {
        await db.lead.update({
          where: { id: existingLead.id },
          data: {
            aiRationale: lead.aiRationale,
            aiPriority: lead.aiPriority,
            medicalScreening: lead.medicalScreening,
            photoUrls: lead.photoUrls,
          },
        });
      }
      console.log(`↑ Updated: ${lead.name}`);
      continue;
    }

    // Create consultation
    const consultation = await db.consultation.create({
      data: {
        patientId: patient.id,
        clinicId: clinic.id,
        procedureId: lead.procedureId,
        additionalProcedureIds: lead.additionalProcedureIds,
        preferredDoctorName: lead.preferredDoctorName,
        status: lead.status === 'CLAIMED' ? 'CONTACTED' : 'ENQUIRY',
      },
    });

    const isClaimed = ['CLAIMED', 'SELECTED', 'OFFER_SENT', 'IN_PROGRESS'].includes(lead.status);
    const isSelected = lead.status === 'SELECTED';
    const claimedAt = isClaimed ? new Date(Date.now() - 3 * 60 * 60 * 1000) : null;
    const patientSelectedAt = isSelected ? new Date(Date.now() - 1 * 60 * 60 * 1000) : null;

    // Create lead
    const createdLead = await db.lead.create({
      data: {
        consultationId: consultation.id,
        coordinatorId: isClaimed ? coordinator.id : null,
        status: lead.status,
        claimedAt,
        patientSelectedAt,
        source: lead.source,
        patientLocation: lead.location,
        aiScore: lead.aiScore,
        aiPriority: lead.aiPriority,
        aiRationale: lead.aiRationale,
        intent: lead.intent,
        scope: lead.scope,
        medicalScreening: lead.medicalScreening,
        photoUrls: lead.photoUrls,
      },
    });

    // Notifications for new leads
    if (lead.status === 'NEW') {
      const existingNotif = await db.notification.findFirst({ where: { recipientId: coordUser.id, entityId: createdLead.id } });
      if (!existingNotif) {
        await db.notification.create({
          data: {
            clinicId: clinic.id,
            recipientId: coordUser.id,
            type: 'lead.new',
            title: `New lead from ${lead.name}`,
            body: `${lead.procedureId === rhinoplasty.id ? 'Rhinoplasty' : 'Facelift'} enquiry from ${lead.location}. AI score: ${lead.aiScore}%`,
            entityType: 'Lead',
            entityId: createdLead.id,
            isRead: false,
          },
        });
      }
    }

    console.log(`✓ Lead: ${lead.name} (${lead.status})`);
  }

  // ─── Bookings for Sarah ───────────────────────────────────────────────────
  const sarahPatient = await db.patient.findFirst({ where: { user: { email: 'sarah.j@example.com' } } });
  if (sarahPatient) {
    const sarahConsult = await db.consultation.findFirst({ where: { patientId: sarahPatient.id } });
    if (sarahConsult) {
      const existing = await db.booking.count({ where: { consultationId: sarahConsult.id } });
      if (existing === 0) {
        const today = new Date();
        const base = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        await db.booking.createMany({
          data: [
            { consultationId: sarahConsult.id, type: 'CONSULTATION', scheduledAt: new Date(base.getTime() + 8.5 * 3600000), durationMins: 240, status: 'CLEARED', notes: 'Pre-op bloodwork confirmed' },
            { consultationId: sarahConsult.id, type: 'CONSULTATION', scheduledAt: new Date(base.getTime() + 13.5 * 3600000), durationMins: 60, status: 'ACTION_REQUIRED', room: 'Room 104', notes: 'Flight delay — may be late' },
            { consultationId: sarahConsult.id, type: 'VIRTUAL', scheduledAt: new Date(base.getTime() + 15 * 3600000), durationMins: 45, status: 'CONFIRMED', joinLink: 'https://zoom.us/j/demo-session', notes: 'Virtual intake session' },
          ],
        });
        console.log(`✓ Bookings: 3 for Sarah J.`);
      }
    }
  }

  // ─── Nia conversation for Sarah ──────────────────────────────────────────
  const sarahForSession = await db.patient.findFirst({ where: { user: { email: 'sarah.j@example.com' } }, select: { id: true } });
  if (sarahForSession) {
    const existingSession = await db.nIASession.findUnique({ where: { surface_identifier: { surface: 'whatsapp', identifier: '+447700900123' } } });
    if (!existingSession) {
      // patientSelectedAt is ~1 hour ago; conversation starts ~6 hours ago
      const t = (hoursAgo: number) => new Date(Date.now() - hoursAgo * 3600000);
      const session = await db.nIASession.create({
        data: {
          patientId: sarahForSession.id,
          surface: 'whatsapp',
          identifier: '+447700900123',
          lastActiveAt: t(0.5),
          messages: {
            create: [
              // ── Pre-selection (clinic cannot see these) ──────────────
              { role: 'PATIENT', content: "Hi, I've lost 40kg over the past year and I'm thinking about body contouring. Can you help?", createdAt: t(6) },
              { role: 'NIA', content: "Congratulations on your incredible journey — 40kg is a life-changing achievement! I'd love to help you explore your options. Body contouring after significant weight loss often involves a combination of procedures. How long ago did you reach your goal weight, and has it been stable?", createdAt: t(5.9) },
              { role: 'PATIENT', content: "About 8 months ago. My weight has been stable for the last 6 months at 65kg. I'm 170cm.", createdAt: t(5.7) },
              { role: 'NIA', content: "That's ideal timing — 6 months of stability is exactly what surgeons look for. With a BMI of 22.5 you're in an excellent range. The areas most commonly addressed after weight loss are the abdomen, flanks, arms and thighs. Are any of those a concern for you?", createdAt: t(5.6) },
              { role: 'PATIENT', content: "All of them honestly. My tummy has a lot of loose skin, same with my arms and inner thighs. And the flanks too.", createdAt: t(5.4) },
              { role: 'NIA', content: "That's very common after significant weight loss — skin doesn't always shrink back. A combined procedure addressing all four areas in one surgical session is often recommended to reduce total recovery time and anaesthetic exposure. Would you be open to exploring clinics in Istanbul? There are several JCI-accredited facilities with strong track records in post-bariatric body contouring.", createdAt: t(5.3) },
              { role: 'PATIENT', content: "Yes, Istanbul works. I've heard great things. What would the recovery look like?", createdAt: t(5.1) },
              { role: 'NIA', content: "For a combined tummy tuck, liposuction, arm lift and thigh lift, expect around 10–14 days in Istanbul before flying. Most patients return to light activity at 3 weeks and feel fully recovered by 6–8 weeks. I'll need a few photos of the treatment areas to share with the clinics — this helps them give you an accurate quote. Are you comfortable sending those via WhatsApp?", createdAt: t(5.0) },
              { role: 'PATIENT', content: "Yes that's fine. Here you go.", createdAt: t(4.8) },
              { role: 'NIA', content: "Thank you — I've received 3 photos and my AI has reviewed them. Skin excess is confirmed across all four areas. I'm now running through a short medical screening to make sure you're a safe candidate. Do you have diabetes?", createdAt: t(4.6) },
              { role: 'PATIENT', content: "No", createdAt: t(4.5) },
              { role: 'NIA', content: "Any history of cancer treatment, organ transplant, DVT, pacemaker, hypertension, blood clotting disorders, heart disease, thyroid or immune conditions, or current pregnancy?", createdAt: t(4.4) },
              { role: 'PATIENT', content: "No to all of those. I just take vitamins.", createdAt: t(4.3) },
              { role: 'NIA', content: "Perfect — all 12 screening questions are clear. Your profile is complete. I'm now requesting quotes from our top-rated clinics in Istanbul for a combined tummy tuck, liposuction of the flanks, arm lift and thigh lift. You'll hear back from me with a comparison of offers within a few hours.", createdAt: t(4.1) },
              // ── Patient selects the clinic (patientSelectedAt = 1 hour ago) ──
              { role: 'NIA', content: "Great news, Sarah! I've received quotes from 3 clinics. Here's a summary:\n\n🏥 Estetik Klinik Istanbul — EUR 6,800 (includes surgeon, anaesthesia, 3 nights hospital, transfers)\n🏥 Vera Clinic — EUR 7,200\n🏥 Acıbadem — EUR 9,100\n\nAll three are JCI-accredited. Would you like to proceed with Estetik Klinik Istanbul?", createdAt: t(1.5) },
              { role: 'PATIENT', content: "Yes, Estetik Klinik looks great. Can I speak to their coordinator directly?", createdAt: t(1.2) },
              // ── Post-selection (clinic CAN see from here) ────────────────
              { role: 'NIA', content: "Wonderful — I've connected you with Estetik Klinik Istanbul. Their coordinator will be in touch shortly to answer your questions, discuss dates and walk you through the next steps. You're in great hands, Sarah! 🎉", createdAt: t(1.0) },
              { role: 'PATIENT', content: "Thank you so much Nia! Really appreciate all your help.", createdAt: t(0.9) },
              { role: 'NIA', content: "My pleasure! I'll stay available if you need anything along the way. Your coordinator can see your full brief and photos. Good luck — this is going to be a wonderful next chapter 💙", createdAt: t(0.8) },
            ],
          },
        },
      });
      console.log(`✓ Nia conversation: ${session.id}`);
    }
  }

  // ─── Insight notification ─────────────────────────────────────────────────
  const existingInsight = await db.notification.findFirst({ where: { recipientId: coordUser.id, type: 'insight.alert' } });
  if (!existingInsight) {
    await db.notification.create({
      data: {
        clinicId: clinic.id,
        recipientId: coordUser.id,
        type: 'insight.alert',
        title: 'Flight delay detected — Sarah J.',
        body: 'Travel itinerary shows a delay. She may be late for her 1:30 PM appointment.',
        entityType: 'Booking',
        isRead: false,
      },
    });
    console.log(`✓ Notification: insight alert`);
  }
}

main().catch(console.error).finally(() => db.$disconnect());
