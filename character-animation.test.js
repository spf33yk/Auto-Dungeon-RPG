import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {CharacterAnimation,directionTo,characterFrame,characterDrawBox,validateCharacterSheet,drawCharacter,loadCharacterSheet} from './character-animation.js';import {readPng} from './test-support/png.js';
const d=JSON.parse(readFileSync(new URL('./art/characters/mukuro-v1/sprites.json',import.meta.url))),image={complete:true,naturalWidth:96,naturalHeight:128};
test('four directions safely round vectors and preserve the previous direction for ties and zero movement',()=>{
 for(const [x,y,want] of [[0,1,0],[-1,0,1],[1,0,2],[0,-1,3],[2,1,2],[-1,-2,3]])assert.equal(directionTo(x,y),want);
 for(const [x,y]of [[0,0],[1,1],[-1,1],[NaN,1]])assert.equal(directionTo(x,y,1),1);
});
test('movement, idle and one-shot attacks change frames without shared instance state',()=>{
 const hero=new CharacterAnimation({x:2,y:3}),enemy=new CharacterAnimation({direction:3});
 hero.moveTo(3,3,0,100);assert.equal(hero.direction,2);assert.equal(hero.sample(0).frame,0);assert.equal(hero.sample(51).frame,1);assert.equal(hero.sample(100).state,'idle');assert.equal(hero.sample(340).frame,1);
 hero.attackTo(2,3,350,140);assert.equal(hero.sample(400).frame,2);assert.equal(hero.sample(400).direction,1);assert.deepEqual(hero.sample(400),hero.sample(400),'Caller-controlled time freezes animation while paused');
 assert.equal(hero.sample(490).state,'idle');assert.equal(hero.sample(490).frame,0);assert.equal(enemy.state,'idle');assert.equal(enemy.direction,3);
 for(const duration of [190,170,85]){hero.moveTo(hero.x,hero.y-1,1000,duration);assert.equal(hero.sample(1000+duration*.25).frame,0);assert.equal(hero.sample(1000+duration*.75).frame,1);assert.equal(hero.sample(1000+duration*.75,{reducedMotion:true}).frame,0);}
 hero.teleport(20,20,2000);assert.equal(hero.state,'idle');assert.throws(()=>hero.moveTo(NaN,0,1));assert.throws(()=>hero.attackTo(0,0,1,-1));
});
test('frame slicing and ground anchors bind all poses to stable foot-depth coordinates',()=>{
 assert.equal(validateCharacterSheet(d),d);for(let dir=0;dir<4;dir++)for(let frame=0;frame<3;frame++)assert.deepEqual(characterFrame(d,dir,frame),{x:frame*32,y:dir*32,width:32,height:32});
 const box=characterDrawBox(2.5,3.5,d),scale=24/32*d.displayScale;assert.equal(box.y+d.anchor[1]*scale,box.footY);assert.equal(box.footY,4.5*24);
 const calls=[],ctx={drawImage(...a){calls.push(a);}};assert.equal(drawCharacter(ctx,{definition:d,image},{x:2.5,y:3.5,direction:1,frame:2}),true);assert.deepEqual(calls[0].slice(1,5),[64,32,32,32]);assert.equal(ctx.imageSmoothingEnabled,false);
 assert.equal(drawCharacter(ctx,{definition:d,image:{...image,naturalWidth:32}},{x:0,y:0,direction:0,frame:0}),false);assert.throws(()=>characterFrame(d,4,0));
 for(const edit of [x=>x.columns=4,x=>x.directions.reverse(),x=>x.anchor=[16,40],x=>x.width=128,x=>x.version=2]){const bad=structuredClone(d);edit(bad);assert.throws(()=>validateCharacterSheet(bad));}
});
test('loader resolves content-versioned artwork and rejects bad dimensions or HTTP errors',async()=>{
 const sheet=await loadCharacterSheet('hero/sprites.json?v=1',{baseURL:'https://example.test/',fetcher:async()=>({ok:true,json:async()=>d}),imageFactory:()=>({...image,decode:async()=>{}})});assert.match(sheet.image.src,/hero\/sprites-32.png\?v=/);
 await assert.rejects(()=>loadCharacterSheet('bad.json',{baseURL:'https://example.test/',fetcher:async()=>({ok:false,status:404})}));
 await assert.rejects(()=>loadCharacterSheet('bad.json',{baseURL:'https://example.test/',fetcher:async()=>({ok:true,json:async()=>d}),imageFactory:()=>({...image,naturalWidth:95,decode:async()=>{}})}));
});
test('native32 artwork contains twelve distinct transparent frames with a shared foot baseline and red cape',()=>{
 const path=new URL('./art/characters/mukuro-v1/sprites-32.png',import.meta.url),p=readPng(path);assert.equal(p.width,96);assert.equal(p.height,128);const frames=new Set();
 for(let row=0;row<4;row++)for(let col=0;col<3;col++){let last=-1,red=0,visible=0;const pixels=[];for(let y=0;y<32;y++)for(let x=0;x<32;x++){const c=p.pixel(col*32+x,row*32+y);pixels.push(...c);assert.ok(c[3]===0||c[3]===255);if(x<2||x>29||y<2||y>28)assert.equal(c[3],0);if(c[3]){visible++;last=y;if(c[0]>c[1]*1.4&&c[0]>c[2]*1.4)red++;}}assert.equal(last,28);assert.ok(visible>60&&red>12);frames.add(JSON.stringify(pixels));}
 assert.equal(frames.size,12);assert.ok(readFileSync(path).length<16384);
});
