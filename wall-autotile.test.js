import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {wallNeighborMask,validateWallTileset,drawWallParts} from './wall-tileset.js';import {readPng} from './test-support/png.js';
const d=JSON.parse(readFileSync(new URL('./art/terrain/walls/crypt/tileset.json',import.meta.url))),image={complete:true,naturalWidth:d.width,naturalHeight:d.height};
const gridFor=mask=>{const g=[[1,1,1],[1,0,1],[1,1,1]];for(const [bit,x,y]of [[1,1,0],[2,2,1],[4,1,2],[8,0,1]])if(mask&bit)g[y][x]=0;return g;};
test('unified entrances share the wall image, geometry and shading instead of stretching legacy 32px trims',()=>{
 assert.equal(d.version,2);const p=readPng(new URL('./art/terrain/walls/crypt/autotile-64.png',import.meta.url));
 for(let part=0;part<4;part++){
  const calls=[],ctx={drawImage(...a){calls.push(a);}};drawWallParts(ctx,{definition:d,image},gridFor(10),1,1,7,24,part);
  assert.equal(calls.length,2);assert.equal(calls[0][0],calls[1][0]);assert.deepEqual(calls[0].slice(5),calls[1].slice(5));assert.deepEqual(calls[1].slice(3,5),[64,112]);
  const f=Object.values(d.entrances)[part][0];let opaque=0,transparent=0;
  for(let y=0;y<112;y++)for(let x=0;x<64;x++){const a=p.pixel(f[0]+x,f[1]+y)[3];assert.ok(a===0||a===255);opaque+=a===255;transparent+=a===0;}
  assert.ok(opaque>0&&transparent>0);
 }
 for(const edit of [x=>delete x.entrances.lintel,x=>x.material.facePixels=64,x=>x.material.entranceMode='legacy',x=>x.entrances.leftJamb=[[0,448,64,64]]]){const value=structuredClone(d);edit(value);assert.throws(()=>validateWallTileset(value));}
 const legacy={...d,version:1};assert.equal(validateWallTileset(legacy),legacy);
});

test('vertical masonry is distinctly lighter than the dark buried-wall cap',()=>{
 const p=readPng(new URL('./art/terrain/walls/crypt/autotile-64.png',import.meta.url)),f=d.tiles[0][0];let cap=0,front=0;
 for(let y=4;y<48;y++)for(let x=8;x<56;x+=2){const a=p.pixel(f[0]+x,f[1]+y),b=p.pixel(f[0]+x,f[1]+64+Math.floor((y-8)*40/48));cap+=a[0]+a[1]+a[2];front+=b[0]+b[1]+b[2];}
 assert.ok(front>cap*1.35,'The front face must remain readable as a separate vertical surface');
});

test('corridor borders remain visible along vertical and horizontal walls and match entrance trims',()=>{
 const p=readPng(new URL('./art/terrain/walls/crypt/autotile-64.png',import.meta.url));
 const brightness=(mask,points)=>{const f=d.tiles[mask][0];return points.reduce((sum,[x,y])=>{const c=p.pixel(f[0]+x,f[1]+y);return sum+c[0]+c[1]+c[2];},0)/points.length;};
 const vertical=x=>Array.from({length:48},(_,i)=>[x,i+8]),horizontal=y=>Array.from({length:48},(_,i)=>[i+8,y]);
 assert.ok(brightness(5,vertical(2))>brightness(5,vertical(12))*1.2,'Left border must use visible masonry');
 assert.ok(brightness(5,vertical(60))>brightness(5,vertical(50))*1.2,'Right border must continue beyond the entrance');
 assert.ok(brightness(10,horizontal(2))>brightness(10,horizontal(12))*1.2,'North border must continue along horizontal corridors');
 for(const [name,mask,active]of [['leftJamb',5,(x,y)=>x>=58&&Math.floor(y/2)!==30&&Math.floor(y/2)!==31],['rightJamb',5,(x,y)=>x<=5&&Math.floor(y/2)!==30&&Math.floor(y/2)!==31],['lintel',10,(x,y)=>x>=6&&x<=57&&y>=64&&y<70],['threshold',10,(x,y)=>x>=6&&x<=57&&y<4]]){
  const trim=d.entrances[name][0],base=d.tiles[mask][0];for(let y=0;y<112;y++)for(let x=0;x<64;x++)if(active(x,y))assert.deepEqual(p.pixel(trim[0]+x,trim[1]+y),p.pixel(base[0]+x,base[1]+y),name+' must share the wall frame pixels');
 }
});
test('all 16 wall masks select their own graphic and ignore diagonals without consuming state',()=>{
 assert.equal(validateWallTileset(d),d);const seen=new Set();for(let mask=0;mask<16;mask++){const grid=gridFor(mask),before=JSON.stringify(grid);assert.equal(wallNeighborMask(grid,1,1),mask);for(const [x,y]of [[0,0],[2,0],[0,2],[2,2]])grid[y][x]=0;assert.equal(wallNeighborMask(grid,1,1),mask);const calls=[],ctx={drawImage(...a){calls.push(a);}};assert.equal(drawWallParts(ctx,{definition:d,image},grid,1,1,123),true);assert.equal(calls.length,1);assert.deepEqual(calls[0].slice(1,5),mask===15?[...d.tiles[mask][0].slice(0,3),d.tileSize]:d.tiles[mask][0]);seen.add(calls[0][1]+','+calls[0][2]);assert.equal(JSON.stringify(gridFor(mask)),before);}assert.equal(seen.size,16);assert.equal(wallNeighborMask([[0]],0,0),15);
});
test('autotile definitions reject missing patterns, wrong bit order and out-of-range artwork',()=>{for(const change of [x=>delete x.tiles[7],x=>x.neighbors=8,x=>x.bitOrder.reverse(),x=>x.tiles[0]=[[128,0,32,56]],x=>x.tiles[0]=[],x=>x.tileSize=16]){const value=structuredClone(d);change(value);assert.throws(()=>validateWallTileset(value));}});

test('solid rock chip15 fills the entire wall projection without transparent or black holes',()=>{
 const p=readPng(new URL('./art/terrain/walls/crypt/autotile-64.png',import.meta.url)),f=d.tiles[15][0];
 for(let y=0;y<112;y++)for(let x=0;x<64;x++){const c=p.pixel(f[0]+x,f[1]+y);assert.equal(c[3],255);assert.ok(c[0]+c[1]+c[2]>35,`rock hole ${x},${y}`);}
});
test('every compatible connected edge shares exact pixels in the final PNG',()=>{
 const p=readPng(new URL('./art/terrain/walls/crypt/autotile-64.png',import.meta.url));assert.equal(p.width,256);assert.equal(p.height,560);let pairs=0;
 for(let a=0;a<16;a++)for(let b=0;b<16;b++){
  const A=d.tiles[a][0],B=d.tiles[b][0];
  if((a&2)&&(b&8)&&(a&5)===(b&5)){for(let y=0;y<112;y++)assert.deepEqual(p.pixel(A[0]+63,A[1]+y),p.pixel(B[0],B[1]+y),`horizontal ${a}/${b} y${y}`);pairs++;}
  if((a&4)&&(b&1)&&(a&10)===(b&10)){for(let x=0;x<64;x++)assert.deepEqual(p.pixel(A[0]+x,A[1]+63),p.pixel(B[0]+x,B[1]),`vertical ${a}/${b} x${x}`);pairs++;}
 }assert.ok(pairs>=32);assert.ok(readFileSync(new URL('./art/terrain/walls/crypt/autotile-64.png',import.meta.url)).length<65536);
});
