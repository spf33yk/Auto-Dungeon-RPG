import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {CharacterAnimation,validateCharacterSheet,characterActionFrame,characterPresentation,characterAttackDuration,characterDrawBox,drawCharacter,loadCharacterSheet} from './character-animation.js';
import {readPng} from './test-support/png.js';
const folder='art/characters/mukuro-minimal64-v1/';
const d=JSON.parse(readFileSync(folder+'sprites.json'));
const image={complete:true,naturalWidth:384,naturalHeight:512},effectImage={complete:true,naturalWidth:192,naturalHeight:256};
const sheet={definition:d,image,effectImage};
const sample=(direction=0,state='idle',elapsed=0,progress=0,reducedMotion=false)=>({direction,state,elapsed,progress,reducedMotion,frame:0,x:2,y:3});
function context(){return {globalAlpha:1,imageSmoothingEnabled:true,calls:[],stack:[],save(){this.stack.push(this.globalAlpha);},restore(){this.globalAlpha=this.stack.pop();},drawImage(...args){this.calls.push({args,alpha:this.globalAlpha});}};}
test('active hero uses the approved12poses unchanged with valid minimal layout and versioned FX',()=>{
 assert.equal(validateCharacterSheet(d),d);
 const approved=JSON.parse(readFileSync(folder+'APPROVED_SOURCE.json'));
 const sha=createHash('sha256').update(readFileSync(folder+'sprites.png')).digest('hex');
 assert.equal(sha,approved.approved_sprites_sha256);
 assert.match(readFileSync('index.html','utf8'),/data-hero="\.\/art\/characters\/mukuro-minimal64-v1\/sprites.json\?v=/);
 assert.equal(d.tileSize,128);assert.deepEqual(d.anchor,[64,96]);
 for(const change of [x=>x.animation.lungePx=Infinity,x=>x.animation.idleStepMs=0,x=>x.portrait=[120,0,96,96],x=>x.effect.width=64]){
  const bad=structuredClone(d);change(bad);assert.throws(()=>validateCharacterSheet(bad));
 }
 const p=readPng(folder+'sprites.png');
 for(let dir=0;dir<4;dir++)for(let frame=0;frame<3;frame++){
  const rgba=[];
  for(let y=0;y<128;y++)for(let x=0;x<128;x++)rgba.push(...p.pixel(frame*128+x,dir*128+y));
  const key=['down','left','right','up'][dir]+'-'+['stand','bob1','bob2'][frame];
  assert.equal(createHash('sha256').update(Buffer.from(rgba)).digest('hex'),approved.pose_rgba_sha256[key]);
 }
 const [px,py,pw,ph]=d.portrait;
 for(let y=0;y<128;y++)for(let x=0;x<128;x++)if(p.pixel(x,y)[3])assert.ok(x>=px&&x<px+pw&&y>=py&&y<py+ph,'portrait must retain the whole approved front');
});
test('idle and movement read all three bob poses in4directions without using attack frame semantics',()=>{
 for(let dir=0;dir<4;dir++){
  for(const [step,col] of [[0,0],[1,1],[2,2],[3,1],[4,0]]){
   assert.deepEqual(characterActionFrame(d,sample(dir,'idle',step*200)),{x:col*128,y:dir*128,width:128,height:128});
   assert.equal(characterActionFrame(d,sample(dir,'moving',step*100)).x,col*128);
  }
  assert.equal(characterActionFrame(d,sample(dir,'attacking',0,.1)).x,256);
  assert.equal(characterActionFrame(d,sample(dir,'attacking',0,.5)).x,0);
  assert.equal(characterActionFrame(d,sample(dir,'idle',400,0,true)).x,0);
 }
});
test('lunge and slash only affect rendering, return to origin and keep four directional handedness rows',()=>{
 for(let dir=0;dir<4;dir++){
  const s=Object.freeze(sample(dir,'attacking',135,.45));
  const before=JSON.stringify(s),v=characterPresentation(d,s,64);
  const vector=[[0,1],[-1,0],[1,0],[0,-1]][dir];
  assert.equal(v.offsetX,vector[0]*13.75);assert.equal(v.offsetY,vector[1]*13.75);
  const c=context();drawCharacter(c,sheet,s,2,3,64);
  assert.equal(c.calls.length,2);assert.equal(c.calls[0].args[2],dir*128);
  assert.equal(c.calls[1].args[2],dir*64);assert.equal(c.calls[1].args[0],effectImage);
  assert.equal(JSON.stringify(s),before);assert.equal(c.globalAlpha,1);
  const end=characterPresentation(d,sample(dir,'attacking',300,1),64);
  assert.equal(end.offsetX,0);assert.equal(end.offsetY,0);assert.equal(end.effectFrame,-1);
  const reduced=characterPresentation(d,sample(dir,'attacking',150,.5,true),64);
  assert.equal(reduced.offsetX,0);assert.equal(reduced.offsetY,0);assert.equal(reduced.effectFrame,1);
 }
 assert.equal(characterPresentation(d,sample(0,'attacking',0,.1)).effectFrame,-1);
 assert.deepEqual([.25,.5,.65].map(p=>characterPresentation(d,sample(0,'attacking',0,p)).effectFrame),[0,1,2]);
 const box=characterDrawBox(2,3,d,64);assert.equal(box.y+d.anchor[1]*64/128*d.displayScale,4*64);
 assert.equal(64*64/128*d.displayScale,55);
});
test('speed1/2/4 completes before the next action, pause is stable, and move/teleport cancel old attacks',()=>{
 assert.deepEqual([.5,1,2,4].map(s=>characterAttackDuration(d,s)),[600,300,168,84]);
 for(const speed of [1,2,4]){
  const actor=new CharacterAnimation({x:1,y:1});const duration=characterAttackDuration(d,speed);
  actor.attackTo(2,1,0,duration);assert.equal(actor.sample(duration-1).state,'attacking');
  assert.equal(actor.sample(420/speed).state,'idle');
  actor.attackTo(2,1,500,duration);
  const frozen=actor.sample(520);assert.deepEqual(actor.sample(520),frozen);
  actor.moveTo(1,2,530,85);assert.equal(characterPresentation(d,actor.sample(540),64).effectFrame,-1);
  actor.teleport(4,4,550);assert.equal(actor.sample(550).state,'idle');assert.equal(actor.direction,0);
 }
});
test('death preserves facing and fades body and effect safely without a missing death clip',()=>{
 const actor=new CharacterAnimation({direction:2});actor.die(100);
 for(const [time,alpha] of [[100,1],[490,.5],[880,0],[1000,0]]){
  const s=actor.sample(time),v=characterPresentation(d,s,64);assert.equal(v.opacity,alpha);assert.equal(v.effectFrame,-1);
  const c=context();drawCharacter(c,sheet,s,2,3,64);assert.equal(c.calls.length,1);assert.equal(c.calls[0].args[2],256);assert.equal(c.calls[0].alpha,alpha);assert.equal(c.globalAlpha,1);
 }
 assert.equal(characterPresentation(d,actor.sample(100,{reducedMotion:true}),64).opacity,0);
});
test('loader resolves slash versions and rejects wrong FX dimensions; all12FX cells have binary alpha',async()=>{
 let n=0;const loaded=await loadCharacterSheet('hero/sprites.json?v=1',{baseURL:'https://example.test/',fetcher:async()=>({ok:true,json:async()=>d}),imageFactory:()=>({...n++?effectImage:image,decode:async()=>{}})});
 assert.match(loaded.effectImage.src,/hero\/slash.png\?v=/);
 n=0;await assert.rejects(()=>loadCharacterSheet('hero/sprites.json',{baseURL:'https://example.test/',fetcher:async()=>({ok:true,json:async()=>d}),imageFactory:()=>({...n++?{...effectImage,naturalWidth:191}:image,decode:async()=>{}})}));
 const p=readPng(folder+'slash.png');
 for(let dir=0;dir<4;dir++)for(let f=0;f<3;f++){
  let count=0;
  for(let y=0;y<64;y++)for(let x=0;x<64;x++){const a=p.pixel(f*64+x,dir*64+y)[3];assert.ok(a===0||a===255);if(a)count++;if(x===0||x===63||y===0||y===63)assert.equal(a,0);}
  assert.ok(count>10);
 }
});
