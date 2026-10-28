export const WALL_RISE=.5;
export function standingBox(x,y,size=24,stretch=1.18){return {x:x*size,y:(y+1)*size-size*stretch,width:size,height:size*stretch,footY:(y+1)*size};}
export function sortByFoot(objects){return [...objects].sort((a,b)=>a.footY-b.footY||(a.layer??0)-(b.layer??0)||(a.x??0)-(b.x??0));}
export function foregroundWallOpacity(x,y,hero,size=24){const box=standingBox(hero.x,hero.y,size);return y>hero.y&&y<=hero.y+1.6&&x*size<box.x+box.width&&(x+1)*size>box.x ? .48 : 1;}
export function drawFootShadow(ctx,x,y,size=24){ctx.save();ctx.fillStyle='#07100d66';ctx.beginPath();ctx.ellipse((x+.5)*size,(y+.88)*size,size*.29,size*.09,0,0,Math.PI*2);ctx.fill();ctx.restore();}
