import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,makeOrder,addOrder,editOrder,setMode,grantReward} from './engine.js';

test('every instruction mutation is rejected outside preparation without changing the save',()=>{
 for(const phase of ['awakening','explore','cleared','dead','ending']){
  const s=newGame(7);s.phase=phase;s.levels.commandSlots=2;
  s.orders=['retreat-low','stairs'].map(makeOrder);grantReward(s,'warp');
  const before=JSON.stringify(s);
  assert.equal(addOrder(s,'warp'),false,phase);
  assert.equal(addOrder(s,'collect-items'),false,phase);
  for(const [index,change] of [[0,'remove'],[0,'down'],[1,'up'],[0,50]])assert.equal(editOrder(s,index,change),false,phase);
  assert.equal(setMode(s,'collect'),false,phase);
  assert.equal(JSON.stringify(s),before,phase);
 }
});

test('preparation still supports adding, reordering, changing thresholds and removing orders',()=>{
 const s=newGame(7);s.floor=2;s.phase='prepare';s.levels.commandSlots=2;
 assert.equal(addOrder(s,'retreat-low'),true);
 assert.equal(editOrder(s,1,50),true);
 assert.equal(editOrder(s,1,'up'),true);
 assert.equal(s.orders[0].hp,50);
 assert.equal(editOrder(s,0,'down'),true);
 assert.equal(editOrder(s,1,'remove'),true);
 assert.equal(setMode(s,'collect'),true);
 assert.deepEqual(s.orders.map(o=>o.id),['collect-items','stairs']);
});
