import{installHoverHelp}from'./hover-help.js';
import{THEME_IMAGES}from'./augment-art.js';
import{skillSetActive}from'./set-bonuses.js';
import{setRibbon,themeIcon,skillTitle}from'./theme-view.js';
import{installTacticsUi}from'./tactics-ui.js';
import{compareForecast,createPreparationBaseline}from'./forecast-comparison.js';
import {screenTutorials} from './screen-tutorial.js';
import{augmentCard,augmentChip}from'./augment-view.js';
import{augments,augmentById,chooseAugment}from'./augments.js';
import {SubtitlePlayer} from './subtitle-player.js';
import {SceneMusic,musicScene} from './scene-music.js';
import {normalEndingLines} from './normal-ending.js';
import {awakeningLines} from './awakening.js';
import{cardCodexRows}from'./card-catalog.js';
import{chestPresentation,drawLegendaryChestEffect}from'./chest-view.js';
import {drawEnemySprite,drawEnemyLabel,layoutEnemyLabels} from './enemy-view.js';
import {skinById,nextPreparationSkin} from './preparation-skins.js';
import {CharacterAnimation,loadCharacterSheet,drawCharacter,characterFrame,characterPresentation,characterAttackDuration} from './character-animation.js';
import {loadWallTilesets,wallDrawBox} from './wall-tileset.js';
import {entranceWallFrames} from './entrance-view.js';
import {readUiSettings,saveUiSettings} from './ui-settings.js';
import {forecastExploration,forecastSignature} from './exploration-forecast.js';
import {forecastSummary} from './forecast-view.js';
import {MEMORY_SHADE,floorLight,drawSightWall,actorFootOffset,renderSightState} from './scene-lighting.js';
import {standingBox,sceneDrawOrder,drawFootShadow} from './scene-depth.js';
import {drawProp,drawMapProp} from './prop-view.js';
import {drawFloorTexture,drawRaisedWall} from './terrain-view.js';
import {requestLandscapeDisplay,sceneLayout} from './display-mode.js';
import {openingVariant,TRUE_END_UNIMPLEMENTED_NOTICE} from './opening.js';
import {createLogVisibility} from './log-visibility.js';
import {queueDamage,damageFrame} from './damage-view.js';
import {renderCardEditor,handleCardClick,handleCardChange,installCardDragging} from './card-editor.js';
import {autoMapModel,cameraFor,cameraSight,miniMapGeometry,drawMiniMap} from './map-view.js';
import {thoughtText} from './thought-view.js';
import {displayStoryText,openingThought,letterFloorThought} from './story-text.js';
import {memoryGroups} from './skill-tree.js';
import {debugJump,debugHeal,debugShards,debugSkills,debugEquipment,debugTitleEnding} from './debug-tools.js';
import {W,H,skills,newGame,abandonRun,stats,price,upgrade,equip,equipBest,tick,ascend,zoneFor,floorLabel,radius,canSee,gearById,gearStats,gearName,discard,locked,codexRows,sortedInventory,normalizeSave,orderDefinitions,orderById,orderCapacity,cardCapacity,orderUnlocked,addOrder,editOrder,beginExploration,equipment,LAST_FLOOR,LETTER_FLOOR,nextStageHint,rewardDefinitions,grantReward,experienceToNext,MAX_LEVEL,HP_PER_LEVEL,gainExperience} from './engine.js';
const $=id=>document.getElementById(id), key='abyss-normal-v2';
let uiStorage;try{uiStorage=localStorage;}catch{}let uiSettings=readUiSettings(uiStorage);document.documentElement.dataset.minimapSize=uiSettings.minimap;$('minimap-size').value=uiSettings.minimap;$('skip-opening').checked=uiSettings.skipOpening;
function applyPreparationSkin(){const skin=skinById(uiSettings.preparationSkin);document.documentElement.dataset.preparationSkin=skin.id;for(const [key,value]of Object.entries(skin))if(['accent','edge','panel','text'].includes(key))document.documentElement.style.setProperty('--prep-theme-'+key,value);$('preparation-skin').textContent='スキン：'+skin.name;$('preparation-skin').title='次のスキン：'+nextPreparationSkin(skin.id).name;}
applyPreparationSkin();$('preparation-skin').onclick=()=>{uiSettings=saveUiSettings(uiStorage,{...uiSettings,preparationSkin:nextPreparationSkin(uiSettings.preparationSkin).id});applyPreparationSkin();};
const bgm=new SceneMusic($('scene-bgm'),$('scene-bgm').dataset);
let endingPreview=false,endingPlayback=null,subtitlePreviewKind='first-end',musicAudition=null;
function syncSceneMusic(){bgm.configure({enabled:uiSettings.bgmEnabled,volume:uiSettings.bgmVolume,hidden:document.hidden});bgm.select(musicAudition||(endingPreview?(subtitlePreviewKind.endsWith('intro')?'opening':'ending'):musicScene(state,{title:showingTitle,teaser:Boolean(pendingJourney)}))); }
function paintMusicOptions(){$('bgm-toggle').textContent='BGM：'+(uiSettings.bgmEnabled?'ON':'OFF');$('bgm-toggle').setAttribute('aria-pressed',String(uiSettings.bgmEnabled));$('bgm-volume').value=uiSettings.bgmVolume;$('bgm-volume-value').textContent=uiSettings.bgmVolume+'%';}
paintMusicOptions();document.addEventListener('pointerdown',()=>bgm.unlock(),{capture:true});document.addEventListener('keydown',()=>bgm.unlock(),{capture:true});document.addEventListener('visibilitychange',()=>syncSceneMusic());
function renderNormalEnding(){
 const active=endingPreview||(!showingTitle&&state.phase==='ending');document.body.classList.toggle('ending-cinema',active);$('normal-ending').hidden=!active;
 if(!active){endingPlayback=null;return;}
 const intro=endingPreview&&subtitlePreviewKind.endsWith('intro'),clears=endingPreview?(subtitlePreviewKind.startsWith('later')?2:1):state.profile.normalClears;
 const key=endingPreview?'preview:'+subtitlePreviewKind:state.seed+':'+clears;if(endingPlayback?.key!==key)endingPlayback={key,player:new SubtitlePlayer(intro?awakeningLines(clears>1?1:0):normalEndingLines(clears)),last:performance.now()};
 const player=endingPlayback.player,done=player.done;$('normal-ending').classList.toggle('is-memory',intro||player.index>=3&&!done);$('normal-ending').classList.toggle('is-intro',intro);$('ending-image').hidden=intro;$('ending-text').textContent=player.text;$('ending-caret').hidden=!player.full||done;$('ending-subtitle').hidden=done;$('ending-result').hidden=!done;$('ending-skip').hidden=done;$('ending-advance').hidden=done;$('ending-hint').hidden=done;$('ending-hint').textContent='';
 $('ending-unimplemented').hidden=endingPreview||!(state.profile.trueEnding||state.letter||state.profile.normalClears>1);$('ending-unimplemented').textContent=TRUE_END_UNIMPLEMENTED_NOTICE;
 $('ending-heading').textContent=intro?'字幕の確認':'届かなかった声';$('ending-label').textContent=endingPreview?'PREVIEW':'NORMAL END';$('ending-next').textContent=endingPreview?'確認を終える':'次の旅へ';$('ending-result-note').innerHTML=endingPreview?'プレビュー：達成記録・現在の旅は変更しません。':state.profile.normalClears>1?'願いを抱き、再びB30へ。':'通常エンド達成<br>次の旅では、B15の手紙を開けられます。';
}
$('ending-advance').onclick=()=>{endingPlayback?.player.advance();renderNormalEnding();};
$('ending-skip').onclick=()=>{endingPlayback?.player.finish();renderNormalEnding();};
$('ending-next').onclick=()=>{if(endingPreview){endingPreview=false;endingPlayback=null;render();}else reset();};
$('awakening-advance').onclick=()=>{if(!memoryReveal)return;memoryReveal.player.advance();if(memoryReveal.player.done){memoryReveal=null;beginExploration(state);paused=false;last=performance.now();render();tryMobileDisplay();}else{$('awakening-text').textContent=memoryReveal.player.text;}};
$('debug-dialog').addEventListener('close',()=>{musicAudition=null;syncSceneMusic();});
$('ending-options').onclick=()=>openDialog('options-dialog');
$('bgm-toggle').onclick=()=>{uiSettings=saveUiSettings(uiStorage,{...uiSettings,bgmEnabled:!uiSettings.bgmEnabled});paintMusicOptions();syncSceneMusic();};
$('bgm-volume').oninput=()=>{uiSettings=saveUiSettings(uiStorage,{...uiSettings,bgmVolume:Number($('bgm-volume').value)});paintMusicOptions();syncSceneMusic();};
const preparationBaseline=createPreparationBaseline();let forecastBefore=null,forecastBeforeSamples=null,forecastBeforeError=false;
let forecastTicket=0,forecastKey='',forecastCache=null,forecastSamples=8,forecastContext='',initialOrders=[];
function forecastDelta(result,index){const comparison=compareForecast(forecastBefore,result);return comparison?'<small class="forecast-delta '+(comparison[index].direction>0?'better':comparison[index].direction<0?'worse':'same')+'">準備開始時比 '+esc(comparison[index].text)+'</small>':'';}
function paintForecastSummary(result=null,status='pending'){const summary=$('forecast-summary');if(!summary)return;summary.hidden=showingTitle||state.phase!=='prepare';summary.innerHTML=forecastSummary(floorLabel(state),result,status).map((item,index)=>'<div class="forecast-summary-item"><span>'+esc(item.label)+'</span><b>'+esc(item.value)+'</b>'+forecastDelta(result,index)+'</div>').join('');}
function paintForecast(result){paintForecastSummary(result);const host=$('forecast-result');if(!host)return;host.innerHTML=`<div class="forecast-metric"><span>${floorLabel(state)}のClear見込み</span><b>${result.clearRate}%</b><progress max="100" value="${result.clearRate}"></progress></div><div class="forecast-metric"><span>想定ターン数（中央値）</span><b>${result.turns===null?'到達なし':'約'+result.turns}</b></div><div class="forecast-metric"><span>回復余力・終了時HP平均</span><b>${result.remainingHp>=50?'余裕あり':result.remainingHp>=25?'やや不足':'危険'} · ${result.remainingHp}%</b><progress max="100" value="${result.remainingHp}"></progress></div><div class="forecast-comparison-detail">${compareForecast(forecastBefore,result)?'<h4>準備開始時からの変化</h4>'+compareForecast(forecastBefore,result).map((d,i)=>'<p>'+['Clear見込み','ターン数','終了HP'][i]+'：'+esc(d.text)+'</p>').join(''):(forecastBeforeError?'<p>準備開始時の予測を比較できませんでした。再予測で試し直せます。</p>':'<p>準備開始時の予測と比較しています…</p>')}</div><h4>計算に使った探索指示</h4>${(result.orders||[]).map((text,i)=>'<p class="forecast-order">'+(i+1)+'. '+esc(text)+'</p>').join('')}<p class="forecast-disclaimer">指示の変更後も、同じ結果になる場合があります。未配置のカードは予測に含みません。</p><h4>試行中の行動例</h4>${result.examples.map((e,i)=>`<p class="forecast-example"><b>${i+1}</b><span>HP ${e.hp}<br>${esc(e.text)}</span></p>`).join('')}<small>${result.samples}試行／各1200ターン上限${result.incomplete?' · 未完了 '+result.incomplete+'回':''}</small>${result.warnings.map(t=>'<p class="forecast-warning">'+esc(t)+'</p>').join('')}`;host.removeAttribute('aria-busy');}
function refreshForecast(force=false){
 const context=[state.seed,state.floor,state.profile.runs].join(':');if(state.phase==='prepare'&&context!==forecastContext){forecastContext=context;initialOrders=structuredClone(state.orders);preparationBaseline.capture(context,state);forecastBefore=null;}
 if(showingTitle||state.phase!=='prepare'){forecastTicket++;forecastKey='';paintForecastSummary(null,'idle');return;}
 $('forecast-samples').value=String(forecastSamples);const signature=forecastSignature(state,forecastSamples);
 if(!force&&signature===forecastKey){if(forecastCache)paintForecast(forecastCache);return;}forecastKey=signature;forecastCache=null;paintForecastSummary();const ticket=++forecastTicket,copy=structuredClone(state);$('forecast-result').textContent='試行を開始しています…';$('forecast-result').setAttribute('aria-busy','true');
 forecastBeforeError=false;const baselineContext=preparationBaseline.context,baselineSamples=forecastSamples;if(forecastBeforeSamples!==baselineSamples){forecastBefore=null;forecastBeforeSamples=baselineSamples;}
 const baselineJob=preparationBaseline.result(baselineSamples,(input,samples)=>forecastExploration(input,{samples,cancelled:()=>state.phase!=='prepare'||showingTitle||preparationBaseline.context!==baselineContext}));
 void baselineJob.then(result=>{if(result&&state.phase==='prepare'&&preparationBaseline.context===baselineContext&&forecastSamples===baselineSamples){forecastBefore=result;if(forecastCache)paintForecast(forecastCache);}}).catch(error=>{if(preparationBaseline.context===baselineContext&&forecastSamples===baselineSamples){forecastBeforeError=true;if(forecastCache)paintForecast(forecastCache);}console.error('Baseline forecast:',error);});
 void forecastExploration(copy,{samples:forecastSamples,cancelled:()=>ticket!==forecastTicket,onProgress:(done,total)=>{if(ticket===forecastTicket){$('forecast-result').textContent=`試行中 ${done} / ${total}…`;$('forecast-summary').querySelectorAll('b').forEach(el=>el.textContent=`計算中 ${done} / ${total}…`);}}}).then(result=>{if(result&&ticket===forecastTicket){forecastCache=result;paintForecast(result);}}).catch(error=>{if(ticket===forecastTicket){forecastKey='';paintForecastSummary(null,'error');if($('forecast-result'))$('forecast-result').textContent='予測できませんでした。再予測してください。';}console.error('Forecast:',error);});
}
const fieldLogVisibility=createLogVisibility({
 show:()=>{$('field-log-host').classList.remove('is-expired');$('field-log-host').removeAttribute('aria-hidden');$('field-log-host').querySelector('.journal')?.removeAttribute('aria-hidden');$('logs').tabIndex=0;},
 hide:()=>{$('field-log-host').classList.add('is-expired');$('field-log-host').querySelector('.journal')?.setAttribute('aria-hidden','true');$('logs').tabIndex=-1;}
});
let autoDisplayAttempted=false,ownsFullscreen=false,lockedOrientation=false;
let damagePopups=[],damageScene='';
let showingTitle=true,hasSave=false,pendingJourney=null;
let state,tab='orders',speed=1,paused=false,last=0,sound=false,volume=35,audio,motion=null,dialogWasPaused=false,gearSlot='weapon',gearSorts={weapon:'acquired',armor:'acquired'},codexKind='monsters',codexSlot='weapon',codexSorts={weapon:'acquired',armor:'acquired'};

