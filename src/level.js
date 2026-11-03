// Trazado manual del perímetro de PartidoArenales.jpg, coordenadas originales 600 × 420.
export const OUTLINE = [[1,295],[130,147],[259,1],[359,98],[385,66],[408,53],[441,44],[599,211],[570,243],[523,202],[489,236],[500,249],[478,274],[455,254],[432,278],[440,292],[422,309],[416,304],[391,332],[382,327],[373,331],[368,341],[370,359],[369,387],[358,392],[350,399],[347,380],[343,370],[334,366],[312,369],[262,418],[234,391],[225,395],[195,364],[208,350],[136,279],[106,311],[79,285],[34,324]];
export const MAP_SCALE=.76, MAP_X=12, MAP_Y=174;
export const MAP_POINTS=OUTLINE.map(([x,y])=>({x:MAP_X+x*MAP_SCALE,y:MAP_Y+y*MAP_SCALE}));
export const MAP_PATH=OUTLINE.map(([x,y],i)=>`${i?'L':'M'}${x},${y}`).join(' ')+' Z';
export function contains(x,y,points=MAP_POINTS){let c=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)c=!c;}return c;}
function makePegs(){const candidates=[];for(let row=0;row<11;row++){for(let col=0;col<15;col++){const x=22+col*32+(row%2)*16,y=190+row*29;if([[-10,0],[10,0],[0,-10],[0,10]].every(([dx,dy])=>contains(x+dx,y+dy)))candidates.push({x,y});}}return candidates;}
const candidates=makePegs();
// Selección uniforme reproducible: exactamente 60 cuerpos.
export const PEGS=Array.from({length:60},(_,i)=>({...candidates[Math.floor(i*candidates.length/60)],id:i,gold:false}));
export const GOLD_IDS=[0,4,8,12,16,20,24,28,32,36,40,44];
for(const p of PEGS)p.gold=GOLD_IDS.includes(p.id);
export const WIDTH=480,HEIGHT=700,MAX_SHOTS=5;
