import test from 'node:test';
import assert from 'node:assert/strict';
import {readPng} from './test-support/png.js';

function bounds(p,col,row=0){let minX=64,minY=64,maxX=-1,maxY=-1;
 for(let y=0;y<64;y++)for(let x=0;x<64;x++)if(p.pixel(col*64+x,row*64+y)[3]){
  minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);
 }
 return {width:maxX-minX+1,height:maxY-minY+1,bottom:maxY+1};
}

test('actors and props use planned visible sizes and a common foot line',()=>{
 const hero=readPng('art/characters/mukuro-front-v2/directions-64.png');
 const enemies=readPng('art/enemies/atlas-64.png');
 const props=readPng('art/props/atlas-64.png');
 const items=readPng('art/props/map-items-64.png');
 for(let col=0;col<4;col++)assert.deepEqual([bounds(hero,col).height,bounds(hero,col).bottom],[44,60]);
 for(const [p,col,row,min,max]of [[enemies,0,0,28,34],[enemies,1,0,46,50],[props,0,0,32,36],[props,1,0,28,34],[items,0,0,24,28]]){
  const b=bounds(p,col,row);assert.ok(b.height>=min&&b.height<=max);assert.equal(b.bottom,60);
 }
});

test('stair artwork visibly rises to the right and agrees across prop atlases',()=>{
 const props=readPng('art/props/atlas-64.png'),items=readPng('art/props/map-items-64.png');
 const top=x=>{for(let y=0;y<64;y++)if(props.pixel(64+x,y)[3])return y;return 64;};
 assert.ok(top(8)>top(48)+15);
 for(let y=0;y<64;y++)for(let x=0;x<64;x++)assert.deepEqual(props.pixel(64+x,y),items.pixel(128+x,64+y));
});