const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
try{const data=JSON.parse(localStorage.getItem(key));state=normalizeSave(data);if(state){hasSave=true;paused=state.phase==='explore';if(data.version!==state.version){try{const backup=key+'-v'+data.version+'-before-ui';if(!localStorage.getItem(backup))localStorage.setItem(backup,JSON.stringify(data));}catch{}}}}catch{}
state ||= newGame();
function save(){try{localStorage.setItem(key,JSON.stringify(state,(name,value)=>name==='damageEvents'?undefined:value));hasSave=true;$('save-status').textContent='端末に保存済み';}catch{$('save-status').textContent='保存できません（空き容量・設定）';}}
function tone(freq=330){if(!sound||volume===0)return;try{audio ||= new AudioContext();audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.type='triangle';o.frequency.value=freq;g.gain.setValueAtTime(volume/100*.1,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.15);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+.15);}catch{}}
// Every sprite is an original pixel matrix. No external game assets are used.
const sprites={
 skeleton:['....hhhhh...','...hbbbbb h..'.replace(' ',''),'...hbdbdbh..','...hbbbbbh..','....hdddh...','.....bb.....','...aabbaa...','..a.abb.a.s.','..a.abb.a.s.','....aaa...s.','....b.b.....','...bb.bb....'],
 slime:['............','............','............','....gggg....','...ggllgg...','..gllllllg..','.gllldldllg.','.glllllllg..','..ggggggg...','............','............','............'],
 brute:['...rrrrrr...','..rppppppr..','..rpdppdpr..','..rppppppr..','...rdddr....','..rrppprr...','.rpprrpppr..','.rpprrpprr..','...rrrrr....','...pp.pp....','..ppp.ppp...','............'],
 chest:['............','............','..yyyyyyyy..','.yoooooooo y.'.replace(' ',''),'.yoooooooo y.'.replace(' ',''),'.yyyyyyyyyy.','.ooooYYoooo.','.ooooYYoooo.','.yooooooooy.','.yyyyyyyyyy.','............','............'],
 potion:['............','.....yy.....','....bbbb....','....bllb....','...bllllb...','...bllllb...','...bllllb...','....bbbb....','............','............','............','............'],
 armor:['............','...aaaaaa...','..aabbbbaa..','.aabbbbbbaa.','.a.bbbbbb.a.','...bbbbbb...','...bbbbbb...','...bbbbbb...','...aaaaaa...','............','............','............'],
 gear:['.........ss.','........ss..','.......ss...','......ss....','.....ss.....','....ss......','..ass.......','...aa.......','..s.aa......','.s..........','............','............'],
 herb:['............','......gg....','..gg.ggg....','..ggggg.....','....gg......','....g.gg....','...ggggg....','....g.......','....g.......','............','............','............'],
 fragment:['............','.....ll.....','....lYYl....','...lYYYYl...','..lYYYYYYl..','...lYYYYl...','....lYYl....','.....ll.....','............','............','............','............'],
 reward:['............','...yyyyyy...','...ybbbbby..','...ybbbbby..','...ybbYbby..','...ybbbbby..','...ybbYbby..','...ybbbbby..','...yyyyyyy..','............','............','............'],
 stairs:['............','.........ll.','.......llbl.','.....llbbbl.','...llbbbbbl.','.llbbbbbbbl.','.lbbbbbbbbl.','.llllllllll.','............','............','............','............']};
