import {playEndingTitleTransition} from './ending-title-transition.js';
import {drawTrapEffects,trapEffectAlive} from './trap-effects.js';
import{createTutorialSpotlight}from'./tutorial-spotlight.js';
import{equipmentPanel}from'./equipment-panel.js';
import{activeOrderCount}from'./order-capacity.js';
import{extensionTree}from'./extension-view.js';
import{extensionOwned,rerollCount,unlockExtension,rerollAugment,startExchange,chooseExchange,canUsePotion,usePotion}from'./extensions.js';
import{createOrderHistory}from'./order-history.js';
import{createFogEffect}from'./fog-effect.js';
import{createEnemyIdleSampler,enemyIdleCuts}from'./enemy-idle.js';
import{idleFootstepSample}from'./character-animation.js';
import{heroAttackAim,createCombatFeedback,queueCombatFeedback,advanceCombatFeedback,hitPresentation,combatShake,feedbackGhosts,ghostOpacity,drawCombatFeedback,drawCombatTrails}from'./combat-feedback.js';
import{SKILL_EFFECT_FORMAT,SKILL_EFFECT_IMAGES}from'./skill-effect-art.js';
import{captureEffectActors,enqueueSkillEffects,skillEffectFrame,heroSkillCenter,enemySkillCenter,drawSkillEffects}from'./skill-effects.js';
import{houseEntryReady,captureFieldMessages,collectFieldMessages,installFieldMessages,bossMemoryMessage}from'./field-messages.js';
import{drawReadableProp}from'./readable-props.js';
import{TRAPS,trapType}from'./traps.js';
import{queueEnemyAttacks,enemyAttackDuration,enemyAttackPresentation,enemyAttackFrame,drawEnemyAttackEffect}from'./enemy-attack-animation.js';
import{buildThemes,themedSkillById}from'./build-themes.js';
import{installHoverHelp}from'./hover-help.js';
import{THEME_IMAGES}from'./augment-art.js';
import{skillSetActive}from'./set-bonuses.js';
import{setRibbon,themeIcon,skillTitle}from'./theme-view.js';
import{installTacticsUi}from'./tactics-ui.js';
import{compareForecast,createPreparationBaseline}from'./forecast-comparison.js';
import {screenTutorials,tutorialSteps as floorTutorialSteps,tutorialKey,isTutorialJourney} from './screen-tutorial.js';
import{augmentCard,augmentChip}from'./augment-view.js';
import{augments,augmentById,chooseAugment}from'./augments.js';
import {SubtitlePlayer} from './subtitle-player.js';
import {SceneMusic,musicScene} from './scene-music.js';
import {normalEndingLines} from './normal-ending.js';
import {awakeningLines} from './awakening.js';
import{cardByKey,cardCodexRows}from'./card-catalog.js';
import{chestPresentation,drawLegendaryChestEffect}from'./chest-view.js';
import {enemyFrame,drawEnemySprite,drawEnemyLabel,layoutEnemyLabels} from './enemy-view.js';
import {skinById,nextPreparationSkin} from './preparation-skins.js';
import {CharacterAnimation,loadCharacterSheet,drawCharacter,characterFrame,characterPresentation,characterAttackDuration} from './character-animation.js';
import {loadWallTilesets,wallDrawBox} from './wall-tileset.js';
import {entranceWallFrames} from './entrance-view.js';
import {readUiSettings,saveUiSettings,resetJourneyTutorials} from './ui-settings.js';
import {forecastExploration,forecastSignature} from './exploration-forecast.js';
import {forecastSummary} from './forecast-view.js';
import {MEMORY_SHADE,floorLight,drawSightWall,actorFootOffset,renderSightState,drawExplorationLight,shadeSightFloor} from './scene-lighting.js';
import {standingBox,sceneDrawOrder,drawFootShadow} from './scene-depth.js';
import {drawProp,drawMapProp} from './prop-view.js';
import {drawFloorTexture,drawRaisedWall,tintedWallTileset} from './terrain-view.js';
import {requestLandscapeDisplay,sceneLayout} from './display-mode.js';
import {openingVariant,TRUE_END_UNIMPLEMENTED_NOTICE} from './opening.js';
import {createLogVisibility} from './log-visibility.js';
import {queueDamage,damageFrame} from './damage-view.js';
import {renderCardEditor,handleCardClick,handleCardChange,installCardDragging} from './card-editor.js';
import {autoMapModel,cameraFor,cameraSight,miniMapGeometry,drawMiniMap} from './map-view.js';
import {thoughtText} from './thought-view.js';
import {displayStoryText,openingThought,letterFloorThought,WILL_UNLOCK_LINE} from './story-text.js';
import {debugBeforeWillChest,debugJump,debugHeal,debugShards,debugSkills,debugEquipment,debugTitleEnding} from './debug-tools.js';
import {W,H,skills,newGame,abandonRun,stats,price,upgrade,equip,equipBest,tick,ascend,zoneFor,floorLabel,radius,canSee,gearById,gearStats,gearName,discard,locked,codexRows,sortedInventory,normalizeSave,orderDefinitions,orderById,orderCapacity,cardCapacity,orderUnlocked,addOrder,editOrder,beginExploration,equipment,LAST_FLOOR,LETTER_FLOOR,nextStageHint,rewardDefinitions,grantReward,experienceToNext,MAX_LEVEL,HP_PER_LEVEL,gainExperience} from './engine.js';
const launchParams=new URLSearchParams(location.search);
const verificationMode=launchParams.get('verify')==='1';if(verificationMode)document.querySelectorAll('video,audio').forEach(el=>{el.muted=true;});
const $=id=>document.getElementById(id), key='abyss-normal-v2';
let uiStorage;try{uiStorage=localStorage;}catch{}let uiSettings=readUiSettings(uiStorage);document.documentElement.dataset.minimapSize=uiSettings.minimap;$('minimap-size').value=uiSettings.minimap;$('skip-opening').checked=uiSettings.skipOpening;
function applyPreparationSkin(){const skin=skinById(uiSettings.preparationSkin);document.documentElement.dataset.preparationSkin=skin.id;for(const [key,value]of Object.entries(skin))if(['accent','edge','panel','text'].includes(key))document.documentElement.style.setProperty('--prep-theme-'+key,value);$('preparation-skin').textContent='スキン：'+skin.name;$('preparation-skin').title='次のスキン：'+nextPreparationSkin(skin.id).name;}
applyPreparationSkin();$('preparation-skin').onclick=()=>{uiSettings=saveUiSettings(uiStorage,{...uiSettings,preparationSkin:nextPreparationSkin(uiSettings.preparationSkin).id});applyPreparationSkin();};
const bgm=new SceneMusic($('scene-bgm'),$('scene-bgm').dataset);
let titleTransitionPreview=false;
let endingPreview=false,endingPlayback=null,subtitlePreviewKind='first-end',musicAudition=null;
function syncSceneMusic(){bgm.configure({enabled:!verificationMode&&!titleTransitionPreview&&uiSettings.bgmEnabled,volume:uiSettings.bgmVolume,hidden:document.hidden});bgm.select(musicAudition||(endingPreview?(subtitlePreviewKind.endsWith('intro')?'opening':'ending'):musicScene(state,{title:showingTitle,teaser:Boolean(pendingJourney),houseEntered:Boolean(state.gimmick?.triggered)&&!fieldMessages.waiting}))); }
function paintMusicOptions(){$('bgm-toggle').textContent='BGM：'+(uiSettings.bgmEnabled?'ON':'OFF');$('bgm-toggle').setAttribute('aria-pressed',String(uiSettings.bgmEnabled));$('bgm-volume').value=uiSettings.bgmVolume;$('bgm-volume-value').textContent=uiSettings.bgmVolume+'%';}
function paintBrightness(){$('screen-brightness').value=uiSettings.brightness-50;$('screen-brightness-value').textContent=(uiSettings.brightness-50)+'%'+(uiSettings.brightness===100?'（標準）':'');}paintBrightness();$('screen-brightness').oninput=()=>{uiSettings=saveUiSettings(uiStorage,{...uiSettings,brightness:Number($('screen-brightness').value)+50});paintBrightness();draw();};
$('screen-shake').checked=uiSettings.screenShake;$('screen-shake').onchange=()=>{uiSettings=saveUiSettings(uiStorage,{...uiSettings,screenShake:$('screen-shake').checked});};
paintMusicOptions();document.addEventListener('pointerdown',()=>bgm.unlock(),{capture:true});document.addEventListener('keydown',()=>bgm.unlock(),{capture:true});document.addEventListener('visibilitychange',()=>syncSceneMusic());
function renderNormalEnding(){
 const active=endingPreview||(!showingTitle&&state.phase==='ending');document.body.classList.toggle('ending-cinema',active);$('normal-ending').hidden=!active;
 if(!active){endingPlayback=null;return;}
 const intro=endingPreview&&subtitlePreviewKind.endsWith('intro'),clears=endingPreview?(subtitlePreviewKind.startsWith('later')?2:1):state.profile.normalClears;
 const ending=endingPreview?(subtitlePreviewKind==='missed-end'?'missed':clears>1?'will':'first'):(state.runEnding||(clears>1?'missed':'first'));
 const key=endingPreview?'preview:'+subtitlePreviewKind:state.seed+':'+clears+':'+ending;if(endingPlayback?.key!==key)endingPlayback={key,player:new SubtitlePlayer(intro?awakeningLines(clears>1?1:0):normalEndingLines(clears,ending)),last:performance.now()};
 const player=endingPlayback.player,done=player.done;
 if(done&&!endingPreview&&ending==='will'){
  playEndingTitleTransition($('title-scene'));
  showingTitle=true;
  render();
  return;
 }
 $('normal-ending').classList.toggle('is-memory',intro||ending!=='will'&&player.index>=3&&!done);$('normal-ending').classList.toggle('is-intro',intro);$('ending-image').hidden=intro||ending==='will';
 const willScene=!intro&&ending==='will';
 const collapse=$('will-ending-collapse'),reading=$('will-ending-reading');
 collapse.hidden=!willScene;
 reading.hidden=!willScene;
 reading.classList.toggle('is-visible',willScene&&(player.index>=4||done));
 if(willScene)reading.loading='eager';
 $('ending-text').textContent=player.text;$('ending-caret').hidden=!player.full||done;$('ending-subtitle').hidden=done;$('ending-result').hidden=!done;$('ending-skip').hidden=done;$('ending-advance').hidden=done;$('ending-hint').hidden=done;$('ending-hint').textContent='';
 $('ending-heading').textContent=intro?'字幕の確認':ending==='will'?'残された遺書':'届かなかった声';
 $('ending-label').textContent=endingPreview?'PREVIEW':ending==='will'?'TRUE END':'NORMAL END';
 $('ending-next').textContent=endingPreview?'確認を終える':ending==='will'?'タイトルへ':'次の旅へ';
 $('ending-result-note').textContent=endingPreview?'プレビュー：達成記録・現在の旅は変更しません。':ending==='will'?'遺書は、息子の手に渡った。':ending==='first'?WILL_UNLOCK_LINE:'次の旅では、B30の遺書を持って地上へ。';
}
$('ending-advance').onclick=()=>{endingPlayback?.player.advance();renderNormalEnding();};
$('ending-skip').onclick=()=>{endingPlayback?.player.finish();renderNormalEnding();};
$('ending-next').onclick=()=>{if(endingPreview){endingPreview=false;endingPlayback=null;render();}else reset();};
$('awakening-advance').onclick=()=>{if(!memoryReveal)return;memoryReveal.player.advance();if(memoryReveal.player.done){memoryReveal=null;beginExploration(state);paused=false;last=performance.now();render();tryMobileDisplay();}else{$('awakening-text').textContent=memoryReveal.player.text;}};
$('debug-dialog').addEventListener('close',()=>{musicAudition=null;syncSceneMusic();});
$('ending-options').onclick=()=>openOptions();
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
let state,tab='orders',speed=1,paused=false,last=0,sound=uiSettings.soundEnabled,volume=uiSettings.soundVolume,audio,motion=null,dialogWasPaused=false,gearSlot='weapon',gearSorts={weapon:'acquired',armor:'acquired'},codexKind='monsters',codexSlot='weapon',codexSorts={weapon:'acquired',armor:'acquired'};

