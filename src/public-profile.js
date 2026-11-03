// Proyección pública acordada para el evento. El apellido completo queda en la partida privada.
export function publicEntry(s,time=null){
 return {
  uid:s.uid,roundId:s.roundId,
  displayName:`${s.profile.name.trim()} ${s.profile.surname.trim().slice(0,1).toUpperCase()}.`,
  school:s.profile.school,town:s.profile.town,
  score:s.score,used:s.used,status:s.status,
  finishedAt:s.status==='active'?null:time,updatedAt:time
 };
}
export function playerDetails(player){
 return [player.school,player.town].filter(value=>typeof value==='string'&&value.trim()).map(value=>value.trim()).join(' · ');
}
