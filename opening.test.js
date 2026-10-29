import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,normalizeSave,validateSave,ascend,LAST_FLOOR} from './engine.js';
import {openingVariant} from './opening.js';
import {debugTitleEnding} from './debug-tools.js';

test('legacy saves gain an unachieved title flag without losing progress',()=>{
 const old=newGame(91);delete old.profile.trueEnding;const before=JSON.stringify(old),loaded=normalizeSave(old);
 assert.ok(loaded);assert.equal(loaded.version,13);assert.equal(loaded.profile.trueEnding,false);assert.equal(openingVariant(loaded.profile),'mukuro');
 assert.deepEqual(loaded.gear,old.gear);assert.equal(loaded.hp,old.hp);assert.equal(loaded.floor,old.floor);assert.equal(JSON.stringify(old),before);
 const bad=structuredClone(loaded);bad.profile.trueEnding='yes';assert.equal(normalizeSave(bad),null);
});
test('debug title achievement persists, survives a new journey, and can be reverted',()=>{
 const s=newGame(92);assert.equal(debugTitleEnding(s,true),true);assert.equal(s.debugUsed,true);assert.equal(openingVariant(s.profile),'segare');
 const loaded=normalizeSave(JSON.parse(JSON.stringify(s)));assert.equal(openingVariant(loaded.profile),'segare');assert.ok(validateSave(newGame(93,loaded.profile)));
 assert.equal(openingVariant(newGame(93,loaded.profile).profile),'segare');assert.equal(debugTitleEnding(loaded,false),true);assert.equal(openingVariant(loaded.profile),'mukuro');
 assert.equal(debugTitleEnding(loaded,1),false);
});
test('normal ending never grants the future TRUE ending title achievement',()=>{
 const s=newGame(94);s.floor=LAST_FLOOR;s.phase='cleared';assert.equal(ascend(s),true);assert.equal(s.profile.normalClears,1);assert.equal(s.profile.trueEnding,false);assert.equal(openingVariant(s.profile),'mukuro');
});
