import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame, makeFloor, normalizeSave, tick, ascend, attackEnemy, LAST_FLOOR} from './engine.js';
import {captureFieldMessages, collectFieldMessages} from './field-messages.js';
import {bossMemory, WILL_UNLOCK_LINE} from './story-text.js';
import {openingVariant} from './opening.js';

test('B30 will chest is adjacent, sealed on the first journey, and collected before stairs on the next', () => {
  const first = newGame(17);
  const chest = first.items.find(item => item.type === 'letter');
  assert.equal(Math.abs(chest.x - first.player.x) + Math.abs(chest.y - first.player.y), 1);
  first.phase = 'explore';
  first.enemies = [];
  first.player = {x: chest.x, y: chest.y};
  tick(first);
  assert.equal(first.letter, false);
  assert.ok(first.items.includes(chest));

  first.floor = LAST_FLOOR;
  first.phase = 'cleared';
  assert.ok(ascend(first));
  assert.equal(first.runEnding, 'first');
  assert.ok(first.logs.some(entry => entry.text === WILL_UNLOCK_LINE));
  const second = newGame(17, first.profile);
  const will = second.items.find(item => item.type === 'letter');
  second.phase = 'explore';
  const before = captureFieldMessages(second);
  tick(second);
  assert.deepEqual(second.player, {x: will.x, y: will.y});
  assert.equal(second.letter, true);
  assert.equal(second.cardOffer, null);
  assert.equal(collectFieldMessages(before, second)[0].kind, 'will');

  second.floor = LAST_FLOOR;
  makeFloor(second);
  second.phase = 'cleared';
  assert.ok(ascend(second));
  const restored = normalizeSave(second);
  assert.equal(restored.runEnding, 'will');
  assert.equal(restored.profile.normalClears, 1);
  assert.equal(openingVariant(restored.profile), 'segare');
});

test('boss defeats trigger the correct story beat on both journeys', () => {
  for (const normalClears of [0, 1]) {
    for (const floor of [11, 21, 30]) {
      const state = newGame(38);
      state.profile.normalClears = normalClears;
      state.floor = floor;
      makeFloor(state);
      const boss = state.enemies[0];
      boss.hp = 1;
      const before = captureFieldMessages(state);
      state.turn++;
      attackEnemy(state, boss, {power: 100});
      const text = bossMemory(floor, normalClears);
      assert.equal(state.augmentOffer?.source, floor === 30 ? undefined : 'boss:' + floor);
      assert.ok(state.memories.includes(text));
      const messages=collectFieldMessages(before,state);
      assert.deepEqual(messages[0], {kind: normalClears ? 'memory' : 'story', text});
    }
  }
});

test('older saves migrate the will chest once and retain an already collected will', () => {
  const state = newGame(17);
  delete state.willChestRevision;
  state.items = state.items.filter(item => item.type !== 'letter');
  const restored = normalizeSave(state);
  assert.equal(restored.items.filter(item => item.type === 'letter').length, 1);
  assert.deepEqual(normalizeSave(restored).items, restored.items);
  state.floor = 16;
  makeFloor(state);
  state.items.push({...state.player, type: 'letter'});
  assert.ok(!normalizeSave(state).items.some(item => item.type === 'letter'));
  state.letter = true;
  assert.equal(normalizeSave(state).letter, true);
});

test('first ending carries the actual card inventory into the next journey',async()=>{
 const {newGame,ascend,LAST_FLOOR}=await import('./engine.js');
 const {grantCard}=await import('./card-inventory.js');
 const first=newGame(43);grantCard(first,'skill:warp');
 first.extensions={unlocked:['condition-or']};first.levels.cardSlots=1;
 first.phase='cleared';first.floor=LAST_FLOOR;ascend(first);
 const second=newGame(44,first.profile,{shortJourney:true});
 assert.ok(second.ownedCards.includes('skill:warp'));
 assert.ok(second.unlockedOrders.includes('warp')||second.abilities.includes('warp'));
 assert.deepEqual(second.extensions.unlocked,['condition-or']);
 assert.equal(second.levels.cardSlots,1);
 assert.deepEqual(second.augments,[]);
});

