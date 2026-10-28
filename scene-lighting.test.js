import test from 'node:test';import assert from 'node:assert/strict';
import {dimmedWallTileset,floorLight,actorFootOffset,renderSightState,MEMORY_SHADE} from './scene-lighting.js';import {canSee,radius,newGame} from './engine.js';import {drawFootShadow} from './scene-depth.js';
test('wall shade uses the sprite alpha and caches an independent opaque-color atlas',()=>{
 const ops=[],ctx={drawImage(...a){ops.push(['image',...a]);},fillRect(...a){ops.push(['shade',this.globalCompositeOperation,this.fillStyle,...a]);}},canvas={getContext:()=>ctx},source={naturalWidth:128,naturalHeight:144},set={definition:{id:'crypt'},image:source};
 const dark=dimmedWallTileset(set,()=>canvas);assert.equal(dark.definition,set.definition);assert.equal(dark.image,canvas);assert.equal(canvas.width,128);assert.equal(canvas.height,144);assert.deepEqual(ops[1],['shade','source-atop',MEMORY_SHADE,0,0,128,144]);assert.equal(ctx.globalCompositeOperation,'source-over');assert.equal(dimmedWallTileset(set,()=>{throw Error('Should be cached');}),dark);assert.equal(dimmedWallTileset(null),null);assert.equal(set.image,source);
});
test('all out-of-sight terrain remains dim without affecting discovery',()=>{
 assert.equal(floorLight(false,false),'memory');assert.equal(floorLight(false,true),'visible');assert.equal(floorLight(true,false),'memory');assert.equal(floorLight(true,true),'visible');
});
test('visual sight follows the rendered tile without changing AI range or seeing through walls',()=>{
 const s=newGame(4);s.player={x:4,y:4};s.grid=Array.from({length:10},()=>Array(10).fill(1));s.grid[4][5]=0;const before=JSON.stringify(s);
 const view=renderSightState(s,{x:3.2,y:4});assert.deepEqual(view.player,{x:3,y:4});assert.equal(radius(view),radius(s));assert.ok(canSee(view,5,4));assert.equal(canSee(view,6,4),false);assert.deepEqual(renderSightState(s,{x:3.6,y:4}).player,s.player);assert.equal(JSON.stringify(s),before);
});
test('different transparent sprite padding shares a fixed ground contact and shadow',()=>{
 const height=28.32,top=24-height;for(const rows of [['....','xxxx','....','....'],['xxxx','xxxx','xxxx','xxxx']]){const last=rows.map((r,i)=>r.includes('x')?i:-1).reduce((a,b)=>Math.max(a,b));assert.ok(Math.abs(top+actorFootOffset(rows,height)+(last+1)*height/rows.length-22)<1e-9);}
 const ellipses=[],ctx={save(){},restore(){},beginPath(){},fill(){},ellipse(...a){ellipses.push(a);}};drawFootShadow(ctx,2.5,4.25);assert.equal(ellipses[0][0],72);assert.equal(ellipses[0][1],124);
});
