import test from 'node:test';
import assert from 'node:assert/strict';
import {thoughtText,thoughtPlacement} from './thought-view.js';
import {orderDefinitions} from './orders.js';

test('all selectable instructions have distinct natural thoughts without technical labels',()=>{
 const texts=orderDefinitions.map(o=>thoughtText(`指示：${o.name}`));
 assert.equal(new Set(texts).size,19);
 for(const text of texts)assert.ok(text&&!/指示：|基本行動：|戦術判断：/.test(text));
 assert.equal(thoughtText('戦術判断：封門の骸騎士を優先'),'封門の骸騎士から倒そう。');
 assert.equal(thoughtText('隣接するスライムと交戦'),'スライムか……ここは戦うしかない。');
 assert.match(thoughtText('階段は封印中。中ボスを倒す必要がある'),/門番/);
});

test('bubble tracks the hero across desktop and mobile edges, switching below at top',()=>{
 for(const width of [280,360,744])for(const bubbleWidth of [120,135,210]){
  const height=width*23/31,bubbleHeight=55;
  for(const x of [width/31,width/2,width*30/31])for(const y of [0,height/2,height-24]){
   const p=thoughtPlacement({x,y,width,height,bubbleWidth,bubbleHeight,spriteHeight:height/23});
   assert.ok(p.left>=6&&p.left+bubbleWidth<=width-6);
   assert.ok(p.top>=6&&p.top+bubbleHeight<=height-6);
   assert.equal(p.below,y<65);
   assert.ok(p.tail>=10&&p.tail<=bubbleWidth-10);
   if(x===width/2)assert.equal(p.left+p.tail,x);
   if(y===0)assert.ok(p.top>=height/23+10);
  }
 }
 const p=thoughtPlacement({x:650,y:350,width:744,height:552,bubbleWidth:135,bubbleHeight:40});
 assert.equal(p.left+p.tail,650); // No former 55% cap on right-side movement.
});