const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
try{const data=JSON.parse(localStorage.getItem(key));state=normalizeSave(data);if(state){hasSave=true;paused=state.phase==='explore';if(data.version!==state.version){try{const backup=key+'-v'+data.version+'-before-ui';if(!localStorage.getItem(backup))localStorage.setItem(backup,JSON.stringify(data));}catch{}}}}catch{}
state ||= newGame();
function save(){try{localStorage.setItem(key,JSON.stringify(state,(name,value)=>['damageEvents','actorSkillEvent'].includes(name)?undefined:value));hasSave=true;$('save-status').textContent='端末に保存済み';return true;}catch{$('save-status').textContent='保存できません（空き容量・設定）';return false;}}
const fieldSounds=Object.fromEntries(Object.entries({
 swing:'01-sword-swing',critical:'02-critical-double-swing',skill:'03-skill-cast',
 hurt:'04-hero-hurt',trap:'05-trap-step',pickup:'06-pickup',heal:'07-heal'
}).map(([cue,name])=>[cue,new Audio('./art/sfx/'+name+'.wav')]));
function playFieldSound(cue){
 if(verificationMode||!sound||volume===0||document.hidden||$('debug-dialog').open)return;
 const clip=fieldSounds[cue];
 clip.volume=volume/100;
 clip.currentTime=0;
 clip.play().catch(()=>{});
}
function tone(freq=330){if(verificationMode||!sound||volume===0)return;try{audio ||= new AudioContext();audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.type='triangle';o.frequency.value=freq;g.gain.setValueAtTime(volume/100*.1,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.15);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+.15);}catch{}}
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
const readableAtlas=new Image();
const potionStockIcon=$('potion-stock-icon');
readableAtlas.addEventListener('load',()=>drawReadableProp(potionStockIcon.getContext('2d'),readableAtlas,'potion',0,0));
readableAtlas.src=$('map').dataset.readableProps;
const trapAtlas=new Image();trapAtlas.src=$('map').dataset.traps;
const mapItemsAtlas=new Image();mapItemsAtlas.src=$('map').dataset.mapItems;
const propsAtlas=new Image();propsAtlas.src=$('map').dataset.props;document.documentElement.style.setProperty('--prop-atlas','url("'+propsAtlas.src+'")');
const redChestAtlas=new Image();redChestAtlas.src=$('map').dataset.redChest;
const enemyAtlas=new Image();enemyAtlas.src=$('map').dataset.enemies;
const sampleEnemyIdle=createEnemyIdleSampler();let idleCuts=Array(25).fill(54);const fogEffect=createFogEffect();
const enemyFlashAtlas=document.createElement('canvas');enemyFlashAtlas.width=enemyFlashAtlas.height=320;enemyAtlas.addEventListener('load',()=>{const c=enemyFlashAtlas.getContext('2d');c.clearRect(0,0,320,320);c.drawImage(enemyAtlas,0,0);idleCuts=enemyIdleCuts(c.getImageData(0,0,320,320).data);c.globalCompositeOperation='source-in';c.fillStyle='#fff';c.fillRect(0,0,320,320);c.globalCompositeOperation='source-over';});
const CELL=64;
const palette={h:'#57695a',b:'#e2dfbd',d:'#27352f',a:'#899e85',s:'#b8b2a1',g:'#3e715f',l:'#9bbba6',r:'#66424a',p:'#ad7276',y:'#bfa266',o:'#634e32',Y:'#e3d49d'};
function sprite(ctx,type,x,y,size=CELL,height=size){if(drawReadableProp(ctx,readableAtlas,type,x,y,size,height)||drawMapProp(ctx,mapItemsAtlas,type,x,y,size,height)||drawProp(ctx,propsAtlas,type,x,y,size,height))return;if((type==='slime'||type==='brute')&&enemyAtlas.complete&&enemyAtlas.naturalWidth===128&&enemyAtlas.naturalHeight===64){ctx.imageSmoothingEnabled=false;ctx.drawImage(enemyAtlas,type==='slime'?0:64,0,64,64,x,y,size,height);return;}const rows=sprites[type]||(['tombstone','tombstone-cracked'].includes(type)?['............','....aaaa....','...abbbba...','..abbbbbba..','..abdbbbba..','..abbdbbba..','..abbbbbba..','..abbbbbba..','..abbbbbba..','.aabbbbbbaa.','.aaaaaaaaaa.','............']:sprites.reward);const scale=size/12,scaleY=height/12;for(let py=0;py<rows.length;py++)for(let px=0;px<rows[py].length;px++){const c=rows[py][px];if(c!=='.'&&palette[c]){ctx.fillStyle=palette[c];ctx.fillRect(x+px*scale,y+py*scaleY,Math.ceil(scale),Math.ceil(scaleY));}}}
const ctx=$('map').getContext('2d');ctx.imageSmoothingEnabled=false;
const cryptAtlas=new Image();cryptAtlas.src=$('map').dataset.terrain;
let entranceGrid=null,entranceFrames=new Map();
let combat=createCombatFeedback();
let enemyAttacks=[],skillEffects=[],trapEffects=[],skillEffectScene='';
const trapEffectAtlas=new Image();trapEffectAtlas.src=$('map').dataset.trapEffects;
const skillEffectAtlases=new Map();
const loadSkillEffectAssets=()=>Promise.all(Object.entries(SKILL_EFFECT_IMAGES).map(async([id,url])=>{const image=new Image();image.src=url;try{await image.decode();skillEffectAtlases.set(id,image);}catch(error){console.error('Skill effect atlas:',id,error);}}));
let heroSheet=null,heroVisual=new CharacterAnimation(),heroClock=0,idleClock=0,heroScene='',lastVisualTime=null;
const heroAssetsReady=loadCharacterSheet($('map').dataset.hero).then(sheet=>{heroSheet=sheet;drawHeroPortraits();}).catch(error=>console.error('Character sheet:',error));
function resetHeroVisual(){combat=createCombatFeedback();damagePopups=[];enemyAttacks=[];skillEffects=[];trapEffects=[];skillEffectScene='';heroVisual=new CharacterAnimation({x:state.player.x,y:state.player.y});heroClock=0;idleClock=0;heroScene='';lastVisualTime=null;}
function drawHeroPortraits(){if(!heroSheet)return;const d=heroSheet.definition,f=characterFrame(d,0,0),[px,py,pw,ph]=d.portrait||[0,0,f.width,f.height];for(const id of ['portrait','camp-portrait']){const canvas=$(id),c=canvas.getContext('2d'),scale=Math.min(canvas.width/pw,canvas.height/ph);c.clearRect(0,0,canvas.width,canvas.height);c.imageSmoothingEnabled=false;c.drawImage(heroSheet.image,f.x+px,f.y+py,pw,ph,(canvas.width-pw*scale)/2,(canvas.height-ph*scale)/2,pw*scale,ph*scale);}}
let wallSets=new Map();const wallAssetsReady=loadWallTilesets($('map').dataset.walls.split(/\s+/)).then(sets=>{wallSets=sets;}).catch(error=>console.error('Wall tileset:',error));
const gambleChestIcon=new Image();gambleChestIcon.src=THEME_IMAGES.gambler;
function draw(){
 if(showingTitle||pendingJourney||endingPreview)return;
 if(!['explore','dead','cleared'].includes(state.phase)){combat.events=[];damagePopups=[];}
 const effectScene=[state.seed,state.profile.runs,state.floor].join(':');if(skillEffectScene!==effectScene){skillEffectScene=effectScene;skillEffects=[];trapEffects=[];}if(!['explore','dead','cleared'].includes(state.phase)){skillEffects=[];trapEffects=[];}
 trapEffects=trapEffects.filter(event=>trapEffectAlive(event,heroClock));skillEffects=skillEffects.filter(e=>skillEffectFrame(e,heroClock,SKILL_EFFECT_FORMAT).alive);
 const scene=state.seed+':'+state.floor;if(damageScene!==scene){damagePopups=[];enemyAttacks=[];damageScene=scene;combat=createCombatFeedback(heroClock);}enemyAttacks=enemyAttacks.filter(a=>state.enemies.includes(a.actor)&&enemyAttackFrame(a,combat.actorTime).alive);if(!['explore','dead'].includes(state.phase))enemyAttacks=[];
 if(heroScene!==scene||heroVisual.x!==state.player.x||heroVisual.y!==state.player.y){heroScene=scene;heroVisual.teleport(state.player.x,state.player.y,combat.actorTime);}
 const restingPose=state.phase==='explore'&&!fieldMessages.waiting&&(paused||Boolean(document.querySelector('dialog[open]')));
 const heroFrame=idleFootstepSample(heroVisual.sample(combat.actorTime,{reducedMotion:reducedMotion.matches}),idleClock,restingPose);
 const map=$('map');if(map.width!==1920||map.height!==1080){map.width=1920;map.height=1080;ctx.imageSmoothingEnabled=false;}
 ctx.fillStyle='#0c1416';ctx.fillRect(0,0,map.width,map.height);const theme=zoneFor(state);
 const progress=motion&&state.phase==='explore'?Math.min(1,(combat.actorTime-motion.time)/motion.duration):1,eased=1-Math.pow(1-progress,3);
 const position=motion?{x:motion.from.x+(state.player.x-motion.from.x)*eased,y:motion.from.y+(state.player.y-motion.from.y)*eased}:state.player;
 const appearance={position:state.player,radius:radius(state),size:CELL,smooth:true};
 const sightState=renderSightState(state,position),visible=(x,y)=>canSee(sightState,x,y);
 const moving=motion&&(motion.from.x!==state.player.x||motion.from.y!==state.player.y),hop=moving?Math.sin(progress*Math.PI)*CELL/12:0;
 const camera=cameraFor(position,cameraSight(state),map.width,map.height);ctx.save();ctx.scale(camera.scale,camera.scale);ctx.translate(-camera.left,-camera.top);const shake=combatShake(combat,{enabled:uiSettings.screenShake,reducedMotion:reducedMotion.matches,size:CELL});ctx.translate(shake.x,shake.y);
 const graves=new Set((state.obstacles||[]).map(o=>o.x+','+o.y)),surface=state.grid.map((r,y)=>r.map((v,x)=>(v||graves.has(x+','+y))?1:0)),queue=[];
 if(entranceGrid!==state.grid){entranceGrid=state.grid;entranceFrames=entranceWallFrames(surface);}
 for(let y=0;y<state.grid.length;y++)for(let x=0;x<state.grid[y].length;x++){
  if((x+1)*CELL<camera.left||x*CELL>camera.left+map.width/camera.scale||(y+1)*CELL<camera.top||(y-1)*CELL>camera.top+map.height/camera.scale)continue;
  const floor=Boolean(surface[y][x]),light=floorLight(state.seen[y][x],visible(x,y));if(floor&&light==='hidden')continue;const px=x*CELL,py=y*CELL,n=(x*17+y*31+state.seed)%13;
  if(!(floor&&drawFloorTexture(ctx,cryptAtlas,x,y,theme.index,CELL))){
   ctx.fillStyle=floor?theme.floorColor:'#0c1416';ctx.fillRect(px,py,CELL,CELL);
   if(floor&&n<4){ctx.fillStyle='#435044';ctx.fillRect(px+13+n*2,py+21,5,5);}
  }
  // Continuous world lighting below shades floors and raised walls together.
  if(!floor)queue.push({footY:(y+1)*CELL,layer:0,x,draw(){ctx.save();ctx.globalAlpha=1;const walls=tintedWallTileset(wallSets.get(theme.id)||wallSets.get('*'),theme.wallColor);drawSightWall(ctx,walls,wallDrawBox(surface,x,y,walls?.definition.rise??.75,CELL),CELL,visible,lit=>drawRaisedWall(ctx,lit,surface,x,y,state.seed,theme,CELL,entranceFrames.get(x+','+y)),appearance);ctx.restore();}});
 }
 const stair=state.stairs;
 for(const t of state.traps||[])if(t.revealed&&(state.gimmick?.id==='traps'||state.seen[t.y][t.x])){ctx.save();ctx.globalAlpha=visible(t.x,t.y)?1:.4;if(trapAtlas.complete&&trapAtlas.naturalWidth===128){ctx.imageSmoothingEnabled=false;ctx.drawImage(trapAtlas,t.spent?64:0,TRAPS.findIndex(k=>k.id===trapType(t))*64,64,64,t.x*CELL,t.y*CELL,CELL,CELL);}else sprite(ctx,t.spent?'trap-spent':'trap',t.x*CELL,t.y*CELL);ctx.restore();}
 const actorEffectCenters=new Map();let heroEffectCenter={x:(position.x+.5)*CELL,y:(position.y+.5)*CELL};
 function entity(o,type,{standing=false,layer=1,hero=false,enemy=false}={}){
  const hit=hitPresentation(combat,o,{hero,size:CELL,reducedMotion:reducedMotion.matches});
  const at=hero?position:o,presentation=hero&&heroSheet?characterPresentation(heroSheet.definition,heroFrame,CELL):enemy?{...enemyAttackPresentation(o,enemyAttacks,combat.actorTime,{size:CELL,reducedMotion:reducedMotion.matches}),opacity:1}:{offsetX:0,offsetY:0,opacity:1},visualAt={x:at.x+(presentation.offsetX+hit.offsetX)/CELL,y:at.y+(presentation.offsetY+hit.offsetY)/CELL},box=standing?standingBox(visualAt.x,visualAt.y,CELL,1):{x:at.x*CELL,y:at.y*CELL,width:CELL,height:CELL,footY:(at.y+1)*CELL};
  const spriteFrame=enemy?enemyFrame(o):null,idleCut=spriteFrame?idleCuts[spriteFrame.x/64+spriteFrame.y/64*5]:54,crouch=enemy?sampleEnemyIdle(o,idleClock,{reducedMotion:reducedMotion.matches,attacking:Boolean(presentation.alive),hurt:combat.events.some(e=>e.target===o&&e.time!==null&&combat.time-e.time<400),defeated:!state.enemies.includes(o)||o.hp<=0}):0;
  if(hero&&heroSheet)heroEffectCenter=heroSkillCenter(at,heroSheet.definition,{...presentation,offsetX:presentation.offsetX+hit.offsetX,offsetY:presentation.offsetY+hit.offsetY},CELL,SKILL_EFFECT_FORMAT);if(enemy){const center=enemySkillCenter(box,spriteFrame,SKILL_EFFECT_FORMAT);center.y+=crouch*box.height/64;actorEffectCenters.set(o,center);}
  if(standing||type==='chest'){ctx.save();ctx.globalAlpha=(hero||visible(o.x,o.y)?1:.4)*presentation.opacity;drawFootShadow(ctx,visualAt.x,visualAt.y,CELL);ctx.restore();}
  queue.push({footY:box.footY,layer,x:at.x,draw(){ctx.save();ctx.globalAlpha=(hero||visible(o.x,o.y)?1:.4)*(enemy&&!state.enemies.includes(o)?ghostOpacity(combat,o):1);
   const oldPalette={g:palette.g,l:palette.l,r:palette.r,p:palette.p};if(enemy){if(type==='slime'){palette.g=theme.wallColor;palette.l='#c0c7b1';}else{palette.r=theme.floorColor;palette.p=theme.wallColor;}}
   const footOffset=enemy?0:(hero?actorFootOffset(sprites[type],box.height):0);
   const chest=type==='chest'?chestPresentation(o):null;if(chest?.legendary)drawLegendaryChestEffect(ctx,box,performance.now(),matchMedia('(prefers-reduced-motion: reduce)').matches);
   if(o.type==='letter'&&drawReadableProp(ctx,readableAtlas,'letter',box.x,box.y,box.width,box.height)){}else if(type==='chest'&&chest?.red&&drawReadableProp(ctx,readableAtlas,'chest-red',box.x,box.y,box.width,box.height)){}else if(type==='chest'&&chest?.red&&redChestAtlas.complete&&redChestAtlas.naturalWidth===64){ctx.imageSmoothingEnabled=false;ctx.drawImage(redChestAtlas,box.x,box.y,box.width,box.height);}else if(hero&&heroSheet)drawCharacter(ctx,heroSheet,heroFrame,at.x+hit.offsetX/CELL,at.y+hit.offsetY/CELL,CELL);else if(!enemy||!drawEnemySprite(ctx,enemyAtlas,o,box,{crouch,cut:idleCut}))sprite(ctx,type,box.x,box.y+footOffset-(hero?hop:0),box.width,box.height);if(enemy){if(hit.flash&&enemyAtlas.complete){const f=enemyFrame(o);if(f)ctx.drawImage(enemyFlashAtlas,f.x,f.y,64,64,box.x,box.y,box.width,box.height);}Object.assign(palette,oldPalette);}
   // The chest artwork supplies its own latch: no oversized yellow lock rectangle.
   if(type==='chest'&&o.cardId&&state.augments?.includes('destiny')&&!state.themeState?.destinyUsed&&gambleChestIcon.complete&&gambleChestIcon.naturalWidth){ctx.drawImage(gambleChestIcon,box.x+box.width*.62,box.y-12,24,24);}

   ctx.restore();}});
 }
 if(state.seen[stair.y][stair.x])entity(stair,'stairs',{standing:true});
 for(const o of state.obstacles||[])if(state.seen[o.y][o.x])entity(o,o.variant?'tombstone-cracked':'tombstone',{standing:true});
 for(const i of state.items)if(state.seen[i.y][i.x])entity(i,i.type==='letter'?'chest':i.type==='gear'&&gearById[i.gear.baseId].slot==='armor'?'armor':i.type);
 for(const e of [...state.enemies,...feedbackGhosts(combat,state.enemies)])if(visible(e.x,e.y))entity(e,e.type,{standing:true,layer:2,enemy:true});
 entity(state.player,'skeleton',{standing:true,layer:3,hero:true});
 for(const object of sceneDrawOrder(queue))object.draw();
 drawExplorationLight(ctx,{position,visible,camera,width:map.width,height:map.height,size:CELL,appearance,brightness:uiSettings.brightness});
 if(state.gimmick?.id==='fog'&&['explore','dead','cleared'].includes(state.phase)){ctx.save();ctx.setTransform(1,0,0,1,0,0);fogEffect.draw(ctx,{width:map.width,height:map.height,time:idleClock,center:{x:(heroEffectCenter.x-camera.left)*camera.scale,y:(heroEffectCenter.y-camera.top)*camera.scale},reducedMotion:reducedMotion.matches});ctx.restore();}
 drawSkillEffects(ctx,skillEffects,heroClock,SKILL_EFFECT_FORMAT,skillEffectAtlases,target=>{if(target.kind==='hero')return heroEffectCenter;const living=state.enemies.includes(target.actor),at=living?target.actor:target.at;if(!visible(at.x,at.y))return null;return actorEffectCenters.get(target.actor)||enemySkillCenter(standingBox(at.x,at.y,CELL,1),enemyFrame(target.actor||{}),SKILL_EFFECT_FORMAT);},{size:CELL,reducedMotion:reducedMotion.matches});
 for(const attack of enemyAttacks)if(visible(attack.actor.x,attack.actor.y))drawEnemyAttackEffect(ctx,attack,enemyAttackFrame(attack,combat.actorTime,{size:CELL,reducedMotion:reducedMotion.matches}),CELL);
 drawTrapEffects(ctx,trapEffects,heroClock,trapEffectAtlas,visible,{size:CELL,reducedMotion:reducedMotion.matches});
 const resolveImpact=(event,source=false)=>{if(source){const at=event.from;if(!at||!visible(at.x,at.y))return null;return {x:(at.x+.5)*CELL,y:(at.y+.5)*CELL};}if(!event.hero&&!visible(event.x,event.y))return null;const center=event.hero?heroEffectCenter:actorEffectCenters.get(event.target)||{x:(event.x+.5)*CELL,y:(event.y+.5)*CELL},dx=event.at.x-(event.from?.x??event.at.x),dy=event.at.y-(event.from?.y??event.at.y),len=Math.hypot(dx,dy)||1;return {x:center.x-dx/len*CELL*.18,y:center.y-dy/len*CELL*.18};};
 drawCombatTrails(ctx,combat,resolveImpact,{size:CELL,reducedMotion:reducedMotion.matches});drawCombatFeedback(ctx,combat,resolveImpact,{size:CELL,reducedMotion:reducedMotion.matches});
 ctx.translate(-shake.x,-shake.y);
 for(const label of layoutEnemyLabels(state.enemies.filter(enemy=>visible(enemy.x,enemy.y)),CELL))drawEnemyLabel(ctx,label.enemy,CELL,label.offset);
 const now=combat.time;damagePopups=damagePopups.filter(p=>damageFrame(p,now).alive);
 for(const p of damagePopups){if(!p.hero&&!visible(p.x,p.y))continue;const frame=damageFrame(p,now,{reducedMotion:reducedMotion.matches}),at=p.hero?position:p;ctx.save();ctx.globalAlpha=frame.alpha;ctx.font='bold 24px monospace';ctx.textAlign='center';ctx.textBaseline='bottom';ctx.lineWidth=6;ctx.strokeStyle='#200909';ctx.fillStyle=p.hero?'#ed9d8f':'#f6e5ba';const x=at.x*CELL+CELL/2,y=at.y*CELL-42-frame.rise*CELL/64;ctx.strokeText(String(p.damage),x,y);ctx.fillText(String(p.damage),x,y);ctx.restore();}
 if(skillPopup){const age=performance.now()-skillPopup.time;if(age<1000){ctx.save();ctx.globalAlpha=Math.min(1,(1000-age)/250);ctx.font='bold 18px serif';ctx.textAlign='center';ctx.lineWidth=4;ctx.strokeStyle='#091013';ctx.fillStyle='#f4df9a';const at=skillPopup.position||position,sx=(at.x+.5)*CELL,sy=at.y*CELL-24-age*.018;ctx.strokeText(skillPopup.name,sx,sy);ctx.fillText(skillPopup.name,sx,sy);ctx.restore();}else skillPopup=null;}
 ctx.restore();drawAutoMap();
}

