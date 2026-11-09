export function musicScene(state,{title=false,teaser=false,endingPreview=false,houseEntered=Boolean(state.gimmick?.triggered)}={}){
 if(endingPreview)return 'ending';if(title||teaser||state.phase==='awakening')return 'opening';
 if(state.phase==='ending')return 'ending';if(state.phase==='dead')return null;
 if(state.bossFloor)return 'boss';
 if(['traps','monsters'].includes(state.gimmick?.id))return houseEntered?state.gimmick.id:'dungeon';
 return state.gimmick?.id==='fog'&&['explore','cleared'].includes(state.phase)?'fog':'dungeon';
}
export class SceneMusic{
 constructor(audio,tracks){this.audio=audio;this.tracks=tracks;this.scene=null;this.unlocked=false;this.enabled=true;this.volume=35;this.hidden=false;this.playing=false;this.request=0;audio.loop=true;audio.preload='none';}
 configure({enabled=true,volume=35,hidden=false}={}){this.enabled=enabled;this.volume=Math.max(0,Math.min(100,Number(volume)||0));this.hidden=hidden;this.audio.volume=this.volume/100;this.sync();}
 select(scene){if(scene!==this.scene){this.request++;this.audio.pause();this.playing=false;this.scene=scene;if(scene&&this.tracks[scene]){this.audio.src=this.tracks[scene];this.audio.load();}}this.sync();}
 unlock(){this.unlocked=true;this.sync();}
 sync(){const active=this.unlocked&&this.enabled&&this.volume>0&&!this.hidden&&this.scene&&this.tracks[this.scene];if(!active){this.request++;this.audio.pause();this.playing=false;return;}if(this.playing)return;const request=++this.request;this.playing=true;try{Promise.resolve(this.audio.play()).catch(()=>{if(request===this.request)this.playing=false;});}catch{this.playing=false;}}
}
