import { PEGS } from './level.js';
import { shotScore,completionBonus,statusFor } from './scoring.js';
export function initialState(roundId,profile,uid){return {roundId,uid,profile,used:0,score:0,removed:[],status:'active',inFlight:null,revision:0,finishedAt:null};}
export function reserveShot(state,angle,phase){
 if(state.status!=='active'||state.used>=5||state.inFlight)throw new Error('No hay un tiro disponible');
 if(!Number.isFinite(angle)||Math.abs(angle)>1.15||!Number.isFinite(phase)||phase<0||phase>100000)throw new Error('Apuntado inválido');
 return {...state,used:state.used+1,inFlight:{angle,phase},revision:state.revision+1};
}
export function settleShot(state,ids,basket){
 if(!state.inFlight)throw new Error('No hay tiro pendiente');
 const hit=[...new Set(ids)].filter(id=>PEGS.some(p=>p.id===id)&&!state.removed.includes(id));
 const pegs=hit.map(id=>PEGS[id]);const details=shotScore(pegs.filter(p=>!p.gold).length,pegs.filter(p=>p.gold).length,basket);
 const removed=[...state.removed,...hit].sort((a,b)=>a-b),status=statusFor(removed.map(id=>PEGS[id]),state.used);
 const bonus=completionBonus(status==='won',state.used);
 return {state:{...state,removed,score:state.score+details.total+bonus,status,inFlight:null,revision:state.revision+1},details:{...details,bonus,hits:hit.length,gold:pegs.filter(p=>p.gold).length,basket}};
}
export function canPlayRound(state,roundId){return !state||state.roundId!==roundId;}
