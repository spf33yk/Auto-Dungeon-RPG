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

test('warm lighting follows sight upgrades and fog, preserves square detection and canvas state',async()=>{
 const {drawExplorationLight,explorationLightGeometry,EXPLORATION_LIGHT}=await import('./scene-lighting.js');const s=newGame(44);s.player={x:5,y:5};s.grid=Array.from({length:20},()=>Array(20).fill(1));s.enemies=[];
 const gradients=[],fills=[],stack=[],ctx={globalCompositeOperation:'source-over',globalAlpha:.8,fillStyle:'original',save(){stack.push([this.globalCompositeOperation,this.globalAlpha,this.fillStyle]);},restore(){[this.globalCompositeOperation,this.globalAlpha,this.fillStyle]=stack.pop();},createRadialGradient(...args){const stops=[];gradients.push({args,stops});return {addColorStop(...v){stops.push(v);}};},fillRect(...rect){fills.push({mode:this.globalCompositeOperation,rect,alpha:this.globalAlpha});}};
 for(const fog of [false,true])for(let level=0;level<=4;level++){s.gimmick={id:fog?'fog':'none'};s.levels.scout=level;const sight=radius(s),before=JSON.stringify(s),seen=canSee(s,8,8);drawExplorationLight(ctx,{position:s.player,appearance:{radius:sight},camera:{left:100,top:200,scale:2},width:1920,height:1080});assert.equal(gradients.at(-1).args[5],(sight+1.3)*64);assert.equal(JSON.stringify(s),before);assert.equal(canSee(s,8,8),seen);}
 assert.deepEqual(fills[0],{mode:'screen',rect:[100,200,960,540],alpha:1});assert.equal(fills[1].mode,'source-over');assert.equal(gradients[1].stops.at(-1)[1],'#000000d2');assert.equal(ctx.globalAlpha,.8);assert.equal(ctx.fillStyle,'original');assert.equal(stack.length,0);assert.equal(explorationLightGeometry(s.player,3).radius,4.3*64);assert.equal(EXPLORATION_LIGHT.warm[0],'#f6ce7959');
});
test('smooth raised walls use the same continuous mask as floors without a second cell shade',()=>{const wall={},draw=[];drawSightWall({},wall,{x:0,y:0,width:64,height:112},64,()=>false,w=>draw.push(w),{smooth:true});assert.deepEqual(draw,[wall]);});

test('visual circular clipping leaves square corner visibility and game state untouched',async()=>{const {clipSightAppearance,shadeSightFloor}=await import('./scene-lighting.js');const s=newGame(22);s.player={x:5,y:5};s.grid=Array.from({length:15},()=>Array(15).fill(1));s.gimmick={id:'none'};s.enemies=[];assert.equal(canSee(s,8,8),true);const before=JSON.stringify(s),ops=[],ctx={save(){},restore(){},beginPath(){},rect(...v){ops.push(['rect',...v]);},moveTo(){},arc(...v){ops.push(['arc',...v]);},clip(rule){ops.push(['clip',rule]);},fillRect(...v){ops.push(['fill',...v]);}};const appearance={position:s.player,radius:3,size:64};clipSightAppearance(ctx,appearance);assert.deepEqual(ops[0],['arc',352,352,224,0,Math.PI*2]);shadeSightFloor(ctx,8,8,64,appearance);assert.ok(ops.some(o=>o[0]==='clip'&&o[1]==='evenodd'));assert.equal(canSee(s,8,8),true);assert.equal(JSON.stringify(s),before);});
