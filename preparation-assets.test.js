import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {fileURLToPath}from'node:url';
import {cardTransform,renderCard}from'./scripts/build-card-frames.js';
import {readPng}from'./test-support/png.js';
const directory=new URL('./art/ui/card-frame-v1/',import.meta.url);
const format=JSON.parse(fs.readFileSync(new URL('format.json',directory),'utf8'));
test('card frames fit mismatched bounds with one uniform scale and retain image aspect',()=>{
 for(const[id,card]of Object.entries(format.cards)){
  const t=cardTransform(format,card),[l,top,r,bottom]=card.sourceBody;
  assert.ok(t.scale>0);assert.ok((r-l)*t.scale<=format.body.right-format.body.left+1e-9);
  assert.ok((bottom-top)*t.scale<=format.body.bottom-format.body.top+1e-9);
  assert.ok(Math.abs(t.tx+(l+r)*t.scale/2-(format.body.left+format.body.right)/2)<1e-9);
  assert.ok(Math.abs(t.ty+(top+bottom)*t.scale/2-(format.body.top+format.body.bottom)/2)<1e-9);
  const svg=renderCard(format,fileURLToPath(directory),id,'ornate');
  assert.ok(!svg.includes('preserveAspectRatio="none"'));assert.match(svg,/scale\([\d.]+\)/);assert.ok(!svg.includes('matrix('));
 }
});
test('delivery images retain their canonical ratios and modest total storage',()=>{
 let size=0;for(const id of ['target','condition','skill','action']){
  const file=new URL(`./art/ui/preparation/card-${id}.png`,import.meta.url),p=readPng(file);assert.equal(p.width,515);assert.equal(p.height,130);size+=fs.statSync(file).size;
 }
 for(const[id,w]of[['left',128],['middle',768],['right',64]]){const file=new URL(`./art/ui/preparation/tray-${id}.png`,import.meta.url),p=readPng(file);assert.equal(p.width,w);assert.equal(p.height,128);size+=fs.statSync(file).size;}
 assert.ok(size<300*1024);
});