function drawAutoMap(){
 const canvas=$('auto-map'),geometry=miniMapGeometry(state.grid[0].length,state.grid.length,6);
 if(canvas.width!==geometry.width||canvas.height!==geometry.height){canvas.width=geometry.width;canvas.height=geometry.height;}
 drawMiniMap(canvas.getContext('2d'),autoMapModel(state,(x,y)=>canSee(state,x,y)),geometry);
}
function renderThoughtSubtitle(){
 const text='▶ '+thoughtText(state.intent),subtitle=$('thought-subtitle');
 if(subtitle.textContent!==text)subtitle.textContent=text;
}
function categoryTabs(type,selected,common=false){return `<div class="subtabs" role="group" aria-label="${type==='skill'?'スキル系統':'装備の種類'}">${(common?[['common','共通'],['weapon','武器'],['armor','防具']]:[['weapon','武器'],['armor','防具']]).map(([id,label])=>`<button data-category="${type}" data-value="${id}" aria-pressed="${selected===id}" class="${selected===id?'active':''}">${label}</button>`).join('')}</div>`;}
function sortButtons(type,selected){return `<div class="sort-controls" role="group" aria-label="装備の並べ替え">${[['acquired','入手順'],['attack','攻撃力順'],['defense','防御力順']].map(([id,label])=>`<button data-sort="${type}" data-value="${id}" class="${selected===id?'active':''}" aria-pressed="${selected===id}">${label} ${id==='acquired'?'↑':'↓'}</button>`).join('')}</div>`;}
const orderHistory=createOrderHistory();
let selectedExtension='chest';
function renderExpansionShop(){const list=skills.filter(k=>['commandSlots','cardSlots','scout'].includes(k.id)),upgrades=list.map(k=>'<button class="extension-node '+(selectedExtension===k.id?'selected':'')+'" data-extension-upgrade-select="'+k.id+'"><strong>'+k.name+'</strong><small>'+(state.levels[k.id]>=k.max?'最大まで取得済み':'記憶の欠片 '+price(state,k)+'個')+' · '+state.levels[k.id]+'/'+k.max+'段階</small></button>').join('');$('order-expansion-content').innerHTML='<b>記憶の欠片 '+state.shards+'個</b>'+extensionTree(state,upgrades,selectedExtension);const k=list.find(k=>k.id===selectedExtension);if(k)$('order-expansion-content').querySelector('.extension-detail').innerHTML='<small>指示の拡張</small><h3>'+k.name+'</h3><p>'+k.detail+'</p><p>現在 '+state.levels[k.id]+'/'+k.max+' · 記憶の欠片 '+price(state,k)+'個</p><button data-upgrade="'+k.id+'" '+(state.phase!=='prepare'||state.floor===1||state.levels[k.id]>=k.max||state.shards<price(state,k)?'disabled':'')+'>購入する</button>';}

