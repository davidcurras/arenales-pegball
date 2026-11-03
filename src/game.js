import Phaser from 'phaser';
import { MAP_POINTS,PEGS } from './level.js';
import { createShot,basketX,STEP } from './physics.js';
export async function createGame(callbacks){
 let scene;
 class Arena extends Phaser.Scene {
  constructor(){super('Arena');this.state=null;this.ready=false;this.phase=0;this.angle=0;this.aiming=false;this.shot=null;this.acc=0;this.pulses=[];this.trail=[];this.seen=new Set();}
  create(){scene=this;this.g=this.add.graphics();this.input.on('pointerdown',p=>{if(this.ready&&!this.shot){this.aiming=true;this.aim(p);}});this.input.on('pointermove',p=>{if(this.aiming)this.aim(p);});this.input.on('pointerup',()=>{if(!this.aiming)return;this.aiming=false;if(!this.ready||this.shot)return;this.ready=false;callbacks.fire(this.angle,this.phase%100000);});this.input.on('gameout',()=>{this.aiming=false;});this.game.canvas.addEventListener('pointercancel',()=>{this.aiming=false;});}
  aim(p){this.angle=Phaser.Math.Clamp(Math.atan2(p.x-240,Math.max(35,p.y-78)),-1.15,1.15);}
  restoreState(state,ready=true){if(this.shot){this.shot.destroy();this.shot=null;}this.state=state;this.ready=ready&&state?.status==='active'&&!state.inFlight;this.seen=new Set();this.trail=[];this.pulses=[];}
  launch(state){this.restoreState(state,false);this.shot=createShot(state.removed,state.inFlight.angle,state.inFlight.phase);this.angle=state.inFlight.angle;this.phase=state.inFlight.phase;this.acc=0;}
  update(time,delta){const g=this.g;if(!g)return;
   if(this.shot&&!this.shot.ended){this.acc+=Math.min(delta,100);while(this.acc>=STEP&&!this.shot.ended){this.shot.step();this.acc-=STEP;}for(const id of this.shot.hits){if(!this.seen.has(id)){this.seen.add(id);this.pulses.push({id,time});callbacks.hit(PEGS[id].gold);}}this.trail.push({...this.shot.ball.position});if(this.trail.length>12)this.trail.shift();if(this.shot.ended){const shot=this.shot;this.time.delayedCall(400,()=>{if(this.shot===shot)callbacks.finish([...shot.hits],shot.basket);});}}
   if(!this.shot)this.phase=(this.phase+Math.min(delta,50))%100000;
   g.clear();g.fillStyle(0x071e35);g.fillRect(0,0,480,700);
   // Retícula discreta, contorno vectorial trazado sobre el mapa original.
   g.fillStyle(0x31516a,.35);for(let y=20;y<680;y+=32)for(let x=16;x<480;x+=32)g.fillCircle(x,y,.65);
   g.fillStyle(0x0a2c46,.75);g.lineStyle(9,0x1cd6e5,.045);g.fillPoints(MAP_POINTS,true);g.strokePoints(MAP_POINTS,true);g.lineStyle(2.2,0x24dce9,.68);g.strokePoints(MAP_POINTS,true);
   const removed=this.state?.removed??[];
   for(const p of PEGS){if(removed.includes(p.id))continue;const hit=this.seen.has(p.id),color=p.gold?0xffd04b:0x23d8e8;g.fillStyle(color,hit?.2:.055);g.fillCircle(p.x,p.y,hit?19:14);g.fillStyle(hit?0xffffff:color);g.fillCircle(p.x,p.y,8);g.fillStyle(0xffffff,hit?.9:.55);g.fillCircle(p.x-2.2,p.y-2.4,2.1);if(hit){g.lineStyle(1,color,.7);g.strokeCircle(p.x,p.y,12);}}
   this.pulses=this.pulses.filter(p=>time-p.time<450);for(const p of this.pulses){const age=(time-p.time)/450;g.lineStyle(2,PEGS[p.id].gold?0xffd04b:0x24dce9,1-age);g.strokeCircle(PEGS[p.id].x,PEGS[p.id].y,10+age*20);}
   const bx=this.shot?this.shot.basketPosition:basketX(this.phase);g.fillStyle(0x020f20,.7);g.fillEllipse(bx,665,110,14);g.fillStyle(0xffc83d);g.fillPoints([{x:bx-43,y:626},{x:bx+43,y:626},{x:bx+30,y:655},{x:bx-30,y:655}],true);g.fillStyle(0x071e35);g.fillEllipse(bx,626,86,15);g.lineStyle(3,0xffe59c);g.strokeEllipse(bx,626,86,15);g.lineStyle(2,0xffe59c);g.lineBetween(bx-30,655,bx+30,655);
   const a=this.angle,c=Math.cos(a),s=Math.sin(a);g.lineStyle(23,0x345f7b);g.lineBetween(240,48,240+s*27,48+c*27);g.lineStyle(17,0xa6c5d8);g.lineBetween(240,49,240+s*24,49+c*24);g.fillStyle(0xffd04b);g.fillCircle(240+s*28,48+c*28,12);g.fillStyle(0x071e35);g.fillCircle(240+s*30,48+c*30,8);
   if(!this.shot){g.fillStyle(0xf4fbff);g.fillCircle(240,88,6);if(this.ready){for(let i=1;i<=9;i++){const t=i*2.5;g.fillStyle(0x9ceef4,.75-i*.065);g.fillCircle(240+s*9.2*t,88+c*9.2*t+.16*t*t,1.8);}}}
   if(this.shot){for(let i=0;i<this.trail.length;i++){g.fillStyle(0xa5edf5,i/this.trail.length*.3);g.fillCircle(this.trail[i].x,this.trail[i].y,2+i/this.trail.length*3);}const {x,y}=this.shot.ball.position;g.fillStyle(0xffffff,.1);g.fillCircle(x,y,14);g.fillStyle(0xffffff);g.fillCircle(x,y,6);g.fillStyle(0x8be9f5);g.fillCircle(x-1.5,y-2,2);}
  }
 }
 const game=new Phaser.Game({type:Phaser.AUTO,parent:'game',width:480,height:700,backgroundColor:'#071e35',scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},render:{antialias:true,pixelArt:false},scene:Arena,audio:{noAudio:true},fps:{target:60},banner:false});
 await new Promise(resolve=>{const check=()=>scene?resolve():requestAnimationFrame(check);check();});
 const resize=new ResizeObserver(()=>game.scale.refresh());resize.observe(document.querySelector('#game'));
 return {setState:(s,r)=>scene.restoreState(s,r),launch:s=>scene.launch(s),setReady:r=>{scene.ready=r;},get scene(){return scene;},destroy:()=>{resize.disconnect();game.destroy(true);}};
}
