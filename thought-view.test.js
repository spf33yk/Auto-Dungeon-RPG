import test from 'node:test';
import assert from 'node:assert/strict';
import {thoughtText} from './thought-view.js';
import {orderDefinitions} from './orders.js';

test('all selectable instructions have distinct natural thoughts without technical labels',()=>{
 const texts=orderDefinitions.map(o=>thoughtText(`指示：${o.name}`));
 assert.equal(new Set(texts).size,orderDefinitions.length);
 for(const text of texts)assert.ok(text&&!/指示：|基本行動：|戦術判断：/.test(text));
 assert.equal(thoughtText('戦術判断：封門の骸騎士を優先'),'封門の骸騎士から倒そう。');
 assert.equal(thoughtText('隣接するスライムと交戦'),'スライムか……ここは戦うしかない。');
 assert.match(thoughtText('階段は封印中。中ボスを倒す必要がある'),/門番/);
});
