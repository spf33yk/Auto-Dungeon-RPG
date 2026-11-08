export const READABLE_PROP_FRAMES={heart:[0,0],fragment:[1,0],sword:[2,0],armor:[3,0],chest:[0,1],'chest-red':[1,1],stairs:[2,1],tombstone:[3,1],'tombstone-cracked':[0,2],reward:[1,2],letter:[2,2]};
const aliases={herb:'heart',potion:'heart',gear:'sword'};
export function drawReadableProp(ctx,atlas,type,x,y,size=64,height=size){
 const cell=READABLE_PROP_FRAMES[aliases[type]||type];if(!cell||!atlas.complete||atlas.naturalWidth!==256||atlas.naturalHeight!==192)return false;
 const scale=Math.min(size,height)/64,w=64*scale;ctx.imageSmoothingEnabled=false;ctx.drawImage(atlas,cell[0]*64,cell[1]*64,64,64,x+(size-w)/2,y+height-w,w,w);return true;
}
