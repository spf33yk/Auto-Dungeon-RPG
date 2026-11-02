import test from'node:test';import assert from'node:assert/strict';import fs from'node:fs';
import{readPng}from'./test-support/png.js';import{floorTextureFrame,drawFloorTexture}from'./terrain-view.js';import{enemyFrame,enemyHealth,drawEnemySprite,drawEnemyLabel,layoutEnemyLabels}from'./enemy-view.js';import{monsters}from'./data.js';import{cameraFor}from'./map-view.js';
test('native64 floors have exact periodic textured edges in every material',()=>{
 const p=readPng('art/terrain/floors-v2/atlas-64.png');assert.equal(p.width,256);assert.equal(p.height,256);
 for(let i=0;i<16;i++){const x=i%4*64,y=Math.floor(i/4)*64,colours=new Set();for(let n=0;n<64;n++){assert.deepEqual(p.pixel(x,y+n),p.pixel(x+63,y+n));assert.deepEqual(p.pixel(x+n,y),p.pixel(x+n,y+63));colours.add(p.pixel(x,y+n).join(','));}assert.ok(colours.size>8,'No uniform border on tile '+i);}
});
test('all areas have independent floor cells and uniform draw scaling',()=>{
 assert.equal(new Set(Array.from({length:10},(_,i)=>JSON.stringify(floorTextureFrame(i)))).size,10);
 const calls=[],ctx={drawImage(...args){calls.push(args);}};assert.equal(drawFloorTexture(ctx,{complete:false},1,2),false);
 assert.equal(drawFloorTexture(ctx,{complete:true,naturalWidth:256,naturalHeight:256},1,2,6,64),true);assert.deepEqual(calls[0].slice(1),[128,64,64,64,64,128,64,64]);assert.equal(ctx.imageSmoothingEnabled,false);
});
test('every monster including bosses gets its own binary-alpha native64 art',()=>{
 const p=readPng('art/enemies/v2/atlas-64.png');assert.equal(p.width,320);assert.equal(p.height,320);const frames=new Set();
 for(const m of monsters){const f=enemyFrame(m);assert.ok(f,m.id);frames.add(JSON.stringify(f));let opaque=0;for(let y=0;y<64;y++)for(let x=0;x<64;x++){const a=p.pixel(f.x+x,f.y+y)[3];assert.ok(a===0||a===255);if(a)opaque++;if(y>=60)assert.equal(a,0,'Foot margin');}assert.ok(opaque>80,m.id);}
 assert.equal(frames.size,monsters.length);assert.equal(enemyFrame({id:'missing'}),null);
 assert.ok(fs.statSync('art/enemies/v2/atlas-64.png').size+fs.statSync('art/terrain/floors-v2/atlas-64.png').size<350000);
});
test('HP bars represent actual remaining health, with stable boss labels',()=>{
 assert.equal(enemyHealth({hp:25,maxHp:100}).ratio,.25);assert.equal(enemyHealth({hp:200,maxHp:100}).ratio,1);assert.equal(enemyHealth({hp:-2,maxHp:100}).ratio,0);assert.equal(enemyHealth({hp:NaN,maxHp:100}).ratio,0);
 const calls=[],ctx={save(){},restore(){},fillRect(...a){calls.push(['rect',...a]);},strokeText(...a){calls.push(['stroke',...a]);},fillText(...a){calls.push(['text',...a]);}};
 drawEnemyLabel(ctx,{x:2,y:3,hp:25,maxHp:100,name:'門番',boss:true});assert.ok(calls.some(c=>c[0]==='text'&&c[1]==='◆ 門番'));assert.ok(calls.some(c=>c[0]==='text'&&c[1]==='25 / 100'));assert.ok(calls.some(c=>c[0]==='rect'&&c[3]===18));
});
test('camera moves in by one row at top and bottom without changing sight',()=>{
 for(const sight of [3,4,7]){const c=cameraFor({x:5,y:6},sight,1920,1080);assert.equal(c.rows,2*Math.ceil(sight)+5);assert.equal((2*Math.ceil(sight)+7)-c.rows,2);}
});
test('adjacent long enemy names are staggered without changing enemies',()=>{const enemies=[{name:'墓地スライム',x:1,y:2},{name:'墓地スライム',x:2,y:2}],before=JSON.stringify(enemies),labels=layoutEnemyLabels(enemies);assert.equal(labels[0].offset,0);assert.equal(labels[1].offset,-30);assert.equal(JSON.stringify(enemies),before);});
