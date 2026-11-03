import {test,expect} from '@playwright/test';
import {initializeTestEnvironment} from '@firebase/rules-unit-testing';
import {doc,setDoc,updateDoc,Timestamp} from 'firebase/firestore';

// Datos sintéticos sólo en el emulador; ninguna escritura en producción.
test('Top 10: límite, partidas finalizadas, desempate, actualizaciones y ronda nueva',async({page})=>{
 const env=await initializeTestEnvironment({projectId:'demo-arenales-pegball',firestore:{host:'127.0.0.1',port:8080}});
 const roundId='top-ten-test';
 try{
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async context=>{
   const db=context.firestore();
   await setDoc(doc(db,'event','current'),{roundId,number:1,updatedAt:Timestamp.now()});
   await setDoc(doc(db,'rounds',roundId),{number:1,createdAt:Timestamp.now()});
   await Promise.all(Array.from({length:13},(_,i)=>{
    const n=i+1,uid=`player-${String(n).padStart(2,'0')}`;
    return setDoc(doc(db,'rounds',roundId,'scores',uid),{uid,roundId,displayName:`Jugador ${String(n).padStart(2,'0')} A.`,...(n===10?{}:{school:'E.E.S. N.º 1',town:'Ascensión'}),score:n===3?1200:1400-n*100,used:n===2?2:4,status:'lost',finishedAt:Timestamp.fromMillis(10000+n),updatedAt:Timestamp.now()});
   }));
   await setDoc(doc(db,'rounds',roundId,'scores','active-player'),{uid:'active-player',roundId,displayName:'Partida activa A.',score:9999,used:1,status:'active',finishedAt:null,updatedAt:Timestamp.now()});
  });
  await page.setViewportSize({width:1440,height:1080});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/ranking.html?emulator=1');
  await expect(page.locator('#sync')).toContainText('conectado');
  const rows=page.locator('#top-ten-body tr');
  await expect(rows).toHaveCount(10);
  await expect(rows.first()).toContainText('Jugador 01 A.');
  await expect(rows.first()).toContainText('E.E.S. N.º 1 · Ascensión');
  await expect(rows.last().locator('.player-details')).toHaveCount(0);
  await expect(rows.nth(1)).toContainText('Jugador 02 A.');
  await expect(rows.nth(2)).toContainText('Jugador 03 A.');
  await expect(rows.last()).toContainText('Jugador 10 A.');
  await expect(page.locator('#top-ten-body')).not.toContainText('Partida activa');
  await expect(page.locator('#top-ten-body')).not.toContainText('Jugador 11');
  await expect(page.locator('.podium-card')).toHaveCount(3);
  await expect(page.locator('.podium-card').first()).toContainText('Jugador 01 A.');
  await expect(page.locator('.podium-card').first()).toContainText('E.E.S. N.º 1 · Ascensión');
  await expect(page.locator('h1')).toContainText('Grandes lanzamientos.');
  await expect(page.locator('.play-link')).toHaveCount(0);
  await env.withSecurityRulesDisabled(async c=>updateDoc(doc(c.firestore(),'rounds',roundId,'scores','player-13'),{score:2000,school:'Escuela de Educación Secundaria Agraria N.º 1 de General Arenales',town:'General Arenales'}));
  await expect(rows.first()).toContainText('Jugador 13 A.');
  await expect(rows.first()).toContainText('Escuela de Educación Secundaria Agraria N.º 1 de General Arenales · General Arenales');
  await expect(page.locator('.podium-card').first()).toContainText('Jugador 13 A.');
  await expect(rows).toHaveCount(10);
  await page.screenshot({path:'docs/ranking-top10-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});
  await expect(page.getByRole('heading',{name:'Top 10 de la ronda'})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();
  await page.screenshot({path:'docs/ranking-top10-mobile.png',fullPage:true});
  await env.withSecurityRulesDisabled(async c=>setDoc(doc(c.firestore(),'event','current'),{roundId:'top-ten-empty',number:2,updatedAt:Timestamp.now()}));
  await expect(page.locator('#round-label')).toContainText('RONDA 02');
  await expect(page.locator('#top-ten-body')).toContainText('Todavía no hay partidas finalizadas');
  await expect(page.locator('.podium-card')).toHaveCount(0);
  expect(errors).toEqual([]);
 }finally{await page.close();await env.clearFirestore();await env.cleanup();}
});
