import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateCharacterSheet,characterActionFrame,characterPresentation,drawCharacter} from './character-animation.js';
import {readPng} from './test-support/png.js';
const root='art/characters/mukuro-march64-v1/';
const d=JSON.parse(readFileSync(root+'sprites.json'));
const sample=(direction,elapsed,state='idle',extra={})=>({direction,elapsed,state,progress:.45,reducedMotion:false,...extra});
test('approved march atlas preserves every reviewed frame and padding without filtering artwork',()=>{
 assert.equal(validateCharacterSheet(d),d);assert.equal(d.columns,4);
 const approval=JSON.parse(readFileSync(root+'APPROVED_SOURCE.json')),atlas=readPng(root+'sprites.png');
 assert.equal(atlas.width,512);assert.equal(atlas.height,512);
 for(const entry of approval.files){
  assert.equal(createHash('sha256').update(readFileSync(root+entry.file)).digest('hex'),entry.sha256);
  const [,dir,col]=entry.file.match(/frames\/(down|left|right|up)-(\d)\.png/),row=['down','left','right','up'].indexOf(dir),frame=readPng(root+entry.file);
  for(let y=0;y<128;y++)for(let x=0;x<128;x++){
   const pixel=atlas.pixel(Number(col)*128+x,row*128+y);assert.deepEqual(pixel,frame.pixel(x,y));
   assert.ok(pixel[3]===0||pixel[3]===255);if(x<8||x>=120||y<8||y>=120)assert.equal(pixel[3],0);
  }
 }
});
test('both legs play at exact 800ms boundaries in all directions and across action clock resets',()=>{
 for(let dir=0;dir<4;dir++)for(const [time,col] of [[0,0],[119,0],[120,1],[399,1],[400,2],[519,2],[520,3],[799,3],[800,0],[1320,3]]){
  for(const state of ['idle','moving']){
   const f=characterActionFrame(d,sample(dir,0,state,{cycleElapsed:time}));assert.equal(f.x,col*128);assert.equal(f.y,dir*128);
  }
 }
 for(const change of [x=>x.animation.cycleDurationsMs=[120,280],x=>x.animation.cycleDurationsMs[3]=0,x=>x.columns=5]){
  const bad=structuredClone(d);change(bad);assert.throws(()=>validateCharacterSheet(bad));
 }
});
test('attack, reduced motion and death use grounded pose while lunge and slash stay visual only',()=>{
 for(let dir=0;dir<4;dir++){
  for(const s of [sample(dir,620,'attacking'),sample(dir,620,'dead'),sample(dir,620,'moving',{reducedMotion:true})])assert.equal(characterActionFrame(d,s).x,0);
  const s=Object.freeze(sample(dir,0,'attacking')),v=characterPresentation(d,s,64);assert.equal(v.effectFrame,1);
  const calls=[],ctx={globalAlpha:1,save(){},restore(){},drawImage(...a){calls.push(a);}};
  assert.equal(drawCharacter(ctx,{definition:d,image:{naturalWidth:512,naturalHeight:512},effectImage:{naturalWidth:192,naturalHeight:256}},s,2,3,64),true);
  assert.equal(calls.length,2);assert.equal(calls[0][2],dir*128);assert.equal(calls[1][2],dir*64);
 }
});
