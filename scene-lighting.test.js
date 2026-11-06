import test from 'node:test';import assert from 'node:assert/strict';
import {dimmedWallTileset,drawSightWall,floorLight,actorFootOffset,renderSightState,MEMORY_SHADE} from './scene-lighting.js';import {canSee,radius,newGame} from './engine.js';import {drawFootShadow} from './scene-depth.js';
test('wall shade uses the sprite alpha and caches an independent opaque-color atlas',()=>{
 const ops=[],ctx={drawImage(...a){ops.push(['image',...a]);},fillRect(...a){ops.push(['shade',this.globalCompositeOperation,this.fillStyle,...a]);}},canvas={getContext:()=>ctx},source={naturalWidth:128,naturalHeight:144},set={definition:{id:'crypt'},image:source};
 const dark=dimmedWallTileset(set,()=>canvas);assert.equal(dark.definition,set.definition);assert.equal(dark.image,canvas);assert.equal(canvas.width,128);assert.equal(canvas.height,144);assert.deepEqual(ops[1],['shade','source-atop',MEMORY_SHADE,0,0,128,144]);assert.equal(ctx.globalCompositeOperation,'source-over');assert.equal(dimmedWallTileset(set,()=>{throw Error('Should be cached');}),dark);assert.equal(dimmedWallTileset(null),null);assert.equal(set.image,source);
});
test('all out-of-sight terrain remains dim without affecting discovery',()=>{
 assert.equal(floorLight(false,false),'memory');assert.equal(floorLight(false,true),'visible');assert.equal(floorLight(true,false),'memory');assert.equal(floorLight(true,true),'visible');
});
test('camera interpolation does not delay committed visibility or reveal through walls',()=>{
 const s=newGame(4);s.player={x:4,y:4};s.grid=Array.from({length:10},()=>Array(10).fill(1));s.grid[4][5]=0;const before=JSON.stringify(s);
 for(const position of [{x:3.2,y:4},{x:3.6,y:4},{x:4,y:3.2}]){const view=renderSightState(s,position);assert.equal(view,s);assert.equal(radius(view),radius(s));for(let y=0;y<10;y++)for(let x=0;x<10;x++)assert.equal(canSee(view,x,y),canSee(s,x,y));}assert.ok(canSee(s,5,4));assert.equal(canSee(s,6,4),false);assert.equal(JSON.stringify(s),before);
});
test('raised wall light clips projected cells without spilling into neighbouring shadow',()=>{
 const ops=[],ctx={save(){},restore(){},beginPath(){},rect(...a){ops.push(a);},clip(){ops.push('clip');}},dark={id:'dark'},wall={dimmed:dark},draw=[];
 drawSightWall(ctx,wall,{x:128,y:80,width:64,height:112},64,(x,y)=>x===2&&y===2,set=>draw.push(set));assert.deepEqual(ops,[[128,128,64,64],'clip']);assert.deepEqual(draw,[dark,wall]);
 ops.length=0;draw.length=0;drawSightWall(ctx,wall,{x:128,y:80,width:64,height:112},64,()=>false,set=>draw.push(set));assert.deepEqual(ops,[]);assert.deepEqual(draw,[dark]);
});
test('different transparent sprite padding shares a fixed ground contact and shadow',()=>{
 const height=28.32,top=24-height;for(const rows of [['....','xxxx','....','....'],['xxxx','xxxx','xxxx','xxxx']]){const last=rows.map((r,i)=>r.includes('x')?i:-1).reduce((a,b)=>Math.max(a,b));assert.ok(Math.abs(top+actorFootOffset(rows,height)+(last+1)*height/rows.length-22)<1e-9);}
 const ellipses=[],ctx={save(){},restore(){},beginPath(){},fill(){},ellipse(...a){ellipses.push(a);}};drawFootShadow(ctx,2.5,4.25);assert.equal(ellipses[0][0],72);assert.equal(ellipses[0][1],124);
});

test('exploration cold lighting restores canvas state and clips its visibility aid to sight',async()=>{
 const {drawExplorationLight,EXPLORATION_LIGHT}=await import('./scene-lighting.js');
 const clips=[],fills=[],stops=[],stack=[];
 const ctx={globalCompositeOperation:'source-over',globalAlpha:.8,fillStyle:'original',save(){stack.push([this.globalCompositeOperation,this.globalAlpha,this.fillStyle]);},restore(){[this.globalCompositeOperation,this.globalAlpha,this.fillStyle]=stack.pop();},beginPath(){},rect(...v){clips.push(v);},clip(){},createRadialGradient(){return {addColorStop(...v){stops.push(v);}};},fillRect(...v){fills.push({mode:this.globalCompositeOperation,alpha:this.globalAlpha,rect:v});}};
 const position={x:4.25,y:3.5},before=JSON.stringify(position);
 drawExplorationLight(ctx,{position,visible:(x,y)=>x===4&&y===3,camera:{left:100,top:200,scale:2},width:1920,height:1080});
 assert.deepEqual(fills[0],{mode:'multiply',alpha:EXPLORATION_LIGHT.tintAlpha,rect:[100,200,960,540]});assert.deepEqual(clips,[[256,192,64,64]]);assert.equal(fills[1].mode,'screen');assert.equal(stops.at(-1)[1],'rgba(132,186,198,0)');assert.equal(ctx.globalCompositeOperation,'source-over');assert.equal(ctx.globalAlpha,.8);assert.equal(ctx.fillStyle,'original');assert.equal(stack.length,0);assert.equal(JSON.stringify(position),before);
 // With no visible cells, the effect cannot emit any local light.
 fills.length=0;clips.length=0;
 drawExplorationLight(ctx,{position,visible:()=>false,camera:{left:0,top:0,scale:1},width:1920,height:1080});assert.equal(fills.length,1);assert.equal(fills[0].mode,'multiply');assert.deepEqual(clips,[]);
});

test('visual circular clipping leaves square corner visibility and game state untouched',async()=>{const {clipSightAppearance,shadeSightFloor}=await import('./scene-lighting.js');const s=newGame(22);s.player={x:5,y:5};s.grid=Array.from({length:15},()=>Array(15).fill(1));s.gimmick={id:'none'};s.enemies=[];assert.equal(canSee(s,8,8),true);const before=JSON.stringify(s),ops=[],ctx={save(){},restore(){},beginPath(){},rect(...v){ops.push(['rect',...v]);},moveTo(){},arc(...v){ops.push(['arc',...v]);},clip(rule){ops.push(['clip',rule]);},fillRect(...v){ops.push(['fill',...v]);}};const appearance={position:s.player,radius:3,size:64};clipSightAppearance(ctx,appearance);assert.deepEqual(ops[0],['arc',352,352,224,0,Math.PI*2]);shadeSightFloor(ctx,8,8,64,appearance);assert.ok(ops.some(o=>o[0]==='clip'&&o[1]==='evenodd'));assert.equal(canSee(s,8,8),true);assert.equal(JSON.stringify(s),before);});