function renderOrderEditor(host){if(state.phase==='prepare')orderHistory.observe(state);renderCardEditor(host,state,orderCapacity(state));for(const b of host.querySelectorAll('[data-order-history]'))b.disabled=!orderHistory[b.dataset.orderHistory];if($('order-expansion-dialog').open)renderExpansionShop();}

function handleOrderClick(e,host){const result=handleCardClick(e,state);if(result!==null){if(result!=='selected'){delete host.dataset.orderSignature;render();}return true;}const b=e.target.closest('button');if(!b||b.disabled)return false;if(b.hasAttribute('data-rule-add')){const choice=host.querySelector('[data-order-choice]');if(choice&&addOrder(state,choice.value)){delete host.dataset.orderSignature;render();}return true;}if(b.dataset.ruleOp){editOrder(state,Number(b.dataset.index),b.dataset.ruleOp);delete host.dataset.orderSignature;render();return true;}return false;}
function handleOrderChange(e){const result=handleCardChange(e,state);if(result!==null){if(result==='selected')return;delete $('live-orders').dataset.orderSignature;delete $('tab-content').dataset.orderSignature;render();return;}if(e.target.dataset.ruleValue!==undefined){editOrder(state,Number(e.target.dataset.ruleValue),e.target.value);delete $('live-orders').dataset.orderSignature;delete $('tab-content').dataset.orderSignature;render();}}
const displayAttack=()=>state.gear.weapon.identified?stats(state).attack:'？';
const displayDefense=()=>state.gear.armor.identified?stats(state).defense:'？';
function renderAugmentOwnedSkills(){
 const cards=(state.ownedCards||[]).map(key=>cardByKey[key]).filter(card=>card?.kind==='skill');
 const groups=[...buildThemes,{id:null,name:'共通'}];
 $('augment-skill-groups').innerHTML=groups.map(theme=>{
  const owned=cards.filter(card=>(card.themeId??null)===theme.id);
  return '<section><h3>'+esc(theme.name)+' <b>'+owned.length+'種</b></h3>'+
   (owned.length?'<ul>'+owned.map(card=>'<li>'+esc(card.name)+'</li>').join('')+'</ul>':'<small>所持なし</small>')+'</section>';
 }).join('');
}
function renderAugments(){
 const offer=state.augmentOffer,dialog=$('augment-dialog');$('augment-reroll').hidden=false;$('augment-reroll').disabled=!offer||rerollCount(state,'augment')<1;$('augment-reroll').textContent='リロール（残り '+rerollCount(state,'augment')+'回）';$('augment-tutorial').hidden=!offer||!isTutorialJourney(state)||uiSettings.tutorials.explore;if(!showingTitle&&!fieldMessages.active&&offer&&!dialog.open){renderAugmentOwnedSkills();$('augment-choices').innerHTML=offer.choices.map(id=>augmentCard(augmentById[id],{choice:true,state})).join('');dialog.showModal();}
 if(state.phase==='prepare'){const hint=nextStageHint({...state,floor:state.floor-1});$('prep-hint').textContent=hint.title.replace('次は','')+' · '+hint.text;$('prep-augments').innerHTML='<div class="prep-augment-list"><b>オーグメント</b>'+((state.augments||[]).map(id=>augmentChip(augmentById[id],state)).join('')||'<span>なし</span>')+'</div>'+setRibbon(state);}
}
$('debug-augment').innerHTML=augments.map(a=>'<option value="'+a.id+'">'+a.rarity+' · '+a.theme+' · '+a.name+'</option>').join('');
$('augment-dialog').addEventListener('cancel',e=>e.preventDefault());
$('augment-reroll').onclick=()=>{if(rerollAugment(state)){$('augment-dialog').close();pendingAugment=null;render();}};
let pendingAugment=null;
$('augment-choices').onclick=e=>{const b=e.target.closest('[data-augment]');if(!b||!state.augmentOffer?.choices.includes(b.dataset.augment))return;pendingAugment=b.dataset.augment;$('augment-confirm-name').textContent=augmentById[pendingAugment].name;$('augment-confirm-dialog').showModal();};
$('confirm-augment').onclick=()=>{if(!pendingAugment||!chooseAugment(state,pendingAugment))return;pendingAugment=null;$('augment-owned-skills').open=false;$('augment-confirm-dialog').close();uiSettings=saveUiSettings(uiStorage,{...uiSettings,tutorials:{...uiSettings.tutorials,explore:true}});$('tutorial-explore').textContent='オーグメントの案内を再表示';$('augment-dialog').close();if(state.phase==='awakening'){beginExploration(state);paused=false;last=performance.now();}render();};
installHoverHelp();
const renderTactics=installTacticsUi({getState:()=>state,onChange:()=>{delete $('tab-content').dataset.orderSignature;render();},storage:uiStorage,onResume:()=>{paused=false;dialogWasPaused=false;last=performance.now();}});
const fieldMessages=installFieldMessages({dialog:$('field-event-dialog'),button:$('field-event-advance'),text:$('field-event-text'),skillBox:$('field-skill-message'),skillText:$('field-skill-text'),host:$('map-wrap'),hud:$('hud-bottom'),onIdle:()=>{last=performance.now();render();}});
$('rest-potion').onclick=()=>{if(usePotion(state,stats(state).maxHp,paused&&!fieldMessages.active&&!document.querySelector('dialog[open]'))){playFieldSound('heal');render();}};
function render(){
 const st=stats(state),prep=state.phase==='prepare',theme=zoneFor(state);$('rest-potion').hidden=state.phase!=='explore'||!paused||fieldMessages.active||!(state.potionStock>0);$('rest-potion').disabled=!canUsePotion(state,st.maxHp,paused&&!fieldMessages.active&&!document.querySelector('dialog[open]'));$('rest-potion').textContent='回復ポーションを使う（残り '+(state.potionStock||0)+'個）';fieldMessages.sync(state);renderScreens();if(!showingTitle&&!fieldMessages.active)renderTactics();
 const runClears=Math.max(0,state.profile.normalClears-(state.phase==='ending'?1:0));
 $('floor-title').textContent=`${theme.name} · ${floorLabel(state)}`;
 $('floor-message').hidden=state.floor!==LETTER_FLOOR||state.letter;$('floor-message').textContent='B30 ― '+letterFloorThought(state.profile.normalClears);
 $('turn').textContent=`TURN ${String(state.turn).padStart(3,'0')}`;
 $('hud-shards').textContent=state.shards;$('hud-sight').textContent=radius(state)+'マス';
 $('level-text').textContent='Lv.'+state.level;const expNeed=experienceToNext(state.level);$('exp-bar').style.width=(expNeed?state.experience/expNeed*100:100)+'%';$('level-vitals').setAttribute('aria-label',`レベル${state.level}、経験値${state.experience}、次のレベルまで${expNeed?expNeed-state.experience:0}`);$('level-vitals').title=state.level===MAX_LEVEL?'最大レベル':`EXP ${state.experience} / ${expNeed}`;
 const stock=state.potionStock||0;
 $('potion-stock').hidden=state.phase!=='explore';
 $('potion-stock').setAttribute('aria-label','回復ポーション '+stock+'個');
 $('potion-stock-count').textContent='×'+stock;
 $('hp-text').textContent=`${state.hp} / ${st.maxHp}`;$('hp-bar').style.width=`${state.hp/st.maxHp*100}%`;$('hp-bar').style.background=state.hp<st.maxHp*.3?'#bd8073':'#91ae88';
 $('atk').textContent=displayAttack();$('def').textContent=displayDefense();$('shards').innerHTML=`${state.shards}個`;$('intent').textContent=prep?'出発の準備をしています':state.intent;
 const notices={cleared:[`${floorLabel(state)} Clear`,state.floor===LAST_FLOOR?'階段の先に、地上の光が見える。':'記憶の欠片を手に入れた。次の階の準備へ。'],dead:['途切れた旅','骸は崩れ、再び最深部へ。図鑑の記録は残ります。'],ending:['地上','旅の記憶をたどる。']};
 const hint=['cleared','dead','ending'].includes(state.phase)?nextStageHint(state):null;
 $('field-gimmick').hidden=!state.gimmick||state.gimmick.id==='none';$('field-gimmick').textContent=state.gimmick&&state.gimmick.id!=='none'?'異変：'+state.gimmick.name+(state.gimmick.id==='fog'?' · 視界−2':''):'';
 const resting=state.phase==='explore'&&paused&&!fieldMessages.active&&!document.querySelector('dialog[open]');
 $('map-notice').dataset.kind=resting?'rest':state.phase;
 const n=notices[state.phase]||(resting?['ひとやすみ','少し骨を休めよう。下の「探索を再開」で旅を続けられます。']:null);$('map-notice').hidden=!n||fieldMessages.active;$('map-notice').classList.toggle('has-hint',Boolean(n&&hint));
 $('notice-copy').innerHTML=n?'<strong>'+n[0]+'</strong><small>'+n[1]+'</small>':'';
 $('notice-hint').innerHTML=hint?'<div class="clear-hint"><h3>'+esc(displayStoryText(hint.title.replace(/^次は/,''),state.profile.normalClears))+'</h3><p>'+esc(displayStoryText(hint.text,state.profile.normalClears))+'</p></div>':'';
 $('primary').innerHTML=({awakening:'思い出す',prepare:'探索を始める',cleared:state.floor===LAST_FLOOR?'地上1Fへ':'準備画面へ',dead:'B30で再び目覚める',ending:'次の旅をはじめる'})[state.phase]||'';
 $('primary').hidden=state.phase==='explore';$('pause-toggle').hidden=state.phase!=='explore';$('explore-abandon').hidden=state.phase!=='explore';$('pause-toggle').textContent=paused?'探索を再開':'ひとやすみ';
 renderJourneyLog();
 $('memory-quote').textContent=displayStoryText(state.memories.at(-1)||openingThought(runClears),runClears);

 renderTab();renderThoughtSubtitle();draw();renderTitle();renderNormalEnding();renderAugments();if(!showingTitle)fieldMessages.render({ready:houseEntryReady(motion,combat.actorTime)});syncSceneMusic();if(!showingTitle)save();maybeTutorial();
}
function syncTitleEffect(){
 const video=$('title-fx'),variant=(titleTransitionPreview?'segare':openingVariant(state.profile));
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
 const variant=(titleTransitionPreview?'segare':openingVariant(state.profile)),name=variant==='segare'?'倅の旅路':'骸の旅路';
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
 host.innerHTML=(overlay?rows.reverse():rows).map(l=>`<div class="log-row ${esc(l.type)}"><time>${String(l.turn).padStart(3,'0')}</time><span>${esc(displayStoryText(l.text,runClears))}</span></div>`).join('');
 host.scrollTop=overlay&&follow?host.scrollHeight:modeChanged?0:top;
}
const logHolds=new Set();
function holdLogs(key,hold){if(hold)logHolds.add(key);else logHolds.delete(key);fieldLogVisibility.setHeld(logHolds.size>0);}
for(const [id,prefix]of [['field-log-host','log'],['log-open','icon']]){const el=$(id);el.addEventListener('pointerenter',e=>{if(e.pointerType!=='touch')holdLogs(prefix+'-hover',true);});el.addEventListener('pointerleave',()=>holdLogs(prefix+'-hover',false));el.addEventListener('focusin',()=>holdLogs(prefix+'-focus',true));el.addEventListener('focusout',e=>{if(!el.contains(e.relatedTarget))holdLogs(prefix+'-focus',false);});}
$('field-log-host').addEventListener('pointerdown',e=>{if(e.pointerType==='touch')holdLogs('touch',true);});
document.addEventListener('pointerdown',e=>{if(!e.target.closest('#field-log-host,#log-open')){holdLogs('touch',false);if($('field-log-host').contains(document.activeElement))document.activeElement.blur();}});
$('log-open').onclick=()=>{const runClears=Math.max(0,state.profile.normalClears-(state.phase==='ending'?1:0));$('full-log-count').textContent='この旅の記録 '+state.logs.length+'件';$('full-logs').innerHTML=[...state.logs].reverse().map(l=>'<div class="log-row '+esc(l.type)+'"><time>ターン '+String(l.turn).padStart(3,'0')+'</time><span>'+esc(displayStoryText(l.text,runClears))+'</span></div>').join('');openDialog('history-dialog');$('full-log-scroll').scrollTop=$('full-log-scroll').scrollHeight;};
function itemCard(g,ref,equipped=false){
 const b=gearById[g.baseId],st=gearStats(g),target=typeof ref==='number'?'i'+ref:ref;
 return '<article class="item-card" data-gear-id="'+g.baseId+'"><div><small>'+ (b.slot==='weapon'?'武器':'防具')+(equipped?' · 装備中':'')+'</small><strong><span class="equipment-icon '+b.slot+'" aria-hidden="true"></span>'+esc(gearName(g))+'</strong><small>攻撃 '+st.attack+' / 防御 '+st.defense+'</small></div>'+(!equipped?'<div class="item-actions"><button data-action="equip" data-ref="'+target+'">装備</button><button data-action="discard" data-ref="'+target+'" class="text-button">処分</button></div>':'')+'</article>';
}
function renderTab(){
 if(tab==='skills')tab='orders';
 if(tab==='status')tab='gear';
 if(tab==='gear'){const host=$('tab-content'),scroll=host.querySelector('.gear-inventory-scroll'),top=host.dataset.gearSlot===gearSlot?scroll?.scrollTop||0:0,expanded=host.querySelector('.gear-details')?.open;host.dataset.gearSlot=gearSlot;host.innerHTML=equipmentPanel(state,{slot:gearSlot,sort:gearSorts[gearSlot],tabs:categoryTabs('gear',gearSlot),sorts:sortButtons('gear',gearSorts[gearSlot]),details:$('expedition-summary').innerHTML.replace(/\sid="[^"]*"/g,''),sight:radius(state)});host.querySelector('.gear-inventory-scroll').scrollTop=top;host.querySelector('.gear-details').open=Boolean(expanded);}

 if(tab==='orders'){if(!$('tab-content').querySelector('.card-board'))delete $('tab-content').dataset.orderSignature;renderOrderEditor($('tab-content'));}
 refreshForecast();

}
function renderScreens(){
 const prep=state.phase==='prepare',awake=state.phase==='awakening',st=stats(state);document.body.classList.toggle('awakening',!showingTitle&&awake);$('awakening-start').hidden=Boolean(memoryReveal);$('awakening-copy').hidden=!memoryReveal;$('awakening-advance').hidden=!memoryReveal;$('awakening-hint').hidden=!memoryReveal;$('workspace').dataset.screen=awake?'awakening':prep?'prepare':'explore';document.body.classList.toggle('opening',showingTitle);$('title-scene').hidden=!showingTitle;document.body.classList.toggle('exploring',!showingTitle&&!prep&&!awake);document.body.classList.toggle('preparing',!showingTitle&&prep);$('awakening-scene').hidden=!awake;$('game-icons').hidden=awake;const journal=document.querySelector('.journal');journal.hidden=awake;const journalHost=awake?$('workspace'):prep?$('prep-journal-content'):$('field-log-host');if(journal.parentElement!==journalHost)journalHost.appendChild(journal);const toolsHost=awake?$('header-tools'):$('hud-tools');if($('utility-controls').parentElement!==toolsHost)toolsHost.appendChild($('utility-controls'));
 $('prepare-scene').hidden=!prep;document.querySelector('.adventure').hidden=awake;$('expedition').hidden=awake;const statusHost=awake?$('workspace'):$('status-dialog-content');if($('expedition').parentElement!==statusHost)statusHost.appendChild($('expedition'));$('status-open').hidden=awake;$('fullscreen-open').hidden=false;$('mobile-display').hidden=true;$('status-phase').textContent=prep?'PREPARATION':'EXPEDITION';
 $('prepare-floor').textContent=`${floorLabel(state)}への支度`;
 const host=awake?$('awakening-start'):prep?$('launch-area'):$('notice-actions');if($('primary').parentElement!==host)host.prepend($('primary'));
 const visited=state.visited.flat().filter(Boolean).length;
 const summary=`<dl class="stat-list"><div><dt>レベル / 経験値</dt><dd>Lv.${state.level} / ${state.level===MAX_LEVEL?'MAX':state.experience+' / '+experienceToNext(state.level)}</dd></div><div><dt>HP</dt><dd>${state.hp} / ${st.maxHp}</dd></div><div><dt>攻撃力 / 防御力</dt><dd>${displayAttack()} / ${displayDefense()}</dd></div><div><dt>記憶の欠片</dt><dd id="shards">${state.shards}個</dd></div><div><dt>武器</dt><dd>${esc(gearName(state.gear.weapon))}${state.gear.weapon.boundKnown?' · 呪い':''}</dd></div><div><dt>防具</dt><dd>${esc(gearName(state.gear.armor))}${state.gear.armor.boundKnown?' · 呪い':''}</dd></div><div><dt>指示枠</dt><dd>${activeOrderCount(state.orders)} / ${orderCapacity(state)}枠</dd></div><div><dt>1行のカード枠</dt><dd>${cardCapacity(state)}枚</dd></div><div><dt>視界範囲</dt><dd>半径${radius(state)}マス</dd></div><div><dt>再生の祈り</dt><dd>${state.abilities.includes('mend')?(state.mended?'使用済み':state.orders.some(o=>o.effect?.id==='mend')?'使用可能':'指示未設定'):'未習得'}</dd></div></dl>`;

 $('expedition-summary').innerHTML=summary+`<div class="current-action"><small>今の判断</small><p>${esc(prep?'出発の準備をしています':state.intent)}</p></div><dl class="stat-list"><div><dt>探索済みの床 / この階の撃破</dt><dd>${visited}マス / ${state.floorKills}体</dd></div><div><dt>所持品 / 遺書</dt><dd>${state.inventory.length}個 / ${state.letter?'入手済':'未入手'}</dd></div></dl><h3>習得した記憶</h3><p class="section-caption">${skills.filter(k=>state.levels[k.id]).map(k=>k.name+(k.max>1?' Lv.'+state.levels[k.id]:'')).join(' / ')||'未習得'}</p><h3>この旅で得たスキル・特殊指示</h3><p class="section-caption">${[...state.abilities,...state.unlockedOrders].map(id=>esc(rewardDefinitions.find(r=>r.id===id).name)).join(' / ')||'未取得'}<br>特殊指示は準備中に探索指示へ設定して使います。</p>`;
 renderOrderEditor($('live-orders'));
 const inJourney=!showingTitle&&!awake;
 $('status-open').closest('.settings-row').hidden=!inJourney;
 $('live-orders-open').closest('.settings-row').hidden=!inJourney;
 for(const [action,category] of [['options-save','save'],['return-title','exit']]){
  $(action).closest('.settings-row').hidden=!inJourney;
  $('settings-'+category+'-empty').hidden=inJourney;
 }
}
function openDialog(id){if(!document.querySelector('dialog[open]'))dialogWasPaused=paused;paused=true;$(id).showModal();if(state.phase==='explore')render();}
let tutorialSteps=[],activeTutorialKey=null;
let tutorialKind=null,tutorialStep=0,tutorialActing=false,tutorialWasPaused=true,tutorialPlacementCount=0;
document.body.insertAdjacentHTML('beforeend','<canvas id="tutorial-spotlight" hidden aria-hidden="true"></canvas><aside id="tutorial-task" hidden role="status"><span></span><button type="button" id="tutorial-task-skip">この操作を省略</button></aside>');
const tutorialSpotlight=createTutorialSpotlight($('tutorial-spotlight'));
function clearTutorialTargets(){tutorialSpotlight.clear();$('tutorial-task').hidden=true;}
function paintTutorial(){clearTutorialTargets();tutorialActing=false;const steps=tutorialSteps,step=steps[tutorialStep];$('tutorial-progress').textContent=(tutorialKind==='explore'?'探索':'準備')+' · '+(tutorialStep+1)+' / '+steps.length;$('tutorial-copy').textContent=step.text;$('tutorial-back').disabled=tutorialStep===0;$('tutorial-next').textContent=step.selector?'操作する':tutorialStep===steps.length-1?'完了':'次へ';if(!$('tutorial-dialog').open)$('tutorial-dialog').showModal();}
function startTutorial(kind){const steps=floorTutorialSteps(state);if(!steps.length)return;activeTutorialKey=tutorialKey(state);tutorialSteps=steps;tutorialWasPaused=document.querySelector('dialog[open]')?dialogWasPaused:paused;tutorialKind=kind;tutorialStep=0;paused=true;for(const d of document.querySelectorAll('dialog[open]'))d.close();if(kind==='prepare'){tab='orders';document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));renderTab();}paintTutorial();}
function maybeTutorial(){const key=tutorialKey(state);if(!tutorialKind&&!showingTitle&&!pendingJourney&&!endingPreview&&!document.querySelector('dialog[open]')&&state.guidedJourney===true&&key&&!(state.tutorialFloors||[]).includes(key))startTutorial(state.phase);}

function finishTutorial(resume=false){if(activeTutorialKey){state.tutorialFloors=[...new Set([...(state.tutorialFloors||[]),activeTutorialKey])];activeTutorialKey=null;}if(tutorialKind)uiSettings=saveUiSettings(uiStorage,{...uiSettings,tutorials:{...uiSettings.tutorials,[tutorialKind]:true}});clearTutorialTargets();tutorialKind=null;tutorialActing=false;paused=resume?false:tutorialWasPaused;dialogWasPaused=paused;$('tutorial-dialog').close();last=performance.now();render();}
function advanceTutorial(performed=false){const step=tutorialSteps[tutorialStep];clearTutorialTargets();tutorialActing=false;if(tutorialStep===tutorialSteps.length-1){finishTutorial(Boolean(performed&&step.lastAction));return;}tutorialStep++;paintTutorial();}
function actTutorial(){const step=tutorialSteps[tutorialStep];if(!step.selector){advanceTutorial();return;}if(step.complete?.(state)){advanceTutorial(true);return;}tutorialActing=true;tutorialPlacementCount=state.orders.reduce((n,r)=>n+(r.conditions?.length||0),0);$('tutorial-dialog').close();$('tutorial-task').querySelector('span').textContent=step.text;$('tutorial-task').hidden=false;const targets=[...document.querySelectorAll(step.selector)].filter(el=>!el.disabled&&el.getClientRects().length);if(targets.length){targets[0].scrollIntoView({block:'nearest',inline:'nearest'});$('tutorial-task').classList.toggle('at-bottom',targets[0].getBoundingClientRect().top<innerHeight/2);}else $('tutorial-task').querySelector('span').textContent='この操作は今の構成では行えません。「この操作を省略」で進めます。';tutorialSpotlight.show(step.selector);}
$('tutorial-next').onclick=actTutorial;
$('tutorial-back').onclick=()=>{if(tutorialStep>0){tutorialStep--;paintTutorial();}};
$('tutorial-task-skip').onclick=()=>advanceTutorial();
$('tutorial-dialog').addEventListener('cancel',e=>{e.preventDefault();finishTutorial();});
$('tutorial-prepare').onclick=()=>{if(!isTutorialJourney(state)){displayMessage('チュートリアルは初回クリアまで表示します。');return;}if(floorTutorialSteps(state).length)startTutorial(state.phase);else displayMessage('階層別の案内はB30〜B26で表示します。');};
$('tutorial-explore').onclick=()=>{if(!isTutorialJourney(state)){displayMessage('チュートリアルは初回クリアまで表示します。');return;}uiSettings=saveUiSettings(uiStorage,{...uiSettings,tutorials:{...uiSettings.tutorials,explore:false}});$('tutorial-explore').textContent='次のオーグメント取得時に案内します';};
function tutorialOperation(e){if(!tutorialKind||!tutorialActing)return;const kind=tutorialKind,index=tutorialStep,step=tutorialSteps[index],hit=e.type===(step.event||'click')&&e.target.closest(step.selector)&&(e.type!=='change'||e.target.checkValidity());if(!hit&&!step.placement&&!step.complete)return;setTimeout(()=>{if(tutorialKind!==kind||tutorialStep!==index||!tutorialActing)return;const placed=state.orders.reduce((n,r)=>n+(r.conditions?.length||0),0)>tutorialPlacementCount;if(step.complete?!step.complete(state):step.placement?!placed:!hit)return;advanceTutorial(true);},0);}
document.addEventListener('click',tutorialOperation,true);
document.addEventListener('pointerup',tutorialOperation,true);
document.addEventListener('change',tutorialOperation,true);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&tutorialKind&&tutorialActing){e.preventDefault();finishTutorial();}});
function finishDialog(){if(tutorialKind)return;if(!document.querySelector('dialog[open]')){paused=dialogWasPaused;last=performance.now();render();}}
let cardBookKind='all';
function renderCardBook(){const names={all:'すべて',target:'ターゲット',condition:'条件',action:'アクション',skill:'スキル'};const all=cardCodexRows(state),rows=all.filter(c=>cardBookKind==='all'||c.kind===cardBookKind);$('codex-title').textContent='カード図鑑';$('codex-note').textContent='未所持カードもすべて公開。取得記録は周回後も保持し、所持と効果はその旅だけ。全スキルは取得後、探索指示への配置が必要です。';$('codex-body').innerHTML='<div class="subtabs">'+Object.entries(names).map(([id,name])=>'<button data-card-book-kind="'+id+'" aria-pressed="'+(cardBookKind===id)+'">'+name+'</button>').join('')+'</div><p class="section-caption">この旅の所持 '+all.filter(c=>c.owned).length+' / '+all.length+' · 取得記録 '+all.filter(c=>c.discovered).length+'</p><div class="card-codex-grid">'+rows.map(c=>'<article class="item-card card-codex-item '+c.rarity+'" tabindex="0" title="'+esc(skillTitle(c,state))+'"><div><span class="rarity-badge '+c.rarity+'">'+c.rarity+'</span><strong>'+esc(c.name)+'</strong><small>'+esc(c.group)+' · '+(c.owned?'所持中':c.discovered?'過去に取得／現在未所持':'未取得')+'</small><p>'+esc(c.detail)+'</p>'+(skillSetActive(state,c.id)?'<small class="active-set-note">同テーマのオーグメント強化に寄与</small>':'')+'<small>入手：'+(c.id==='letter'?'旧セーブから引き継ぎ':c.initial?'旅の開始時':'宝箱')+(c.modifier&&c.kind==='skill'?' · 配置した条件の成立中に有効':'')+'</small></div></article>').join('')+'</div>';}
document.addEventListener('click',e=>{const b=e.target.closest('[data-card-book-kind]');if(b){cardBookKind=b.dataset.cardBookKind;renderCodex();}});
let augmentBookOrder='theme';
function renderAugmentBook(){
 $('codex-title').textContent='オーグメント図鑑';
 $('codex-note').textContent='開始時とB20・B10のボス撃破時に選択。効果は旅ごとにリセットし、取得記録は引き継ぎます。数値は仮バランス。';
 const groups=augmentBookOrder==='theme'
  ?buildThemes.map(theme=>({name:theme.name,cards:augments.filter(a=>a.themeId===theme.id)}))
  :['NORMAL','EPIC','LEGENDARY'].map(rarity=>({name:rarity,cards:augments.filter(a=>a.rarity===rarity)}));
 const card=a=>augmentCard(a,{state,showSetHint:false,status:state.augments.includes(a.id)?'所持中':state.profile.augments?.includes(a.id)?'過去に取得':'未取得'});
 $('codex-body').innerHTML='<div class="sort-controls" role="group" aria-label="オーグメントの並べ替え">'+
  [['theme','テーマ順'],['rarity','レアリティ順']].map(([order,label])=>'<button type="button" data-augment-order="'+order+'" aria-pressed="'+(augmentBookOrder===order)+'">'+label+'</button>').join('')+
  '</div>'+groups.map(group=>'<section class="augment-codex-group"><h3>'+esc(group.name)+'</h3><div class="augment-codex-grid">'+group.cards.map(card).join('')+'</div></section>').join('');
}
$('codex-body').addEventListener('click',event=>{
 const button=event.target.closest('[data-augment-order]');
 if(!button||button.dataset.augmentOrder===augmentBookOrder)return;
 augmentBookOrder=button.dataset.augmentOrder;
 renderAugmentBook();
 $('codex-body').scrollTop=0;
 $('codex-body').querySelector('[data-augment-order="'+augmentBookOrder+'"]').focus();
});
function renderCodex(){if(codexKind==='augments'){renderAugmentBook();return;}if(codexKind==='cards'){renderCardBook();return;}if(codexKind==='skills'){codexKind='cards';renderCardBook();return;}let rows=codexRows(state,codexKind);if(codexKind==='equipment')rows=rows.filter(r=>r.slot===codexSlot).sort((a,b)=>Number(b.known)-Number(a.known)||(a.known&&b.known?(codexSorts[codexSlot]==='acquired'?a.acquiredOrder-b.acquiredOrder:b[codexSorts[codexSlot]]-a[codexSorts[codexSlot]]):0));$('codex-title').textContent=codexKind==='monsters'?'モンスター図鑑':'装備図鑑';$('codex-note').textContent=codexKind==='monsters'?'視認した種類を登録。図鑑は基礎能力です。増援は長期滞在で強化されます。記録は周回でも引き継ぎます。':'入手した種類の名前と能力を登録。記録は周回でも引き継ぎます。';$('codex-body').innerHTML=(codexKind==='equipment'?categoryTabs('codex',codexSlot)+sortButtons('codex',codexSorts[codexSlot]):'')+`<p class="section-caption">公開済み ${rows.filter(r=>r.known).length} / ${rows.length}</p><table class="codex-table"><thead><tr><th>名前</th><th>攻撃</th><th>防御</th></tr></thead><tbody>${rows.map(r=>r.known?`<tr><td>${codexKind==='equipment'?'<span class="equipment-icon '+r.slot+'" aria-hidden="true"></span>':''}${esc(r.name)}${r.zone?`<small>${esc(r.zone)}</small>`:''}</td><td>${r.attack}</td><td>${r.defense}</td></tr>`:'<tr><td><span aria-label="未登録">？</span></td><td>―</td><td>―</td></tr>').join('')}</tbody></table>`;}
const codexNavigation=$('codex-dialog').querySelector('nav');
function selectCodex(kind){
 codexKind=kind;
 for(const button of codexNavigation.querySelectorAll('[data-codex-kind]')){
  button.setAttribute('aria-pressed',String(button.dataset.codexKind===kind));
 }
 renderCodex();
 $('codex-body').scrollTop=0;
}
codexNavigation.addEventListener('click',event=>{
 const button=event.target.closest('[data-codex-kind]');
 if(button)selectCodex(button.dataset.codexKind);
});
function showCodex(kind){selectCodex(kind);openDialog('codex-dialog');}
const getRef=r=>r.startsWith('i')?Number(r.slice(1)):r;
$('tab-content').onclick=e=>{if(e.target.closest('[data-drop-return],[data-drag-source],[data-inline-condition]')&&handleOrderClick(e,$('tab-content')))return;const b=e.target.closest('button');if(!b||b.disabled)return;if(b.hasAttribute('data-best-equipment')){equipBest(state);render();return;}if(b.dataset.category){const type=b.dataset.category;if(type==='gear')gearSlot=b.dataset.value;}else if(b.dataset.sort){gearSorts[gearSlot]=b.dataset.value;}else if(handleOrderClick(e,$('tab-content')))return;else if(b.dataset.upgrade){if(upgrade(state,b.dataset.upgrade))tone(550);}else if(b.dataset.action){const ref=getRef(b.dataset.ref);switch(b.dataset.action){case'equip':equip(state,ref);break;case'discard':discard(state,ref);break;}}render();};
$('live-orders').onclick=e=>handleOrderClick(e,$('live-orders'));
$('live-orders').onchange=handleOrderChange;
$('tab-content').onchange=handleOrderChange;
$('codex-body').onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.category)codexSlot=b.dataset.value;else if(b.dataset.sort)codexSorts[codexSlot]=b.dataset.value;renderCodex();};
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;document.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('active',x===b));renderTab();});
document.querySelectorAll('[data-speed]').forEach(b=>b.onclick=()=>{speed=Number(b.dataset.speed);document.querySelectorAll('[data-speed]').forEach(x=>x.classList.toggle('active',x===b));});
let skillPopup=null;
let memoryReveal=null;
function reset(next=newGame(undefined,state.profile)){memoryReveal=null;state=next;resetHeroVisual();skillPopup=null;paused=false;dialogWasPaused=false;motion=null;last=performance.now();render();}
let enteringJourney=false;
async function enterJourney(done){
 if(enteringJourney)return;enteringJourney=true;
 const waiting=!gameAssetsLoaded;
 if(waiting){$('startup-message').textContent='ダンジョンを読み込み中…';$('startup-status').hidden=false;$('title-new').disabled=true;$('title-load').disabled=true;}
 try{await gameAssetsReady;done();}finally{enteringJourney=false;$('startup-status').hidden=true;$('title-new').disabled=false;$('title-load').disabled=!hasSave;}
}
function playJourneyTeaser(done){
 if(pendingJourney)return;
 if(enteringJourney)return;
 if(uiSettings.skipOpening||openingVariant(state.profile)!=='mukuro'){enterJourney(done);return;}
 pendingJourney=done;paused=true;dialogWasPaused=true;document.body.classList.add('watching-teaser');$('teaser-scene').hidden=false;$('teaser-retry').hidden=true;
 const video=$('journey-teaser');if(video.error){finishJourneyTeaser();return;}video.currentTime=0;syncTitleEffect();video.play().catch(()=>{$('teaser-retry').hidden=false;});$('teaser-skip').focus();syncSceneMusic();
}
function finishJourneyTeaser(){if(!pendingJourney)return;const done=pendingJourney;pendingJourney=null;$('journey-teaser').pause();$('teaser-scene').hidden=true;document.body.classList.remove('watching-teaser');enterJourney(done);}
$('journey-teaser').addEventListener('ended',finishJourneyTeaser);
$('journey-teaser').addEventListener('error',()=>{if(pendingJourney)finishJourneyTeaser();});
$('teaser-skip').onclick=finishJourneyTeaser;
$('teaser-retry').onclick=()=>{$('journey-teaser').play().then(()=>{$('teaser-retry').hidden=true;}).catch(()=>{});};
document.addEventListener('keydown',e=>{if(pendingJourney&&e.key==='Escape')finishJourneyTeaser();});
document.addEventListener('visibilitychange',()=>{if(!pendingJourney)return;const video=$('journey-teaser');if(document.hidden)video.pause();else video.play().catch(()=>{$('teaser-retry').hidden=false;});});
function startNewJourney(){tryMobileDisplay();playJourneyTeaser(()=>{showingTitle=false;uiSettings=resetJourneyTutorials(uiStorage,uiSettings);reset(newGame(undefined,state.profile));});}