const mapItemsAtlas=new Image();mapItemsAtlas.src=$('map').dataset.mapItems;
const propsAtlas=new Image();propsAtlas.src=$('map').dataset.props;document.documentElement.style.setProperty('--prop-atlas','url("'+propsAtlas.src+'")');
const redChestAtlas=new Image();redChestAtlas.src=$('map').dataset.redChest;
const enemyAtlas=new Image();enemyAtlas.src=$('map').dataset.enemies;
const CELL=64;
const palette={h:'#57695a',b:'#e2dfbd',d:'#27352f',a:'#899e85',s:'#b8b2a1',g:'#3e715f',l:'#9bbba6',r:'#66424a',p:'#ad7276',y:'#bfa266',o:'#634e32',Y:'#e3d49d'};
function sprite(ctx,type,x,y,size=CELL,height=size){if(drawMapProp(ctx,mapItemsAtlas,type,x,y,size,height)||drawProp(ctx,propsAtlas,type,x,y,size,height))return;if((type==='slime'||type==='brute')&&enemyAtlas.complete&&enemyAtlas.naturalWidth===128&&enemyAtlas.naturalHeight===64){ctx.imageSmoothingEnabled=false;ctx.drawImage(enemyAtlas,type==='slime'?0:64,0,64,64,x,y,size,height);return;}const rows=sprites[type]||(['tombstone','tombstone-cracked'].includes(type)?['............','....aaaa....','...abbbba...','..abbbbbba..','..abdbbbba..','..abbdbbba..','..abbbbbba..','..abbbbbba..','..abbbbbba..','.aabbbbbbaa.','.aaaaaaaaaa.','............']:sprites.reward);const scale=size/12,scaleY=height/12;for(let py=0;py<rows.length;py++)for(let px=0;px<rows[py].length;px++){const c=rows[py][px];if(c!=='.'&&palette[c]){ctx.fillStyle=palette[c];ctx.fillRect(x+px*scale,y+py*scaleY,Math.ceil(scale),Math.ceil(scaleY));}}}
const ctx=$('map').getContext('2d');ctx.imageSmoothingEnabled=false;
const cryptAtlas=new Image();cryptAtlas.src=$('map').dataset.terrain;
let entranceGrid=null,entranceFrames=new Map();
let heroSheet=null,heroVisual=new CharacterAnimation(),heroClock=0,heroScene='',lastVisualTime=null;
const heroAssetsReady=loadCharacterSheet($('map').dataset.hero).then(sheet=>{heroSheet=sheet;drawHeroPortraits();}).catch(error=>console.error('Character sheet:',error));
function resetHeroVisual(){heroVisual=new CharacterAnimation({x:state.player.x,y:state.player.y});heroClock=0;heroScene='';lastVisualTime=null;}
function drawHeroPortraits(){if(!heroSheet)return;const d=heroSheet.definition,f=characterFrame(d,0,0),[px,py,pw,ph]=d.portrait||[0,0,f.width,f.height];for(const id of ['portrait','camp-portrait']){const canvas=$(id),c=canvas.getContext('2d'),scale=Math.min(canvas.width/pw,canvas.height/ph);c.clearRect(0,0,canvas.width,canvas.height);c.imageSmoothingEnabled=false;c.drawImage(heroSheet.image,f.x+px,f.y+py,pw,ph,(canvas.width-pw*scale)/2,(canvas.height-ph*scale)/2,pw*scale,ph*scale);}}
let wallSets=new Map();const wallAssetsReady=loadWallTilesets($('map').dataset.walls.split(/\s+/)).then(sets=>{wallSets=sets;}).catch(error=>console.error('Wall tileset:',error));
const gambleChestIcon=new Image();gambleChestIcon.src=THEME_IMAGES.gambler;
function draw(){
 const scene=state.seed+':'+state.floor;if(damageScene!==scene){damagePopups=[];damageScene=scene;}
 if(heroScene!==scene||heroVisual.x!==state.player.x||heroVisual.y!==state.player.y){heroScene=scene;heroVisual.teleport(state.player.x,state.player.y,heroClock);}
 const heroFrame=heroVisual.sample(heroClock,{reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches});
 heroFrame.cycleElapsed=heroClock;
 const map=$('map');if(map.width!==1920||map.height!==1080){map.width=1920;map.height=1080;ctx.imageSmoothingEnabled=false;}
 ctx.fillStyle='#0c1416';ctx.fillRect(0,0,map.width,map.height);const theme=zoneFor(state);
 const progress=motion&&state.phase==='explore'?Math.min(1,(performance.now()-motion.time)/motion.duration):1,eased=1-Math.pow(1-progress,3);
 const position=motion?{x:motion.from.x+(state.player.x-motion.from.x)*eased,y:motion.from.y+(state.player.y-motion.from.y)*eased}:state.player;
 const sightState=renderSightState(state,position),visible=(x,y)=>canSee(sightState,x,y);
 const moving=motion&&(motion.from.x!==state.player.x||motion.from.y!==state.player.y),hop=moving?Math.sin(progress*Math.PI)*CELL/12:0;
 const camera=cameraFor(position,cameraSight(state),map.width,map.height);ctx.save();ctx.scale(camera.scale,camera.scale);ctx.translate(-camera.left,-camera.top);
 const graves=new Set((state.obstacles||[]).map(o=>o.x+','+o.y)),surface=state.grid.map((r,y)=>r.map((v,x)=>(v||graves.has(x+','+y))?1:0)),queue=[];
 if(entranceGrid!==state.grid){entranceGrid=state.grid;entranceFrames=entranceWallFrames(surface);}
 for(let y=0;y<state.grid.length;y++)for(let x=0;x<state.grid[y].length;x++){
  if((x+1)*CELL<camera.left||x*CELL>camera.left+map.width/camera.scale||(y+1)*CELL<camera.top||(y-1)*CELL>camera.top+map.height/camera.scale)continue;
  const floor=Boolean(surface[y][x]),light=floorLight(state.seen[y][x],visible(x,y));if(floor&&light==='hidden')continue;const px=x*CELL,py=y*CELL,n=(x*17+y*31+state.seed)%13;
  if(!(floor&&drawFloorTexture(ctx,cryptAtlas,x,y,theme.index,CELL))){
   ctx.fillStyle=floor?theme.floorColor:'#0c1416';ctx.fillRect(px,py,CELL,CELL);
   if(floor&&n<4){ctx.fillStyle='#435044';ctx.fillRect(px+13+n*2,py+21,5,5);}
  }
  if(floor&&light==='memory'){ctx.fillStyle=MEMORY_SHADE;ctx.fillRect(px,py,CELL,CELL);}
  if(!floor)queue.push({footY:(y+1)*CELL,layer:0,x,draw(){ctx.save();ctx.globalAlpha=1;const walls=wallSets.get(theme.id)||wallSets.get('*');drawSightWall(ctx,walls,wallDrawBox(surface,x,y,walls?.definition.rise??.75,CELL),CELL,visible,lit=>drawRaisedWall(ctx,lit,surface,x,y,state.seed,theme,CELL,entranceFrames.get(x+','+y)));ctx.restore();}});
 }
 const stair=state.stairs;
 for(const t of state.traps||[])if(t.revealed&&(state.gimmick?.id==='traps'||state.seen[t.y][t.x])){ctx.save();ctx.globalAlpha=visible(t.x,t.y)?1:.4;sprite(ctx,t.spent?'trap-spent':'trap',t.x*CELL,t.y*CELL);ctx.restore();}
 function entity(o,type,{standing=false,layer=1,hero=false,enemy=false}={}){
  const at=hero?position:o,presentation=hero&&heroSheet?characterPresentation(heroSheet.definition,heroFrame,CELL):{offsetX:0,offsetY:0,opacity:1},visualAt={x:at.x+presentation.offsetX/CELL,y:at.y+presentation.offsetY/CELL},box=standing?standingBox(visualAt.x,visualAt.y,CELL,1):{x:at.x*CELL,y:at.y*CELL,width:CELL,height:CELL,footY:(at.y+1)*CELL};
  if(standing||type==='chest'){ctx.save();ctx.globalAlpha=(hero||visible(o.x,o.y)?1:.4)*presentation.opacity;drawFootShadow(ctx,visualAt.x,visualAt.y,CELL);ctx.restore();}
  queue.push({footY:box.footY,layer,x:at.x,draw(){ctx.save();ctx.globalAlpha=hero||visible(o.x,o.y)?1:.4;
   const oldPalette={g:palette.g,l:palette.l,r:palette.r,p:palette.p};if(enemy){if(type==='slime'){palette.g=theme.wallColor;palette.l='#c0c7b1';}else{palette.r=theme.floorColor;palette.p=theme.wallColor;}}
   const footOffset=enemy?0:(hero?actorFootOffset(sprites[type],box.height):0);
   const chest=type==='chest'?chestPresentation(o):null;if(chest?.legendary)drawLegendaryChestEffect(ctx,box,performance.now(),matchMedia('(prefers-reduced-motion: reduce)').matches);
   if(type==='chest'&&chest?.red&&redChestAtlas.complete&&redChestAtlas.naturalWidth===64){ctx.imageSmoothingEnabled=false;ctx.drawImage(redChestAtlas,box.x,box.y,box.width,box.height);}else if(hero&&heroSheet)drawCharacter(ctx,heroSheet,heroFrame,at.x,at.y,CELL);else if(!enemy||!drawEnemySprite(ctx,enemyAtlas,o,box))sprite(ctx,type,box.x,box.y+footOffset-(hero?hop:0),box.width,box.height);if(enemy)Object.assign(palette,oldPalette);
   // The chest artwork supplies its own latch: no oversized yellow lock rectangle.
   if(type==='chest'&&o.cardId&&state.augments?.includes('destiny')&&!state.themeState?.destinyUsed&&gambleChestIcon.complete&&gambleChestIcon.naturalWidth){ctx.drawImage(gambleChestIcon,box.x+box.width*.62,box.y-12,24,24);}
   if(o.type==='letter'){ctx.fillStyle='#292a26';ctx.fillRect(box.x+40,box.y+8,21,16);ctx.fillStyle='#e4dfc3';ctx.fillRect(box.x+43,box.y+11,16,11);}

   ctx.restore();}});
 }
 if(state.seen[stair.y][stair.x])entity(stair,'stairs',{standing:true});
 for(const o of state.obstacles||[])if(state.seen[o.y][o.x])entity(o,o.variant?'tombstone-cracked':'tombstone',{standing:true});
 for(const i of state.items)if(state.seen[i.y][i.x])entity(i,i.type==='letter'?'chest':i.type==='gear'&&gearById[i.gear.baseId].slot==='armor'?'armor':i.type);
 for(const e of state.enemies)if(visible(e.x,e.y))entity(e,e.type,{standing:true,layer:2,enemy:true});
 entity(state.player,'skeleton',{standing:true,layer:3,hero:true});
 for(const object of sceneDrawOrder(queue))object.draw();
 for(const label of layoutEnemyLabels(state.enemies.filter(enemy=>visible(enemy.x,enemy.y)),CELL))drawEnemyLabel(ctx,label.enemy,CELL,label.offset);
 if(state.flash){ctx.fillStyle=state.flash.kind==='hurt'?'#e49a8c55':'#fff3b755';ctx.fillRect(state.flash.x*CELL,state.flash.y*CELL,CELL,CELL);}
 const now=performance.now();damagePopups=damagePopups.filter(p=>damageFrame(p,now).alive);
 for(const p of damagePopups){if(!p.hero&&!visible(p.x,p.y))continue;const frame=damageFrame(p,now),at=p.hero?position:p;ctx.save();ctx.globalAlpha=frame.alpha;ctx.font='bold 29px monospace';ctx.textAlign='center';ctx.textBaseline='bottom';ctx.lineWidth=6;ctx.strokeStyle='#200909';ctx.fillStyle='#ff5656';const x=at.x*CELL+CELL/2,y=at.y*CELL-19-frame.rise*CELL/24;ctx.strokeText(String(p.damage),x,y);ctx.fillText(String(p.damage),x,y);ctx.restore();}
 ctx.restore();if(state.gimmick?.id==='fog'){ctx.fillStyle='#a6bdc620';ctx.fillRect(0,0,map.width,map.height);}drawAutoMap();
}

