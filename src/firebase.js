import { initializeApp } from 'firebase/app';
import { getAuth,signInAnonymously,setPersistence,browserLocalPersistence,connectAuthEmulator } from 'firebase/auth';
import { getFirestore,connectFirestoreEmulator,doc,collection,query,limit,onSnapshot,runTransaction,serverTimestamp } from 'firebase/firestore';
import { initialState,reserveShot,settleShot } from './state.js';
import { compareEntries } from './scoring.js';
import { publicEntry } from './public-profile.js';
export { publicEntry } from './public-profile.js';
export const PRACTICE=new URLSearchParams(location.search).get('practice')==='1';
const emulated=['localhost','127.0.0.1'].includes(location.hostname)&&new URLSearchParams(location.search).get('emulator')==='1';
const app=initializeApp({apiKey:'AIzaSyAgPwyZ2QvOA78bXENscLy0xGZ_jFxshck',authDomain:'arenales-pegball.firebaseapp.com',projectId:emulated?'demo-arenales-pegball':'arenales-pegball',storageBucket:'arenales-pegball.firebasestorage.app',messagingSenderId:'342719252512',appId:'1:342719252512:web:b6268e1850ad95c1fd5445'});
const auth=getAuth(app),db=getFirestore(app);
if(emulated){connectAuthEmulator(auth,'http://127.0.0.1:9099',{disableWarnings:true});connectFirestoreEmulator(db,'127.0.0.1',8080);}
const configRef=doc(db,'event','current');
let uid,round,localGame;const practiceKey='arenales-practice-v1';
export function sortRanking(rows,official=true){return rows.filter(r=>!official||r.status!=='active').sort(compareEntries);}
export async function connect(){
 if(PRACTICE){uid='practice';round={roundId:'practice',number:0};try{localGame=JSON.parse(localStorage.getItem(practiceKey));}catch{localGame=null;}return {uid,round};}
 await setPersistence(auth,browserLocalPersistence);uid=(await signInAnonymously(auth)).user.uid;
 round=await runTransaction(db,async tx=>{const snap=await tx.get(configRef);if(snap.exists())return snap.data();const id=crypto.randomUUID();const r={roundId:id,number:1,updatedAt:serverTimestamp()};tx.set(doc(db,'rounds',id),{number:1,createdAt:serverTimestamp()});tx.set(configRef,r);return r;});return {uid,round};
}
export function watchRound(next,error){if(PRACTICE){next(round);return ()=>{};}return onSnapshot(configRef,s=>next(s.data()),error);}
export function watchRanking(roundId,next,error){if(PRACTICE){next([]);return ()=>{};}return onSnapshot(query(collection(db,'rounds',roundId,'scores'),limit(100)),s=>next(s.docs.map(d=>d.data())),error);}
export async function getGame(){if(PRACTICE)return localGame;return runTransaction(db,async tx=>{const s=await tx.get(doc(db,'rounds',round.roundId,'games',uid));return s.exists()?s.data():null;});}
function refs(){return {game:doc(db,'rounds',round.roundId,'games',uid),score:doc(db,'rounds',round.roundId,'scores',uid)};}
function saveLocal(s){localGame=s;localStorage.setItem(practiceKey,JSON.stringify(s));return s;}
export async function startGame(profile){
 const p=Object.fromEntries(Object.entries(profile).map(([k,v])=>[k,v.trim().replace(/\s+/g,' ')]));
 if(['name','surname','school','town'].some(k=>!p[k]||p[k].length>80))throw new Error('Completá todos los campos (máximo 80 caracteres).');
 if(PRACTICE){if(localGame)return localGame;return saveLocal(initialState(round.roundId,p,uid));}
 const r=refs();return runTransaction(db,async tx=>{const c=await tx.get(configRef),existing=await tx.get(r.game);if(c.data().roundId!==round.roundId)throw new Error('La ronda cambió. Recargá la página.');if(existing.exists())return existing.data();const s=initialState(round.roundId,p,uid);tx.set(r.game,s);tx.set(r.score,publicEntry(s,serverTimestamp()));return s;});
}
async function mutate(previous,operation){
 if(PRACTICE){const next=operation(localGame);return saveLocal(next);}
 const r=refs();return runTransaction(db,async tx=>{const c=await tx.get(configRef),g=await tx.get(r.game);if(c.data().roundId!==round.roundId)throw new Error('La ronda cambió. Recargá para participar de la nueva ronda.');const s=g.data();
 // Otra pestaña o una respuesta de red perdida: nunca consumir un tiro a ciegas.
 if(s.revision!==previous.revision){return s;}
 const next=operation(s);if(next.status!=='active')next.finishedAt=serverTimestamp();tx.set(r.game,next);tx.set(r.score,publicEntry(next,serverTimestamp()));return next;});
}
export async function reserve(state,angle,phase){return mutate(state,s=>reserveShot(s,angle,phase));}
export async function settle(state,ids,basket){return mutate(state,s=>settleShot(s,ids,basket).state);}
export async function resetRound(){if(PRACTICE){localStorage.removeItem(practiceKey);location.reload();return;}return runTransaction(db,async tx=>{const s=await tx.get(configRef);const number=s.data().number+1,roundId=crypto.randomUUID();tx.set(doc(db,'rounds',roundId),{number,createdAt:serverTimestamp()});tx.set(configRef,{roundId,number,updatedAt:serverTimestamp()});return number;});}
