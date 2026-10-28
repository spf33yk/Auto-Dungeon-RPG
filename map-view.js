import {roomMapTiles} from './map-discovery.js';
// Room terrain is public after entry; objects still use real exploration sight.
// Trap-house markers are explicitly public even before their room is explored.
export function autoMapModel(s,visible){
 const tiles=roomMapTiles(s),markers=[],mapped=new Set(tiles.map(t=>`${t.x},${t.y}`)),known=p=>mapped.has(`${p.x},${p.y}`);
 if(known(s.stairs)&&s.seen[s.stairs.y][s.stairs.x])markers.push({...s.stairs,type:'stairs'});
 for(const i of s.items)if(known(i)&&s.seen[i.y][i.x])markers.push({x:i.x,y:i.y,type:'item'});
 for(const t of s.traps||[])if(t.revealed&&(s.gimmick?.id==='traps'||known(t)&&s.seen[t.y][t.x]))markers.push({x:t.x,y:t.y,type:t.spent?'spent':'trap'});
 for(const e of s.enemies)if(known(e)&&visible(e.x,e.y))markers.push({x:e.x,y:e.y,type:e.boss?'boss':'enemy'});
 for(const o of s.obstacles||[])if(known(o)&&s.seen[o.y][o.x])markers.push({...o,type:'tombstone'});
 markers.push({...s.player,type:'player'});return {tiles,markers};
}

// The camera follows the interpolated hero; padding keeps the full sight square on screen.
export function cameraFor(position,sight,width=744,height=552){
 const rows=2*Math.ceil(sight)+7,scale=Math.min(width,height)/(rows*24);
 return {scale,left:(position.x+.5)*24-width/scale/2,top:(position.y+.5)*24-height/scale/2,rows:height/(24*scale),columns:width/(24*scale)};
}

export function miniMapGeometry(columns,rows,cell=6){
 return {width:columns*cell+1,height:rows*cell+1,cell,
  vertical:Array.from({length:columns+1},(_,x)=>x*cell),
  horizontal:Array.from({length:rows+1},(_,y)=>y*cell)};
}

export function drawMiniMap(ctx,model,geometry){
 const {width,height,cell}=geometry;
 ctx.clearRect(0,0,width,height);
 for(const tile of model.tiles){
  ctx.fillStyle='#40574a';ctx.fillRect(tile.x*cell,tile.y*cell,cell+1,cell+1);
  ctx.fillStyle=tile.walkable?'#739d86':'#253c32';ctx.fillRect(tile.x*cell+1,tile.y*cell+1,cell-1,cell-1);
 }
 for(const m of model.markers){ctx.fillStyle=({player:'#fff3b0',enemy:'#ff8c83',boss:'#ffb44e',stairs:'#9ddff2',item:'#dec68c',trap:'#f3a66d',spent:'#827b73',tombstone:'#a3aa9b'})[m.type];ctx.fillRect(m.x*cell+1,m.y*cell+1,cell-1,cell-1);}
}
