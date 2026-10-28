import test from 'node:test';import assert from 'node:assert/strict';import {standingBox,sortByFoot,foregroundWallOpacity} from './scene-depth.js';import {readPng} from './test-support/png.js';
test('standing sprites retain the same feet and depth order at fractional movement positions',()=>{
 for(const size of [24,32])for(const y of [0,2,3.5]){const b=standingBox(2.25,y,size);assert.equal(b.y+b.height,b.footY);assert.equal(b.footY,(y+1)*size);assert.ok(b.height>size);}
 const input=[{id:'front wall',footY:72,layer:0},{id:'hero',footY:48,layer:3},{id:'grave',footY:48,layer:1},{id:'rear wall',footY:24,layer:0}],before=JSON.stringify(input);assert.deepEqual(sortByFoot(input).map(o=>o.id),['rear wall','grave','hero','front wall']);assert.equal(JSON.stringify(input),before);
 assert.ok(foregroundWallOpacity(2,3,{x:2,y:2})<1);assert.equal(foregroundWallOpacity(2,1,{x:2,y:2}),1);assert.equal(foregroundWallOpacity(5,3,{x:2,y:2}),1);
});
test('all terrain variants have pixel-identical opposite edges after PNG encoding',()=>{
 for(const [file,size]of [['master-64.png',64],['atlas-32.png',32]]){const p=readPng(new URL('./art/terrain/crypt/'+file,import.meta.url));for(let family=0;family<2;family++)for(let a=0;a<2;a++)for(let b=0;b<2;b++)for(let n=0;n<size;n++){assert.deepEqual(p.pixel(a*size+size-1,family*size+n),p.pixel(b*size,family*size+n));assert.deepEqual(p.pixel(a*size+n,family*size+size-1),p.pixel(b*size+n,family*size));}}
});
test('prop PNGs retain binary alpha and clear borders after repainting',()=>{
 for(const [file,size]of [['master-64.png',64],['atlas-32.png',32]]){const p=readPng(new URL('./art/props/'+file,import.meta.url));for(let y=0;y<p.height;y++)for(let x=0;x<p.width;x++){const a=p.pixel(x,y)[3];assert.ok(a===0||a===255);if(x%size===0||x%size===size-1||y%size===0||y%size===size-1)assert.equal(a,0);}}
});
