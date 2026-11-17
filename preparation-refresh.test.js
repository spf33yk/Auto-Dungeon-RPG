import{grantCard}from'./card-inventory.js';
import test from'node:test';import assert from'node:assert/strict';
import{newGame,createCardRule}from'./engine.js';import{forecastExploration,forecastSignature}from'./exploration-forecast.js';
import{readUiSettings,saveUiSettings}from'./ui-settings.js';
test('forecast keys change for placed instructions, condition values, equipment and hp',()=>{
 const s=newGame(44),key=forecastSignature(s,8);s.logs.push({text:'visual only'});s.intent='rendering';assert.equal(forecastSignature(s,8),key);
 for(const update of [s=>s.orders=[createCardRule('self',[{id:'hp-below',value:50}],'action','stairs')],s=>s.hp--,s=>s.levels.power++,s=>s.gear.weapon.plus=1]){const s=newGame(44);update(s);assert.notEqual(forecastSignature(s,8),key);}
});
test('a meaningful instruction edit changes simulated results without changing the real run',async()=>{
 const s=newGame(44);s.phase='prepare';s.enemies=[];s.items=[];s.stairs={...s.player};const original=JSON.stringify(s);
 const a=await forecastExploration(s,{samples:1,maxTurns:80,yieldTask:async()=>{}});assert.equal(a.clearRate,100);assert.equal(JSON.stringify(s),original);
 grantCard(s,'action:explore-all');s.orders=[createCardRule('self',[],'action','explore-all')];const b=await forecastExploration(s,{samples:1,maxTurns:80,yieldTask:async()=>{}});assert.notDeepEqual([a.clearRate,a.turns],[b.clearRate,b.turns]);assert.notDeepEqual(a.rows,b.rows);assert.equal(b.rows[0].executed,1);
});
test('retired skin preferences are ignored without changing other settings',()=>{
 let value=JSON.stringify({preparationSkin:'black-iron',soundVolume:17,cameraZoom:90});const storage={getItem:()=>value,setItem:(k,v)=>value=v};
 assert.equal(readUiSettings(storage).preparationSkin,undefined);
 const settings=saveUiSettings(storage,{preparationSkin:'bone-parchment'});
 assert.equal(settings.preparationSkin,undefined);assert.equal(JSON.parse(value).preparationSkin,undefined);
 assert.equal(settings.soundVolume,17);assert.equal(settings.cameraZoom,90);
});
