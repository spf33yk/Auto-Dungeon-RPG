import test from 'node:test';import assert from 'node:assert/strict';import {newGame,makeFloor,normalizeSave,validateSave,W,H,route} from './engine.js';import {autoMapModel,cameraFor} from './map-view.js';
test('expanded floors have nine separate rooms and narrow traversable passages',()=>{
 let narrow=0;for(let seed=1;seed<=8;seed++){const s=newGame(seed);assert.equal(W,47);assert.equal(H,35);assert.equal(s.rooms.length,9);assert.equal(s.grid.length,H);assert.equal(s.grid[0].length,W);assert.ok(validateSave(s));
  for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++)if(s.grid[y][x]&&!s.rooms.some(r=>x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h))if(s.grid[y][x-1]&&s.grid[y][x+1]&&!s.grid[y-1][x]&&!s.grid[y+1][x])narrow++;
  assert.ok(route(s,p=>p.x===s.stairs.x&&p.y===s.stairs.y,{known:false}));assert.ok(autoMapModel(s,()=>false).tiles.length<s.grid.flat().filter(Boolean).length);
 }assert.ok(narrow>30);
});
test('legacy 31x23 stages retain current progress and expand only on a new floor',()=>{
 const s=newGame(202);s.version=11;delete s.rooms;s.obstacles=[];s.items=[];s.enemies=[];s.traps=[];s.player={x:3,y:3};s.stairs={x:27,y:19};s.grid=Array.from({length:23},(_,y)=>Array.from({length:31},(_,x)=>Number(x>0&&x<30&&y>0&&y<22)));s.seen=s.grid.map(r=>r.map(()=>true));s.visited=s.grid.map(r=>r.map(()=>false));s.hp=21;s.shards=42;const before=JSON.stringify(s),loaded=normalizeSave(s);assert.ok(loaded);assert.equal(loaded.version,13);assert.deepEqual(loaded.grid,s.grid);assert.deepEqual(loaded.player,s.player);assert.equal(loaded.hp,21);assert.equal(loaded.shards,42);assert.equal(JSON.stringify(s),before);assert.deepEqual(normalizeSave(loaded),loaded);makeFloor(loaded);assert.equal(loaded.grid.length,35);assert.equal(loaded.grid[0].length,47);assert.equal(loaded.rooms.length,9);
});
test('camera pulls back while preserving sight radius and the centered hero',()=>{
 const c=cameraFor({x:23,y:17},3,1920,1080);assert.equal(c.rows,13);assert.ok(c.columns>23);assert.ok(Math.abs(((23.5*24)-c.left)*c.scale-960)<1e-8);
});
