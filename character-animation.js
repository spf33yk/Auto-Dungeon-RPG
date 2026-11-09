export const CHARACTER_DIRECTIONS=['south','west','east','north'];
export function directionTo(dx,dy,previous=0){
 if(!Number.isFinite(dx)||!Number.isFinite(dy)||dx===0&&dy===0)return previous;
 if(Math.abs(dx)===Math.abs(dy))return previous;
 return Math.abs(dx)>Math.abs(dy)?dx<0?1:2:dy<0?3:0;
}
export function validateCharacterSheet(d){
 if(d?.format==='character-front-actions'){
  if(d.version!==1||!Number.isInteger(d.tileSize)||d.tileSize!==64||d.columns!==5||d.rows!==4||d.width!==320||d.height!==256||typeof d.id!=='string'||!d.id||typeof d.image!=='string'||!d.image||typeof d.directionsImage!=='string'||!d.directionsImage||d.directionsWidth!==256||d.directionsHeight!==64)throw Error('Invalid front-action layout');
  if(!Array.isArray(d.anchor)||d.anchor.length!==2||d.anchor.some(v=>!Number.isFinite(v)||v<0||v>d.tileSize)||!Number.isFinite(d.displayScale)||d.displayScale<=0||d.displayScale>2)throw Error('Invalid character anchor or scale');
  for(const name of ['idle','move','attackA','attackB','death']){const clip=d.clips?.[name];if(!clip||!Array.isArray(clip.cells)||!clip.cells.length||clip.cells.length!==clip.durationsMs?.length||clip.cells.some(([x,y])=>!Number.isInteger(x)||!Number.isInteger(y)||x<0||x>=5||y<0||y>=4)||clip.durationsMs.some(ms=>!Number.isInteger(ms)||ms<=0))throw Error('Invalid character clip: '+name);}
  return d;
 }
 if(!['character-4dir','character-minimal-4dir'].includes(d?.format)||d.version!==1||!Number.isInteger(d.tileSize)||d.tileSize<8||d.tileSize>256||!(d.columns===3||d.format==='character-minimal-4dir'&&d.columns===4)||d.rows!==4||JSON.stringify(d.directions)!==JSON.stringify(CHARACTER_DIRECTIONS))throw Error('Invalid character-4dir layout');
 if(typeof d.id!=='string'||!d.id||typeof d.image!=='string'||!d.image||d.width!==d.tileSize*d.columns||d.height!==d.tileSize*4)throw Error('Invalid character image definition');
 if(!Array.isArray(d.anchor)||d.anchor.length!==2||d.anchor.some(v=>!Number.isFinite(v)||v<0||v>d.tileSize)||!Number.isFinite(d.displayScale)||d.displayScale<=0||d.displayScale>2)throw Error('Invalid character anchor or scale');
 if(d.format==='character-minimal-4dir'){
  const a=d.animation,e=d.effect,p=d.portrait;
  if(!a||['idleStepMs','moveStepMs','attackMs','deathMs'].some(k=>!Number.isFinite(a[k])||a[k]<=0)||!Number.isFinite(a.lungePx)||a.lungePx<0||a.lungePx>d.tileSize/4)throw Error('Invalid minimal character animation');
  if(d.columns===4&&(!Array.isArray(a.cycleDurationsMs)||a.cycleDurationsMs.length!==4||a.cycleDurationsMs.some(ms=>!Number.isInteger(ms)||ms<=0)))throw Error('Invalid four-pose character cycle');
  if(!Array.isArray(p)||p.length!==4||p.some(v=>!Number.isInteger(v)||v<0)||!p[2]||!p[3]||p[0]+p[2]>d.tileSize||p[1]+p[3]>d.tileSize)throw Error('Invalid character portrait');
  if(!e||typeof e.image!=='string'||!e.image||!Number.isInteger(e.tileSize)||e.tileSize<8||e.tileSize>256||e.columns!==3||e.rows!==4||e.width!==e.tileSize*3||e.height!==e.tileSize*4||!Array.isArray(e.anchor)||e.anchor.length!==2||e.anchor.some(v=>!Number.isFinite(v)||v<0||v>e.tileSize)||!Number.isFinite(e.forwardPx)||e.forwardPx<0||!Number.isFinite(e.heightPx)||e.heightPx<0)throw Error('Invalid character effect');
 }
 return d;
}
export function characterFrame(d,direction,frame){
 if(d.format==='character-front-actions')return {x:frame*d.tileSize,y:0,width:d.tileSize,height:d.tileSize};
 if(!Number.isInteger(direction)||direction<0||direction>3||!Number.isInteger(frame)||frame<0||frame>=d.columns)throw Error('Invalid character direction/frame');
 return {x:frame*d.tileSize,y:direction*d.tileSize,width:d.tileSize,height:d.tileSize};
}
export function characterActionFrame(d,sample){
 if(d.format==='character-minimal-4dir'){
  if(d.columns===4){
   let pose=0;
   if(!sample.reducedMotion&&sample.state!=='dead'&&sample.state!=='attacking'){
    const durations=d.animation.cycleDurationsMs,total=durations.reduce((a,b)=>a+b,0);
    let elapsed=Math.max(0,sample.cycleElapsed??sample.elapsed)%total;
    while(pose<durations.length-1&&elapsed>=durations[pose])elapsed-=durations[pose++];
   }
   return characterFrame(d,sample.direction,pose);
  }
  const pose=sample.reducedMotion||sample.state==='dead'?0:sample.state==='attacking'?(sample.progress<.35?2:0):[0,1,2,1][Math.floor(sample.elapsed/(sample.state==='moving'?d.animation.moveStepMs:d.animation.idleStepMs))%4];
  return characterFrame(d,sample.direction,pose);
 }
 if(d.format!=='character-front-actions')return characterFrame(d,sample.direction,sample.frame);
 const name=sample.state==='attacking'?(sample.attackVariant?'attackB':'attackA'):sample.state==='moving'?'move':sample.state==='dead'?'death':'idle';
 const clip=d.clips[name],total=clip.durationsMs.reduce((a,b)=>a+b,0),elapsed=sample.reducedMotion?0:sample.state==='moving'||sample.state==='attacking'?Math.min(total-1,Math.floor(sample.progress*total)):sample.state==='dead'?Math.min(total-1,sample.elapsed):sample.elapsed%total;
 let remaining=elapsed,index=0;while(index<clip.durationsMs.length-1&&remaining>=clip.durationsMs[index])remaining-=clip.durationsMs[index++];
 const [col,row]=clip.cells[index];return {x:col*d.tileSize,y:row*d.tileSize,width:d.tileSize,height:d.tileSize};
}
export function characterDrawBox(x,y,d,size=24){const scale=size/d.tileSize*d.displayScale;return {x:(x+.5)*size-d.anchor[0]*scale,y:(y+1)*size-d.anchor[1]*scale,width:d.tileSize*scale,height:d.tileSize*scale,footY:(y+1)*size};}
export function characterAttackDuration(d,speed=1){const slow=Number.isFinite(speed)&&speed>0?Math.min(1,speed):1;return Math.round((d?.format==='character-minimal-4dir'?Math.min(d.animation.attackMs,420/Math.max(1,Number.isFinite(speed)?speed:1)*.8):300)/slow);}
export function characterPresentation(d,sample,size=24){
 const visual={offsetX:0,offsetY:0,opacity:1,effectFrame:-1,effectOpacity:0};
 if(d?.format!=='character-minimal-4dir')return visual;
 if(sample.state==='dead'){visual.opacity=sample.reducedMotion?0:Math.max(0,1-sample.elapsed/d.animation.deathMs);return visual;}
 if(sample.state!=='attacking')return visual;
 const p=Math.max(0,Math.min(1,sample.progress)),scale=size/d.tileSize*d.displayScale,[dx,dy]=[[0,1],[-1,0],[1,0],[0,-1]][sample.direction];
 const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
 const advance=p<.35?smooth((p-.15)/.2):p<.55?1:1-smooth((p-.55)/.45);
 const distance=sample.reducedMotion?0:d.animation.lungePx*scale*advance;
 visual.offsetX=dx*distance||0;visual.offsetY=dy*distance||0;
 if(p>=.25&&p<.75){visual.effectFrame=sample.reducedMotion?1:Math.min(2,Math.floor((p-.25)/.5*3));visual.effectOpacity=Math.min(1,(.75-p)/.1);}
 return visual;
}
export class CharacterAnimation{
 constructor({x=0,y=0,direction=0,idleMs=240,moveMs=180,attackMs=140}={}){
  if(![x,y,idleMs,moveMs,attackMs].every(Number.isFinite)||Math.min(idleMs,moveMs,attackMs)<=0||!Number.isInteger(direction)||direction<0||direction>3)throw Error('Invalid character animation state');
  Object.assign(this,{x,y,direction,idleMs,moveMs,attackMs,state:'idle',since:0,until:0,idleFrame:0,stepStart:0,nextStep:0,attackVariant:0,attackCount:0});
 }
 faceTo(x,y){this.direction=directionTo(x-this.x,y-this.y,this.direction);return this.direction;}
 teleport(x,y,time=0){if(![x,y,time].every(Number.isFinite))throw Error('Invalid character position');Object.assign(this,{x,y,state:'idle',since:time,until:time,idleFrame:0,stepStart:0,nextStep:0});}
 moveTo(x,y,time,duration=this.moveMs){
  if(![x,y,time,duration].every(Number.isFinite)||duration<=0)throw Error('Invalid character movement');
  if(x===this.x&&y===this.y)return;
  this.faceTo(x,y);this.stepStart=this.nextStep;this.nextStep=1-this.nextStep;Object.assign(this,{x,y,state:'moving',since:time,until:time+duration});
 }
 attackTo(x,y,time,duration=this.attackMs){if(![x,y,time,duration].every(Number.isFinite)||duration<=0)throw Error('Invalid character attack');this.faceTo(x,y);Object.assign(this,{state:'attacking',since:time,until:time+duration,attackVariant:this.attackCount++%2});}
 die(time){if(!Number.isFinite(time))throw Error('Invalid death time');Object.assign(this,{state:'dead',since:time,until:Infinity});}
 sample(time,{reducedMotion=false}={}){
  if(!Number.isFinite(time))throw Error('Invalid animation time');
  if(this.state!=='idle'&&this.state!=='dead'&&time>=this.until){this.idleFrame=this.state==='moving'?1-this.stepStart:0;this.state='idle';this.since=this.until;}
  const elapsed=Math.max(0,time-this.since),interval=this.state==='moving'?(this.until-this.since)/2:this.idleMs;
  const frame=this.state==='attacking'?2:reducedMotion?0:((this.state==='moving'?this.stepStart:this.idleFrame)+Math.floor(elapsed/interval))%2;
  return {x:this.x,y:this.y,direction:this.direction,state:this.state,frame,elapsed,progress:this.state==='moving'||this.state==='attacking'?Math.min(1,elapsed/(this.until-this.since)):0,attackVariant:this.attackVariant,reducedMotion};
 }
}
export async function loadCharacterSheet(source,{baseURL=globalThis.document?.baseURI,fetcher=globalThis.fetch,imageFactory=()=>new Image()}={}){
 const url=new URL(source,baseURL),response=await fetcher(url);if(!response.ok)throw Error('Character definition failed: '+response.status);
 const definition=validateCharacterSheet(await response.json()),image=imageFactory();image.src=new URL(definition.image,url).href;await image.decode();if(image.naturalWidth!==definition.width||image.naturalHeight!==definition.height)throw Error('Character image dimensions do not match definition');
 let directionImage=null;if(definition.directionsImage){directionImage=imageFactory();directionImage.src=new URL(definition.directionsImage,url).href;await directionImage.decode();if(directionImage.naturalWidth!==definition.directionsWidth||directionImage.naturalHeight!==definition.directionsHeight)throw Error('Character direction image dimensions do not match definition');}
 let effectImage=null;if(definition.effect){effectImage=imageFactory();effectImage.src=new URL(definition.effect.image,url).href;await effectImage.decode();if(effectImage.naturalWidth!==definition.effect.width||effectImage.naturalHeight!==definition.effect.height)throw Error('Character effect dimensions do not match definition');}
 return {definition,image,directionImage,effectImage};
}
export function drawCharacter(ctx,sheet,sample,x=sample.x,y=sample.y,size=24){
 const d=sheet?.definition,image=sheet?.image;if(!d||!image||image.complete===false||(image.naturalWidth??image.width)!==d.width||(image.naturalHeight??image.height)!==d.height)return false;
 if(d.format==='character-minimal-4dir'){
  const f=characterActionFrame(d,sample),v=characterPresentation(d,sample,size),box=characterDrawBox(x,y,d,size),scale=size/d.tileSize*d.displayScale;
  ctx.save();ctx.globalAlpha=(ctx.globalAlpha??1)*v.opacity;ctx.imageSmoothingEnabled=false;
  ctx.drawImage(image,f.x,f.y,f.width,f.height,box.x+v.offsetX,box.y+v.offsetY,box.width,box.height);
  const e=d.effect,fx=sheet.effectImage;
  if(v.effectFrame>=0&&fx&&fx.complete!==false&&(fx.naturalWidth??fx.width)===e.width&&(fx.naturalHeight??fx.height)===e.height){
   const [dx,dy]=[[0,1],[-1,0],[1,0],[0,-1]][sample.direction],cx=(x+.5)*size+v.offsetX+dx*e.forwardPx*scale,cy=(y+1)*size+v.offsetY-e.heightPx*scale+dy*e.forwardPx*scale;
   ctx.globalAlpha*=v.effectOpacity;ctx.drawImage(fx,v.effectFrame*e.tileSize,sample.direction*e.tileSize,e.tileSize,e.tileSize,cx-e.anchor[0]*scale,cy-e.anchor[1]*scale,e.tileSize*scale,e.tileSize*scale);
  }
  ctx.restore();return true;
 }
 const directional=d.format==='character-front-actions'&&sample.direction>0&&sample.state!=='dead',source=directional?sheet.directionImage:image;if(directional&&(!source||(source.naturalWidth??source.width)!==d.directionsWidth))return false;
 const f=directional?{x:sample.direction*d.tileSize,y:0,width:d.tileSize,height:d.tileSize}:characterActionFrame(d,sample),box=characterDrawBox(x,y,d,size);ctx.imageSmoothingEnabled=false;ctx.drawImage(source,f.x,f.y,f.width,f.height,box.x,box.y,box.width,box.height);return true;
}

// Idle stepping is independent of paused movement/combat clocks and never changes actor state.
export function idleFootstepSample(sample,time,resting=false){return resting?{...sample,state:'idle',progress:0,elapsed:time,cycleElapsed:time}:{...sample,cycleElapsed:time};}
