// Procedural forgetting mist: approved center variant, no new bitmap or game RNG.
export const FOG_EFFECT={width:160,height:90,frameMs:50,periodMs:6400,dust:6};
const DARK=[64,88,111],LIGHT=[157,178,189],RIBBON=[151,178,194];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const noiseGrid=Float32Array.from({length:32*24},(_,i)=>{let n=Math.imul(i+81110,0x45d9f3b);n^=n>>>16;return (n>>>0)/4294967295;});
function noise(x,y){const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,at=(a,b)=>noiseGrid[((b%24+24)%24)*32+(a%32+32)%32],u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);return (at(ix,iy)*(1-u)+at(ix+1,iy)*u)*(1-v)+(at(ix,iy+1)*(1-u)+at(ix+1,iy+1)*u)*v;}
export function fogPixels(time,{width=FOG_EFFECT.width,height=FOG_EFFECT.height,center={x:.5,y:.5},reducedMotion=false}={}){
 const pixels=new Uint8ClampedArray(width*height*4),phase=reducedMotion?0:(Math.max(0,time)%FOG_EFFECT.periodMs)/FOG_EFFECT.periodMs*Math.PI*2,h=216,cx=center.x*384,cy=center.y*h;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const u=x/width*384,v=y/height*h,n=noise(u/16+.5*Math.sin(phase),v/16+.2*Math.cos(phase)),protect=1-.68*Math.exp(-((u-cx)**2+(v-cy)**2)/(2*48**2)),band=Math.max(0,(.5+.5*Math.sin(v/22+.45*Math.sin(u/82-phase)+phase))-.48)/.52,curl=Math.max(0,Math.sin(v/34+u/160+phase+.9*Math.sin(u/60+phase))-.62)/.38,filament=Math.exp(-(((v-(h*.50+20*Math.sin(u/84+phase)))/13)**2))+.7*Math.exp(-(((v-(h*.20+14*Math.sin(u/108-phase)))/10)**2)),a=clamp((.05+.55*band*n+.16*curl*n)*protect,0,.65),b=.38*curl*(.4+n*.6)*protect,c=clamp(.24*filament*(.5+n*.5)*protect,0,.5),alpha=1-(1-a)*(1-b)*(1-c),p=(y*width+x)*4;
  for(let k=0;k<3;k++)pixels[p+k]=(DARK[k]*a*(1-b)*(1-c)+LIGHT[k]*b*(1-c)+RIBBON[k]*c)/alpha;pixels[p+3]=alpha*255;
 }
 return pixels;
}
export function createFogEffect({createCanvas=()=>document.createElement('canvas')}={}){let canvas=null,key='',lastCenter=null;return {draw(ctx,{width,height,time,center={x:width/2,y:height/2},reducedMotion=false}){
 if(!canvas){canvas=createCanvas();canvas.width=FOG_EFFECT.width;canvas.height=FOG_EFFECT.height;}
 const normalized={x:clamp(center.x/width,0,1),y:clamp(center.y/height,0,1)},stamp=reducedMotion?'static':Math.floor(time/FOG_EFFECT.frameMs),next=[stamp,Math.round(normalized.x*100),Math.round(normalized.y*100)].join(':');
 if(next!==key){key=next;lastCenter=normalized;const c=canvas.getContext('2d'),image=c.createImageData(canvas.width,canvas.height);image.data.set(fogPixels(reducedMotion?0:time,{center:normalized,reducedMotion}));c.putImageData(image,0,0);}
 ctx.save();ctx.globalAlpha=1;ctx.imageSmoothingEnabled=true;ctx.drawImage(canvas,0,0,width,height);
 if(!reducedMotion){const phase=Math.max(0,time)/FOG_EFFECT.periodMs*Math.PI*2;for(let i=0;i<FOG_EFFECT.dust;i++){const q=(phase/(Math.PI*2)+i/FOG_EFFECT.dust)%1,x=((i*71+23+12*Math.sin(phase+i))%384)/384*width,y=(236-q*256)/216*height;ctx.globalAlpha=.23*Math.sin(q*Math.PI);ctx.fillStyle='#96b0bf';ctx.fillRect(x,y,Math.max(1,width/384),Math.max(1,height/108));}}
 ctx.restore();return {width:canvas.width,height:canvas.height,center:lastCenter};
 }};}
