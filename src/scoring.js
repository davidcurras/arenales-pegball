export function shotScore(normal,gold,basket=false){
 if(!Number.isInteger(normal)||!Number.isInteger(gold)||normal<0||gold<0||normal+gold>60||normal>48||gold>12)throw new RangeError('Impactos inválidos');
 const hits=normal+gold,combo=hits>=10?300:hits>=5?100:0;
 const base=normal*10+gold*50;
 return {base,combo,multiplier:basket?2:1,total:(base+combo)*(basket?2:1)};
}
export function completionBonus(won,used){if(!Number.isInteger(used)||used<1||used>5)throw new RangeError('Tiros inválidos');return won?1000+(5-used)*500:0;}
export function statusFor(removed,used){return removed.filter(p=>p.gold).length===12?'won':used>=5?'lost':'active';}
export function compareEntries(a,b){return b.score-a.score||a.used-b.used||(a.finishedAt?.toMillis?.()??a.finishedAt??Infinity)-(b.finishedAt?.toMillis?.()??b.finishedAt??Infinity)||a.uid.localeCompare(b.uid);}
