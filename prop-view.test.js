import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {drawProp,PROP_FRAMES} from './prop-view.js';
test('six prop frames stay within the atlas and unloaded art falls back',()=>{
 const calls=[],ctx={drawImage(...args){calls.push(args);}},atlas={complete:true,naturalWidth:96,naturalHeight:64};
 for(const type of Object.keys(PROP_FRAMES)){assert.equal(drawProp(ctx,atlas,type,24,48),true);const a=calls.at(-1);assert.ok(a[1]>=0&&a[1]+a[3]<=96&&a[2]>=0&&a[2]+a[4]<=64);assert.deepEqual(a.slice(5),[24,48,24,24]);}
 assert.equal(ctx.imageSmoothingEnabled,false);assert.equal(drawProp(ctx,{complete:false},'chest',0,0),false);assert.equal(drawProp(ctx,atlas,'unknown',0,0),false);
});
test('prop master and delivery atlases stay compact and have exact dimensions',()=>{
 let total=0;for(const [name,w,h]of [['master-64.png',192,128],['atlas-32.png',96,64]]){const b=readFileSync(new URL('./art/props/'+name,import.meta.url));total+=b.length;assert.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(b.readUInt32BE(16),w);assert.equal(b.readUInt32BE(20),h);}assert.ok(total<=65536);
});