$('title-new').onclick=()=>{if(hasSave)openDialog('new-game-dialog');else startNewJourney();};
$('confirm-new-game').onclick=()=>{$('new-game-dialog').close();startNewJourney();};
$('title-load').onclick=()=>{if(hasSave)openDialog('load-game-dialog');};
$('confirm-load-game').onclick=()=>{if(!hasSave)return;tryMobileDisplay();$('load-game-dialog').close();playJourneyTeaser(()=>{showingTitle=false;resetHeroVisual();paused=state.phase==='explore';dialogWasPaused=paused;last=performance.now();render();});};
$('title-option').onclick=()=>openOptions();
$('return-title').onclick=()=>confirmOption('タイトルへ戻りますか？','現在の旅を端末に保存してからタイトルに戻ります。','戻る',()=>{
 if(!save()){ $('settings-help').textContent=$('save-status').textContent;return; }
 paused=true;dialogWasPaused=true;showingTitle=true;motion=null;$('options-dialog').close();render();
});
$('primary').onclick=()=>{if(state.phase==='explore')return;if(state.phase==='awakening'){if(!memoryReveal){memoryReveal={player:new SubtitlePlayer(awakeningLines(state.profile.normalClears)),last:performance.now()};$('awakening-text').textContent='';$('awakening-caret').hidden=true;render();}return;}if(state.phase==='prepare'){beginExploration(state);paused=false;last=performance.now();tone();}else if(state.phase==='cleared'){ascend(state);motion=null;tone(440);}else reset();render();if(state.phase==='explore')tryMobileDisplay();};
const askAbandon=()=>{if(['prepare','explore'].includes(state.phase))openDialog('abandon-dialog');};$('abandon-run').onclick=askAbandon;$('explore-abandon').onclick=askAbandon;
$('confirm-abandon').onclick=()=>{const next=abandonRun(state);if(!next)return;$('abandon-dialog').close();reset(next);};
$('pause-toggle').onclick=()=>{if(state.phase!=='explore')return;paused=!paused;last=performance.now();render();if(!paused)tryMobileDisplay();};
$('skip-opening').onchange=()=>{uiSettings=saveUiSettings(uiStorage,{...uiSettings,skipOpening:$('skip-opening').checked});};
$('minimap-size').onchange=()=>{uiSettings=saveUiSettings(uiStorage,{...uiSettings,minimap:$('minimap-size').value});document.documentElement.dataset.minimapSize=uiSettings.minimap;drawAutoMap();};
 document.addEventListener('click',e=>{const history=e.target.closest('[data-order-history]');if(history&&!history.disabled&&orderHistory.move(state,history.dataset.orderHistory)){render();return;}if(e.target.closest('[data-order-expansions]')&&state.phase==='prepare'){renderExpansionShop();$('order-expansion-dialog').showModal();return;}if(e.target.closest('[data-forecast-run]'))refreshForecast(true);if(e.target.closest('[data-orders-undo]')&&state.phase==='prepare'&&forecastContext){state.orders=structuredClone(initialOrders);render();}});
 document.addEventListener('change',e=>{if(e.target.id==='forecast-samples'){forecastSamples=Number(e.target.value);refreshForecast(true);}});
 $('sound').onclick=()=>{sound=!sound;uiSettings=saveUiSettings(uiStorage,{...uiSettings,soundEnabled:sound});paintSoundOptions();tone(440);};
