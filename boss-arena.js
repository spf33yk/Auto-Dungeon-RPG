// Build all geometry from the map centre, reflecting complete pillar footprints.
export function bossArena(basement,width=47,height=35){
 const cx=Math.floor(width/2),cy=Math.floor(height/2),grid=Array.from({length:height},()=>Array(width).fill(0));
 const room={x:cx-10,y:cy-8,w:21,h:17};
 for(let y=room.y;y<room.y+room.h;y++)for(let x=room.x;x<room.x+room.w;x++)grid[y][x]=1;
 const pillars=[];
 const reflect=(x,y,w,h)=>{for(const px of new Set([x,2*cx-x-w+1]))for(const py of new Set([y,2*cy-y-h+1])){pillars.push({x:px,y:py,w,h});for(let dy=0;dy<h;dy++)for(let dx=0;dx<w;dx++)grid[py+dy][px+dx]=0;}};
 const offset=basement===20?6:basement===10?7:8,vertical=basement===1?6:5;
 reflect(cx-offset,cy-vertical,2,2);
 if(basement!==20)reflect(cx-4,cy-1,2,3);
 return {grid,rooms:[room],player:{x:cx,y:cy+8},stairs:{x:cx,y:cy-8},boss:{x:cx,y:cy},items:[{x:cx-8,y:cy,type:'heart'},{x:cx+8,y:cy,type:'heart'}],pillars};
}
