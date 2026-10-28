import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {cryptTileFrame,drawCryptTile} from './terrain-view.js';

test('crypt frame selection stays deterministic and inside its atlas without random state',()=>{
 const found=new Set();
 for(let y=0;y<20;y++)for(let x=0;x<20;x++)for(const floor of [false,true]){
  const f=cryptTileFrame(floor,x,y,9876);assert.deepEqual(f,cryptTileFrame(floor,x,y,9876));
  assert.ok([0,32].includes(f.x));assert.equal(f.y,floor?0:32);assert.equal(f.width,32);assert.equal(f.height,32);found.add(f.x);
 }
 assert.equal(found.size,2);
});
test('crypt rendering tolerates missing atlases and never draws outside the tile',()=>{
 const calls=[],ctx={drawImage(...a){calls.push(['image',...a]);},fillRect(...a){calls.push(['rect',...a]);}};
 const grid=Object.freeze([Object.freeze([true,true,true]),Object.freeze([true,false,true]),Object.freeze([true,true,true])]);
 assert.equal(drawCryptTile(ctx,{complete:false},grid,1,1,4),false);assert.equal(calls.length,0);
 assert.equal(drawCryptTile(ctx,{complete:true,naturalWidth:128,naturalHeight:128},grid,1,1,4),false);
 for(const size of [24,32]){
  calls.length=0;assert.equal(drawCryptTile(ctx,{complete:true,naturalWidth:64,naturalHeight:64},grid,1,1,4,size),true);
  assert.equal(ctx.imageSmoothingEnabled,false);
  for(const c of calls.filter(c=>c[0]==='rect')){const [,x,y,w,h]=c;assert.ok(x>=size&&y>=size&&x+w<=size*2&&y+h<=size*2);}
 }
 // A map corner must also tolerate missing north/west neighbors.
 assert.equal(drawCryptTile(ctx,{complete:true,naturalWidth:64,naturalHeight:64},grid,0,0,4),true);
});
test('production terrain PNG dimensions and combined storage budget remain bounded',()=>{
 let total=0;
 for(const [file,expected]of [['master-64.png',128],['atlas-32.png',64]]){
  const b=readFileSync(new URL('./art/terrain/crypt/'+file,import.meta.url));total+=b.length;
  assert.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(b.readUInt32BE(16),expected);assert.equal(b.readUInt32BE(20),expected);
 }
 assert.ok(total<=32768,'The 64px master and 32px delivery atlas together must stay below 32 KiB');
});
