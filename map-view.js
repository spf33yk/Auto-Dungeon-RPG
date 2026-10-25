// Only discovered terrain and currently visible enemies enter the automap.
// Trap-house markers are explicitly public even before their room is explored.
export function autoMapModel(s,visible){
 const tiles=[],markers=[];
 for(let y=0;y<s.grid.length;y++)for(let x=0;x<s.grid[y].length;x++)if(s.seen[y][x])tiles.push({x,y,walkable:Boolean(s.grid[y][x])});
 if(s.seen[s.stairs.y][s.stairs.x])markers.push({...s.stairs,type:'stairs'});
 for(const i of s.items)if(s.seen[i.y][i.x])markers.push({x:i.x,y:i.y,type:'item'});
 for(const t of s.traps||[])if(t.revealed&&(s.gimmick?.id==='traps'||s.seen[t.y][t.x]))markers.push({x:t.x,y:t.y,type:t.spent?'spent':'trap'});
 for(const e of s.enemies)if(visible(e.x,e.y))markers.push({x:e.x,y:e.y,type:e.boss?'boss':'enemy'});
 markers.push({...s.player,type:'player'});return {tiles,markers};
}
