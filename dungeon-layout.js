export const WIDE_CORRIDOR_CHANCE=.05;
export const roomCountForFloor=floor=>5+Math.min(5,Math.max(0,Math.floor((floor-1)/5)));
// A new run seed changes partitions, occupied regions, room geometry and connections.
// Reusing that seed keeps forecasts and saved journeys reproducible.
export function generateDungeonLayout(floor,rng,{width=47,height=35,layout='rooms'}={}){
 const pick=n=>Math.floor(rng()*n),cols=[1,11+pick(3),23+pick(3),34+pick(2),width-1],rows=[1,10+pick(3),21+pick(3),height-1];
 const neighbours=i=>[i%4?i-1:-1,i%4<3?i+1:-1,i>=4?i-4:-1,i<8?i+4:-1].filter(n=>n>=0);
 const chosen=[pick(12)],links=[];
 while(chosen.length<roomCountForFloor(floor)){const edges=chosen.flatMap(a=>neighbours(a).filter(b=>!chosen.includes(b)).map(b=>[a,b]));const [a,b]=edges[pick(edges.length)];chosen.push(b);links.push([a,b]);}
 const extras=chosen.flatMap(a=>neighbours(a).filter(b=>a<b&&chosen.includes(b)&&!links.some(([x,y])=>x===a&&y===b||x===b&&y===a)).map(b=>[a,b]));
 if(extras.length&&rng()<.15)links.push(extras[pick(extras.length)]);
 const rooms=chosen.map(cell=>{const col=cell%4,row=Math.floor(cell/4),cw=cols[col+1]-cols[col],ch=rows[row+1]-rows[row],maxW=Math.min(layout==='hall'?9:8,cw-2),maxH=Math.min(layout==='hall'?8:7,ch-2),w=4+pick(maxW-3),h=4+pick(maxH-3);return {x:cols[col]+1+pick(cw-w-1),y:rows[row]+1+pick(ch-h-1),w,h};});
 const centers=rooms.map(r=>({x:r.x+Math.floor(r.w/2),y:r.y+Math.floor(r.h/2)})),grid=Array.from({length:height},()=>Array(width).fill(0)),roomTiles=grid.map(r=>r.map(()=>false));
 for(const r of rooms)for(let y=r.y;y<r.y+r.h;y++)for(let x=r.x;x<r.x+r.w;x++)if(layout!=='caves'||Math.hypot((x-r.x-r.w/2)/(r.w/2),(y-r.y-r.h/2)/(r.h/2))<1.15)grid[y][x]=Number(roomTiles[y][x]=true);
 const corridors=[];
 for(const [a,b]of links){const ca=chosen.indexOf(a),cb=chosen.indexOf(b),from=centers[ca],to=centers[cb],horizontal=Math.floor(a/4)===Math.floor(b/4),path=[];let {x,y}=from;
  const line=(axis,end)=>{while((axis==='x'?x:y)!==end){path.push({x,y});if(axis==='x')x+=Math.sign(end-x);else y+=Math.sign(end-y);}};
  // Bend in the solid gap, rather than drawing overlapping L-shaped room-centre routes.
  if(horizontal){const left=rooms[from.x<to.x?ca:cb],right=rooms[from.x<to.x?cb:ca],bend=left.x+left.w+pick(Math.max(1,right.x-left.x-left.w));line('x',bend);line('y',to.y);line('x',to.x);}
  else{const top=rooms[from.y<to.y?ca:cb],bottom=rooms[from.y<to.y?cb:ca],bend=top.y+top.h+pick(Math.max(1,bottom.y-top.y-top.h));line('y',bend);line('x',to.x);line('y',to.y);}
  path.push({x,y});const wide=rng()<WIDE_CORRIDOR_CHANCE;
  for(let i=0;i<path.length;i++){const p=path[i];grid[p.y][p.x]=1;if(wide){const next=path[i+1]||path[i-1]||p,nx=p.x+(next.y!==p.y?1:0),ny=p.y+(next.y===p.y?1:0);if(nx>0&&ny>0&&nx<width-1&&ny<height-1&&!roomTiles[ny][nx])grid[ny][nx]=1;}}
  corridors.push({wide,path});
 }
 const startIndex=pick(rooms.length),start=centers[startIndex],queue=[start],dist=new Map([[start.x+','+start.y,0]]);
 for(let i=0;i<queue.length;i++){const p=queue[i];for(const [dx,dy]of [[0,-1],[1,0],[0,1],[-1,0]]){const x=p.x+dx,y=p.y+dy,key=x+','+y;if(grid[y]?.[x]&&!dist.has(key)){dist.set(key,dist.get(p.x+','+p.y)+1);queue.push({x,y});}}}
 const end=centers.reduce((a,b)=>dist.get(a.x+','+a.y)>dist.get(b.x+','+b.y)?a:b);
 return {grid,rooms,start,end,corridors};
}
