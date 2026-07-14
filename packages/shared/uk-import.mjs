import fs from 'fs';
for (const line of fs.readFileSync('.env.local','utf8').split('\n')){const m=line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);if(m){let v=m[2].replace(/^["']|["']$/g,'');if(!process.env[m[1]])process.env[m[1]]=v;}}
const DRY = process.env.WRITE !== '1';
const { PrismaClient } = await import('@prisma/client');
const db = new PrismaClient();
const FULL = ['Face','Nose','Breast','Body']; // "full-service" plastic surgery (NOT BBL — vetting-sensitive)
const ph = s => s ? s.replace(/[^\d+]/g,'') : null;
// Parsed EXACTLY from Ida's list. clusters: as stated where given, else full-service. accreditations: NONE given → [].
const UK = [
  { surgeon:'Norman Waterhouse', clinic:'WaterhouseJanssen', city:'London', phone:'+44 20 7636 4073', clusters:['Face','Nose'], spec:'facelift + rhinoplasty specialist' },
  { surgeon:'Christopher Inglefield', clinic:'London Bridge Plastic Surgery', city:'London', phone:'+44 20 4583 0872', clusters:FULL, spec:'full-service' },
  { surgeon:'Gary Ross', clinic:null, city:'Manchester', phone:'+44 161 401 4037', clusters:FULL, spec:'full-service' },
  { surgeon:'Julian Rowe-Jones', clinic:'The Nose Clinic', city:'London / Guildford', phone:'+44 20 7118 3553', clusters:['Nose'], spec:'rhinoplasty specialist' },
  { surgeon:'Naveen Cavale', clinic:'Real Plastic Surgery', city:'London', phone:'+44 20 7751 4055', clusters:FULL, spec:'full-service' },
  { surgeon:null, clinic:'Signature Clinic', city:'Multi-site', phone:null, clusters:['BBL'], spec:'one of the few UK BBL providers — BBL vetting PENDING; freephone to confirm', active:false },
  { surgeon:null, clinic:'Cadogan Clinic', city:'London', phone:'+44 20 7901 8500', clusters:FULL, spec:null },
  { surgeon:null, clinic:'The Private Clinic', city:'London (Harley St)', phone:'+44 20 7725 0880', clusters:FULL, spec:null },
  { surgeon:null, clinic:'Centre for Surgery', city:'London (Baker St)', phone:'+44 20 7993 4849', clusters:FULL, spec:null },
  { surgeon:null, clinic:'Cosmetic Surgery Partners', city:'London', phone:'+44 20 7486 6778', clusters:FULL, spec:null },
  { surgeon:'Rajiv Grover', clinic:null, city:'London (Harley St)', phone:'+44 20 7486 4301', clusters:FULL, spec:null },
  { surgeon:'Ash Mosahebi', clinic:'London Plastic Surgery Centre', city:'London', phone:null, clusters:FULL, spec:'line to confirm' },
  { surgeon:'Adrian Richards', clinic:'Aurora', city:null, phone:'+44 1324 578290', clusters:FULL, spec:null },
  { surgeon:'Marc Pacifico', clinic:'Purity Bridge', city:'Tunbridge Wells', phone:'+44 1892 536960', clusters:FULL, spec:null },
  { surgeon:'Taimur Shoaib', clinic:'La Belle Forme', city:'Glasgow', phone:'+44 141 552 0828', clusters:FULL, spec:null },
  { surgeon:null, clinic:'Nu Cosmetic', city:'Liverpool / Manchester', phone:'+44 151 707 9239', clusters:FULL, spec:null },
  { surgeon:null, clinic:'MYA', city:'National', phone:'+44 333 014 1014', clusters:FULL, spec:'national chain' },
];
console.log(`${DRY?'DRY RUN (no write)':'WRITING'} — ${UK.length} UK providers\n`);
let created=0, skipped=0;
for (const r of UK){
  const surgeonName = r.surgeon || r.clinic;
  const exists = await db.provider.findFirst({ where:{ surgeonName, country:'GB' }, select:{id:true} });
  console.log(`  ${surgeonName.padEnd(26)} | ${(r.clinic||'—').padEnd(30)} | ${(r.city||'?').padEnd(22)} | [${r.clusters.join(',')}]${exists?'  (exists)':''}`);
  if (!DRY && !exists){
    await db.provider.create({ data:{
      surgeonName, clinicName:r.clinic, city:r.city, country:'GB', clusters:r.clusters,
      specialisms:r.spec, accreditations:[], whatsapp: ph(r.phone), notes:'UK provider list from Ida 2026-07-14; accreditation TBD',
      verified:false, isActive: r.active !== false,
    }});
    created++;
  } else if (exists) skipped++;
}
if(!DRY) console.log(`\ncreated=${created} skipped(existing)=${skipped}`);
await db.$disconnect();
