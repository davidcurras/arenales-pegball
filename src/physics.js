import Matter from 'matter-js';
import { PEGS,WIDTH } from './level.js';
export const STEP=1000/120;
export function basketX(t){return WIDTH/2+165*Math.sin(t*0.00065);}
export function createShot(removed,angle,phase=0){
 const {Engine,Bodies,Composite,Body,Events}=Matter;
 const engine=Engine.create({gravity:{x:0,y:1.18,scale:.001},enableSleeping:false});
 engine.positionIterations=8;engine.velocityIterations=8;
 const pegs=PEGS.filter(p=>!removed.includes(p.id)).map(p=>{const b=Bodies.circle(p.x,p.y,8,{isStatic:true,restitution:.84,friction:0,label:'peg'});b.pegId=p.id;return b;});
 const walls=[Bodies.rectangle(-10,350,20,1000,{isStatic:true,restitution:.86}),Bodies.rectangle(WIDTH+10,350,20,1000,{isStatic:true,restitution:.86}),Bodies.rectangle(240,-25,520,30,{isStatic:true,restitution:.8})];
 const ball=Bodies.circle(240,88,6,{restitution:.86,friction:0,frictionAir:.0008,slop:.01});
 Body.setVelocity(ball,{x:Math.sin(angle)*9.2,y:Math.cos(angle)*9.2});Composite.add(engine.world,[...pegs,...walls,ball]);
 const hits=new Set();let elapsed=0,ended=false,caught=false;
 Events.on(engine,'collisionStart',e=>{for(const pair of e.pairs){const p=pair.bodyA===ball?pair.bodyB:pair.bodyB===ball?pair.bodyA:null;if(p?.label==='peg')hits.add(p.pegId);}});
 return {engine,ball,hits,pegs,get elapsed(){return elapsed;},get ended(){return ended;},get basket(){return caught;},get basketPosition(){return basketX(phase+elapsed);},step(){if(ended)return;const previous={...ball.position};Engine.update(engine,STEP);elapsed+=STEP;
 // Detectar el cruce superior de la canasta: sólo su abertura puntúa.
 if(previous.y<626&&ball.position.y>=626&&ball.velocity.y>0){const f=(626-previous.y)/(ball.position.y-previous.y);const x=previous.x+(ball.position.x-previous.x)*f;const bx=basketX(phase+elapsed-STEP+f*STEP);caught=Math.abs(x-bx)<=40;}
 if(ball.position.y>660||elapsed>=18000){ended=true;}},destroy(){Events.off(engine);Composite.clear(engine.world,false);Engine.clear(engine);}};
}
export function simulateShot(removed,angle,phase=0){const s=createShot(removed,angle,phase);while(!s.ended)s.step();const result={ids:[...s.hits],basket:s.basket,elapsed:s.elapsed};s.destroy();return result;}
