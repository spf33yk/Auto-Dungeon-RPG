// Wide connected floor areas are rooms; one-tile passages remain separate.
// Derive them from the saved grid so older floors need no regeneration.
export function roomMapTiles(s){
 if(s.rooms)return savedRoomTiles(s);
 const grid=s.grid,h=grid.length,w=grid[0].length,wide=new Set(),key=(x,y)=>y*w+x;
 const obstacles=new Set((s.obstacles||[]).map(p=>key(p.x,p.y))),roomGrid=grid.map((r,y)=>r.map((v,x)=>v||obstacles.has(key(x,y))));
 for(let y=0;y<h-1;y++)for(let x=0;x<w-1;x++)if(roomGrid[y][x]&&roomGrid[y][x+1]&&roomGrid[y+1][x]&&roomGrid[y+1][x+1])
  for(const [dx,dy]of [[0,0],[1,0],[0,1],[1,1]])wide.add(key(x+dx,y+dy));
 const sector=(x,y)=>s.bossFloor||w!==31||h!==23?0:Math.min(2,Math.floor(x/10))+(y>=12?3:0);
 const pending=new Set(wide),rooms=[],roomWalls=new Set(),shown=new Set();
 while(pending.size){
  const first=pending.values().next().value,q=[first],walls=new Set();pending.delete(first);let entered=false;
  for(let i=0;i<q.length;i++){
   const n=q[i],x=n%w,y=Math.floor(n/w);if(s.visited[y][x]||s.player.x===x&&s.player.y===y)entered=true;
   for(const [dx,dy]of [[0,-1],[1,0],[0,1],[-1,0]]){const k=key(x+dx,y+dy);if(x+dx>=0&&x+dx<w&&y+dy>=0&&y+dy<h&&sector(x,y)===sector(x+dx,y+dy)&&pending.delete(k))q.push(k);}
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(x+dx>=0&&x+dx<w&&y+dy>=0&&y+dy<h&&!grid[y+dy][x+dx])walls.add(key(x+dx,y+dy));
  }
  for(const n of walls)roomWalls.add(n);rooms.push({floors:q,walls,entered});
 }
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const n=key(x,y);if(s.seen[y][x]&&!wide.has(n)&&!roomWalls.has(n))shown.add(n);}
 for(const r of rooms)if(r.entered){for(const n of r.floors)shown.add(n);for(const n of r.walls)shown.add(n);}
 return [...shown].map(n=>({x:n%w,y:Math.floor(n/w),walkable:Boolean(grid[Math.floor(n/w)][n%w])}));
}
// Explicit rooms keep long corridors from accidentally merging adjacent areas.
function savedRoomTiles(s){
 const grid=s.grid,w=grid[0].length,h=grid.length,key=(x,y)=>y*w+x,graves=new Set((s.obstacles||[]).map(p=>key(p.x,p.y))),floor=(x,y)=>Boolean(grid[y]?.[x]||graves.has(key(x,y))),all=new Set(),walls=new Set(),shown=new Set();
 for(const r of s.rooms){const cells=[],border=new Set();let entered=false;
  for(let y=r.y;y<r.y+r.h;y++)for(let x=r.x;x<r.x+r.w;x++)if(floor(x,y)){const n=key(x,y);cells.push(n);all.add(n);if(s.visited[y][x]||s.player.x===x&&s.player.y===y)entered=true;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(x+dx>=0&&x+dx<w&&y+dy>=0&&y+dy<h&&!floor(x+dx,y+dy))border.add(key(x+dx,y+dy));}
  for(const n of border)walls.add(n);if(entered){for(const n of cells)shown.add(n);for(const n of border)shown.add(n);}
 }
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(s.seen[y][x]&&!all.has(key(x,y))&&!walls.has(key(x,y)))shown.add(key(x,y));
 return [...shown].map(n=>({x:n%w,y:Math.floor(n/w),walkable:Boolean(grid[Math.floor(n/w)][n%w])}));
}
