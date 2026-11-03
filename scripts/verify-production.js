// Verificación de lectura: no registra jugadores, no dispara ni reinicia rondas.
import {chromium,expect} from '@playwright/test';
import {writeFileSync} from 'node:fs';
const base='https://arenales-pegball.web.app';
const browser=await chromium.launch();
try{
 const context=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const report={base,checkedAt:new Date().toISOString(),pages:[],gameRecordsCreated:0};
 for(const [path,selector,expected]of [['/','#sync','Conectado · listo para jugar'],['/ranking.html','#sync','conectado'],['/admin.html','#sync','Panel conectado']]){
  const response=await page.goto(base+path);expect(response.status()).toBe(200);await expect(page.locator(selector)).toContainText(expected,{timeout:30000});
  const headers=response.headers();expect(headers['content-security-policy']).toContain("default-src 'self'");expect(headers['x-content-type-options']).toBe('nosniff');
  if(path==='/'){await expect(page.locator('#start')).toBeEnabled();await expect(page.locator('#round-label')).toContainText(/RONDA \d{2}/);await page.screenshot({path:'docs/production-desktop.png'});await page.setViewportSize({width:390,height:844});await page.screenshot({path:'docs/production-mobile.png'});await page.setViewportSize({width:1440,height:1000});}
  if(path==='/ranking.html'){await expect(page.locator('#active-count')).toContainText('estudiantes en juego');await expect(page.getByRole('heading',{name:'Top 10 de la ronda'})).toBeVisible();await expect(page.locator('#top-ten-body')).not.toContainText('Esperando las primeras');expect(await page.locator('#top-ten-body .top-ten-place').count()).toBeLessThanOrEqual(10);const positions=await page.locator('#top-ten-body .top-ten-place').count();const podiumCount=await page.locator('.podium-card').count();await expect(page.locator('#top-ten-body .player-details')).toHaveCount(positions);await expect(page.locator('.podium-card > .player-details')).toHaveCount(podiumCount);await page.screenshot({path:'docs/ranking-top10-production.png',fullPage:true});}
  if(path==='/admin.html')await expect(page.locator('#reset')).toBeEnabled();
  report.pages.push({path,status:response.status(),state:await page.locator(selector).innerText(),csp:true});
 }
 expect(errors).toEqual([]);report.javascriptErrors=errors;writeFileSync('docs/production-check.json',JSON.stringify(report,null,2)+'\n');console.log(report);
 await context.close();
}finally{await browser.close();}
