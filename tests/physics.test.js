import {test} from 'node:test';import assert from 'node:assert/strict';
import {createShot,simulateShot,basketX} from '../src/physics.js';import {GOLD_IDS} from '../src/level.js';
import {initialState,reserveShot,settleShot} from '../src/state.js';
test('Matter: colisiones, rebotes y fin del tiro',()=>{const s=createShot([], .85);let bounced=false,prev=s.ball.velocity.x;while(!s.ended){s.step();if(Math.sign(prev)!==Math.sign(s.ball.velocity.x))bounced=true;prev=s.ball.velocity.x;}assert.ok(bounced);assert.ok(s.hits.size>=5);assert.ok(s.elapsed<=18010);s.destroy();});
test('recuperación determinista: mismo ángulo, estado y fase, mismo tiro',()=>{assert.deepEqual(simulateShot([],.5,2300),simulateShot([],.5,2300));});
test('las canastas se mueven dentro del tablero sin añadir bolas',()=>{for(let t=0;t<30000;t+=100){assert.ok(basketX(t)>=75&&basketX(t)<=405);}assert.equal(typeof simulateShot([],0,100).basket,'boolean');});
test('nivel comprobado ganable en cuatro trayectorias razonables',()=>{let state=initialState('r',{name:'Ana',surname:'P',school:'E',town:'A'},'u');for(const angle of [.85,.5,-.3,-.675]){const reserved=reserveShot(state,angle,0);const r=simulateShot(state.removed,angle,0);state=settleShot(reserved,r.ids,r.basket).state;}assert.equal(state.status,'won');assert.equal(state.used,4);assert.ok(GOLD_IDS.every(id=>state.removed.includes(id)));});
test('cada tiro termina incluso en ángulos extremos',()=>{for(const angle of [-1.15,-.8,0,.8,1.15])assert.ok(simulateShot([],angle).elapsed<=18010);});
