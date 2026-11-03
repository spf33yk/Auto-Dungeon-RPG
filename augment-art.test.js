import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {augments} from './augments.js';
import {AUGMENT_IMAGES,AUGMENT_FRAME} from './augment-art.js';
import {augmentCard,augmentChip} from './augment-view.js';
import {readPng} from './test-support/png.js';
function jpegSize(buffer){let p=2;while(p<buffer.length){assert.equal(buffer[p],255);const marker=buffer[p+1],length=buffer.readUInt16BE(p+2);if([0xc0,0xc1,0xc2].includes(marker))return {width:buffer.readUInt16BE(p+7),height:buffer.readUInt16BE(p+5)};p+=2+length;}throw Error('Missing JPEG dimensions');}
test('every augment has a compact correctly versioned illustration and a shared alpha frame',()=>{let bytes=0;for(const a of augments){assert.ok(AUGMENT_IMAGES[a.id],a.id);const url=AUGMENT_IMAGES[a.id],file=url.slice(2).split('?')[0],buffer=fs.readFileSync(file);assert.deepEqual(jpegSize(buffer),{width:192,height:240});assert.equal(url.split('?v=')[1],createHash('sha256').update(buffer).digest('hex').slice(0,12));bytes+=buffer.length;}const file=AUGMENT_FRAME.slice(2).split('?')[0],frame=readPng(file);assert.equal(frame.width,384);assert.equal(frame.height,576);assert.equal(frame.pixel(192,288)[3],0);bytes+=fs.statSync(file).size;assert.ok(bytes<600000,'production images must stay under 600KB');});
test('choice, codex and preparation share the same artwork without rasterizing text',()=>{const a=augments.find(a=>a.id==='swift-ascent');for(const html of [augmentCard(a,{choice:true}),augmentCard(a,{status:'未取得'}),augmentChip(a)]){assert.ok(html.includes(AUGMENT_IMAGES[a.id]));assert.ok(html.includes(a.name));assert.ok(html.includes(a.detail));assert.ok(html.includes(a.rarity));}assert.ok(augmentCard(a,{choice:true}).includes('data-augment="swift-ascent"'));});