function drawAutoMap(){
 const canvas=$('auto-map'),geometry=miniMapGeometry(state.grid[0].length,state.grid.length,6);
 if(canvas.width!==geometry.width||canvas.height!==geometry.height){canvas.width=geometry.width;canvas.height=geometry.height;}
 drawMiniMap(canvas.getContext('2d'),autoMapModel(state,(x,y)=>canSee(state,x,y)),geometry);
}
function renderThoughtSubtitle(){
 const text='▶ '+thoughtText(state.intent),subtitle=$('thought-subtitle');
 const active=$('executing-order'),label=Number.isInteger(state.executingRule)?'指示'+(state.executingRule+1):state.executingRule==='fixed'?'常設':'';
 active.hidden=!label;active.textContent=label?'実行中 · '+label+'：'+state.intent.replace(/^(カード指示：|指示：)/,''):'';
 if(subtitle.textContent!==text)subtitle.textContent=text;
}
function categoryTabs(type,selected,common=false){return `<div class="subtabs" role="group" aria-label="${type==='skill'?'スキル系統':'装備の種類'}">${(common?[['common','共通'],['weapon','武器'],['armor','防具']]:[['weapon','武器'],['armor','防具']]).map(([id,label])=>`<button data-category="${type}" data-value="${id}" aria-pressed="${selected===id}" class="${selected===id?'active':''}">${label}</button>`).join('')}</div>`;}
function sortButtons(type,selected){return `<div class="sort-controls" role="group" aria-label="装備の並べ替え">${[['acquired','入手順'],['attack','攻撃力順'],['defense','防御力順']].map(([id,label])=>`<button data-sort="${type}" data-value="${id}" class="${selected===id?'active':''}" aria-pressed="${selected===id}">${label} ${id==='acquired'?'↑':'↓'}</button>`).join('')}</div>`;}
function renderOrderEditor(host){renderCardEditor(host,state,orderCapacity(state));}
function handleOrderClick(e,host){const result=handleCardClick(e,state);if(result!==null){if(result!=='selected'){delete host.dataset.orderSignature;render();}return true;}const b=e.target.closest('button');if(!b||b.disabled)return false;if(b.hasAttribute('data-rule-add')){const choice=host.querySelector('[data-order-choice]');if(choice&&addOrder(state,choice.value)){delete host.dataset.orderSignature;render();}return true;}if(b.dataset.ruleOp){editOrder(state,Number(b.dataset.index),b.dataset.ruleOp);delete host.dataset.orderSignature;render();return true;}return false;}
function handleOrderChange(e){const result=handleCardChange(e,state);if(result!==null){if(result==='selected')return;delete $('live-orders').dataset.orderSignature;delete $('tab-content').dataset.orderSignature;render();return;}if(e.target.dataset.ruleValue!==undefined){editOrder(state,Number(e.target.dataset.ruleValue),e.target.value);delete $('live-orders').dataset.orderSignature;delete $('tab-content').dataset.orderSignature;render();}}
const displayAttack=()=>state.gear.weapon.identified?stats(state).attack:'？';
const displayDefense=()=>state.gear.armor.identified?stats(state).defense:'？';
function renderAugments(){
 const offer=state.augmentOffer,dialog=$('augment-dialog');if(!showingTitle&&offer&&!dialog.open){$('augment-choices').innerHTML=offer.choices.map(id=>augmentCard(augmentById[id],{choice:true,state})).join('');dialog.showModal();}
 if(state.phase==='prepare'){const hint=nextStageHint({...state,floor:state.floor-1});$('prep-hint').textContent=hint.title.replace('次は','')+' · '+hint.text;$('prep-augments').innerHTML='<div class="prep-augment-list"><b>オーグメント</b>'+((state.augments||[]).map(id=>augmentChip(augmentById[id],state)).join('')||'<span>なし</span>')+'</div>'+setRibbon(state);}
}
$('debug-augment').innerHTML=augments.map(a=>'<option value="'+a.id+'">'+a.rarity+' · '+a.theme+' · '+a.name+'</option>').join('');
$('augment-dialog').addEventListener('cancel',e=>e.preventDefault());
$('augment-choices').onclick=e=>{const b=e.target.closest('[data-augment]');if(!b||!chooseAugment(state,b.dataset.augment))return;$('augment-dialog').close();if(state.phase==='awakening'){beginExploration(state);paused=false;last=performance.now();}render();};
installHoverHelp();
const renderTactics=installTacticsUi({getState:()=>state,onChange:()=>{delete $('tab-content').dataset.orderSignature;render();},storage:uiStorage});
function render(){
 const st=stats(state),prep=state.phase==='prepare',theme=zoneFor(state);renderScreens();if(!showingTitle)renderTactics();
 const runClears=Math.max(0,state.profile.normalClears-(state.phase==='ending'?1:0));
 $('floor-title').textContent=`${theme.name} · ${floorLabel(state)}`;
 $('phase-label').textContent=({awakening:'目覚め',prepare:'準備中',explore:paused?'一時停止':'探索中',cleared:'Clear',dead:'記憶喪失',ending:'通常エンド'})[state.phase];
 $('floor-message').hidden=state.floor!==LETTER_FLOOR;$('floor-message').textContent='B15 ― '+letterFloorThought(state.profile.normalClears);
 $('turn').textContent=`TURN ${String(state.turn).padStart(3,'0')}`;
 $('hud-shards').textContent=state.shards;$('hud-sight').textContent=radius(state)+'マス';
 $('level-text').textContent='Lv.'+state.level;const expNeed=experienceToNext(state.level);$('exp-bar').style.width=(expNeed?state.experience/expNeed*100:100)+'%';$('level-vitals').setAttribute('aria-label',`レベル${state.level}、経験値${state.experience}、次のレベルまで${expNeed?expNeed-state.experience:0}`);$('level-vitals').title=state.level===MAX_LEVEL?'最大レベル':`EXP ${state.experience} / ${expNeed}`;
 $('hp-text').textContent=`${state.hp} / ${st.maxHp}`;$('hp-bar').style.width=`${state.hp/st.maxHp*100}%`;$('hp-bar').style.background=state.hp<st.maxHp*.3?'#bd8073':'#91ae88';
 $('atk').textContent=displayAttack();$('def').textContent=displayDefense();$('shards').innerHTML=`${state.shards} <em>pt</em>`;$('intent').textContent=prep?'出発の準備をしています':state.intent;
 const notices={cleared:[`${floorLabel(state)} Clear`,state.floor===LAST_FLOOR?'階段の先に、地上の光が見える。':'記憶の欠片を手に入れた。次の階の準備へ。'],dead:['途切れた旅','骸は崩れ、再び最深部へ。図鑑の記録は残ります。'],ending:['届かなかった声',state.profile.normalClears===1?'「魔物か」<br>若者は剣を抜き、骸を打ち倒した。<br>自分が誰なのかも知らぬまま、旅は終わった。<br><br>闇の中で、失われた記憶が戻り始める。<br>通常エンド達成 · 次の旅ではB15の手紙を開けられます。':'「魔物か」<br>若者は剣を抜き、骸を打ち倒した。<br>この先の物語は、まだ実装されていません。']};
 const hint=['cleared','dead','ending'].includes(state.phase)?nextStageHint(state):null;
 $('field-gimmick').hidden=!state.gimmick||state.gimmick.id==='none';$('field-gimmick').textContent=state.gimmick&&state.gimmick.id!=='none'?'異変：'+state.gimmick.name+(state.gimmick.id==='fog'?' · 視界−2':''):'';
 const resting=state.phase==='explore'&&paused&&!document.querySelector('dialog[open]');
 $('map-notice').dataset.kind=resting?'rest':state.phase;
 const n=notices[state.phase]||(resting?['ひとやすみ','少し骨を休めよう。下の「探索を再開」で旅を続けられます。']:null);$('map-notice').hidden=!n;$('map-notice').classList.toggle('has-hint',Boolean(n&&hint));
 $('notice-copy').innerHTML=n?'<strong>'+n[0]+'</strong><small>'+n[1]+'</small>':'';
 $('notice-hint').innerHTML=hint?'<div class="clear-hint"><h3>'+esc(displayStoryText(hint.title.replace(/^次は/,''),state.profile.normalClears))+'</h3><p>'+esc(displayStoryText(hint.text,state.profile.normalClears))+'</p></div>':'';
 $('primary').innerHTML=({awakening:'思い出す',prepare:'探索を始める',cleared:state.floor===LAST_FLOOR?'地上1Fへ':'準備画面へ',dead:'B30で再び目覚める',ending:'次の旅をはじめる'})[state.phase]||'';
 $('primary').hidden=state.phase==='explore';$('pause-toggle').hidden=state.phase!=='explore';$('explore-abandon').hidden=state.phase!=='explore';$('pause-toggle').textContent=paused?'探索を再開':'ひとやすみ';
 renderJourneyLog();
 $('memory-count').textContent=`記憶の断片 ${state.memories.length} / 4 · 通常エンド ${state.profile.normalClears}回`;
 $('memory-quote').textContent=displayStoryText(state.memories.at(-1)||openingThought(runClears),runClears);

 renderTab();renderThoughtSubtitle();draw();renderTitle();renderNormalEnding();renderAugments();syncSceneMusic();if(!showingTitle)save();maybeTutorial();
}
function syncTitleEffect(){
 const video=$('title-fx'),variant=openingVariant(state.profile);
 if(video.dataset.variant!==variant){video.pause();video.dataset.variant=variant;delete video.dataset.fallbackActive;video.classList.remove('is-screen-fallback');video.dataset.fallback=video.dataset[variant+'Fallback'];video.src=video.dataset[variant];video.load();}
 if(showingTitle&&!pendingJourney&&!endingPreview&&!document.hidden){if(video.paused)video.play().catch(()=>{});}else video.pause();
}
const titleEffect=$('title-fx');
function useTitleEffectFallback(){if(titleEffect.dataset.fallbackActive)return;titleEffect.dataset.fallbackActive='true';titleEffect.classList.add('is-screen-fallback');titleEffect.src=titleEffect.dataset.fallback;titleEffect.load();syncTitleEffect();}
function checkTitleEffectAlpha(){if(titleEffect.dataset.fallbackActive||titleEffect.readyState<2)return;try{const probe=document.createElement('canvas');probe.width=probe.height=1;const c=probe.getContext('2d',{willReadFrequently:true});c.drawImage(titleEffect,0,0,1,1,0,0,1,1);if(c.getImageData(0,0,1,1).data[3]===255)useTitleEffectFallback();}catch{useTitleEffectFallback();}}
titleEffect.addEventListener('loadeddata',checkTitleEffectAlpha);
titleEffect.addEventListener('error',useTitleEffectFallback);
if(titleEffect.readyState>=2)checkTitleEffectAlpha();
document.addEventListener('visibilitychange',syncTitleEffect);
$('title-scene').addEventListener('pointerdown',syncTitleEffect);
function renderTitle(){
 syncTitleEffect();
 const variant=openingVariant(state.profile),name=variant==='segare'?'倅の旅路':'骸の旅路';
 $('title-unimplemented').hidden=variant!=='segare';$('title-unimplemented').textContent=TRUE_END_UNIMPLEMENTED_NOTICE;$('title-scene').dataset.variant=variant;$('title-name').textContent=name;document.title=name+' — 記憶の迷宮';
 for(const id of ['title-background','title-logo']){const el=$(id),src=el.dataset[variant];if(el.getAttribute('src')!==src)el.src=src;}
 $('title-logo').alt=name;$('title-load').disabled=!hasSave;
 $('title-save-note').textContent=hasSave?`${floorLabel(state)} · Lv.${state.level} · 保存された旅の続きから`:'保存された旅はありません';
}
function renderJourneyLog(){
 const host=$('logs'),overlay=document.body.classList.contains('exploring'),rows=[...state.logs],signature=JSON.stringify([overlay,rows]);
 fieldLogVisibility.sync(overlay,JSON.stringify(rows));
 if(host.dataset.signature===signature)return;
 const modeChanged=host.dataset.overlay!==String(overlay),follow=host.scrollHeight-host.clientHeight-host.scrollTop<8||modeChanged,top=host.scrollTop;
 host.dataset.signature=signature;host.dataset.overlay=String(overlay);
 const runClears=Math.max(0,state.profile.normalClears-(state.phase==='ending'?1:0));
 host.innerHTML=(overlay?rows.reverse():rows).map(l=>`<div class="log-row ${esc(l.type)}"><time>${String(l.turn).padStart(3,'0')}</time><span>${esc(displayStoryText(l.text,runClears).replace(/記憶のかけら|かけら/g,'記憶の欠片'))}</span></div>`).join('');
 host.scrollTop=overlay&&follow?host.scrollHeight:modeChanged?0:top;
}
const logHolds=new Set();
function holdLogs(key,hold){if(hold)logHolds.add(key);else logHolds.delete(key);fieldLogVisibility.setHeld(logHolds.size>0);}
for(const [id,prefix]of [['field-log-host','log'],['log-open','icon']]){const el=$(id);el.addEventListener('pointerenter',e=>{if(e.pointerType!=='touch')holdLogs(prefix+'-hover',true);});el.addEventListener('pointerleave',()=>holdLogs(prefix+'-hover',false));el.addEventListener('focusin',()=>holdLogs(prefix+'-focus',true));el.addEventListener('focusout',e=>{if(!el.contains(e.relatedTarget))holdLogs(prefix+'-focus',false);});}
$('field-log-host').addEventListener('pointerdown',e=>{if(e.pointerType==='touch')holdLogs('touch',true);});
document.addEventListener('pointerdown',e=>{if(!e.target.closest('#field-log-host,#log-open')){holdLogs('touch',false);if($('field-log-host').contains(document.activeElement))document.activeElement.blur();}});
$('log-open').onclick=()=>{const runClears=Math.max(0,state.profile.normalClears-(state.phase==='ending'?1:0));$('full-log-count').textContent='この旅の記録 '+state.logs.length+'件';$('full-logs').innerHTML=[...state.logs].reverse().map(l=>'<div class="log-row '+esc(l.type)+'"><time>TURN '+String(l.turn).padStart(3,'0')+'</time><span>'+esc(displayStoryText(l.text,runClears).replace(/記憶のかけら|かけら/g,'記憶の欠片'))+'</span></div>').join('');openDialog('history-dialog');$('full-log-scroll').scrollTop=$('full-log-scroll').scrollHeight;};
function itemCard(g,ref,equipped=false){
 const b=gearById[g.baseId],st=gearStats(g),target=typeof ref==='number'?'i'+ref:ref;
 return '<article class="item-card"><div><small>'+ (b.slot==='weapon'?'武器':'防具')+(equipped?' · 装備中':'')+'</small><strong><span class="equipment-icon '+b.slot+'" aria-hidden="true"></span>'+esc(gearName(g))+'</strong><small>攻撃 '+st.attack+' / 防御 '+st.defense+'</small></div>'+(!equipped?'<div class="item-actions"><button data-action="equip" data-ref="'+target+'">装備</button><button data-action="discard" data-ref="'+target+'" class="text-button">処分</button></div>':'')+'</article>';
}
function renderMemories(){
 const focused=document.activeElement?.dataset.upgrade;
 $('tab-content').innerHTML='<div class="memory-toolbar"><span>スキルツリー <b>'+state.shards+' pt</b></span><small>難易度：深淵</small></div><p class="section-caption">記憶の欠片で能力と指示枠を強化できます。指示行数と1行のカード数を別々に拡張できます。スキルカードは探索で取得します。</p>'+memoryGroups.map(group=>'<section class="memory-list-group"><h3>'+group.name+'</h3>'+group.ids.map(id=>{
  const k=skills.find(k=>k.id===id),lv=state.levels[id],max=lv>=k.max,dep=skills.find(p=>p.id===k.requires),disabled=max||locked(state,k)||state.floor===1||state.phase!=='prepare'||state.shards<price(state,k);
  const status=max?'習得済み':locked(state,k)?'未解放':state.floor===1?'B29から習得可能':state.shards<price(state,k)?'記憶の欠片不足':'習得する';
  return '<article class="memory-list-card"><span class="skill-icon" aria-hidden="true">'+k.icon+'</span><div><strong>'+esc(k.name)+' <small>Lv.'+lv+' / '+k.max+'</small></strong><p>'+esc(k.detail)+'</p>'+(dep?'<small>前提：'+esc(dep.name)+' Lv.1</small>':'')+'</div><button data-upgrade="'+id+'" '+(disabled?'disabled':'')+' aria-label="'+esc(k.name+' '+status)+'">'+status+(max?'':' · '+price(state,k)+' pt')+'</button></article>';
 }).join('')+'</section>').join('');
 if(focused)document.querySelector('[data-upgrade="'+focused+'"]')?.focus({preventScroll:true});
}
function renderTab(){
 if(tab==='skills')renderMemories();
 if(tab==='status')$('tab-content').innerHTML=$('expedition-summary').innerHTML.replace(/\sid="[^"]*"/g,'');
 if(tab==='gear'){$('tab-content').innerHTML='<div class="equipment-toolbar"><button data-best-equipment class="primary">最強装備</button><small>武器は攻撃力、防具は防御力で選びます。</small></div>'+categoryTabs('gear',gearSlot)+sortButtons('gear',gearSorts[gearSlot])+'<p class="section-caption">本編の装備は鑑定済み・呪いなし。入手順は古い順、攻撃力順・防御力順は高い順です。</p>'+itemCard(state.gear[gearSlot],gearSlot,true)+`<h3>所持品</h3>`+(sortedInventory(state,gearSlot,gearSorts[gearSlot]).map(({g,index})=>itemCard(g,index)).join('')||'<p class="section-caption">この種類の装備はありません。</p>');}
 if(tab==='orders'){if(!$('tab-content').querySelector('.card-board'))delete $('tab-content').dataset.orderSignature;renderOrderEditor($('tab-content'));}
 refreshForecast();

}
function renderScreens(){
 const prep=state.phase==='prepare',awake=state.phase==='awakening',st=stats(state);document.body.classList.toggle('awakening',!showingTitle&&awake);$('awakening-start').hidden=Boolean(memoryReveal);$('awakening-copy').hidden=!memoryReveal;$('awakening-advance').hidden=!memoryReveal;$('awakening-hint').hidden=!memoryReveal;$('workspace').dataset.screen=awake?'awakening':prep?'prepare':'explore';document.body.classList.toggle('opening',showingTitle);$('title-scene').hidden=!showingTitle;document.body.classList.toggle('exploring',!showingTitle&&!prep&&!awake);document.body.classList.toggle('preparing',!showingTitle&&prep);$('awakening-scene').hidden=!awake;$('game-icons').hidden=awake;const journal=document.querySelector('.journal');journal.hidden=awake;const journalHost=awake?$('workspace'):prep?$('prep-journal-content'):$('field-log-host');if(journal.parentElement!==journalHost)journalHost.appendChild(journal);const toolsHost=awake?$('header-tools'):$('hud-tools');if($('utility-controls').parentElement!==toolsHost)toolsHost.appendChild($('utility-controls'));
 $('prepare-scene').hidden=!prep;document.querySelector('.adventure').hidden=awake;$('expedition').hidden=awake;const statusHost=awake?$('workspace'):$('status-dialog-content');if($('expedition').parentElement!==statusHost)statusHost.appendChild($('expedition'));$('status-open').hidden=awake;$('fullscreen-open').hidden=false;$('mobile-display').hidden=true;$('live-order-panel').hidden=prep;$('status-phase').textContent=prep?'PREPARATION':'EXPEDITION';
 $('prepare-floor').textContent=`${floorLabel(state)}への支度`;
 const host=awake?$('awakening-start'):prep?$('launch-area'):$('notice-actions');if($('primary').parentElement!==host)host.prepend($('primary'));
 const visited=state.visited.flat().filter(Boolean).length;
 const summary=`<dl class="stat-list"><div><dt>レベル / 経験値</dt><dd>Lv.${state.level} / ${state.level===MAX_LEVEL?'MAX':state.experience+' / '+experienceToNext(state.level)}</dd></div><div><dt>HP</dt><dd>${state.hp} / ${st.maxHp}</dd></div><div><dt>攻撃力 / 防御力</dt><dd>${displayAttack()} / ${displayDefense()}</dd></div><div><dt>記憶の欠片</dt><dd id="shards">${state.shards} pt</dd></div><div><dt>武器</dt><dd>${esc(gearName(state.gear.weapon))}${state.gear.weapon.boundKnown?' · 呪い':''}</dd></div><div><dt>防具</dt><dd>${esc(gearName(state.gear.armor))}${state.gear.armor.boundKnown?' · 呪い':''}</dd></div><div><dt>指示枠</dt><dd>${state.orders.length} / ${orderCapacity(state)}枠</dd></div><div><dt>1行のカード枠</dt><dd>${cardCapacity(state)}枚</dd></div><div><dt>視界範囲</dt><dd>半径${radius(state)}マス</dd></div><div><dt>再生の祈り</dt><dd>${state.abilities.includes('mend')?(state.mended?'使用済み':state.orders.some(o=>o.effect?.id==='mend')?'使用可能':'指示未設定'):'未習得'}</dd></div></dl>`;

 $('expedition-summary').innerHTML=summary+`<div class="current-action"><small>今の判断</small><p>${esc(prep?'出発の準備をしています':state.intent)}</p></div><dl class="stat-list"><div><dt>探索済みの床 / この階の撃破</dt><dd>${visited}マス / ${state.floorKills}体</dd></div><div><dt>所持品 / 手紙</dt><dd>${state.inventory.length}個 / ${state.letter?'入手済':'未入手'}</dd></div></dl><h3>習得した記憶</h3><p class="section-caption">${skills.filter(k=>state.levels[k.id]).map(k=>k.name+(k.max>1?' Lv.'+state.levels[k.id]:'')).join(' / ')||'未習得'}</p><h3>この旅で得たスキル・特殊指示</h3><p class="section-caption">${[...state.abilities,...state.unlockedOrders].map(id=>esc(rewardDefinitions.find(r=>r.id===id).name)).join(' / ')||'未取得'}<br>特殊指示は準備中に探索指示へ設定して使います。</p>`;
 renderOrderEditor($('live-orders'));
 $('status-open').hidden=showingTitle||awake;$('fullscreen-open').hidden=false;$('mobile-display').hidden=true;$('return-title').hidden=showingTitle;
}
function openDialog(id){if(!document.querySelector('dialog[open]'))dialogWasPaused=paused;paused=true;$(id).showModal();if(state.phase==='explore')render();}
let tutorialKind=null,tutorialStep=0;
function paintTutorial(){const steps=screenTutorials[tutorialKind],step=steps[tutorialStep];$('tutorial-progress').textContent=(tutorialKind==='explore'?'探索':'準備')+' · '+(tutorialStep+1)+' / '+steps.length;$('tutorial-title').textContent=step.title;$('tutorial-copy').textContent=step.text;$('tutorial-back').disabled=tutorialStep===0;$('tutorial-next').textContent=tutorialStep===steps.length-1?'わかった':'次へ';}
function startTutorial(kind){tutorialKind=kind;tutorialStep=0;paintTutorial();openDialog('tutorial-dialog');}
function maybeTutorial(){if(!showingTitle&&!pendingJourney&&!endingPreview&&!document.querySelector('dialog[open]')&&screenTutorials[state.phase]&&!uiSettings.tutorials[state.phase])startTutorial(state.phase);}
function finishTutorial(){if(tutorialKind)uiSettings=saveUiSettings(uiStorage,{...uiSettings,tutorials:{...uiSettings.tutorials,[tutorialKind]:true}});tutorialKind=null;$('tutorial-dialog').close();}
$('tutorial-next').onclick=()=>{if(tutorialStep===screenTutorials[tutorialKind].length-1)finishTutorial();else{tutorialStep++;paintTutorial();}};
$('tutorial-back').onclick=()=>{if(tutorialStep>0){tutorialStep--;paintTutorial();}};
$('tutorial-skip').onclick=finishTutorial;
$('tutorial-dialog').addEventListener('cancel',e=>{e.preventDefault();finishTutorial();});
for(const kind of ['explore','prepare'])$('tutorial-'+kind).onclick=()=>startTutorial(kind);
function finishDialog(){if(!document.querySelector('dialog[open]')){paused=dialogWasPaused;last=performance.now();render();}}
let cardBookKind='all';
function renderCardBook(){const names={all:'すべて',target:'ターゲット',condition:'条件',action:'アクション',skill:'スキル'};const all=cardCodexRows(state),rows=all.filter(c=>cardBookKind==='all'||c.kind===cardBookKind);$('codex-title').textContent='カード図鑑';$('codex-note').textContent='未所持カードもすべて公開。取得記録は周回後も保持し、所持と効果はその旅だけ。全スキルは取得後、探索指示への配置が必要です。';$('codex-body').innerHTML='<div class="subtabs">'+Object.entries(names).map(([id,name])=>'<button data-card-book-kind="'+id+'" aria-pressed="'+(cardBookKind===id)+'">'+name+'</button>').join('')+'</div><p class="section-caption">この旅の所持 '+all.filter(c=>c.owned).length+' / '+all.length+' · 取得記録 '+all.filter(c=>c.discovered).length+'</p><div class="card-codex-grid">'+rows.map(c=>'<article class="item-card card-codex-item '+c.rarity+'" tabindex="0" title="'+esc(skillTitle(c,state))+'"><div><span class="rarity-badge '+c.rarity+'">'+c.rarity+'</span><strong>'+esc(c.name)+'</strong><small>'+esc(c.group)+' · '+(c.owned?'所持中':c.discovered?'過去に取得／現在未所持':'未取得')+'</small><p>'+esc(c.detail)+'</p>'+(skillSetActive(state,c.id)?'<small class="active-set-note">同テーマのオーグメント強化に寄与</small>':'')+'<small>入手：'+(c.id==='letter'?'通常エンド初回クリア後':c.initial?'旅の開始時':'宝箱')+(c.modifier&&c.kind==='skill'?' · 配置した条件の成立中に有効':'')+'</small></div></article>').join('')+'</div>';}
document.addEventListener('click',e=>{const b=e.target.closest('[data-card-book-kind]');if(b){cardBookKind=b.dataset.cardBookKind;renderCodex();}});
function renderCodex(){if(codexKind==='augments'){$('codex-title').textContent='オーグメント図鑑';$('codex-note').textContent='開始時・ボス撃破時に3択から選択。効果は旅ごとにリセット、取得記録は引き継ぎます。数値は仮バランス。';$('codex-body').innerHTML='<div class="augment-codex-grid">'+augments.map(a=>augmentCard(a,{state,status:(state.augments||[]).includes(a.id)?'所持中':state.profile.augments?.includes(a.id)?'過去に取得':'未取得'})).join('')+'</div>';return;}if(codexKind==='cards'){renderCardBook();return;}if(codexKind==='skills'){codexKind='cards';renderCardBook();return;}let rows=codexRows(state,codexKind);if(codexKind==='equipment')rows=rows.filter(r=>r.slot===codexSlot).sort((a,b)=>Number(b.known)-Number(a.known)||(a.known&&b.known?(codexSorts[codexSlot]==='acquired'?a.acquiredOrder-b.acquiredOrder:b[codexSorts[codexSlot]]-a[codexSorts[codexSlot]]):0));$('codex-title').textContent=codexKind==='monsters'?'モンスター図鑑':'装備図鑑';$('codex-note').textContent=codexKind==='monsters'?'視認した種類を登録。図鑑は基礎能力です。増援は長期滞在で強化されます。記録は周回でも引き継ぎます。':'入手した種類の名前と能力を登録。記録は周回でも引き継ぎます。';$('codex-body').innerHTML=(codexKind==='equipment'?categoryTabs('codex',codexSlot)+sortButtons('codex',codexSorts[codexSlot]):'')+`<p class="section-caption">公開済み ${rows.filter(r=>r.known).length} / ${rows.length}</p><table class="codex-table"><thead><tr><th>名前</th><th>攻撃</th><th>防御</th></tr></thead><tbody>${rows.map(r=>r.known?`<tr><td>${codexKind==='equipment'?'<span class="equipment-icon '+r.slot+'" aria-hidden="true"></span>':''}${esc(r.name)}${r.zone?`<small>${esc(r.zone)}</small>`:''}</td><td>${r.attack}</td><td>${r.defense}</td></tr>`:'<tr><td><span aria-label="未登録">？</span></td><td>―</td><td>―</td></tr>').join('')}</tbody></table>`;}
function showCodex(kind){codexKind=kind;renderCodex();openDialog('codex-dialog');}
const getRef=r=>r.startsWith('i')?Number(r.slice(1)):r;
$('tab-content').onclick=e=>{const b=e.target.closest('button');if(!b||b.disabled)return;if(b.hasAttribute('data-best-equipment')){equipBest(state);render();return;}if(b.dataset.category){const type=b.dataset.category;if(type==='gear')gearSlot=b.dataset.value;}else if(b.dataset.sort){gearSorts[gearSlot]=b.dataset.value;}else if(handleOrderClick(e,$('tab-content')))return;else if(b.dataset.upgrade){if(upgrade(state,b.dataset.upgrade))tone(550);}else if(b.dataset.action){const ref=getRef(b.dataset.ref);switch(b.dataset.action){case'equip':equip(state,ref);break;case'discard':discard(state,ref);break;}}render();};
$('live-orders').onclick=e=>handleOrderClick(e,$('live-orders'));
$('live-orders').onchange=handleOrderChange;
$('tab-content').onchange=handleOrderChange;
$('codex-body').onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.category)codexSlot=b.dataset.value;else if(b.dataset.sort)codexSorts[codexSlot]=b.dataset.value;renderCodex();};
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;document.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('active',x===b));renderTab();});
document.querySelectorAll('[data-speed]').forEach(b=>b.onclick=()=>{speed=Number(b.dataset.speed);document.querySelectorAll('[data-speed]').forEach(x=>x.classList.toggle('active',x===b));});
let memoryReveal=null;
function reset(next=newGame(undefined,state.profile)){memoryReveal=null;state=next;resetHeroVisual();paused=false;motion=null;last=performance.now();render();}
function playJourneyTeaser(done){
 if(pendingJourney)return;
 if(uiSettings.skipOpening||openingVariant(state.profile)!=='mukuro'){done();return;}
 pendingJourney=done;paused=true;dialogWasPaused=true;document.body.classList.add('watching-teaser');$('teaser-scene').hidden=false;$('teaser-retry').hidden=true;
 const video=$('journey-teaser');if(video.error){finishJourneyTeaser();return;}video.currentTime=0;syncTitleEffect();video.play().catch(()=>{$('teaser-retry').hidden=false;});$('teaser-skip').focus();syncSceneMusic();
}
function finishJourneyTeaser(){if(!pendingJourney)return;const done=pendingJourney;pendingJourney=null;$('journey-teaser').pause();$('teaser-scene').hidden=true;document.body.classList.remove('watching-teaser');done();}
$('journey-teaser').addEventListener('ended',finishJourneyTeaser);
$('journey-teaser').addEventListener('error',()=>{if(pendingJourney)finishJourneyTeaser();});
$('teaser-skip').onclick=finishJourneyTeaser;
$('teaser-retry').onclick=()=>{$('journey-teaser').play().then(()=>{$('teaser-retry').hidden=true;}).catch(()=>{});};
document.addEventListener('keydown',e=>{if(pendingJourney&&e.key==='Escape')finishJourneyTeaser();});
document.addEventListener('visibilitychange',()=>{if(!pendingJourney)return;const video=$('journey-teaser');if(document.hidden)video.pause();else video.play().catch(()=>{$('teaser-retry').hidden=false;});});
function startNewJourney(){tryMobileDisplay();playJourneyTeaser(()=>{showingTitle=false;reset(hasSave?newGame(undefined,state.profile):state);});}

