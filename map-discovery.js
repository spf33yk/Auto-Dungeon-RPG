// Wide connected floor areas are rooms; one-tile passages remain separate.
// Derive them from the saved grid so older floors need no regeneration.
export function roomMapTiles(s){
 const grid=s.grid,h=grid.length,w=grid[0].length,wide=new Set(),key=(x,y)=>y*w+x;
 for(let y=0;y<h-1;y++)for(let x=0;x<w-1;x++)if(grid[y][x]&&grid[y][x+1]&&grid[y+1][x]&&grid[y+1][x+1])
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
