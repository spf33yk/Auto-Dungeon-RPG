import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,W,H,canSee,reveal,radius,normalizeSave,upgrade,skills} from './engine.js';

function room(){const s=newGame(29);s.obstacles=[];s.grid=Array.from({length:H},()=>Array(W).fill(1));s.player={x:15,y:11};s.seen=s.grid.map(r=>r.map(()=>false));s.visited=s.grid.map(r=>r.map(()=>false));s.enemies=[];s.gimmick={id:'none'};return s;}

test('sight is the full square at each memory rank, including diagonal corners',()=>{
 for(let rank=0;rank<=4;rank++){
  const s=room();s.levels.scout=rank;const r=3+rank;let count=0;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
   const expected=Math.abs(x-15)<=r&&Math.abs(y-11)<=r;
   assert.equal(canSee(s,x,y),expected,`rank ${rank} at ${x},${y}`);if(canSee(s,x,y))count++;
  }
  assert.equal(count,(2*r+1)**2);assert.equal(radius(s),r);
 }
});
test('walls and closed diagonal corners still occlude square vision',()=>{
 const s=room();s.grid[11][16]=0;assert.equal(canSee(s,16,11),true);assert.equal(canSee(s,17,11),false);
 s.grid[12][15]=0;assert.equal(canSee(s,16,12),false);assert.equal(canSee(s,14,10),true);
});
test('fog, memory purchases and loaded discovery use the same square',()=>{
 const s=room();s.gimmick={id:'fog'};assert.equal(radius(s),2);assert.equal(canSee(s,17,13),true);assert.equal(canSee(s,18,13),false);
 s.gimmick={id:'none'};s.floor=2;s.phase='prepare';s.shards=100;
 assert.equal(upgrade(s,'scout'),true);assert.equal(s.shards,90);assert.equal(s.seen[15][19],true);assert.equal(s.seen[16][19],false);
 assert.equal(skills.find(k=>k.id==='scout').costStep,8);
 s.levels.scout=0;s.seen=s.grid.map(r=>r.map(()=>false));s.seen[0][0]=true;
 s.enemies=[{x:18,y:14,baseId:'enemy-0-0'}];const before=structuredClone(s),loaded=normalizeSave(s);
 assert.equal(loaded.seen[14][18],true);assert.equal(loaded.seen[0][0],true);assert.ok(loaded.profile.monsters.includes('enemy-0-0'));
 assert.deepEqual(s,before);for(const k of ['hp','shards','gear','levels','level','experience','grid','rngState','version'])assert.deepEqual(loaded[k],s[k]);
});
