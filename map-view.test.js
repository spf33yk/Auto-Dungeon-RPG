import test from 'node:test';
import assert from 'node:assert/strict';
test('portrait and landscape cameras fit the full sight range without stretching tiles',()=>{
 for(const [width,height] of [[744,552],[744,912],[320,380],[1280,720],[360,202.5]])for(const sight of [2,3,7]){
  const p={x:15.5,y:10.25},c=cameraFor(p,sight,width,height),center={x:(p.x+.5)*24,y:(p.y+.5)*24};
  for(const [dx,dy]of [[sight,0],[-sight,0],[0,sight],[0,-sight]]){
   const x=(center.x+dx*24-c.left)*c.scale,y=(center.y+dy*24-c.top)*c.scale;
   assert.ok(x>=0&&x<=width&&y>=0&&y<=height);
  }
  assert.ok(Math.abs(c.scale*24-Math.min(width,height)/(2*Math.ceil(sight)+3))<1e-8);
 }
});
import {cameraFor,miniMapGeometry,drawMiniMap} from './map-view.js';

test('zoom camera fits every sight radius and follows fractional positions at map edges',()=>{
 for(const sight of [2,3,4,5,6,7,8])for(const p of [{x:1,y:1},{x:15.25,y:11.5},{x:29,y:21}]){
  const c=cameraFor(p,sight),center={x:(p.x+.5)*24,y:(p.y+.5)*24};
  assert.ok(c.rows<23&&c.columns<31); // Never show the entire 31×23 field.
  assert.ok(c.scale>1);
  assert.ok(Math.abs((center.x-c.left)*c.scale-372)<1e-8);
  assert.ok(Math.abs((center.y-c.top)*c.scale-276)<1e-8);
  for(const [dx,dy] of [[sight,0],[-sight,0],[0,sight],[0,-sight]]){
   const x=(center.x+dx*24-c.left)*c.scale,y=(center.y+dy*24-c.top)*c.scale;
   assert.ok(x>=0&&x<=744&&y>=0&&y<=552);
  }
 }
 assert.ok(cameraFor({x:10,y:10},6).scale<cameraFor({x:10,y:10},4).scale);
});

test('minimap leaves undiscovered cells transparent and preserves mapped grid boundaries',()=>{
 for(const cell of [4,6]){
  const g=miniMapGeometry(31,23,cell),pixels=new Map();
  const ctx={fillStyle:'',clearRect(){pixels.clear();},fillRect(x,y,w,h){
   for(let cy=y;cy<y+h;cy++)for(let cx=x;cx<x+w;cx++)pixels.set(cx+','+cy,this.fillStyle);
  }};
  drawMiniMap(ctx,{tiles:[{x:0,y:0,walkable:true},{x:30,y:22,walkable:true}],markers:[{x:0,y:0,type:'player'},{x:30,y:22,type:'boss'}]},g);
  assert.equal(g.vertical.length,32);assert.equal(g.horizontal.length,24);
  for(const [tx,ty]of [[0,0],[30,22]])for(let n=0;n<=cell;n++){
   for(const [x,y]of [[tx*cell+n,ty*cell],[tx*cell+n,(ty+1)*cell],[tx*cell,ty*cell+n],[(tx+1)*cell,ty*cell+n]])assert.equal(pixels.get(x+','+y),'#40574a');
  }
  assert.equal(pixels.has((15*cell)+','+(10*cell)),false);
  assert.equal(pixels.get('1,1'),'#fff3b0');
  assert.equal(pixels.get((30*cell+1)+','+(22*cell+1)),'#ffb44e');
 }
});
