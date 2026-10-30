import test from'node:test';import assert from'node:assert/strict';
import{newGame,createCardRule}from'./engine.js';import{forecastExploration,forecastSignature}from'./exploration-forecast.js';
import{readUiSettings,saveUiSettings}from'./ui-settings.js';import{PREPARATION_SKINS,nextPreparationSkin}from'./preparation-skins.js';
import{readPng}from'./test-support/png.js';import fs from'node:fs';
test('forecast keys change for placed instructions, condition values, equipment and hp',()=>{
 const s=newGame(44),key=forecastSignature(s,8);s.logs.push({text:'visual only'});s.intent='rendering';assert.equal(forecastSignature(s,8),key);
 for(const update of [s=>s.orders=[createCardRule('self',[{id:'hp-below',value:50}],'action','stairs')],s=>s.hp--,s=>s.levels.power++,s=>s.gear.weapon.plus=1]){const s=newGame(44);update(s);assert.notEqual(forecastSignature(s,8),key);}
});
test('a meaningful instruction edit changes simulated results without changing the real run',async()=>{
 const s=newGame(44);s.phase='prepare';s.enemies=[];s.items=[];s.stairs={...s.player};const original=JSON.stringify(s);
 const a=await forecastExploration(s,{samples:1,maxTurns:80,yieldTask:async()=>{}});assert.equal(a.clearRate,100);assert.equal(JSON.stringify(s),original);
 s.orders=[createCardRule('self',[],'action','explore-all')];const b=await forecastExploration(s,{samples:1,maxTurns:80,yieldTask:async()=>{}});assert.notDeepEqual([a.clearRate,a.turns],[b.clearRate,b.turns]);assert.notDeepEqual(a.orders,b.orders);
});
test('all skins persist separately from game saves and invalid settings fall back safely',()=>{
 let value='{}';const storage={getItem:()=>value,setItem:(k,v)=>value=v};for(const skin of PREPARATION_SKINS){saveUiSettings(storage,{preparationSkin:skin.id});assert.equal(readUiSettings(storage).preparationSkin,skin.id);assert.ok(nextPreparationSkin(skin.id));}
 value='{"preparationSkin":"missing"}';assert.equal(readUiSettings(storage).preparationSkin,'classic');assert.equal(readUiSettings(undefined).preparationSkin,'classic');
});
test('skins keep source geometry and alpha with bounded delivery size',()=>{
 let size=0;for(const skin of PREPARATION_SKINS.slice(1))for(const asset of ['card-target','card-condition','card-skill','card-action','tray-left','tray-middle','tray-right']){
 const file=`art/ui/preparation/${skin.id}/${asset}.png`,base=readPng(`art/ui/preparation/${asset}.png`),p=readPng(file);assert.equal(p.width,base.width);assert.equal(p.height,base.height);for(let y=0;y<p.height;y++)for(let x=0;x<p.width;x++)assert.equal(p.pixel(x,y)[3],base.pixel(x,y)[3]);size+=fs.statSync(file).size;}
 assert.ok(size<2*1024*1024);
});
