import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,createCardRule,validCardRule,normalizeSave} from './engine.js';
import {placeCard,moveCardRow} from './card-placement.js';
import {targetCards,conditionCards,actionCards,skillCards} from './card-orders.js';
const prep=()=>{const s=newGame(31);s.phase='prepare';s.floor=2;s.orders=[createCardRule('self',[{id:'hp-below',value:45}],'action','stairs'),createCardRule('self',[{id:'visible'}],'action','chests')];return s;};
const palette=(type,id)=>({origin:'palette',type,id}),slot=(row,slot,index)=>({origin:'slot',row,slot,index}),dest=(row,slot,index)=>({row,slot,index});

test('palette cards replace target, effect or condition and preserve valid rules',()=>{
 const s=prep();assert.equal(placeCard(s,palette('condition','turns'),dest(0,'condition',1)),true);assert.deepEqual(s.orders[0].conditions[1],{id:'turns',value:150});
 assert.equal(placeCard(s,palette('condition','range'),dest(0,'condition',0)),true);assert.equal(s.orders[0].conditions[0].value,6);
 assert.equal(placeCard(s,palette('target','enemy'),dest(0,'target')),true);assert.equal(s.orders[0].effect.id,'attack');
 assert.equal(placeCard(s,palette('target','self'),dest(0,'target')),true);assert.equal(s.orders[0].effect.id,'stairs');
 assert.equal(placeCard(s,palette('action','chests'),dest(0,'effect')),true);assert.equal(s.orders[0].effect.id,'chests');assert.ok(s.orders.every(r=>validCardRule(s,r)));
});
test('reordering conditions, swapping and moving between rows are atomic',()=>{
 const s=prep();s.levels.cardSlots=1;s.orders[0].conditions.push({id:'range',value:7});
 assert.equal(placeCard(s,slot(0,'condition',0),dest(0,'condition',1)),true);assert.deepEqual(s.orders[0].conditions.map(c=>c.id),['range','hp-below']);
 assert.equal(placeCard(s,slot(0,'condition',0),dest(1,'condition',0)),true);assert.equal(s.orders[1].conditions[0].value,7);assert.equal(s.orders[0].conditions[0].id,'visible');
 assert.equal(placeCard(s,slot(1,'condition',0),dest(0,'condition',2)),true);assert.equal(s.orders[0].conditions[2].id,'range');assert.equal(s.orders[1].conditions.length,0);
 const before=structuredClone(s.orders);assert.equal(placeCard(s,palette('condition','range'),dest(0,'condition',0)),false);assert.deepEqual(s.orders,before);
});
test('locked rewards, mismatched categories, duplicate conditions and capacity cannot mutate data',()=>{
 const s=prep(),before=structuredClone(s.orders);for(const [a,b] of [[palette('skill','mend'),dest(0,'effect')],[palette('action','attack'),dest(0,'effect')],[palette('condition','one-hit'),dest(0,'condition',1)],[palette('action','stairs'),dest(0,'target')],[palette('condition','hp-below'),dest(0,'condition',1)]])assert.equal(placeCard(s,a,b),false);
 assert.deepEqual(s.orders,before);s.abilities.push('mend');assert.equal(placeCard(s,palette('skill','mend'),dest(0,'effect')),true);
 s.orders[0].conditions.push({id:'visible'});const full=structuredClone(s.orders);assert.equal(placeCard(s,palette('condition','range'),dest(0,'condition',2)),false);assert.deepEqual(s.orders,full);
 s.phase='explore';const saved=structuredClone(s.orders);assert.equal(placeCard(s,palette('action','stairs'),dest(0,'effect')),false);assert.equal(moveCardRow(s,0,1),false);assert.deepEqual(s.orders,saved);
});
test('row priority is reordered and persists with existing save format',()=>{
 const s=prep();assert.equal(moveCardRow(s,0,1),true);assert.equal(s.orders[0].effect.id,'chests');const saved=normalizeSave(JSON.parse(JSON.stringify(s)));assert.deepEqual(saved.orders,s.orders);assert.equal(saved.version,13);
});
test('expanded capacity supports eight rows and four conditions without exceeding limits',()=>{
 const s=prep();s.levels.commandSlots=6;s.levels.cardSlots=2;s.orders=Array.from({length:8},()=>createCardRule());
 for(const [index,id] of ['hp-below','visible','range','hp-above'].entries())assert.equal(placeCard(s,palette('condition',id),dest(7,'condition',index)),true);
 const before=structuredClone(s.orders);assert.equal(placeCard(s,palette('condition','turns'),dest(7,'condition',4)),false);assert.deepEqual(s.orders,before);
 assert.equal(moveCardRow(s,7,0),true);assert.equal(s.orders[0].conditions.length,4);assert.ok(s.orders.every(r=>validCardRule(s,r)));
});
test('every existing card can be placed on a compatible rule when acquired',()=>{
 for(const c of targetCards){const s=prep();assert.equal(placeCard(s,palette('target',c.id),dest(0,'target')),true,c.id);}
 for(const c of conditionCards){const s=prep();s.orders[0]=['one-hit','injured'].includes(c.id)?createCardRule('enemy',[],'action','attack'):createCardRule();assert.equal(placeCard(s,palette('condition',c.id),dest(0,'condition',0)),true,c.id);}
 for(const [kind,cards] of [['action',actionCards],['skill',skillCards]])for(const c of cards){const s=prep();s.abilities.push('mend');s.unlockedOrders.push('warp','avoid-traps');s.orders[0]=c.enemy?createCardRule('enemy',[],'action','attack'):createCardRule();assert.equal(placeCard(s,palette(kind,c.id),dest(0,'effect')),true,c.id);}
});