$('codex-open').onclick=()=>showCodex(codexKind);
$('help').onclick=()=>openDialog('dialog');$('close-dialog').onclick=()=>$('dialog').close();$('guide-start').onclick=()=>$('dialog').close();
$('order-expansion-dialog').onchange=e=>{if(e.target.id!=='exchange-source-a')return;const first=e.target.value,second=$('exchange-source-b');for(const o of second.options)o.hidden=o.disabled=o.value===first||o.value.split(':')[0]!==first.split(':')[0];second.value=[...second.options].find(o=>!o.disabled)?.value||'';};
$('order-expansion-dialog').onclick=e=>{const b=e.target.closest('button');if(!b||b.disabled||state.phase!=='prepare')return;if(b.dataset.extensionUpgradeSelect){selectedExtension=b.dataset.extensionUpgradeSelect;renderExpansionShop();return;}if(b.dataset.extensionSelect){selectedExtension=b.dataset.extensionSelect;renderExpansionShop();return;}let changed=false;if(b.dataset.upgrade)changed=upgrade(state,b.dataset.upgrade);if(b.dataset.extensionUnlock)changed=unlockExtension(state,b.dataset.extensionUnlock);if(b.hasAttribute('data-extension-exchange'))changed=startExchange(state,[$('exchange-source-a')?.value,$('exchange-source-b')?.value]);if(b.dataset.extensionChoice)changed=chooseExchange(state,b.dataset.extensionChoice);if(changed){tone(550);renderExpansionShop();render();}};

