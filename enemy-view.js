import {monsters} from './data.js';
const indices=new Map(monsters.map((m,index)=>[m.id,index]));
export function enemyFrame(enemy){const id=enemy.spriteId||monsters.find(m=>m.id===(enemy.baseId||enemy.id))?.spriteId||enemy.baseId||enemy.id,index=indices.get(id);return index===undefined?null:{x:index%5*64,y:Math.floor(index/5)*64,width:64,height:64};}
export function drawEnemySprite(ctx,atlas,enemy,box){const frame=enemyFrame(enemy);if(!frame||!atlas.complete||atlas.naturalWidth!==320||atlas.naturalHeight!==320)return false;ctx.imageSmoothingEnabled=false;ctx.drawImage(atlas,frame.x,frame.y,64,64,box.x,box.y,box.width,box.height);return true;}
export function enemyHealth(enemy){const max=Number.isFinite(enemy.maxHp)&&enemy.maxHp>0?enemy.maxHp:Math.max(1,Number.isFinite(enemy.hp)?enemy.hp:1),hp=Math.max(0,Math.min(max,Number.isFinite(enemy.hp)?enemy.hp:0));return {hp,max,ratio:hp/max};}
// Labels are an overlay after world depth sorting, so walls and actors cannot cover them.
export function layoutEnemyLabels(enemies,size=64){const boxes=[];return [...enemies].sort((a,b)=>a.y-b.y||a.x-b.x).map(enemy=>{const width=Math.max(enemy.boss?76:56,Array.from(enemy.name).length*11+(enemy.boss?20:4)),box={x:(enemy.x+.5)*size-width/2,y:enemy.y*size-34,width,height:enemy.boss?46:29};let offset=0;while(boxes.some(b=>box.x<b.x+b.width&&box.x+box.width>b.x&&box.y<b.y+b.height&&box.y+box.height>b.y)&&offset>-260){offset-=30;box.y-=30;}boxes.push(box);return {enemy,offset};});}
export function drawEnemyLabel(ctx,enemy,size=64,offset=0){
 const health=enemyHealth(enemy),width=enemy.boss?72:52,x=(enemy.x+.5)*size-width/2,y=enemy.y*size-16+offset;
 ctx.save();ctx.globalAlpha=1;ctx.textAlign='center';ctx.textBaseline='bottom';ctx.font=(enemy.boss?'bold ':'')+'11px sans-serif';ctx.lineWidth=3;ctx.strokeStyle='#090c10';ctx.fillStyle=enemy.boss?'#f2d48a':'#f0e9d9';const name=(enemy.boss?'◆ ':'')+enemy.name;
 ctx.strokeText(name,x+width/2,y-3);ctx.fillText(name,x+width/2,y-3);
 ctx.fillStyle='#080c10';ctx.fillRect(x-1,y,width+2,9);ctx.fillStyle=enemy.boss?'#bf9b54':'#746b63';ctx.fillRect(x,y+1,width,7);ctx.fillStyle='#351e23';ctx.fillRect(x+1,y+2,width-2,5);ctx.fillStyle=health.ratio<=.25?'#ed6f67':health.ratio<=.5?'#deb56b':'#a5bc7c';ctx.fillRect(x+1,y+2,Math.round((width-2)*health.ratio),5);
 if(enemy.boss){ctx.font='9px sans-serif';ctx.fillStyle='#f4e7c5';ctx.textBaseline='top';ctx.strokeText(`${health.hp} / ${health.max}`,x+width/2,y+11);ctx.fillText(`${health.hp} / ${health.max}`,x+width/2,y+11);}ctx.restore();
}