$('title-new').onclick=()=>{if(hasSave)openDialog('new-game-dialog');else startNewJourney();};
$('confirm-new-game').onclick=()=>{$('new-game-dialog').close();startNewJourney();};
$('title-load').onclick=()=>{if(hasSave)openDialog('load-game-dialog');};
$('confirm-load-game').onclick=()=>{if(!hasSave)return;tryMobileDisplay();$('load-game-dialog').close();playJourneyTeaser(()=>{showingTitle=false;resetHeroVisual();paused=state.phase==='explore';dialogWasPaused=paused;last=performance.now();render();});};
$('title-option').onclick=()=>openDialog('options-dialog');
$('return-title').onclick=()=>{paused=true;dialogWasPaused=true;save();showingTitle=true;motion=null;$('options-dialog').close();render();};
$('primary').onclick=()=>{if(state.phase==='explore')return;if(state.phase==='awakening'){if(!memoryReveal){memoryReveal={player:new SubtitlePlayer(awakeningLines(state.profile.normalClears)),last:performance.now()};$('awakening-text').textContent='';$('awakening-caret').hidden=true;render();}return;}if(state.phase==='prepare'){beginExploration(state);paused=false;last=performance.now();tone();}else if(state.phase==='cleared'){ascend(state);motion=null;tone(440);}else reset();render();if(state.phase==='explore')tryMobileDisplay();};
const askAbandon=()=>{if(['prepare','explore'].includes(state.phase))openDialog('abandon-dialog');};$('abandon-run').onclick=askAbandon;$('explore-abandon').onclick=askAbandon;
$('confirm-abandon').onclick=()=>{const next=abandonRun(state);if(!next)return;$('abandon-dialog').close();reset(next);};
$('pause-toggle').onclick=()=>{if(state.phase!=='explore')return;paused=!paused;last=performance.now();render();if(!paused)tryMobileDisplay();};
$('skip-opening').onchange=()=>{uiSettings=saveUiSettings(uiStorage,{...uiSettings,skipOpening:$('skip-opening').checked});};
$('minimap-size').onchange=()=>{uiSettings=saveUiSettings(uiStorage,{...uiSettings,minimap:$('minimap-size').value});document.documentElement.dataset.minimapSize=uiSettings.minimap;drawAutoMap();};
 document.addEventListener('click',e=>{if(e.target.closest('[data-forecast-run]'))refreshForecast(true);if(e.target.closest('[data-orders-undo]')&&state.phase==='prepare'&&forecastContext){state.orders=structuredClone(initialOrders);render();}});
 document.addEventListener('change',e=>{if(e.target.id==='forecast-samples'){forecastSamples=Number(e.target.value);refreshForecast(true);}});
 $('sound').onclick=()=>{sound=!sound;$('sound').setAttribute('aria-pressed',String(sound));$('sound').setAttribute('aria-label',sound?'効果音を無効にする':'効果音を有効にする');$('sound').textContent='効果音：'+(sound?'ON':'OFF');tone(440);};
