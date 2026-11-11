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
      assert.ok(state.memories.includes(text));
      assert.deepEqual(collectFieldMessages(before, state)[0], {kind: normalClears ? 'memory' : 'story', text});
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
