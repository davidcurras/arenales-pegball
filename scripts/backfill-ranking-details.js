// Publica sólo escuela/localidad de puntajes existentes de la ronda actual.
// Por defecto es lectura; --apply aplica una actualización parcial, sin tocar puntuación ni fechas.
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {resolve,join} from 'node:path';
const root=fileURLToPath(new URL('..',import.meta.url));
process.env.XDG_CONFIG_HOME=resolve(root,'.tools/firebase-config');
const npmRoot=spawnSync('npm',['root','-g'],{encoding:'utf8'});
if(npmRoot.status!==0)throw new Error('No se pudo localizar Firebase CLI');
const require=createRequire(import.meta.url);
const auth=require(join(npmRoot.stdout.trim(),'firebase-tools/lib/auth.js'));
const account=auth.getGlobalDefaultAccount();
if(!account)throw new Error('Primero ejecutá npm run firebase:login');
const credentials=await auth.getAccessToken(account.tokens.refresh_token,['https://www.googleapis.com/auth/cloud-platform']);
const project='arenales-pegball';
const prefix=`projects/${project}/databases/(default)/documents`;
const base=`https://firestore.googleapis.com/v1/${prefix}`;
async function request(url,options={}){
 const response=await fetch(url,{...options,headers:{Authorization:`Bearer ${credentials.access_token}`,'Content-Type':'application/json',...options.headers}});
 if(!response.ok)throw new Error(`Firestore respondió HTTP ${response.status}; operación detenida`);
 return response.json();
}
async function list(path,fields){
 const docs=[];let token;
 do{
  const params=new URLSearchParams({pageSize:'300'});
  for(const field of fields)params.append('mask.fieldPaths',field);
  if(token)params.set('pageToken',token);
  const result=await request(`${base}/${path}?${params}`);
  docs.push(...(result.documents??[]));token=result.nextPageToken;
 }while(token);
 return docs;
}
const event=await request(`${base}/event/current`);
const round=event.fields.roundId.stringValue;
if(!/^[A-Za-z0-9_-]+$/.test(round))throw new Error('ID de ronda inválido');
const [scores,games]=await Promise.all([
 list(`rounds/${round}/scores`,['school','town']),
 list(`rounds/${round}/games`,['profile.school','profile.town'])
]);
const byId=new Map(games.map(g=>[g.name.split('/').at(-1),g]));
const writes=[];let missing=0;
for(const score of scores){
 const profile=byId.get(score.name.split('/').at(-1))?.fields?.profile?.mapValue?.fields;
 const school=profile?.school?.stringValue,town=profile?.town?.stringValue;
 if(!school||!town||school.length>80||town.length>80){missing++;continue;}
 if(score.fields?.school?.stringValue===school&&score.fields?.town?.stringValue===town)continue;
 writes.push({update:{name:score.name,fields:{school:{stringValue:school},town:{stringValue:town}}},updateMask:{fieldPaths:['school','town']},currentDocument:{exists:true}});
}
const summary={project,round,publicScores:scores.length,toUpdate:writes.length,missingProfiles:missing,applied:0};
if(process.argv.includes('--apply')){
 for(let start=0;start<writes.length;start+=300){
  const current=await request(`${base}/event/current`);
  if(current.fields.roundId.stringValue!==round)throw new Error('La ronda cambió; se detuvo la actualización');
  const batch=writes.slice(start,start+300);
  await request(`https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents:commit`,{method:'POST',body:JSON.stringify({writes:batch})});
  summary.applied+=batch.length;
 }
}
// No imprimir nombres, escuelas, localidades ni credenciales en el reporte.
console.log(JSON.stringify(summary,null,2));
