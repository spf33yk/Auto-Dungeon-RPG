import test from 'node:test';
import assert from 'node:assert/strict';
import {preparationFloorInfo} from './field-events.js';
test('preparation describes the current B25 start rather than the following floor',()=>{const info=preparationFloorInfo({floor:6,seed:7,profile:{normalClears:0}});assert.equal(info.basement,'B25');assert.equal(info.name,'忘れられた地下墓所');assert.equal(info.event,'なし');assert.deepEqual(info.monsters,['墓地スライム','骨の番兵']);assert.equal(info.skill,'なし');});
test('B20 preparation announces the boss skill only after the first clear',()=>{const base={floor:11,seed:7};const first=preparationFloorInfo({...base,profile:{normalClears:0}}),second=preparationFloorInfo({...base,profile:{normalClears:1}});assert.equal(first.basement,'B20');assert.equal(first.skill,'なし');assert.equal(second.skill,'封門斬（各戦闘1回）');assert.match(second.skillDetail,/HP75%以下/);assert.equal(second.monsters.length,1);});
