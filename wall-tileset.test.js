import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {validateWallTileset,wallPartNames,wallVariant,drawWallParts,loadWallTilesets,wallDrawBox} from './wall-tileset.js';import {readPng} from './test-support/png.js';import {drawRaisedWall} from './terrain-view.js';
const definition=JSON.parse(readFileSync(new URL('./art/terrain/walls/crypt/parts-tileset-v1.json',import.meta.url))),image={complete:true,naturalWidth:128,naturalHeight:definition.height};
test('south walls fit their own footprint along corridors, room edges and junctions',()=>{
 for(const grid of [[[0,0,0],[1,1,1],[0,0,0]],[[1,1,1],[1,1,1],[0,0,0]],[[0,1,0],[1,1,1],[0,0,1]]])for(const size of [24,32]){
  const before=JSON.stringify(grid),box=wallDrawBox(grid,1,2,.75,size);assert.equal(box.foreground,true);assert.equal(box.y,2*size);assert.equal(box.y+box.height,3*size);assert.equal(JSON.stringify(grid),before);
  const calls=[],ctx={drawImage(...a){calls.push(a);}};drawWallParts(ctx,{definition,image},grid,1,2,7,size);assert.ok(calls.length);for(const c of calls){assert.equal(c[6],2*size);assert.equal(c[8],size);}
 }
 const rear=wallDrawBox([[0,0,0],[0,0,0],[1,1,1]],1,1,.75);assert.equal(rear.foreground,false);assert.equal(rear.y,6);assert.equal(rear.height,42);
});
test('missing wall artwork uses the same non-overlapping foreground box',()=>{const calls=[],ctx={fillRect(...a){calls.push(a);}};drawRaisedWall(ctx,null,[[1],[0]],0,1,1,{wallColor:'#666'});assert.deepEqual(calls,[[0,24,24,24]]);});
test('wall definitions reject incompatible versions, missing faces and out-of-bounds frames',()=>{
 assert.equal(validateWallTileset(definition),definition);
 for(const edit of [d=>d.version=2,d=>delete d.parts.leftMiddle,d=>d.parts.front=[[128,0,32,48]],d=>d.parts.cap=[[0,0,32,32]],d=>d.rise=0,d=>d.themes=[]]){const d=structuredClone(definition);edit(d);assert.throws(()=>validateWallTileset(d));}
});
test('wall connections select dedicated start/middle/end/single and front sprites without changing the grid',()=>{
 const g=[[1,0,1],[1,0,1],[1,0,1]],before=JSON.stringify(g);assert.deepEqual(wallPartNames(g,1,1),['cap','leftMiddle','rightMiddle']);assert.deepEqual(wallPartNames(g,1,0),['cap','leftStart','rightStart']);assert.deepEqual(wallPartNames(g,1,2),['cap','leftEnd','rightEnd']);
 assert.deepEqual(wallPartNames([[1,0,1],[0,1,0]],1,0),['cap','front','leftSingle','rightSingle']);assert.equal(JSON.stringify(g),before);
});
test('renderer draws only dedicated artwork at its defined anchor and has a safe missing-image fallback',()=>{
 const calls=[],fills=[],ctx={drawImage(...a){calls.push(a);},fillRect(...a){fills.push(a);}},g=[[1,0,1],[0,1,0]];
 assert.equal(drawRaisedWall(ctx,{definition,image},g,1,0,4,{wallColor:'#666'}),true);assert.equal(calls.length,4);
 for(const c of calls){assert.equal(c[0],image);assert.deepEqual(c.slice(5),[24,-18,24,42]);assert.equal(c[3],32);assert.equal(c[4],56);}assert.equal(fills.length,0);
 assert.equal(drawWallParts(ctx,{definition,image:{...image,naturalWidth:64}},g,1,0,4),false);
 calls.length=0;assert.equal(drawRaisedWall(ctx,null,g,1,0,4,{wallColor:'#666'}),false);assert.equal(calls.length,0);assert.equal(fills.length,1);
 assert.equal(wallVariant(2,4,7,2),wallVariant(2,4,7,2));
});
test('tileset loader resolves versioned image URLs and allows an area-specific override',async()=>{
 const requested=[],d2={...definition,id:'water-v1',themes:['water']};
 const sets=await loadWallTilesets(['crypt/tileset.json?v=1','water/tileset.json?v=2'],{baseURL:'https://example.test/walls/',fetcher:async u=>({ok:true,json:async()=>{requested.push(String(u));return String(u).includes('/water/')?d2:definition;}}),imageFactory:()=>({...image,decode:async()=>{}})});
 assert.equal(sets.get('*').definition.id,definition.id);assert.equal(sets.get('water').definition.id,'water-v1');assert.match(sets.get('water').image.src,/water\/atlas-32.png\?v=/);assert.equal(requested.length,2);
 await assert.rejects(()=>loadWallTilesets(['bad.json'],{baseURL:'https://example.test/',fetcher:async()=>({ok:false,status:404})}));
});
test('wall artwork has canonical transparent parts, seamless caps/fronts and a small storage budget',()=>{
 let bytes=0;for(const [file,scale]of [['atlas-32.png',1]]){
  const url=new URL('./art/terrain/walls/crypt/'+file,import.meta.url),p=readPng(url),tile=32*scale;bytes+=readFileSync(url).length;assert.equal(p.width,128*scale);assert.equal(p.height,168*scale);
  for(const name of ['cap','front'])for(const a of definition.parts[name])for(const b of definition.parts[name])for(let n=0;n<(name==='cap'?tile:tile/2);n++){
   const y=(name==='front'?tile:0)+n;assert.deepEqual(p.pixel(a[0]*scale,y),p.pixel(b[0]*scale+tile-1,y));
   if(name==='cap')assert.deepEqual(p.pixel(a[0]*scale+n,0),p.pixel(b[0]*scale+n,tile-1));
  }
  for(const [name,frames]of Object.entries(definition.parts))for(const f of frames){let visible=0;for(let y=0;y<f[3]*scale;y++)for(let x=0;x<tile;x++){const alpha=p.pixel(f[0]*scale+x,f[1]*scale+y)[3];assert.ok(alpha===0||alpha===255);visible+=alpha>0;if(name==='front'&&y<tile||name==='cap'&&y>=tile)assert.equal(alpha,0);if(name.startsWith('left')&&x>=tile*.375||name.startsWith('right')&&x<tile*.625)assert.equal(alpha,0);}assert.ok(visible>0,name);}
 }assert.ok(bytes<32768,'Native 32px wall atlas stays below 32 KiB');
});
