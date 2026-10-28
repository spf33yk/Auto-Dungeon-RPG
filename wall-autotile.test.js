import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {wallNeighborMask,validateWallTileset,drawWallParts} from './wall-tileset.js';import {readPng} from './test-support/png.js';
const d=JSON.parse(readFileSync(new URL('./art/terrain/walls/crypt/tileset.json',import.meta.url))),image={complete:true,naturalWidth:d.width,naturalHeight:d.height};
const gridFor=mask=>{const g=[[1,1,1],[1,0,1],[1,1,1]];for(const [bit,x,y]of [[1,1,0],[2,2,1],[4,1,2],[8,0,1]])if(mask&bit)g[y][x]=0;return g;};
test('all 16 wall masks select their own graphic and ignore diagonals without consuming state',()=>{
 assert.equal(validateWallTileset(d),d);const seen=new Set();for(let mask=0;mask<16;mask++){const grid=gridFor(mask),before=JSON.stringify(grid);assert.equal(wallNeighborMask(grid,1,1),mask);for(const [x,y]of [[0,0],[2,0],[0,2],[2,2]])grid[y][x]=0;assert.equal(wallNeighborMask(grid,1,1),mask);const calls=[],ctx={drawImage(...a){calls.push(a);}};assert.equal(drawWallParts(ctx,{definition:d,image},grid,1,1,123),true);assert.equal(calls.length,1);assert.deepEqual(calls[0].slice(1,5),d.tiles[mask][0]);seen.add(calls[0][1]+','+calls[0][2]);assert.equal(JSON.stringify(gridFor(mask)),before);}assert.equal(seen.size,16);assert.equal(wallNeighborMask([[0]],0,0),15);
});
test('autotile definitions reject missing patterns, wrong bit order and out-of-range artwork',()=>{for(const change of [x=>delete x.tiles[7],x=>x.neighbors=8,x=>x.bitOrder.reverse(),x=>x.tiles[0]=[[128,0,32,56]],x=>x.tiles[0]=[],x=>x.tileSize=64]){const value=structuredClone(d);change(value);assert.throws(()=>validateWallTileset(value));}});
test('every compatible connected edge shares exact pixels in the final PNG',()=>{
 const p=readPng(new URL('./art/terrain/walls/crypt/autotile-32.png',import.meta.url));assert.equal(p.width,128);assert.equal(p.height,224);let pairs=0;
 for(let a=0;a<16;a++)for(let b=0;b<16;b++){
  const A=d.tiles[a][0],B=d.tiles[b][0];
  if((a&2)&&(b&8)&&(a&5)===(b&5)){for(let y=0;y<56;y++)assert.deepEqual(p.pixel(A[0]+31,A[1]+y),p.pixel(B[0],B[1]+y),`horizontal ${a}/${b} y${y}`);pairs++;}
  if((a&4)&&(b&1)&&(a&10)===(b&10)){for(let x=0;x<32;x++)assert.deepEqual(p.pixel(A[0]+x,A[1]+31),p.pixel(B[0]+x,B[1]),`vertical ${a}/${b} x${x}`);pairs++;}
 }assert.ok(pairs>=32);assert.ok(readFileSync(new URL('./art/terrain/walls/crypt/autotile-32.png',import.meta.url)).length<16384);
});
