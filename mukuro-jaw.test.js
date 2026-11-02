import test from 'node:test';
import assert from 'node:assert/strict';
import {readPng} from './test-support/png.js';

test('original animation is pixel-identical outside the narrow front-jaw edits',()=>{
 const original=readPng('art/characters/mukuro-front-v2/sprites-64-before-refine.png');
 const current=readPng('art/characters/mukuro-front-v2/sprites-64.png');
 const centers=[[31,32,32,32],[32,30,32,31],[33,null,null,33]];
 let edits=0;
 for(let y=0;y<256;y++)for(let x=0;x<320;x++){
  const col=Math.floor(x/64),row=Math.floor(y/64),center=centers[row]?.[col];
  const jaw=center!=null&&x-col*64>=center-5&&x-col*64<center+5&&y-row*64>=25&&y-row*64<32;
  const a=original.pixel(x,y),b=current.pixel(x,y);
  if(!jaw)assert.deepEqual(b,a,`animation pixel changed outside jaw at ${x},${y}`);
  else if(a.some((value,i)=>value!==b[i]))edits++;
 }
 assert.ok(edits>100);
});

test('static side and back views remain the approved original-size art',()=>{
 const original=readPng('art/characters/mukuro-front-v2/directions-64-before-refine.png');
 const current=readPng('art/characters/mukuro-front-v2/directions-64.png');
 const sheet=readPng('art/characters/mukuro-front-v2/sprites-64.png');
 for(let y=0;y<64;y++)for(let x=0;x<256;x++){
  assert.deepEqual(current.pixel(x,y),x<64?sheet.pixel(x,y):original.pixel(x,y));
 }
});
