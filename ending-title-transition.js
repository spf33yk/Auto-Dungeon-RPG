const BURN_START_MS=7000;
const TITLE_REVEALED_MS=9350;
const BURN_CLEANUP_MS=10600;
const TITLE_HOLD_MS=2400;
const MENU_FADE_MS=1000;

export function playEndingTitleTransition(title,onComplete){
 const overlay=document.createElement('div');
 overlay.className='ending-title-transition';
 overlay.dataset.step='ending';
 overlay.setAttribute('aria-hidden','true');
 const outgoing=document.createElement('div');
 outgoing.className='title-scene';
 const background=document.createElement('img');
 background.className='title-background';
 background.src=title.querySelector('#title-background').dataset.mukuro;
 const shade=document.createElement('div');
 shade.className='title-shade';
 const logoFrame=document.createElement('div');
 logoFrame.className='title-logo-frame';
 const logo=document.createElement('img');
 logo.className='title-logo';
 logo.src=title.querySelector('#title-logo').dataset.mukuro;
 logoFrame.append(logo);
 const effect=document.createElement('video');
 effect.className='title-fx is-screen-fallback';
 effect.src=title.querySelector('#title-fx').dataset.mukuroFallback;
 effect.muted=effect.loop=effect.playsInline=true;
 outgoing.append(background,shade,logoFrame,effect);
 const still=document.createElement('img');
 still.className='ending-title-still';
 still.src=title.dataset.endingStill;
 const flame=document.createElement('video');
 flame.src=title.dataset.endingFlame;
 flame.muted=flame.playsInline=true;
 flame.preload='auto';
 const surface=document.createElement('canvas');
 surface.className='ending-title-flame';
 surface.width=960;
 surface.height=540;
 overlay.append(outgoing,still,surface);
 title.dataset.endingTransition='playing';
 title.append(overlay);

 const playVideo=video=>video.play().catch(()=>{});
 const pixels=surface.getContext('2d',{willReadFrequently:true});
 const reveal=document.createElement('canvas');
 reveal.width=160;
 reveal.height=90;
 const mask=reveal.getContext('2d');
 const burned=mask.createImageData(reveal.width,reveal.height);
 const smoothed=mask.createImageData(reveal.width,reveal.height);
 const ignition = new Float64Array(reveal.width * reveal.height);
 let flameFrame,burnStartedAt;
 function drawFlame(now){
  const elapsed=now-burnStartedAt;
  surface.style.opacity=String(Math.max(0,Math.min(1,1-(elapsed-1850)/1500)));
  if(flame.readyState>=2){
   pixels.drawImage(flame,0,0,surface.width,surface.height);
   const frame=pixels.getImageData(0,0,surface.width,surface.height);
   const rgba=frame.data;
   for(let i=0;i<rgba.length;i+=4){
    const neutral=Math.max(rgba[i],rgba[i+1]);
    const blue=rgba[i+2];
    const coverage=Math.min(1,Math.max(0,(blue-neutral-4)/28));
    const low=Math.min(rgba[i],rgba[i+1],blue);
    const white=Math.min(1,Math.max(0,(low-165)/65)) *
     (1-Math.min(1,(Math.max(neutral,blue)-low)/38));
    const light=Math.min(1,Math.max(0,(Math.max(neutral,blue)-22)/52));
    rgba[i+3]=255*(1-coverage)*(1-white)*light;
    rgba[i+2]=blue-Math.max(0,blue-neutral)*coverage;
   }
   pixels.putImageData(frame,0,0);
   if(overlay.dataset.step==='burn'){
    for(let y=0;y<reveal.height;y++){
     for(let x=0;x<reveal.width;x++){
      const sample=((y*6+3)*surface.width+x*6+3)*4;
      const heat=rgba[sample]-rgba[sample+2];
      const cell=y*reveal.width+x;
      if(!ignition[cell]&&heat>24&&rgba[sample]>100&&rgba[sample+3]>100){
       ignition[cell]=Math.max(1,elapsed);
      }
      if(ignition[cell])burned.data[cell*4+3]=255*Math.min(1,Math.max(0,elapsed-ignition[cell])/1000);
     }
    }
    // Expand the revealed area slightly to close isolated holes between flame pixels.
    const finish=Math.min(1,Math.max(0,(elapsed-1350)/1000));
    for(let y=0;y<reveal.height;y++){
     for(let x=0;x<reveal.width;x++){
      let alpha=0;
      for(let dy=-2;dy<=2;dy++){
       const row=Math.min(reveal.height-1,Math.max(0,y+dy));
       for(let dx=-2;dx<=2;dx++){
        const column=Math.min(reveal.width-1,Math.max(0,x+dx));
        alpha=Math.max(alpha,burned.data[(row*reveal.width+column)*4+3]);
       }
      }
      smoothed.data[(y*reveal.width+x)*4+3]=255-(alpha+(255-alpha)*finish);
     }
    }
    mask.putImageData(smoothed,0,0);
    overlay.style.setProperty('--outgoing-mask','url('+reveal.toDataURL()+')');
   }
  }
  flameFrame=requestAnimationFrame(drawFlame);
 }
 function burn(){
  burnStartedAt=performance.now();
  if(flame.readyState)flame.currentTime=0;
  playVideo(flame);
  cancelAnimationFrame(flameFrame);
  flameFrame=requestAnimationFrame(drawFlame);
 }

 setTimeout(()=>overlay.dataset.step='black',800);
 setTimeout(()=>{
  playVideo(effect);
  overlay.dataset.step='mukuro';
 },3200);
 setTimeout(()=>{
  mask.fillStyle='black';
  mask.fillRect(0,0,reveal.width,reveal.height);
  overlay.style.setProperty('--outgoing-mask','url('+reveal.toDataURL()+')');
  overlay.dataset.step='burn';
  burn();
 },BURN_START_MS);
 setTimeout(()=>{
  outgoing.hidden=true;
  effect.pause();
 },TITLE_REVEALED_MS);
 setTimeout(()=>{
  cancelAnimationFrame(flameFrame);
  flame.pause();
  effect.pause();
  overlay.remove();
 },BURN_CLEANUP_MS);
 const menuStart=TITLE_REVEALED_MS+TITLE_HOLD_MS;
 setTimeout(()=>title.dataset.endingTransition='menu',menuStart);
 setTimeout(()=>{
  delete title.dataset.endingTransition;
  onComplete?.();
 },menuStart+MENU_FADE_MS);
}
