export const CHARACTER_DIRECTIONS=['south','west','east','north'];
export function directionTo(dx,dy,previous=0){
 if(!Number.isFinite(dx)||!Number.isFinite(dy)||dx===0&&dy===0)return previous;
 if(Math.abs(dx)===Math.abs(dy))return previous;
 return Math.abs(dx)>Math.abs(dy)?dx<0?1:2:dy<0?3:0;
}
export function validateCharacterSheet(d){
 if(d?.format!=='character-4dir'||d.version!==1||!Number.isInteger(d.tileSize)||d.tileSize<8||d.tileSize>256||d.columns!==3||d.rows!==4||JSON.stringify(d.directions)!==JSON.stringify(CHARACTER_DIRECTIONS))throw Error('Invalid character-4dir layout');
 if(typeof d.id!=='string'||!d.id||typeof d.image!=='string'||!d.image||d.width!==d.tileSize*3||d.height!==d.tileSize*4)throw Error('Invalid character image definition');
 if(!Array.isArray(d.anchor)||d.anchor.length!==2||d.anchor.some(v=>!Number.isFinite(v)||v<0||v>d.tileSize)||!Number.isFinite(d.displayScale)||d.displayScale<=0||d.displayScale>2)throw Error('Invalid character anchor or scale');
 return d;
}
export function characterFrame(d,direction,frame){
 if(!Number.isInteger(direction)||direction<0||direction>3||!Number.isInteger(frame)||frame<0||frame>2)throw Error('Invalid character direction/frame');
 return {x:frame*d.tileSize,y:direction*d.tileSize,width:d.tileSize,height:d.tileSize};
}
export function characterDrawBox(x,y,d,size=24){const scale=size/d.tileSize*d.displayScale;return {x:(x+.5)*size-d.anchor[0]*scale,y:(y+1)*size-d.anchor[1]*scale,width:d.tileSize*scale,height:d.tileSize*scale,footY:(y+1)*size};}
export class CharacterAnimation{
 constructor({x=0,y=0,direction=0,idleMs=240,moveMs=180,attackMs=140}={}){
  if(![x,y,idleMs,moveMs,attackMs].every(Number.isFinite)||Math.min(idleMs,moveMs,attackMs)<=0||!Number.isInteger(direction)||direction<0||direction>3)throw Error('Invalid character animation state');
  Object.assign(this,{x,y,direction,idleMs,moveMs,attackMs,state:'idle',since:0,until:0});
 }
 faceTo(x,y){this.direction=directionTo(x-this.x,y-this.y,this.direction);return this.direction;}
 teleport(x,y,time=0){if(![x,y,time].every(Number.isFinite))throw Error('Invalid character position');Object.assign(this,{x,y,state:'idle',since:time,until:time});}
 moveTo(x,y,time,duration=this.moveMs){
  if(![x,y,time,duration].every(Number.isFinite)||duration<=0)throw Error('Invalid character movement');
  if(x===this.x&&y===this.y)return;
  this.faceTo(x,y);Object.assign(this,{x,y,state:'moving',since:time,until:time+duration});
 }
 attackTo(x,y,time,duration=this.attackMs){if(![x,y,time,duration].every(Number.isFinite)||duration<=0)throw Error('Invalid character attack');this.faceTo(x,y);Object.assign(this,{state:'attacking',since:time,until:time+duration});}
 sample(time,{reducedMotion=false}={}){
  if(!Number.isFinite(time))throw Error('Invalid animation time');
  if(this.state!=='idle'&&time>=this.until){this.state='idle';this.since=this.until;}
  const elapsed=Math.max(0,time-this.since),interval=this.state==='moving'?(this.until-this.since)/2:this.idleMs;
  const frame=this.state==='attacking'?2:reducedMotion?0:Math.floor(elapsed/interval)%2;
  return {x:this.x,y:this.y,direction:this.direction,state:this.state,frame};
 }
}
export async function loadCharacterSheet(source,{baseURL=globalThis.document?.baseURI,fetcher=globalThis.fetch,imageFactory=()=>new Image()}={}){
 const url=new URL(source,baseURL),response=await fetcher(url);if(!response.ok)throw Error('Character definition failed: '+response.status);
 const definition=validateCharacterSheet(await response.json()),image=imageFactory();image.src=new URL(definition.image,url).href;await image.decode();if(image.naturalWidth!==definition.width||image.naturalHeight!==definition.height)throw Error('Character image dimensions do not match definition');return {definition,image};
}
export function drawCharacter(ctx,sheet,sample,x=sample.x,y=sample.y,size=24){
 const d=sheet?.definition,image=sheet?.image;if(!d||!image||image.complete===false||(image.naturalWidth??image.width)!==d.width||(image.naturalHeight??image.height)!==d.height)return false;
 const f=characterFrame(d,sample.direction,sample.frame),box=characterDrawBox(x,y,d,size);ctx.imageSmoothingEnabled=false;ctx.drawImage(image,f.x,f.y,f.width,f.height,box.x,box.y,box.width,box.height);return true;
}
