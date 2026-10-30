import test from 'node:test';
import assert from 'node:assert/strict';
import {forecastSummary} from './forecast-view.js';
test('footer uses live forecast values including no-clear results',()=>{
 assert.deepEqual(forecastSummary('B29',{clearRate:100,turns:673,remainingHp:82}).map(x=>x.value),['100%','約673','余裕あり · 82%']);
 assert.equal(forecastSummary('B28',{clearRate:0,turns:null,remainingHp:24})[1].value,'到達なし');
 for(const [hp,label] of [[24,'危険'],[25,'やや不足'],[49,'やや不足'],[50,'余裕あり']])assert.equal(forecastSummary('B28',{clearRate:0,turns:null,remainingHp:hp})[2].value,`${label} · ${hp}%`);
 assert.equal(forecastSummary('B28')[0].label,'B28のClear見込み');
 assert.ok(forecastSummary('B28').every(x=>x.value==='計算中…'));
 assert.ok(forecastSummary('B28',null,'error').every(x=>x.value==='予測できません'));
});
