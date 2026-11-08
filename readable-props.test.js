import test from'node:test';import assert from'node:assert/strict';import{readFileSync}from'node:fs';import{READABLE_PROP_FRAMES,drawReadableProp}from'./readable-props.js';
test('readable prop format and renderer agree on every frame and preserve aspect ratio',()=>{
 const f=JSON.parse(readFileSync('art/props/readable-v1/format.json'));assert.deepEqual(f.frames,READABLE_PROP_FRAMES);assert.equal(f.cellPx,64);const b=readFileSync('art/props/readable-v1/atlas-64.png');assert.equal(b.readUInt32BE(16),256);assert.equal(b.readUInt32BE(20),192);assert.ok(b.length<65536);const calls=[],ctx={drawImage:(...a)=>calls.push(a)},image={complete:true,naturalWidth:256,naturalHeight:192};
 for(const id of [...Object.keys(f.frames),...Object.keys(f.aliases)]){assert.equal(drawReadableProp(ctx,image,id,10,20,64,32),true);const a=calls.at(-1);assert.equal(a[7],a[8]);assert.equal(a[5],26);assert.equal(a[6],20);}
 assert.equal(drawReadableProp(ctx,{...image,complete:false},'heart',0,0),false);assert.equal(drawReadableProp(ctx,image,'unknown',0,0),false);
});