$('augment-book').onclick=()=>showCodex('augments');$('skill-book').onclick=()=>showCodex('cards');$('monster-book').onclick=()=>showCodex('monsters');$('equipment-book').onclick=()=>showCodex('equipment');
$('help').onclick=()=>openDialog('dialog');$('close-dialog').onclick=()=>$('dialog').close();$('guide-start').onclick=()=>$('dialog').close();
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$(b.dataset.close).close());document.querySelectorAll('dialog').forEach(d=>d.addEventListener('close',finishDialog));
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state.phase==='explore'){paused=true;dialogWasPaused=true;render();}});
function debugStatus(message=''){ $('debug-status').textContent=`${floorLabel(state)} · Lv.${state.level} · EXP ${state.experience} · HP ${state.hp}/${stats(state).maxHp} · ${state.shards}pt${state.debugUsed?' · DEBUG操作済み':''}${message?' — '+message:''}`;}
function displayMessage(text){$('fullscreen-status').textContent=text;$('landscape-status').textContent=text||'端末を横向きにしてください。';$('mobile-display').textContent=text||'横向きで全画面表示';}
async function enterDisplay(){
 const result=await requestLandscapeDisplay(document.documentElement,screen.orientation);ownsFullscreen=result.fullscreen;lockedOrientation=result.landscape;
 displayMessage(result.landscape?'横向きの全画面表示中です。':result.fullscreen?'全画面表示中です。端末を横向きにしてください。':'全画面に切り替えられませんでした。端末を横向きにして続けてください。');
 $('fullscreen-open').textContent=result.fullscreen?'全画面表示を終了':'横向きで全画面表示';
}
function tryMobileDisplay(){if(!autoDisplayAttempted&&matchMedia('(pointer: coarse)').matches&&!document.fullscreenElement){autoDisplayAttempted=true;void enterDisplay();}}
$('fullscreen-open').onclick=()=>{if(document.fullscreenElement)document.exitFullscreen?.().catch(()=>{});else void enterDisplay();};
$('mobile-display').onclick=()=>void enterDisplay();
$('landscape-fullscreen').onclick=()=>{autoDisplayAttempted=true;void enterDisplay();};
$('landscape-gate').addEventListener('cancel',e=>{if(document.documentElement.dataset.landscapeRequired==='true')e.preventDefault();});
function syncSceneViewport(){
 const layout=sceneLayout(innerWidth,innerHeight,matchMedia('(pointer: coarse)').matches),root=document.documentElement;root.style.setProperty('--game-scene-scale',layout.scale);root.dataset.landscapeRequired=String(layout.portrait);
 const gate=$('landscape-gate');if(layout.portrait&&!gate.open){paused=true;dialogWasPaused=true;gate.showModal();if(state.phase==='explore')render();}else if(!layout.portrait&&gate.open)gate.close();
}
addEventListener('resize',syncSceneViewport);window.visualViewport?.addEventListener('resize',syncSceneViewport);document.addEventListener('fullscreenchange',syncSceneViewport);syncSceneViewport();
document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement){if(lockedOrientation)screen.orientation?.unlock?.();lockedOrientation=false;ownsFullscreen=false;$('fullscreen-open').textContent='横向きで全画面表示';displayMessage('横向きで全画面表示');}});
$('status-open').onclick=()=>openDialog('status-dialog');
$('prepare-status').onclick=()=>openDialog('status-dialog');
$('prepare-forecast').onclick=()=>{if(state.phase==='prepare'){openDialog('forecast-dialog');refreshForecast();}};
$('prepare-journal').onclick=()=>openDialog('prep-journal-dialog');
$('sound-volume').oninput=e=>{volume=Number(e.target.value);$('volume-value').textContent=volume+'%';};
$('sound-volume').onchange=()=>tone(440);
$('options-open').onclick=()=>openDialog('options-dialog');
$('debug-open').onclick=()=>{$('debug-floor').innerHTML=Array.from({length:LAST_FLOOR},(_,i)=>`<option value="${i+1}" ${state.floor===i+1?'selected':''}>B${LAST_FLOOR-i}</option>`).join('');$('debug-gear').innerHTML=equipment.map(g=>`<option value="${g.id}">${g.name}</option>`).join('');$('debug-reward').innerHTML=rewardDefinitions.map(r=>`<option value="${r.id}">${r.name}</option>`).join('');debugStatus();openDialog('debug-dialog');};
$('debug-dialog').addEventListener('click',e=>{const b=e.target.closest('[data-debug]');if(!b)return;let message='';switch(b.dataset.debug){case'music-preview':musicAudition=$('debug-music-scene').value;$('debug-music-status').textContent='試聴中：'+bgm.tracks[musicAudition].split('/').at(-1).split('?')[0];syncSceneMusic();return;case'music-stop':musicAudition=null;$('debug-music-status').textContent='元の場面のBGMへ戻しました。';syncSceneMusic();return;case'ending-preview':subtitlePreviewKind=$('debug-subtitle-kind').value;endingPreview=true;endingPlayback=null;musicAudition=null;for(const d of document.querySelectorAll('dialog[open]'))d.close();render();return;case'title-ending':debugTitleEnding(state,!state.profile.trueEnding);message=state.profile.trueEnding?'倅の旅路タイトル：'+TRUE_END_UNIMPLEMENTED_NOTICE:'骸の旅路タイトル';break;case'jump':debugJump(state,Number($('debug-floor').value));break;case'next':debugJump(state,Math.min(LAST_FLOOR,state.floor+1));break;case'previous':debugJump(state,Math.max(1,state.floor-1));break;case'reinforcements':state.debugUsed=true;state.debugNoReinforcements=!state.debugNoReinforcements;message='増援を'+(state.debugNoReinforcements?'停止':'再開')+'しました';break;case'experience':{const gained=gainExperience(state,10);state.debugUsed=true;message=state.level===MAX_LEVEL&&!gained?'最大レベル':`経験値+10 / Lv.${state.level}${gained?' / HP +'+gained*HP_PER_LEVEL:''}`;break;}case'augment':grantReward(state,$('debug-augment').value);state.debugUsed=true;message='オーグメントを取得しました';break;case'heal':debugHeal(state);break;case'shards':debugShards(state);break;case'skills':debugSkills(state);break;case'reward':{const id=$('debug-reward').value;grantReward(state,id);state.debugUsed=true;message='報酬を取得';break;}case'equipment':if(!debugEquipment(state,$('debug-gear').value,{plus:Number($('debug-plus').value),identified:true}))message='強化値は0〜20の整数にしてください';break;case'export':{const url=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`abyss-save-${floorLabel(state).replace(/ /g,'-')}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);message='セーブを書き出しました';break;}case'reset-run':if(confirm('現在の旅を初期化しますか？ 図鑑と通常エンド達成は残します。'))reset();break;case'reset-all':if(confirm('このゲームの全セーブ・図鑑・通常エンド達成・旧版・バックアップを削除します。元に戻せません。初期化しますか？')){try{for(const k of Object.keys(localStorage))if(k===key||k.startsWith(key+'-')||k==='abyss-prototype-v1'||k==='abyss-order-presets-v1')localStorage.removeItem(k);state=newGame();resetHeroVisual();motion=null;paused=true;message='全データを初期化しました';}catch{message='保存領域にアクセスできず初期化できませんでした';}}break;}
 motion=null;save();render();debugStatus(message);});
$('debug-import').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{const loaded=normalizeSave(JSON.parse(await file.text()));if(!loaded)throw Error('このゲームの有効なセーブではありません');if(confirm('選択したセーブで現在の進行と図鑑・達成記録を置き換えますか？')){try{localStorage.setItem(key+'-before-import',JSON.stringify(state));}catch{}state=loaded;resetHeroVisual();motion=null;paused=true;dialogWasPaused=true;save();render();debugStatus('セーブを読み込みました');}}catch(err){debugStatus('読み込み失敗：'+err.message);}e.target.value='';};
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
function loop(t){if(endingPlayback){if(!document.hidden&&!document.querySelector('dialog[open]'))endingPlayback.player.update(Math.max(0,Math.min(100,t-endingPlayback.last)));endingPlayback.last=t;renderNormalEnding();}if(memoryReveal){if(state.phase!=='awakening'||showingTitle)memoryReveal=null;else{if(!document.hidden&&!document.querySelector('dialog[open]'))memoryReveal.player.update(Math.max(0,Math.min(100,t-memoryReveal.last)));memoryReveal.last=t;$('awakening-text').textContent=memoryReveal.player.text;$('awakening-hint').textContent='';$('awakening-caret').hidden=!memoryReveal.player.full;}} const visualActive=!showingTitle&&!endingPreview&&(state.phase==='dead'||state.phase==='explore'&&!paused&&!document.querySelector('dialog[open]'));if(visualActive&&lastVisualTime!==null)heroClock+=Math.max(0,Math.min(100,t-lastVisualTime));lastVisualTime=t;if(!showingTitle&&!endingPreview&&state.phase==='explore'&&!paused&&!document.querySelector('dialog[open]')&&t-last>420/speed){last=t;const old=state.phase;motion={from:{...state.player},time:t,duration:reducedMotion.matches?1:Math.min(190,340/speed)/Math.min(1,speed)};tick(state);if(Math.abs(state.player.x-heroVisual.x)+Math.abs(state.player.y-heroVisual.y)>1)heroVisual.teleport(state.player.x,state.player.y,heroClock);else heroVisual.moveTo(state.player.x,state.player.y,heroClock,motion.duration);const heroHit=(state.damageEvents||[]).find(e=>!e.hero);if(heroHit)heroVisual.attackTo(heroHit.x,heroHit.y,heroClock,characterAttackDuration(heroSheet?.definition,speed));damagePopups=queueDamage(damagePopups,state.damageEvents||[],t);if(Math.abs(state.player.x-motion.from.x)+Math.abs(state.player.y-motion.from.y)>1)motion=null;if(state.flash?.kind==='hit')tone(180);if(state.phase!==old){motion=null;if(state.phase==='dead')heroVisual.die(heroClock);else heroVisual.teleport(state.player.x,state.player.y,heroClock);tone(state.phase==='dead'?110:660);}render();}if(state.phase==='explore'&&(!paused||motion&&t-motion.time<motion.duration+50)||damagePopups.length||state.phase==='dead'&&heroClock-heroVisual.since<800)draw();requestAnimationFrame(loop);}
new ResizeObserver(()=>draw()).observe($('map'));
const hudObserver=new ResizeObserver(()=>{const wrap=$('map-wrap'),gap=wrap.clientWidth<=480?8:20;$('workspace').style.setProperty('--shared-hud-space',($('hud-top').offsetTop+$('hud-top').offsetHeight+gap)+'px');wrap.style.setProperty('--hud-top-space',($('hud-top').offsetHeight+gap)+'px');wrap.style.setProperty('--hud-bottom-space',($('hud-bottom').offsetHeight+gap)+'px');const available=wrap.clientHeight-$('hud-top').offsetHeight-$('hud-bottom').offsetHeight-$('field-log-host').offsetHeight-52;wrap.style.setProperty('--minimap-limit',Math.max(64,(available-22)*31/23)+'px');});hudObserver.observe($('hud-top'));hudObserver.observe($('hud-bottom'));hudObserver.observe($('field-log-host'));
installCardDragging($('tab-content'),()=>state,()=>{delete $('tab-content').dataset.orderSignature;render();});
drawHeroPortraits();render();requestAnimationFrame(loop);

await Promise.all([...['title-background','title-logo'].map(id=>$(id).decode().catch(()=>{})),cryptAtlas.decode().catch(()=>{}),propsAtlas.decode().catch(()=>{}),heroAssetsReady,wallAssetsReady]);draw();
