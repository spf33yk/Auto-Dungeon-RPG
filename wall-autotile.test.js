import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {wallNeighborMask,validateWallTileset,drawWallParts} from './wall-tileset.js';import {readPng} from './test-support/png.js';
const d=JSON.parse(readFileSync(new URL('./art/terrain/walls/crypt/tileset.json',import.meta.url))),image={complete:true,naturalWidth:d.width,naturalHeight:d.height};
const gridFor=mask=>{const g=[[1,1,1],[1,0,1],[1,1,1]];for(const [bit,x,y]of [[1,1,0],[2,2,1],[4,1,2],[8,0,1]])if(mask&bit)g[y][x]=0;return g;};
test('unified entrances share the wall image, geometry and shading instead of stretching legacy 32px trims',()=>{
 assert.equal(d.version,2);const p=readPng(new URL('./art/terrain/walls/crypt/autotile-32.png',import.meta.url));
 for(let part=0;part<4;part++){
  const calls=[],ctx={drawImage(...a){calls.push(a);}};drawWallParts(ctx,{definition:d,image},gridFor(10),1,1,7,24,part);
  assert.equal(calls.length,2);assert.equal(calls[0][0],calls[1][0]);assert.deepEqual(calls[0].slice(5),calls[1].slice(5));assert.deepEqual(calls[1].slice(3,5),[32,56]);
  const f=Object.values(d.entrances)[part][0];let opaque=0,transparent=0;
  for(let y=0;y<56;y++)for(let x=0;x<32;x++){const a=p.pixel(f[0]+x,f[1]+y)[3];assert.ok(a===0||a===255);opaque+=a===255;transparent+=a===0;}
  assert.ok(opaque>0&&transparent>0);
 }
 for(const edit of [x=>delete x.entrances.lintel,x=>x.material.facePixels=32,x=>x.material.entranceMode='legacy',x=>x.entrances.leftJamb=[[0,224,32,32]]]){const value=structuredClone(d);edit(value);assert.throws(()=>validateWallTileset(value));}
 const legacy={...d,version:1};assert.equal(validateWallTileset(legacy),legacy);
});

test('vertical masonry is distinctly lighter than the dark buried-wall cap',()=>{
 const p=readPng(new URL('./art/terrain/walls/crypt/autotile-32.png',import.meta.url)),f=d.tiles[0][0];let cap=0,front=0;
 for(let y=4;y<28;y++)for(let x=4;x<28;x++){const a=p.pixel(f[0]+x,f[1]+y),b=p.pixel(f[0]+x,f[1]+32+Math.floor((y-4)*20/24));cap+=a[0]+a[1]+a[2];front+=b[0]+b[1]+b[2];}
 assert.ok(front>cap*1.35,'The front face must remain readable as a separate vertical surface');
});

test('corridor borders remain visible along vertical and horizontal walls and match entrance trims',()=>{
 const p=readPng(new URL('./art/terrain/walls/crypt/autotile-32.png',import.meta.url));
 const brightness=(mask,points)=>{const f=d.tiles[mask][0];return points.reduce((sum,[x,y])=>{const c=p.pixel(f[0]+x,f[1]+y);return sum+c[0]+c[1]+c[2];},0)/points.length;};
 const vertical=x=>Array.from({length:24},(_,i)=>[x,i+4]),horizontal=y=>Array.from({length:24},(_,i)=>[i+4,y]);
 assert.ok(brightness(5,vertical(1))>brightness(5,vertical(6))*1.2,'Left border must use visible masonry');
 assert.ok(brightness(5,vertical(30))>brightness(5,vertical(25))*1.2,'Right border must continue beyond the entrance');
 assert.ok(brightness(10,horizontal(1))>brightness(10,horizontal(6))*1.2,'North border must continue along horizontal corridors');
 for(const [name,mask,active]of [['leftJamb',5,(x,y)=>x>=29&&y!==30&&y!==31],['rightJamb',5,(x,y)=>x<=2&&y!==30&&y!==31],['lintel',10,(x,y)=>x>=3&&x<=28&&y>=32&&y<35],['threshold',10,(x,y)=>x>=3&&x<=28&&y<2]]){
  const trim=d.entrances[name][0],base=d.tiles[mask][0];for(let y=0;y<56;y++)for(let x=0;x<32;x++)if(active(x,y))assert.deepEqual(p.pixel(trim[0]+x,trim[1]+y),p.pixel(base[0]+x,base[1]+y),name+' must share the wall frame pixels');
 }
});
test('all 16 wall masks select their own graphic and ignore diagonals without consuming state',()=>{
 assert.equal(validateWallTileset(d),d);const seen=new Set();for(let mask=0;mask<16;mask++){const grid=gridFor(mask),before=JSON.stringify(grid);assert.equal(wallNeighborMask(grid,1,1),mask);for(const [x,y]of [[0,0],[2,0],[0,2],[2,2]])grid[y][x]=0;assert.equal(wallNeighborMask(grid,1,1),mask);const calls=[],ctx={drawImage(...a){calls.push(a);}};assert.equal(drawWallParts(ctx,{definition:d,image},grid,1,1,123),true);assert.equal(calls.length,1);assert.deepEqual(calls[0].slice(1,5),d.tiles[mask][0]);seen.add(calls[0][1]+','+calls[0][2]);assert.equal(JSON.stringify(gridFor(mask)),before);}assert.equal(seen.size,16);assert.equal(wallNeighborMask([[0]],0,0),15);
});
test('autotile definitions reject missing patterns, wrong bit order and out-of-range artwork',()=>{for(const change of [x=>delete x.tiles[7],x=>x.neighbors=8,x=>x.bitOrder.reverse(),x=>x.tiles[0]=[[128,0,32,56]],x=>x.tiles[0]=[],x=>x.tileSize=64]){const value=structuredClone(d);change(value);assert.throws(()=>validateWallTileset(value));}});

test('solid rock chip15 fills the entire wall projection without transparent or black holes',()=>{
 const p=readPng(new URL('./art/terrain/walls/crypt/autotile-32.png',import.meta.url)),f=d.tiles[15][0];
 for(let y=0;y<56;y++)for(let x=0;x<32;x++){const c=p.pixel(f[0]+x,f[1]+y);assert.equal(c[3],255);assert.ok(c[0]+c[1]+c[2]>35,`rock hole ${x},${y}`);}
});
test('every compatible connected edge shares exact pixels in the final PNG',()=>{
 const p=readPng(new URL('./art/terrain/walls/crypt/autotile-32.png',import.meta.url));assert.equal(p.width,128);assert.equal(p.height,280);let pairs=0;
 for(let a=0;a<16;a++)for(let b=0;b<16;b++){
  const A=d.tiles[a][0],B=d.tiles[b][0];
  if((a&2)&&(b&8)&&(a&5)===(b&5)){for(let y=0;y<56;y++)assert.deepEqual(p.pixel(A[0]+31,A[1]+y),p.pixel(B[0],B[1]+y),`horizontal ${a}/${b} y${y}`);pairs++;}
  if((a&4)&&(b&1)&&(a&10)===(b&10)){for(let x=0;x<32;x++)assert.deepEqual(p.pixel(A[0]+x,A[1]+31),p.pixel(B[0]+x,B[1]),`vertical ${a}/${b} x${x}`);pairs++;}
 }assert.ok(pairs>=32);assert.ok(readFileSync(new URL('./art/terrain/walls/crypt/autotile-32.png',import.meta.url)).length<16384);
});
