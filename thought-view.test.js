import test from 'node:test';
import assert from 'node:assert/strict';
import {thoughtText,appendThought} from './thought-view.js';
import {orderDefinitions} from './orders.js';

test('all selectable instructions have distinct natural thoughts without technical labels',()=>{
 const texts=orderDefinitions.map(o=>thoughtText(`指示：${o.name}`));
 assert.equal(new Set(texts).size,19);
 for(const text of texts)assert.ok(text&&!/指示：|基本行動：|戦術判断：/.test(text));
 assert.equal(thoughtText('戦術判断：封門の骸騎士を優先'),'封門の骸騎士から倒そう。');
 assert.equal(thoughtText('隣接するスライムと交戦'),'スライムか……ここは戦うしかない。');
 assert.match(thoughtText('階段は封印中。中ボスを倒す必要がある'),/門番/);
});

test('thought chat suppresses consecutive repeats and keeps the latest thirty decisions',()=>{
 const empty=[],first=appendThought(empty,'視界の先を調べる',1);
 assert.deepEqual(empty,[]);assert.equal(first.length,1);assert.equal(first[0].turn,1);
 assert.equal(appendThought(first,'基本行動：視界の先を調べる',2),first);
 let history=first;for(let i=2;i<=40;i++)history=appendThought(history,i%2?'指示：階段を発見したら向かう':'隣接する墓地スライムと交戦',i);
 assert.equal(history.length,30);assert.equal(history[0].turn,11);assert.equal(history.at(-1).turn,40);
 assert.equal(first.length,1);assert.ok(!history.some(row=>/戦術判断：|指示：/.test(row.text)));
});