document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$(b.dataset.close).close());document.querySelectorAll('dialog').forEach(d=>{if(d.id!=='field-event-dialog')d.addEventListener('close',finishDialog);});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state.phase==='explore'){paused=true;dialogWasPaused=true;render();}});
function debugStatus(message=''){ $('debug-status').textContent=`${floorLabel(state)} · Lv.${state.level} · EXP ${state.experience} · HP ${state.hp}/${stats(state).maxHp} · 記憶の欠片 ${state.shards}個${state.debugUsed?' · DEBUG操作済み':''}${message?' — '+message:''}`;}
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
 const layout=sceneLayout(innerWidth,innerHeight,matchMedia('(pointer: coarse)').matches),root=document.documentElement;root.style.setProperty('--game-scene-scale',layout.scale);root.dataset.landscapeRequired=String(layout.portrait);root.dataset.touchControls=String(matchMedia('(any-pointer: coarse)').matches);
 const gate=$('landscape-gate');if(layout.portrait&&!gate.open){paused=true;dialogWasPaused=true;gate.showModal();if(state.phase==='explore')render();}else if(!layout.portrait&&gate.open)gate.close();
}
addEventListener('resize',()=>{syncSceneViewport();fieldMessages.place();});window.visualViewport?.addEventListener('resize',()=>{syncSceneViewport();fieldMessages.place();});document.addEventListener('fullscreenchange',()=>{syncSceneViewport();fieldMessages.place();});syncSceneViewport();
document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement){if(lockedOrientation)screen.orientation?.unlock?.();lockedOrientation=false;ownsFullscreen=false;$('fullscreen-open').textContent='横向きで全画面表示';displayMessage('横向きで全画面表示');}});
const optionsDialog=$('options-dialog');
const optionTabs=[...optionsDialog.querySelectorAll('[role="tab"]')];
const optionResetKeys={
 'settings-display':['brightness','minimap','screenShake','optionsContrast','skipOpening'],
 'settings-audio':['bgmEnabled','bgmVolume','soundEnabled','soundVolume']
};
let activeOptionTab=0,confirmedOptionAction;
function describeSetting(row){
 optionsDialog.querySelector('.settings-row[data-current]')?.removeAttribute('data-current');
 if(row)row.dataset.current='';
 $('settings-help-title').textContent=row?.querySelector('.settings-name').textContent??'';
 $('settings-help').textContent=row?.dataset.settingHelp??'';
}
function showOptionTab(index,focus=false){
 activeOptionTab=index;
 for(const [i,tab] of optionTabs.entries()){
  tab.setAttribute('aria-selected',String(i===index));
  tab.tabIndex=i===index?0:-1;
  $(tab.getAttribute('aria-controls')).hidden=i!==index;
 }
 const panel=$(optionTabs[index].getAttribute('aria-controls'));
 $('options-reset').hidden=!optionResetKeys[panel.id];
 describeSetting(null);
 if(focus)optionTabs[index].focus();
}
function openOptions(){
 openDialog('options-dialog');
 $('options-save-result').textContent='';
 showOptionTab(0,true);
}
function confirmOption(title,description,label,action){
 const dialog=$('options-confirm-dialog');
 $('options-confirm-title').textContent=title;
 $('options-confirm-description').textContent=description;
 $('options-confirm-ok').textContent=label;
 confirmedOptionAction=action;
 dialog.returnValue='cancel';
 openDialog(dialog.id);
}
$('options-confirm-dialog').addEventListener('close',e=>{
 const action=confirmedOptionAction;
 confirmedOptionAction=undefined;
 if(e.currentTarget.returnValue==='confirm')action?.();
});
function paintOptionsContrast(){
 $('options-contrast').checked=uiSettings.optionsContrast;
 document.documentElement.classList.toggle('high-contrast-menus',uiSettings.optionsContrast);
}
paintOptionsContrast();
$('options-contrast').onchange=()=>{
 uiSettings=saveUiSettings(uiStorage,{...uiSettings,optionsContrast:$('options-contrast').checked});
 paintOptionsContrast();
};
optionTabs.forEach((tab,index)=>tab.onclick=()=>showOptionTab(index));
optionsDialog.querySelector('[role="tablist"]').addEventListener('keydown',event=>{
 if(event.target.getAttribute('role')!=='tab')return;
 const step={ArrowDown:1,ArrowRight:1,ArrowUp:-1,ArrowLeft:-1}[event.key];
 if(!step&&event.key!=='Home'&&event.key!=='End')return;
 event.preventDefault();
 const last=optionTabs.length-1;
 const next=event.key==='Home'?0:event.key==='End'?last:(activeOptionTab+step+optionTabs.length)%optionTabs.length;
 showOptionTab(next,true);
});
for(const row of optionsDialog.querySelectorAll('.settings-row')){
 row.addEventListener('pointermove',()=>{
  if(!row.hasAttribute('data-current'))describeSetting(row);
 });
 row.addEventListener('focusin',()=>describeSetting(row));
}
$('options-save').onclick=()=>{
 if(!showingTitle&&state.phase!=='awakening'){
  save();
  $('options-save-result').textContent=$('save-status').textContent;
 }
};
$('options-reset').onclick=()=>{
 const panel=optionTabs[activeOptionTab].getAttribute('aria-controls');
 confirmOption('設定を初期化しますか？','選択中のカテゴリを標準設定に戻します。','初期化',()=>{
  const defaults=readUiSettings(null);
  const reset=Object.fromEntries(optionResetKeys[panel].map(key=>[key,defaults[key]]));
  uiSettings=saveUiSettings(uiStorage,{...uiSettings,...reset});
  paintOptionsContrast();paintBrightness();paintMusicOptions();
  $('skip-opening').checked=uiSettings.skipOpening;
  $('screen-shake').checked=uiSettings.screenShake;
  $('minimap-size').value=document.documentElement.dataset.minimapSize=uiSettings.minimap;
  sound=uiSettings.soundEnabled;volume=uiSettings.soundVolume;paintSoundOptions();
  syncSceneMusic();draw();
  $('settings-help').textContent='標準設定に戻しました。';
 });
};
$('status-open').onclick=()=>openDialog('status-dialog');
$('live-orders-open').onclick=()=>openDialog('live-orders-dialog');
$('prepare-forecast').onclick=()=>{if(state.phase==='prepare'){openDialog('forecast-dialog');refreshForecast();}};
$('sound-volume').oninput=e=>{volume=Number(e.target.value);uiSettings=saveUiSettings(uiStorage,{...uiSettings,soundVolume:volume});$('volume-value').textContent=volume+'%';};
$('sound-volume').onchange=()=>tone(440);
function paintSoundOptions(){$('sound').setAttribute('aria-pressed',String(sound));$('sound').setAttribute('aria-label',sound?'効果音を無効にする':'効果音を有効にする');$('sound').textContent='効果音：'+(sound?'ON':'OFF');$('sound-volume').value=volume;$('volume-value').textContent=volume+'%';}
paintSoundOptions();
$('options-open').onclick=()=>openOptions();
$('debug-open').onclick=()=>{$('debug-floor').innerHTML=Array.from({length:LAST_FLOOR},(_,i)=>`<option value="${i+1}" ${state.floor===i+1?'selected':''}>B${LAST_FLOOR-i}</option>`).join('');$('debug-gear').innerHTML=equipment.map(g=>`<option value="${g.id}">${g.name}</option>`).join('');$('debug-reward').innerHTML=rewardDefinitions.filter(r=>!r.legacy).map(r=>`<option value="${r.id}">${r.name}</option>`).join('');debugStatus();openDialog('debug-dialog');};
$('debug-dialog').addEventListener('click',e=>{const b=e.target.closest('[data-debug]');if(!b)return;let message='';switch(b.dataset.debug){case'music-preview':musicAudition=$('debug-music-scene').value;$('debug-music-status').textContent='試聴中：'+bgm.tracks[musicAudition].split('/').at(-1).split('?')[0];syncSceneMusic();return;case'music-stop':musicAudition=null;$('debug-music-status').textContent='元の場面のBGMへ戻しました。';syncSceneMusic();return;case'title-transition-preview':{
 const title=$('title-scene'),menu=title.querySelector('.title-menu'),previousTitle=showingTitle;
 titleTransitionPreview=true;
 showingTitle=true;
 menu.inert=true;
 $('debug-dialog').close();
 playEndingTitleTransition(title,()=>setTimeout(()=>{
  titleTransitionPreview=false;
  showingTitle=previousTitle;
  menu.inert=false;
  $('debug-dialog').showModal();
  render();
 },2000));
 render();
 return;
}case'ending-preview':subtitlePreviewKind=$('debug-subtitle-kind').value;endingPreview=true;endingPlayback=null;musicAudition=null;for(const d of document.querySelectorAll('dialog[open]'))d.close();render();return;case'will-jump':{
 const next=debugBeforeWillChest(state);
 if(!next){debugStatus('遺書の宝箱の隣に移動できませんでした。');return;}
 state=next;showingTitle=false;endingPreview=false;endingPlayback=null;
 paused=true;dialogWasPaused=true;motion=null;resetHeroVisual();
 for(const dialog of document.querySelectorAll('dialog[open]'))dialog.close();
 render();return;
}case'memory-preview':{
 const kind=$('debug-memory-kind').value;
 const [floor,clears]=kind.split(':').map(Number);
 const message=bossMemoryMessage(floor,clears);
 if(!message)return;
 for(const d of document.querySelectorAll('dialog[open]'))d.close();
 paused=dialogWasPaused;fieldMessages.sync(state);fieldMessages.push([message]);fieldMessages.render();return;
}case'title-ending':debugTitleEnding(state,!state.profile.trueEnding);message=state.profile.trueEnding?'倅の旅路タイトル：'+TRUE_END_UNIMPLEMENTED_NOTICE:'骸の旅路タイトル';break;case'jump':debugJump(state,Number($('debug-floor').value));break;case'next':debugJump(state,Math.min(LAST_FLOOR,state.floor+1));break;case'previous':debugJump(state,Math.max(1,state.floor-1));break;case'reinforcements':state.debugUsed=true;state.debugNoReinforcements=!state.debugNoReinforcements;message='増援を'+(state.debugNoReinforcements?'停止':'再開')+'しました';break;case'experience':{const gained=gainExperience(state,10);state.debugUsed=true;message=state.level===MAX_LEVEL&&!gained?'最大レベル':`経験値+10 / Lv.${state.level}${gained?' / HP +'+gained*HP_PER_LEVEL:''}`;break;}case'augment':grantReward(state,$('debug-augment').value);state.debugUsed=true;message='オーグメントを取得しました';break;case'heal':debugHeal(state);break;case'shards':debugShards(state);break;case'skills':debugSkills(state);break;case'reward':{const id=$('debug-reward').value;grantReward(state,id);state.debugUsed=true;message='報酬を取得';break;}case'equipment':if(!debugEquipment(state,$('debug-gear').value,{plus:Number($('debug-plus').value),identified:true}))message='強化値は0〜20の整数にしてください';break;case'export':{const url=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`abyss-save-${floorLabel(state).replace(/ /g,'-')}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);message='セーブを書き出しました';break;}case'reset-run':if(confirm('現在の旅を初期化しますか？ 図鑑と通常エンド達成は残します。'))reset();break;case'reset-all':if(confirm('このゲームの全セーブ・図鑑・通常エンド達成・旧版・バックアップを削除します。元に戻せません。初期化しますか？')){try{for(const k of Object.keys(localStorage))if(k===key||k.startsWith(key+'-')||k==='abyss-prototype-v1'||k==='abyss-order-presets-v1')localStorage.removeItem(k);state=newGame();resetHeroVisual();motion=null;paused=true;message='全データを初期化しました';}catch{message='保存領域にアクセスできず初期化できませんでした';}}break;}
 motion=null;save();render();debugStatus(message);});
$('debug-import').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{const loaded=normalizeSave(JSON.parse(await file.text()));if(!loaded)throw Error('このゲームの有効なセーブではありません');if(confirm('選択したセーブで現在の進行と図鑑・達成記録を置き換えますか？')){try{localStorage.setItem(key+'-before-import',JSON.stringify(state));}catch{}state=loaded;resetHeroVisual();motion=null;paused=true;dialogWasPaused=true;save();render();debugStatus('セーブを読み込みました');}}catch(err){debugStatus('読み込み失敗：'+err.message);}e.target.value='';};
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
function flushCombatFeedback(){const hits=advanceCombatFeedback(combat,heroClock,{reducedMotion:reducedMotion.matches});for(const hit of hits)damagePopups=queueDamage(damagePopups,[hit],hit.time);if(hits.some(hit=>hit.hero&&!hit.trap))playFieldSound('hurt');}
function loop(t){fieldMessages.animate(t,showingTitle||endingPreview||document.hidden||Boolean(document.querySelector('dialog[open]')));if(endingPlayback){if(!document.hidden&&!document.querySelector('dialog[open]'))endingPlayback.player.update(Math.max(0,Math.min(100,t-endingPlayback.last)));endingPlayback.last=t;renderNormalEnding();}if(memoryReveal){if(state.phase!=='awakening'||showingTitle)memoryReveal=null;else{if(!document.hidden&&!document.querySelector('dialog[open]'))memoryReveal.player.update(Math.max(0,Math.min(100,t-memoryReveal.last)));memoryReveal.last=t;$('awakening-text').textContent=memoryReveal.player.text;$('awakening-hint').textContent='';$('awakening-caret').hidden=!memoryReveal.player.full;}} const visualActive=!showingTitle&&!endingPreview&&!document.hidden&&!document.querySelector('dialog[open]')&&(state.phase==='dead'||state.phase==='cleared'&&(skillEffects.length||trapEffects.length||combat.events.length)&&!paused&&!document.querySelector('dialog[open]')||state.phase==='explore'&&!tutorialKind&&!paused&&!document.querySelector('dialog[open]'));const visualDelta=lastVisualTime===null?0:Math.max(0,Math.min(100,t-lastVisualTime)),idleActive=!showingTitle&&!endingPreview&&!pendingJourney&&!document.hidden&&state.phase==='explore';if(visualActive)heroClock+=visualDelta;lastVisualTime=t;const beforeActorTime=combat.actorTime;flushCombatFeedback();if(idleActive)idleClock+=visualActive?Math.max(0,combat.actorTime-beforeActorTime):visualDelta;if(fieldMessages.waiting&&houseEntryReady(motion,combat.actorTime)){fieldMessages.render();syncSceneMusic();}if(!showingTitle&&!endingPreview&&state.phase==='explore'&&!tutorialKind&&!paused&&!fieldMessages.active&&!document.querySelector('dialog[open]')&&t-last>420/speed){last=t;const old=state.phase;motion={from:{...state.player},time:combat.actorTime,duration:reducedMotion.matches?1:Math.min(190,340/speed)/Math.min(1,speed)};const eventBefore=captureFieldMessages(state),usedBefore=new Set(state.themeState?.used||[]),effectActors=captureEffectActors(state),castEffects=[],hpBeforeTick=state.hp;let pickupHealed=false;tick(state,{
 onPickup:(_item,healed)=>{pickupHealed=healed;playFieldSound(healed?'heal':'pickup');},
 onSkillEffect:event=>castEffects.push(event),
 onTrapEffect:event=>{
  trapEffects.push({...event,start:heroClock+(event.hero&&!event.destination?motion.duration:0)});
  if(event.hero)playFieldSound('trap');
 }
 });
 if(!pickupHealed&&state.hp>hpBeforeTick)playFieldSound('heal');
 const meleeHits=(state.damageEvents||[]).filter(event=>!event.hero&&event.impact==='melee');
 if(meleeHits.length)playFieldSound(meleeHits.some(event=>event.critical)?'critical':'swing');
 if(castEffects.length)playFieldSound('skill');
 skillEffects=enqueueSkillEffects(skillEffects,castEffects,effectActors,state,heroClock,SKILL_EFFECT_FORMAT);fieldMessages.push(collectFieldMessages(eventBefore,state));const usedSkill=state.themeState?.used?.find(id=>!usedBefore.has(id));if(usedSkill){skillPopup={name:themedSkillById[usedSkill]?.name||usedSkill,time:t,position:state.actorSkillEvent?{x:state.actorSkillEvent.x,y:state.actorSkillEvent.y}:null};$('skill-announcement').textContent=skillPopup.name;}if(Math.abs(state.player.x-heroVisual.x)+Math.abs(state.player.y-heroVisual.y)>1)heroVisual.teleport(state.player.x,state.player.y,combat.actorTime);else heroVisual.moveTo(state.player.x,state.player.y,combat.actorTime,motion.duration);const heroHit=heroAttackAim(state.damageEvents,castEffects,state.player,SKILL_EFFECT_FORMAT,heroVisual.direction);if(heroHit)heroVisual.attackTo(heroHit.x,heroHit.y,combat.actorTime,characterAttackDuration(heroSheet?.definition,speed));enemyAttacks=queueEnemyAttacks(enemyAttacks,state.damageEvents,state.enemies,combat.actorTime,enemyAttackDuration(speed));queueCombatFeedback(combat,(state.damageEvents||[]).filter(e=>e.hero||canSee(state,e.x,e.y)),effectActors,state,{speed,heroDuration:characterAttackDuration(heroSheet?.definition,speed),enemyDuration:enemyAttackDuration(speed)});flushCombatFeedback();if(Math.abs(state.player.x-motion.from.x)+Math.abs(state.player.y-motion.from.y)>1)motion=null;if(state.phase!==old){motion=null;if(state.phase==='dead')heroVisual.die(combat.actorTime+Math.max(0,...combat.events.filter(e=>e.hero&&e.time===null).map(e=>e.contact-combat.actorTime)));else heroVisual.teleport(state.player.x,state.player.y,combat.actorTime);tone(state.phase==='dead'?110:660);}render();}if(idleActive||state.phase==='explore'&&(!paused||motion&&combat.actorTime-motion.time<motion.duration+50)||combat.events.length||skillEffects.length||trapEffects.length||enemyAttacks.length||damagePopups.length||skillPopup||state.phase==='dead'&&combat.actorTime-heroVisual.since<800)draw();requestAnimationFrame(loop);}
new ResizeObserver(()=>draw()).observe($('map'));
const hudObserver=new ResizeObserver(()=>{const wrap=$('map-wrap'),gap=wrap.clientWidth<=480?8:20;$('workspace').style.setProperty('--shared-hud-space',($('hud-top').offsetTop+$('hud-top').offsetHeight+gap)+'px');wrap.style.setProperty('--hud-top-space',($('hud-top').offsetHeight+gap)+'px');wrap.style.setProperty('--hud-bottom-space',($('hud-bottom').offsetHeight+gap)+'px');const available=wrap.clientHeight-$('hud-top').offsetHeight-$('hud-bottom').offsetHeight-$('field-log-host').offsetHeight-52;wrap.style.setProperty('--minimap-limit',Math.max(64,(available-22)*31/23)+'px');});hudObserver.observe($('hud-top'));hudObserver.observe($('hud-bottom'));hudObserver.observe($('field-log-host'));
for(const host of [$('tab-content'),$('live-orders')]){
 installCardDragging(host,()=>state,()=>{delete host.dataset.orderSignature;render();});
}
drawHeroPortraits();render();requestAnimationFrame(loop);

// Only title artwork gates startup. Gameplay images load concurrently and gate journey entry.
let gameAssetsLoaded=false;
const titleAssetsReady=Promise.all(['title-background','title-logo'].map(id=>$(id).decode().catch(()=>{})));
const gameAssetsReady=titleAssetsReady.then(()=>Promise.all([cryptAtlas,readableAtlas,trapAtlas,trapEffectAtlas,propsAtlas,mapItemsAtlas,redChestAtlas,enemyAtlas].map(image=>image.decode().catch(()=>{})).concat([heroAssetsReady,wallAssetsReady,loadSkillEffectAssets()]))).then(()=>{gameAssetsLoaded=true;if(!showingTitle)draw();});
await titleAssetsReady;
