const fs = require('fs');
for (const line of fs.readFileSync('./.env.local', 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (!m) continue;
  let v = m[2].trim(); if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  process.env[m[1]] = v;
}
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

const slugify = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Treatment category -> provider "Oia cluster" (null = not a pilot matchable cluster)
const CLUSTER_MAP = {
  'Rhinoplasty And Nose Shaping': 'Nose',
  'Breast Surgery': 'Breast', 'Breast Reconstruction': 'Breast',
  'Face And Neck Lifts': 'Face', 'Cheek, Chin And Jawline Enhancement': 'Face',
  'Eyelid Enhancement': 'Face', 'Eyebrow And Lash Enhancement': 'Face', 'Lip Enhancement': 'Face',
  'Body Contouring': 'Body', 'Post-Pregnancy Procedures': 'Body', 'Male Body Enhancement': 'Body',
  'Hip & Butt Enhancement': 'BBL',
};
// Non-surgical / branded items inside pilot categories -> NOT matchable
const NON_SURGICAL = /nonsurgical|non-surgical|thread|vampire|liquid|sculptra|emsculpt|coolsculpt|kybella|sculpsure|bodytite|cellulaze|cellfina|profound|vanquish|lipodissolve|thermibreast|silhouette|quicklift|lifestyle lift|instalift|airsculpt|botox|filler|\bsinus surgery\b|septoplasty|mentor|natrelle|sientra|motiva|inspira|nagor|eurosilicone|ideal implant/i;

// Flagship match-tags (the seed of the master vocabulary — CEO refines/extends)
const FACE_LIFT = { concernTags: ['jowls', 'midface_descent', 'skin_laxity', 'tired_appearance'], severityFit: ['moderate', 'severe'], ageBandFit: ['45-54', '55-64', '65+'], goalFit: ['natural', 'refreshed'] };
const ADULT = ['35-44', '45-54', '55-64', '65+'];
const TAGS = {
  'Facelift': FACE_LIFT, 'Deep Plane Facelift': FACE_LIFT, 'SMAS Facelift': FACE_LIFT, 'Lower Facelift': FACE_LIFT, 'MACS Facelift': FACE_LIFT,
  'Mini Facelift': { concernTags: ['jowls', 'skin_laxity'], severityFit: ['mild', 'moderate'], ageBandFit: ['35-44', '45-54'], goalFit: ['natural', 'subtle'] },
  'Neck Lift': { concernTags: ['neck_laxity', 'platysmal_bands', 'submental_fullness'], severityFit: ['moderate', 'severe'], ageBandFit: ['45-54', '55-64', '65+'], goalFit: ['natural'] },
  'Mini Neck Lift': { concernTags: ['neck_laxity', 'submental_fullness'], severityFit: ['mild', 'moderate'], ageBandFit: ['35-44', '45-54'], goalFit: ['natural'] },
  'Brow Lift': { concernTags: ['brow_descent', 'forehead_lines', 'tired_appearance'], severityFit: ['mild', 'moderate'], ageBandFit: ['35-44', '45-54', '55-64'], goalFit: ['refreshed', 'natural'] },
  'Cheek Lift': { concernTags: ['midface_descent', 'cheek_volume_loss'], severityFit: ['mild', 'moderate'], ageBandFit: ['45-54', '55-64'], goalFit: ['natural'] },
  'Facial Fat Transfer': { concernTags: ['volume_loss', 'cheek_volume_loss'], severityFit: ['mild', 'moderate'], ageBandFit: ADULT, goalFit: ['natural', 'refreshed'] },
  'Rhinoplasty': { concernTags: ['nose_shape', 'dorsal_hump', 'nose_tip', 'nose_proportion'], severityFit: ['mild', 'moderate', 'severe'], ageBandFit: ['<35', '35-44', '45-54', '55-64'], goalFit: ['natural', 'refined'] },
  'Revision Rhinoplasty': { concernTags: ['nose_revision', 'nose_shape', 'breathing'], severityFit: ['moderate', 'severe'], ageBandFit: ['<35', '35-44', '45-54', '55-64'], goalFit: ['natural', 'refined'] },
  'Breast Augmentation': { concernTags: ['breast_volume', 'small_breasts', 'breast_asymmetry'], severityFit: ['mild', 'moderate', 'severe'], ageBandFit: ['<35', '35-44', '45-54'], goalFit: ['natural', 'fuller'] },
  'Breast Lift': { concernTags: ['breast_sagging', 'breast_ptosis', 'post_pregnancy'], severityFit: ['moderate', 'severe'], ageBandFit: ['35-44', '45-54', '55-64'], goalFit: ['natural', 'lifted'] },
  'Breast Reduction': { concernTags: ['breast_size', 'breast_heaviness', 'back_pain'], severityFit: ['moderate', 'severe'], ageBandFit: ADULT, goalFit: ['natural', 'lighter'] },
  'Breast Fat Transfer': { concernTags: ['breast_volume', 'breast_asymmetry'], severityFit: ['mild', 'moderate'], ageBandFit: ['<35', '35-44', '45-54'], goalFit: ['natural'] },
  'Mommy Makeover': { concernTags: ['post_pregnancy', 'abdominal_skin', 'breast_sagging', 'stubborn_fat'], severityFit: ['moderate', 'severe'], ageBandFit: ['35-44', '45-54'], goalFit: ['natural', 'restored'] },
  'Liposuction': { concernTags: ['stubborn_fat', 'localized_fat', 'body_contour'], severityFit: ['mild', 'moderate', 'severe'], ageBandFit: ADULT, goalFit: ['contoured', 'natural'] },
  'Vaser Liposuction': { concernTags: ['stubborn_fat', 'body_contour', 'muscle_definition'], severityFit: ['mild', 'moderate'], ageBandFit: ADULT, goalFit: ['contoured', 'defined'] },
  'Arm Lift': { concernTags: ['arm_laxity', 'sagging_skin'], severityFit: ['moderate', 'severe'], ageBandFit: ADULT, goalFit: ['natural', 'firmer'] },
  'Gynecomastia Surgery': { concernTags: ['male_chest', 'glandular_tissue', 'chest_fat'], severityFit: ['mild', 'moderate', 'severe'], ageBandFit: ['<35', '35-44', '45-54'], goalFit: ['flatter', 'masculine'] },
  'Brazilian Butt Lift': { concernTags: ['buttock_volume', 'buttock_shape', 'body_contour'], severityFit: ['mild', 'moderate', 'severe'], ageBandFit: ['<35', '35-44', '45-54'], goalFit: ['fuller', 'contoured'] },
  'Butt Lift': { concernTags: ['buttock_sagging', 'buttock_shape'], severityFit: ['moderate', 'severe'], ageBandFit: ['35-44', '45-54', '55-64'], goalFit: ['lifted', 'natural'] },
  'Butt Implants': { concernTags: ['buttock_volume', 'buttock_shape'], severityFit: ['moderate', 'severe'], ageBandFit: ['<35', '35-44', '45-54'], goalFit: ['fuller'] },
};

// ── Turkey providers (from the CEO's sheet) ──────────────────────────────────
const ALL5 = ['Nose', 'Breast', 'Face', 'Body', 'BBL'];
const P = (surgeonName, clinicName, district, specialisms, clusters, accreditations, whatsapp, instagram, website, notes) =>
  ({ surgeonName, clinicName, district, specialisms, clusters, accreditations, whatsapp, instagram, website, notes });
const PROVIDERS = [
  P('Op. Dr. Abdülkadir Göksel', 'RinoIstanbul', 'Kadıköy (Caddebostan)', 'Rhinoplasty (primary & revision)', ['Nose'], 'ENT / facial plastic; RinoIstanbul founder', '+90 544 302 6988', null, 'drgoksel.com', 'Directory shortlist. High-volume rhinoplasty specialist'),
  P('Prof. Dr. Ercan Karacaoğlu', 'Este Istanbul / Memorial Ataşehir', 'Ataşehir', 'Breast, facelift, liposuction', ['Breast', 'Face', 'Body'], 'ISAPS, EBOPRAS; Memorial (JCI)', '+90 532 411 7238', null, 'esteistanbul.com', 'RealSelf 4.6★/94. Breast success cited >97%'),
  P('Dr. Ozan Balık', 'Dr. Ozan Balık Clinic', 'Beşiktaş (Levent)', 'Rhinoplasty, facial, body', ['Nose', 'Face', 'Body'], 'Turkish Board', '+90 532 609 0873', '@dr.ozanbalik', 'ozanbalik.com', 'Own clinic since 2010'),
  P('Dr. Semih Yıldız', 'Private clinic', 'Şişli (Nişantaşı)', 'Rhinoplasty, breast, body', ALL5, 'EBOPRAS, Turkish Board', '+90 212 993 8846', '@drsemihyildiz', 'drsemihyildiz.com', 'Directory shortlist'),
  P('Dr. Y. İlker Manavbaşı', 'Private clinic', 'Şişli (Nişantaşı)', 'Liposuction, BBL, rhinoplasty, mommy makeover', ['Body', 'BBL', 'Nose'], 'Rhinoplasty Society member', '+90 507 754 1556', null, null, 'Directory shortlist'),
  P('Op. Dr. Leyla Arvas', 'Quartz Clinique', 'Şişli (Nişantaşı)', 'Facelift, VASER lipo, breast, rhino, body', ALL5, 'ASPS intl affiliate', '+90 542 464 7433', null, 'quartzclinique.com', 'Landline +90 212 241 4624'),
  P('Dr. Metin Kerem', 'Private clinic', 'Beşiktaş (Etiler)', 'Body contouring, breast, rhinoplasty', ['Body', 'Breast', 'Nose'], 'EBOPRAS', '+90 533 426 3226', '@dr.metinkerem', 'metinkerem.com', 'Landline +90 212 257 8000'),
  P('Op. Dr. Mehmet Solmaz', 'Asya Hospital', 'Istanbul', 'Rhinoplasty, breast, body', ['Nose', 'Breast', 'Body'], 'EBOPRAS (exam 2021)', '+90 532 506 2830', null, null, 'Directory shortlist'),
  P('Op. Dr. Serbülent Güzey', 'The SG Clinic', 'Şişli (Nişantaşı)', 'Body contouring/BBL, breast', ['Body', 'BBL', 'Breast'], 'ISAPS', '+90 542 784 1519', null, 'drserbulentguzey.com', 'Named request. Alt +90 533 686 6838'),
  P('Op. Dr. Barış Çelik', 'ClinMedica', 'Istanbul', 'Rhinoplasty (ENT)', ['Nose'], 'Otorhinolaryngology', '+90 505 195 0587', '@dr.baris.celik', 'drbariscelik.com', 'Not Doç. Dr. Barış Çakır'),
  P('Op. Dr. Bülent Cihantimur', 'Estetik International', 'Şişli (Mecidiyeköy)', 'Full-service aesthetic surgery', ALL5, 'ISAPS; 30+ yrs', '+90 543 968 9988', '@bulentcihantimur', 'estetikinternational.com', 'In Providers DB. Alt +90 444 7707'),
  P('Op. Dr. Mirza Fırat', 'Mirza Fırat Clinic', 'Beşiktaş (Zorlu)', 'Rhinoplasty, facelift', ['Nose', 'Face'], 'Aesthetic & plastic surgeon', '+90 536 516 3248', '@drmirzafirat', 'mirzafirat.com', 'Named request. In Providers DB'),
  P('Dr. Yakup Avşar', 'Avsar Aesthetic Clinic', 'Beşiktaş (Akatlar)', 'Rhinoplasty', ['Nose'], 'Aesthetic & plastic surgery', '+90 532 708 3030', '@dravsar', 'avsarclinic.com', 'Landline +90 212 270 0993'),
  P('Dr. Cemil Işık', 'BHT Clinic Istanbul Tema', 'Küçükçekmece', 'Body contouring, high-vol lipo, facelift, tummy tuck', ['Body', 'Face'], 'EBOPRAS, Turkish Board; Asst Prof', '+90 536 488 4760', null, 'isikcemilmd.com', 'Directory shortlist'),
  P('Dr. Ergin Er', 'Istanbul Aesthetic Center', 'Şişli (Esentepe)', 'Breast, liposuction, mommy makeover', ['Breast', 'Body'], '30+ yrs', '+90 549 340 3063', null, 'istanbulaestheticcenter.com', 'Intl desk uses a US line'),
  P('Op. Dr. Aykut Gök', 'Private clinic', 'Şişli (Harbiye)', 'Breast, facelift, blepharoplasty, mommy makeover', ['Breast', 'Face', 'Body'], 'Turkish Board; 10+ yrs', '+90 532 419 8343', null, 'aykutgok.com', 'Phone = WhatsApp'),
  P('Prof. Dr. Halil İbrahim Gökçek', 'Private clinic', 'Bakırköy (Ataköy)', 'Facelift, rhinoplasty, body shaping', ['Face', 'Nose', 'Body'], 'Prof.; 25+ yrs', '+90 552 600 0008', null, 'halilibrahimgokcek.com', 'Directory shortlist'),
  P('Dr. Koray Kır', 'Private clinic', 'Bakırköy (Ataköy)', 'Body contouring, liposuction, mommy makeover', ['Body'], 'Aesthetic & plastic surgery', '+90 536 983 8496', null, 'koraykir.com', 'Directory shortlist'),
  P('Dr. Celal Alioğlu', 'Private clinic', 'Kadıköy (Suadiye)', 'Facial rejuvenation, rhinoplasty, breast', ['Face', 'Nose', 'Breast'], 'ASPS intl affiliate', '+90 532 438 3936', null, 'celalalioglu.com', 'Phone = WhatsApp'),
  P('Prof. Dr. Atacan Emre Koçman', 'IME Clinic', 'Istanbul', 'Facelift, neck lift', ['Face'], 'EBOPRAS', '+90 546 524 8334', null, 'imeclinic.com', 'Also emrekocman.com'),
  P('Prof. Dr. Arif Türkmen', 'Private clinic', 'Kadıköy (Suadiye)', 'Breast, liposuction, abdominoplasty', ['Breast', 'Body'], 'FRCS, MD, EBOPRAS; Prof.', null, null, 'profdrarifturkmen.com', 'Confirm line on site'),
  P('Op. Dr. Salih Cem Altunal', 'BHT Clinic Istanbul Tema', 'Küçükçekmece', 'Deep-plane facelift, rhinoplasty, body', ['Face', 'Nose', 'Body'], 'Turkish Board; 10+ yrs', null, null, 'bhtclinic.com.tr', 'Book via BHT Clinic'),
  P('Op. Dr. Mehmet Yıldıran', 'Estherian Clinic', 'Istanbul', 'Rhinoplasty, breast, VASER lipo, tummy tuck', ['Nose', 'Breast', 'Body'], 'TPRECD, EPCD', null, null, 'drmehmetyildiran.com', 'Confirm line on site'),
  P('Dr. Cengizhan Ekizceli', 'Private clinic', 'Küçükçekmece (Atakent)', 'Rhinoplasty, facial feminization, forehead reduction', ['Nose', 'Face'], 'EBOPRAS, ISAPS', null, null, 'drcengizhan.com', 'Site lists UK WhatsApp — confirm TR line'),
  P('Op. Dr. Ali Mezdeği', 'Esteport Clinic', 'Şişli (Nişantaşı)', 'Liposuction, gynecomastia, deep-plane facelift, rhino', ['Body', 'Face', 'Nose'], 'Aesthetic & plastic surgery (2004)', null, null, 'alimezdegi.com', 'Confirm line on site'),
  P('Op. Dr. Engin Öcal', 'Doku Clinic', 'Şişli', 'Rhinoplasty, facelift, breast', ['Nose', 'Face', 'Breast'], 'ISAPS; 15 yrs', null, null, 'dokuclinic.com', 'Confirm line on site'),
  P('Prof. Dr. Gürhan Özcan', 'Istanbul Aesthetic Center', 'Şişli (Nişantaşı)', 'Rhinoplasty, liposuction, facelift', ['Nose', 'Body', 'Face'], 'Prof.; 40 yrs', null, null, 'istanbulaestheticcenter.com', 'Confirm line on site'),
  P('Dr. Mehmet Akif Çakmak', 'Private practice', 'Istanbul', 'BBL, liposuction, rhinoplasty, breast, HD body contouring', ['BBL', 'Body', 'Nose', 'Breast'], 'TPRECD; 14+ yrs', null, null, null, 'Confirm line'),
  P('Prof. Dr. Ayşe Öztürk', 'Medicana Hospital', 'Istanbul', 'Breast reconstruction & revision breast', ['Breast'], 'Prof.; 21+ yrs; Medicana (JCI)', null, null, null, 'Via Medicana; confirm line'),
  P('Vanity Cosmetic Surgery (clinic)', 'Vanity', 'Üsküdar', 'Full-service aesthetic surgery', ALL5, 'Boutique aesthetics hospital', '+90 850 441 5444', '@vanitycosmeticsurgery', 'vanityclinic.com', 'Clinic, multiple surgeons. In Providers DB. Advisors 24/7'),
  P('Op. Dr. Çağrı Sade', 'Dr. Sade Clinic', 'Şişli (Nişantaşı)', 'Full aesthetic & reconstructive, 25+ yrs', ALL5, 'Plastic & aesthetic surgeon; 25+ yrs', '+90 534 868 5701', '@opdrcagrisade', 'cagrisade.com.tr', 'PILOT — Ida’s cousin; in Providers DB. Landline +90 212 248 0808'),
  P('Murat Diyarbakırlıoğlu, MD, FEBOPRAS', 'MD Aesthetics', 'Bakırköy (Ataköy)', 'Post-bariatric, body contouring, breast, rhino', ['Body', 'Breast', 'Nose'], 'FEBOPRAS; specialist 2013', '+90 530 113 4766', null, 'muratdiyarbakirlioglu.com', 'RealSelf 4.9★/316'),
  P('Op. Dr. Yücel Sarıaltın', 'Lovest Clinic', 'Ataşehir', 'Body contouring, tummy tuck', ['Body'], 'Aesthetic & plastic surgery', '+90 541 123 0360', '@opdryucelsarialtin', 'lovestclinic.com', 'RealSelf 4.6★/56'),
  P('Op. Dr. Güray Yeşiladalı, FEBOPRAS', 'Vanity Aesthetic', 'Şişli (Teşvikiye)', 'Body, breast', ['Body', 'Breast'], 'FEBOPRAS; 17+ yrs', '+90 530 573 8663', null, 'gurayyesiladali.com', 'RealSelf 4.8★/342. Landline +90 212 215 5533'),
  P('Op. Dr. Yunus Doğan, FEBOPRAS', 'Clinicplast', 'Şişli (Harbiye)', 'Body, breast, tummy tuck', ['Body', 'Breast'], 'EBOPRAS; 12+ yrs', '+90 539 553 5535', '@yunusdoganmd', 'dryunusdogan.com', 'RealSelf 4.8★/370'),
  P('Assoc. Prof. Sedat Tatar, MD, FACS, FEBOPRAS', 'Dr. Sedat Tatar Clinic', 'Beşiktaş (Levent)', 'Body, breast, mommy makeover', ['Body', 'Breast'], 'FACS, FEBOPRAS; Assoc. Prof.', null, null, 'drsedattatar.com', 'RealSelf 4.9★/134. Confirm line on site'),
  P('Op. Dr. Afet Öncel Bozkurt, FEBOPRAS', 'Private clinic', 'Kadıköy (Suadiye)', 'Tummy tuck, breast lift', ['Body', 'Breast'], 'FEBOPRAS; 10+ yrs', '+90 552 593 1132', '@dr.afetoncel', null, 'RealSelf 5.0★/50'),
  P('Dr. Özge Ergün', 'Private clinic', 'Şişli (Fulya)', 'Tummy tuck, body contouring', ['Body'], 'ASPS intl affiliate; 29 yrs', '+90 538 680 7392', null, 'ozgeergunmd.com', 'RealSelf 4.7★/160'),
  P('Op. Dr. Onur Oğan', 'Antalya Aesthetic Clinic', 'Antalya (Muratpaşa)', 'Body, tummy tuck', ['Body'], 'Aesthetic & plastic surgery; 14 yrs', '+90 507 926 3751', null, 'onurogan.com', 'Named request. RealSelf 4.9★/28. NB: Antalya'),
  P('Op. Dr. Mehmet Sürmeli, FEBOPRAS', 'Dr. Sürmeli Clinic', 'Şişli (Harbiye)', 'Body, breast, facelift', ['Body', 'Breast', 'Face'], 'FEBOPRAS, ISAPS, ASPS; 21 yrs', '+90 543 115 1315', null, 'drmehmetsurmeli.com', 'RealSelf 4.9★/160'),
  P('Op. Dr. Erman Ak', 'Private clinic', 'Şişli (Teşvikiye)', 'Facelift, body contouring, tummy tuck', ['Face', 'Body'], 'Aesthetic & plastic surgery; 12 yrs', '+90 552 362 9398', '@opdrermanak', 'drermanak.com', 'RealSelf 5.0★/203'),
  P('Op. Dr. Mehmet Özdemir', 'IME / Grand Clinic', 'Bakırköy (Ataköy)', 'Facelift, lipo, BBL, breast, tummy tuck', ['Face', 'Body', 'BBL', 'Breast'], 'EBOPRAS', '+90 544 919 1737', '@dr.mehmetozdemir', 'imeclinic.com', 'RealSelf 4.8★/23'),
  P('Op. Dr. Gülçin Nujen Çardak, FEBOPRAS', 'Private clinic', 'Kadıköy (Caddebostan)', 'Tummy tuck, breast lift', ['Body', 'Breast'], 'FEBOPRAS; 14 yrs', '+90 545 437 5089', '@dr.gulcinnujen', 'drgulcinnujen.com', 'RealSelf 5.0★/37'),
  P('Op. Dr. Cem Berkay Sinacı', 'Dr. CBS', 'Kadıköy (Caddebostan)', 'Facial & body, tummy tuck', ['Face', 'Body'], 'EBOPRAS, ISAPS; 12+ yrs', '+90 537 777 1058', null, 'doctorcbs.com', 'RealSelf 5.0★/110'),
  P('Op. Dr. Kadir Berat Oyur', 'IME Clinic', 'Bakırköy (Ataköy)', 'Body contouring, tummy tuck', ['Body'], 'Aesthetic & plastic surgery; 13 yrs', '+90 546 527 6238', '@drberatoyur', 'droyur.com', 'RealSelf 4.9★/31'),
];

function parseReview(notes) {
  const m = (notes || '').match(/RealSelf\s+([\d.]+)★\/(\d+)/);
  if (m) return { reviewRating: parseFloat(m[1]), reviewCount: parseInt(m[2], 10), reviewSource: 'RealSelf' };
  return {};
}
function cityFromDistrict(d) { return /antalya/i.test(d) ? 'Antalya' : 'Istanbul'; }

async function ingestTreatments() {
  const raw = fs.readFileSync('/tmp/treatments.md', 'utf8').split('\n');
  const catCache = {}; const seen = new Set();
  let cats = 0, treats = 0, matchable = 0, order = 0;
  for (const line of raw) {
    const cells = line.split('|').map(c => c.trim());
    if (cells.length < 5) continue;
    const num = cells[1]; if (!/^\d+$/.test(num)) continue;
    const catName = cells[2], name = cells[3], definition = cells[4] || null;
    if (!catName || !name) continue;
    const nameSlug = slugify(name);
    if (seen.has(nameSlug)) continue; seen.add(nameSlug);

    if (!catCache[catName]) {
      const cat = await db.treatmentCategory.upsert({
        where: { name: catName },
        create: { name: catName, slug: slugify(catName), cluster: CLUSTER_MAP[catName] || null, sortOrder: order++ },
        update: { cluster: CLUSTER_MAP[catName] || null },
      });
      catCache[catName] = cat; cats++;
    }
    const cluster = CLUSTER_MAP[catName] || null;
    const isMatchable = !!cluster && !NON_SURGICAL.test(name);
    const tags = isMatchable ? (TAGS[name] || { concernTags: [], severityFit: [], ageBandFit: [], goalFit: [] }) : { concernTags: [], severityFit: [], ageBandFit: [], goalFit: [] };
    await db.treatment.upsert({
      where: { slug: nameSlug },
      create: { categoryId: catCache[catName].id, name, slug: nameSlug, definition, matchable: isMatchable, ...tags },
      update: { definition, matchable: isMatchable, ...tags },
    });
    treats++; if (isMatchable) matchable++;
  }
  return { cats, treats, matchable };
}

async function ingestProviders() {
  let n = 0;
  for (const p of PROVIDERS) {
    const accreditations = (p.accreditations || '').split(/[;,]/).map(s => s.trim()).filter(Boolean);
    const data = {
      surgeonName: p.surgeonName, clinicName: p.clinicName, city: cityFromDistrict(p.district), district: p.district,
      country: 'TR', clusters: p.clusters, specialisms: p.specialisms, accreditations,
      whatsapp: p.whatsapp || null, instagram: p.instagram || null, website: p.website || null,
      notes: p.notes || null, verified: false, isActive: true, photoUrls: [], ...parseReview(p.notes),
    };
    const existing = await db.provider.findFirst({ where: { surgeonName: p.surgeonName, country: 'TR' } });
    if (existing) await db.provider.update({ where: { id: existing.id }, data });
    else await db.provider.create({ data });
    n++;
  }
  return n;
}

(async () => {
  const t = await ingestTreatments();
  console.log(`Treatments: ${t.cats} categories, ${t.treats} treatments, ${t.matchable} matchable`);
  const pn = await ingestProviders();
  console.log(`Providers: ${pn} ingested (Turkey)`);
  console.log('Sample matchable-with-tags:');
  const sample = await db.treatment.findMany({ where: { matchable: true, NOT: { concernTags: { isEmpty: true } } }, select: { name: true, concernTags: true }, take: 6 });
  for (const s of sample) console.log(`  - ${s.name}: [${s.concernTags.join(', ')}]`);
  await db.$disconnect();
})().catch(e => { console.error(e); process.exit(1); });
