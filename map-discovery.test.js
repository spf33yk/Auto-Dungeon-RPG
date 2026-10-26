import test from 'node:test';
import assert from 'node:assert/strict';
import {autoMapModel} from './map-view.js';
import {newGame,makeFloor,random,zoneFor} from './engine.js';
test('generated room sectors never expose unentered neighboring rooms',()=>{
 for(let seed=1;seed<=8;seed++)for(const floor of [1,6,12,17,22,27]){
  const s=newGame(seed);s.floor=floor;makeFloor(s);const layout=zoneFor(s).layout,rng=random(seed+floor*997);
  const rooms=Array.from({length:6},(_,i)=>{const w=layout==='hall'?8:layout==='channels'?4:4+Math.floor(rng()*4),h=layout==='hall'?7:layout==='channels'?4:4+Math.floor(rng()*4);return {x:1+i%3*10+Math.floor(rng()*2),y:2+Math.floor(i/3)*11+Math.floor(rng()*2),w,h};});
  const tiles=new Set(autoMapModel(s,()=>false).tiles.map(t=>`${t.x},${t.y}`));
  for(const r of rooms){
   const entered=s.player.x>=r.x&&s.player.x<r.x+r.w&&s.player.y>=r.y&&s.player.y<r.y+r.h;
   if(entered){for(let y=r.y;y<r.y+r.h;y++)for(let x=r.x;x<r.x+r.w;x++)if(s.grid[y][x])assert.ok(tiles.has(`${x},${y}`));}
   else assert.equal(tiles.has(`${r.x+Math.floor(r.w/2)},${r.y+Math.floor(r.h/2)}`),false);
  }
 }
});
function floor(){
 const grid=Array.from({length:9},()=>Array(18).fill(0));
 for(const [left,right]of [[1,5],[12,16]])for(let y=2;y<=6;y++)for(let x=left;x<=right;x++)grid[y][x]=1;
 for(let x=6;x<12;x++)grid[4][x]=1;
 return {grid,seen:grid.map(r=>r.map(()=>false)),visited:grid.map(r=>r.map(()=>false)),player:{x:2,y:3},stairs:{x:15,y:5},items:[{x:14,y:3,type:'herb'}],enemies:[{x:13,y:4}],traps:[],gimmick:{id:'none'}};
}
const has=(m,x,y)=>m.tiles.some(t=>t.x===x&&t.y===y);
test('entry reveals a whole room with walls, keeps it after leaving, and hides unentered rooms',()=>{
 const s=floor();s.visited[3][2]=true;const before=structuredClone(s),m=autoMapModel(s,()=>false);
 assert.ok(has(m,5,6));assert.ok(has(m,0,1));assert.equal(has(m,12,2),false);assert.equal(has(m,6,4),false);assert.deepEqual(s,before);
 s.player={x:8,y:4};s.visited[4][8]=true;s.seen[4][8]=true;
 const corridor=autoMapModel(s,()=>false);assert.ok(has(corridor,5,6));assert.ok(has(corridor,8,4));assert.equal(has(corridor,12,2),false);
 s.player={x:13,y:3};s.visited[3][13]=true;
 const both=autoMapModel(JSON.parse(JSON.stringify(s)),()=>false);assert.ok(has(both,16,6));assert.ok(has(both,5,6));assert.equal(both.markers.filter(m=>m.type!=='player').length,0);
});
test('seeing an unentered room does not register its terrain or hidden objects on MAP',()=>{
 const s=floor();s.seen=s.seen.map(r=>r.map(()=>true));const m=autoMapModel(s,()=>true);
 assert.equal(has(m,14,3),false);assert.equal(m.markers.some(m=>['item','enemy','stairs'].includes(m.type)),false);
 assert.ok(has(m,9,4));
});
