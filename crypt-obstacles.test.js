import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,makeFloor,normalizeSave,validateSave,tick,W,H} from './engine.js';
import {autoMapModel} from './map-view.js';

test('crypt tombstones stay deterministic, reachable and clear of every reserved object',()=>{
 let count=0;const variants=new Set();
 for(let seed=1;seed<=80;seed++)for(let floor=1;floor<=5;floor++){
  const s=newGame(seed);s.floor=floor;makeFloor(s);const before=JSON.stringify(s.obstacles);makeFloor(s);assert.equal(JSON.stringify(s.obstacles),before);
  assert.ok(s.obstacles.length>0&&s.obstacles.length<=6);count+=s.obstacles.length;
  const occupied=new Set([s.player,s.stairs,...s.items,...s.enemies,...s.traps].map(p=>p.x+','+p.y));
  for(const o of s.obstacles){assert.equal(s.grid[o.y][o.x],0);assert.equal(occupied.has(o.x+','+o.y),false);variants.add(o.variant);assert.ok(Math.max(Math.abs(o.x-s.player.x),Math.abs(o.y-s.player.y))>1);}
  const q=[s.player],seen=new Set([s.player.x+','+s.player.y]);
  for(let i=0;i<q.length;i++)for(const [dx,dy]of [[0,1],[0,-1],[1,0],[-1,0]]){const x=q[i].x+dx,y=q[i].y+dy;if(s.grid[y]?.[x]&&!seen.has(x+','+y)){seen.add(x+','+y);q.push({x,y});}}
  assert.equal(seen.size,s.grid.flat().filter(Boolean).length);assert.ok(seen.has(s.stairs.x+','+s.stairs.y));assert.ok(validateSave(s));
 }
 assert.ok(count>0);assert.equal(variants.size,2);
});
test('other zones and boss arenas reset tombstones; old saves keep their current grid',()=>{
 const s=newGame(42);assert.ok(s.obstacles.length);const old=structuredClone(s);delete old.obstacles;const grid=JSON.stringify(old.grid),loaded=normalizeSave(old);
 assert.ok(loaded);assert.deepEqual(loaded.obstacles,[]);assert.equal(JSON.stringify(loaded.grid),grid);assert.equal(old.obstacles,undefined);
 for(const floor of [6,11,16,21,26]){s.floor=floor;makeFloor(s);assert.deepEqual(s.obstacles,[]);}
 const current=newGame(9);assert.deepEqual(normalizeSave(current).obstacles,current.obstacles);
 for(const corrupt of [[{x:current.player.x,y:current.player.y,type:'tombstone',variant:0}],null,[{x:-1,y:2,type:'tombstone',variant:0}]]){const bad=structuredClone(current);bad.obstacles=corrupt;assert.equal(normalizeSave(bad),null);}
});
test('autonomous exploration never steps onto tombstones and still reaches the stairs',()=>{
 for(let seed=1;seed<=12;seed++){const s=newGame(seed);s.enemies=[];s.items=[];s.traps=[];s.phase='explore';const blocked=new Set(s.obstacles.map(o=>o.x+','+o.y));let turns=0;
  while(s.phase==='explore'&&turns++<2000){tick(s);assert.equal(blocked.has(s.player.x+','+s.player.y),false);}
  assert.equal(s.phase,'cleared');assert.deepEqual(s.player,s.stairs);
 }
});
test('a room containing tombstones remains fully mapped after entry',()=>{
 const s=newGame(8);s.seen=s.seen.map(r=>r.map(()=>false));s.visited=s.visited.map(r=>r.map(()=>false));s.visited[s.player.y][s.player.x]=true;
 const mapped=autoMapModel(s,()=>false);assert.ok(mapped.tiles.some(t=>t.x===s.player.x&&t.y===s.player.y));
 const grave=s.obstacles[0];s.player={x:grave.x-1,y:grave.y};s.visited[s.player.y][s.player.x]=true;s.seen[grave.y][grave.x]=true;
 const model=autoMapModel(s,()=>false);assert.ok(model.tiles.some(t=>t.x===grave.x&&t.y===grave.y&&!t.walkable));assert.ok(model.markers.some(m=>m.type==='tombstone'&&m.x===grave.x&&m.y===grave.y));
});
