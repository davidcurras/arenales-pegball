import { connect,watchRound,watchRanking,sortRanking } from './firebase.js';
import { $,text,number,message,errorMessage } from './ui.js';
import { playerDetails } from './public-profile.js';

let unsubscribe=()=>{};

function appendDetails(parent,player){
 const details=playerDetails(player);
 if(!details)return;
 const line=document.createElement('span');
 line.className='player-details';
 line.textContent=details;
 parent.append(line);
}

function renderTopTen(ranking){
 const body=$('#top-ten-body');
 body.replaceChildren();
 if(!ranking.length){
  const row=document.createElement('tr'),cell=document.createElement('td');
  cell.colSpan=3;
  cell.className='top-ten-empty';
  cell.textContent='Todavía no hay partidas finalizadas. El Top 10 aparecerá acá.';
  row.append(cell);
  body.append(row);
  return;
 }
 for(const [i,player] of ranking.slice(0,10).entries()){
  const row=document.createElement('tr');
  if(i<3)row.className='top-ten-podium';
  for(const [className,value] of [
   ['top-ten-place',String(i+1).padStart(2,'0')],
   ['top-ten-name',player.displayName],
   ['top-ten-points',number(player.score)]
  ]){
   const cell=document.createElement('td');
   cell.className=className;
   cell.textContent=value;
   if(className==='top-ten-name')appendDetails(cell,player);
   row.append(cell);
  }
  body.append(row);
 }
}

function render(rows){
 const ranking=sortRanking(rows),top=ranking.slice(0,3),container=$('#podium');
 container.replaceChildren();
 if(!top.length){
  const p=document.createElement('p');
  p.className='empty';
  p.textContent='El primer lugar espera tu jugada. Finalizá tu partida para aparecer acá.';
  container.append(p);
 }
 for(const [i,r] of top.entries()){
  const card=document.createElement('article');
  card.className='podium-card';
  for(const [tag,cls,value]of [['div','podium-place',`0${i+1}`],['h2','',r.displayName],['strong','',number(r.score)],['small','','PUNTOS'],['small','',`${r.used} ${r.used===1?'BOLA':'BOLAS'} UTILIZADAS`]]){
   const el=document.createElement(tag);
   el.className=cls;
   el.textContent=value;
   card.append(el);
   if(tag==='h2')appendDetails(card,r);
  }
  container.append(card);
 }
 renderTopTen(ranking);
 text('#active-count',`${rows.filter(r=>r.status==='active').length} estudiantes en juego · ${ranking.length} partidas finalizadas`);
 message('Actualización en tiempo real · conectado');
}

try{
 await connect();
 watchRound(r=>{
  text('#round-label',`RONDA ${String(r.number).padStart(2,'0')} · EXPO CARRERAS 2026`);
  unsubscribe();
  unsubscribe=watchRanking(r.roundId,render,e=>message(errorMessage(e),'error'));
 },e=>message(errorMessage(e),'error'));
}catch(e){message(errorMessage(e),'error');}