test('B25 route preserves legacy saves and exposes debug boss techniques',async()=>{
 const {newGame,normalizeSave,zoneFor,nextStageHint,tick,startFloorFor}=await import('./engine.js');
 const {debugJourney}=await import('./debug-tools.js');
 const {tutorialKey}=await import('./screen-tutorial.js');
 const {bossSkills}=await import('./field-events.js');
 const first=newGame(1,undefined,{shortJourney:true});
 const legacy=newGame(1);
 assert.equal(startFloorFor(first),6);
 assert.equal(startFloorFor(normalizeSave(legacy)),6);
 assert.equal(zoneFor(first).id,'crypt');
 assert.ok(normalizeSave(first).items.some(i=>i.type==='letter'));
 assert.equal(tutorialKey({...first,phase:'explore'}),'explore:1');
 assert.equal(tutorialKey({...first,floor:10,phase:'prepare'}),'prepare:5');
 for(const basement of [20,10,1]){
  const s=debugJourney(first,basement,true);
  const boss=s.enemies.find(e=>e.boss),skill=bossSkills[boss.id];
  assert.ok(nextStageHint({...s,floor:s.floor-1}).text.includes(skill.name));
  const before=captureFieldMessages(s);
  tick(s);
  const messages=collectFieldMessages(before,s);
  assert.equal(messages[0].kind,'skill');
  assert.ok(messages[0].text.includes(skill.name));
  assert.ok(messages[0].text.includes(boss.name));
  assert.equal(boss.bossSkillUsed,true);
  assert.ok(s.damageEvents.some(event=>event.skillId===boss.id));
  const loaded=normalizeSave(s);
  assert.equal(loaded.enemies.find(e=>e.boss).bossSkillUsed,true);
 }
});

test('first-clear instruction growth is fixed across later losses and endings',async()=>{
 const {newGame,ascend,LAST_FLOOR,normalizeSave}=await import('./engine.js');
 const {grantCard}=await import('./card-inventory.js');
 const first=newGame(43);first.levels.commandSlots=5;first.levels.cardSlots=2;
 first.extensions={unlocked:['condition-or'],uses:{},serviceRevision:1,cardRerolls:0,augmentRerolls:0};
 first.floor=LAST_FLOOR;first.phase='cleared';ascend(first);
 const saved=structuredClone(first.profile.carryInstructions);
 const second=newGame(44,first.profile);
 assert.equal(second.levels.commandSlots,5);assert.equal(second.levels.cardSlots,2);
 assert.deepEqual(second.extensions.unlocked,['condition-or']);
 grantCard(second,'action:wait');second.levels.commandSlots=8;second.phase='cleared';second.floor=LAST_FLOOR;
 ascend(second);assert.deepEqual(second.profile.carryInstructions,saved);
 const third=newGame(45,second.profile);assert.equal(third.levels.commandSlots,5);
 assert.equal(third.ownedCards.includes('action:wait'),first.ownedCards.includes('action:wait'));
 const corrupt=structuredClone(first);corrupt.profile.carryInstructions.cardSlots=999;
 assert.equal(normalizeSave(corrupt),null);
});

test('legacy 30-floor saves migrate to B25 without dropping inventory or growth',async()=>{
 const {newGame,normalizeSave,createGear}=await import('./engine.js');
 for(const floor of [1,5,6,12,21]){
  const legacy=newGame(81);delete legacy.shortJourney;legacy.floor=floor;
  legacy.inventory.push(createGear('weapon-3'));legacy.levels.commandSlots=2;legacy.shards=91;
  const before=JSON.stringify(legacy),loaded=normalizeSave(legacy);
  assert.ok(loaded);assert.equal(loaded.floor,Math.max(6,floor));assert.equal(loaded.shortJourney,true);
  assert.deepEqual(loaded.inventory,legacy.inventory);assert.equal(loaded.shards,91);
  assert.equal(loaded.levels.commandSlots,2);assert.deepEqual(loaded.ownedCards,legacy.ownedCards);
  if(floor>=6)assert.deepEqual(loaded.grid,legacy.grid);
  assert.equal(JSON.stringify(legacy),before);assert.deepEqual(normalizeSave(loaded),loaded);
 }
});
