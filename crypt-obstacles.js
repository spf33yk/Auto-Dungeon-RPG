const directions=[[0,-1],[1,0],[0,1],[-1,0]],key=p=>p.x+','+p.y;
function rank(x,y,seed,floor){let h=Math.imul(x+1,73856093)^Math.imul(y+1,19349663)^(seed|0)^Math.imul(floor,83492791);h^=h>>>13;h=Math.imul(h,0x5bd1e995);return(h^(h>>>15))>>>0;}
function connected(grid,start){const q=[start],seen=new Set([key(start)]);for(let i=0;i<q.length;i++)for(const [dx,dy]of directions){const p={x:q[i].x+dx,y:q[i].y+dy};if(grid[p.y]?.[p.x]&&!seen.has(key(p))){seen.add(key(p));q.push(p);}}return seen.size===grid.flat().filter(Boolean).length;}
// Called only for a newly generated crypt, after enemies, drops and traps are placed.
export function placeCryptObstacles(s,rooms){
 s.obstacles=[];const occupied=new Set([s.player,s.stairs,...s.items,...s.enemies,...s.traps].map(key));
 for(const r of rooms){const candidates=[];
  for(let y=r.y+1;y<r.y+r.h-1;y++)for(let x=r.x+1;x<r.x+r.w-1;x++){
   if(occupied.has(x+','+y)||Math.max(Math.abs(x-s.player.x),Math.abs(y-s.player.y))<=1||Math.abs(x-s.stairs.x)+Math.abs(y-s.stairs.y)<2)continue;
   let open=true;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(!s.grid[y+dy]?.[x+dx])open=false;
   if(open)candidates.push({x,y,rank:rank(x,y,s.seed,s.floor)});
  }
  candidates.sort((a,b)=>a.rank-b.rank||a.y-b.y||a.x-b.x);
  for(const p of candidates){s.grid[p.y][p.x]=0;if(!connected(s.grid,s.player)){s.grid[p.y][p.x]=1;continue;}
   s.obstacles.push({x:p.x,y:p.y,type:'tombstone',variant:p.rank&1});break;
  }
 }
 return s.obstacles;
}
export function validCryptObstacles(s){
 if(s.obstacles===undefined)return true;
 if(!Array.isArray(s.obstacles)||s.obstacles.length>6)return false;
 if(s.obstacles.length&&(s.floor>5||s.bossFloor))return false;
 const occupied=new Set([s.player,s.stairs,...s.items,...s.enemies,...(s.traps||[])].filter(Boolean).map(key)),seen=new Set();
 for(const p of s.obstacles){if(!p||p.type!=='tombstone'||![0,1].includes(p.variant)||!Number.isInteger(p.x)||!Number.isInteger(p.y)||p.x<=0||p.y<=0||p.y>=s.grid.length-1||p.x>=s.grid[0].length-1||s.grid[p.y][p.x]!==0||occupied.has(key(p))||seen.has(key(p)))return false;seen.add(key(p));}
 return true;
}
