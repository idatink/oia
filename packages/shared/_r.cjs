const fs=require('fs');
for(const l of fs.readFileSync('./.env.local','utf8').split('\n')){const m=l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);if(!m)continue;let v=m[2].trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);process.env[m[1]]=v;}
const{PrismaClient}=require('@prisma/client');const db=new PrismaClient();
const id=process.argv[2]; const n=parseInt(process.argv[3]||'4',10);
(async()=>{
  const s=await db.nIASession.findFirst({where:{surface:'whatsapp',identifier:id},select:{messages:{orderBy:{createdAt:'asc'},select:{role:true,content:true}}}});
  if(!s){console.log('(no session yet)');return;}
  for(const m of s.messages.slice(-n)) console.log(`${m.role}: ${m.content}`);
  await db.$disconnect();
})().catch(e=>{console.error(e.message);process.exit(1);});
