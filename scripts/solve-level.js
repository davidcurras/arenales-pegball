import {simulateShot} from '../src/physics.js';
import {PEGS} from '../src/level.js';
let removed=[];const solution=[];
for(let i=0;i<5&&removed.filter(id=>PEGS[id].gold).length<12;i++){let best;for(let n=-44;n<=44;n++){const angle=n*.025;const r=simulateShot(removed,angle,0),g=r.ids.filter(id=>PEGS[id].gold).length;const value=g*100+r.ids.length;if(!best||value>best.value)best={...r,angle,value,g};}removed=[...removed,...best.ids];solution.push({angle:best.angle,ids:best.ids,gold:best.g,basket:best.basket});}
console.log(JSON.stringify({solution,won:removed.filter(id=>PEGS[id].gold).length===12},null,2));
